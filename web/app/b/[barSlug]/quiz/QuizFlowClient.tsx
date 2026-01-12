'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { QUIZ_QUESTIONS, CONTACT_QUESTION_ID, ALLERGENS_QUESTION_ID } from '@/app/lib/questions';
import { apiFetch } from '@/app/lib/api';
import { OptionCard } from '@/app/components/OptionCard';
import { Progress } from '@/app/components/Progress';
import { FooterNav } from '@/app/components/FooterNav';
import { getApiUrl } from '@/lib/utils';
import * as Sentry from '@sentry/nextjs';

const PAYMENTS_ENABLED =
  (process.env.NEXT_PUBLIC_FEATURE_ENABLE_PAYMENT ?? 'true').toLowerCase() !== 'false';

interface QuizFlowProps {
  barSlug: string;
  outroText?: string;
}

interface CreateSessionResponse {
  sessionId: string;
}

interface SubmitQuizResponse {
  orderId: string;
}

interface QuizAnswerPayload {
  questionId: string;
  value: { choice: string };
}

function resolveCheckoutPath(
  checkoutUrl: string,
  orderId: string,
): string {
  try {
    // If the server didn’t send anything, treat it as a failure to parse
    if (!checkoutUrl) {
      throw new Error('Missing checkout URL');
    }

    const parsed = new URL(checkoutUrl);
    return parsed.toString() || `/receipt?orderId=${orderId}`;
  } catch (error) {
    // Same behaviour as before, just guarded
    if (checkoutUrl && checkoutUrl.startsWith('/')) {
      return checkoutUrl;
    }

    return `/receipt?orderId=${orderId}`;
  }
}

export default function QuizFlow({ barSlug, outroText }: QuizFlowProps) {
  const router = useRouter();
  const apiUrl = useMemo(getApiUrl, []);
  const detailsStepIndex = QUIZ_QUESTIONS.length; // index of the new Details step
  const totalSteps = QUIZ_QUESTIONS.length + 1;   // questions + details
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState('');
  const [allergens, setAllergens] = useState(''); // new
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function createSession() {
      setIsLoadingSession(true);
      setError(null);
      try {
        const response = await apiFetch(`${apiUrl}/bars/${barSlug}/quiz/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to start quiz session: ${response.status}`);
        }

        const data = (await response.json()) as CreateSessionResponse;
        if (!cancelled) {
          setSessionId(data.sessionId);
        }
      } catch (sessionError) {
        if (!cancelled) {
          setError('We couldn\'t start the quiz. Please refresh and try again.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSession(false);
        }
      }
    }

    createSession();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, barSlug]);

// NEW computed flags ---------------------------------------------------------
const isDetailsStep = currentStep === detailsStepIndex;

const currentQuestion = !isDetailsStep
  ? QUIZ_QUESTIONS[currentStep]
  : null;

const selectedAnswer = currentQuestion
  ? answers[currentQuestion.id]
  : undefined;

// allow submit on details step even though there is no selectedAnswer
const canProceed =
  (isDetailsStep && Boolean(sessionId) && !isLoadingSession) ||
  (!isDetailsStep &&
    Boolean(selectedAnswer) &&
    Boolean(sessionId) &&
    !isLoadingSession);

const isLastStep = currentStep === totalSteps - 1;

// handlers -------------------------------------------------------------------
const handleSelect = useCallback(
  (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setError(null);
  },
  []
);

const handleNext = useCallback(() => {
  if (!currentQuestion) return;

  if (!answers[currentQuestion.id]) {
    setError('Choose an option to continue.');
    return;
  }

  setError(null);
  setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
}, [answers, currentQuestion, totalSteps]);

const handleBack = useCallback(() => {
  setError(null);
  setCurrentStep((prev) => Math.max(prev - 1, 0));
}, []);

const handleSubmit = useCallback(async () => {
  if (!sessionId) {
    setError('Your session is still starting. Please wait a moment.');
    return;
  }

  setSubmitting(true);
  setError(null);

  // 1. Build payload from the multiple-choice questions
  const answerPayload: QuizAnswerPayload[] = QUIZ_QUESTIONS.map((question) => ({
    questionId: question.id,
    value: { choice: answers[question.id] ?? '' },
  }));

  // 2. Add "Who is this cocktail for?" – this uses the existing CONTACT_QUESTION_ID
  if (contact.trim()) {
    answerPayload.push({
      questionId: CONTACT_QUESTION_ID,
      value: { choice: contact.trim() },
    });
  }

  // 3. Add optional allergens/dislikes – NEW, but same shape as other answers
  if (allergens.trim()) {
    answerPayload.push({
      questionId: ALLERGENS_QUESTION_ID,
      value: { choice: allergens.trim() },
    });
  }

  try {
    await Sentry.startSpan({ name: 'quiz.submit', op: 'ui.action' }, async () => {
      // 4. Send all answers one by one (same as before)
      for (const answer of answerPayload) {
        const answerResponse = await apiFetch(
          `${apiUrl}/quiz/sessions/${sessionId}/answers`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionId: answer.questionId,
              value: answer.value,
            }),
          },
        );

        if (!answerResponse.ok) {
          throw new Error(
            `Failed to submit answer for question ${answer.questionId}`,
          );
        }
      }

      // 5. Finalise quiz – backend creates the order (no checkout yet)
      const submitResponse = await apiFetch(
        `${apiUrl}/quiz/sessions/${sessionId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            final: true,
            answers: answerPayload,
            contact: contact.trim(),
          }),
        },
      );

      if (!submitResponse.ok) {
        throw new Error(`Submit failed with status ${submitResponse.status}`);
      }

      const submitData = (await submitResponse.json()) as SubmitQuizResponse;
      const { orderId } = submitData;

      // 6. Optional "no payment" mode – if you’re never using /receipt, you
      //    can delete this whole block and always go to checkout instead.
      if (!PAYMENTS_ENABLED) {
        router.push(`/receipt?orderId=${orderId}`);
        return;
      }

      // 7. Create Stripe checkout session – this is the *old working behaviour*
      const checkoutResponse = await apiFetch(
        `${apiUrl}/orders/${orderId}/checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (!checkoutResponse.ok) {
        throw new Error(
          `Checkout failed with status ${checkoutResponse.status}`,
        );
      }

      const checkoutData = (await checkoutResponse.json()) as {
        checkout_url: string;
      };

      const redirectPath = resolveCheckoutPath(
        checkoutData.checkout_url,
        orderId,
      );

      // 8. Redirect to Stripe (full URL) or via Next router (relative URL)
      if (redirectPath.startsWith('http')) {
        window.location.href = redirectPath;
      } else {
        router.push(redirectPath);
      }
    });
  } catch (submitError) {
    Sentry.captureException(submitError);
    setError('We hit a snag mixing your cocktail. Please try again.');
  } finally {
    setSubmitting(false);
  }
}, [answers, allergens, apiUrl, contact, router, sessionId]);

// ---------------------------------------------------------------------------

if (!currentQuestion && !isDetailsStep) {
  // should never happen, but keep the old guard
  return null;
}

const headingId = isDetailsStep
  ? 'quiz-details'
  : `quiz-question-${currentQuestion!.id}`;

const title = isDetailsStep ? 'One last thing' : currentQuestion!.title;

const promptText = isDetailsStep
  ? 'Tell the bar who this is for and any allergies or dislikes.'
  : currentQuestion!.prompt;

const hasSelection =
  !isDetailsStep &&
  typeof selectedAnswer === 'string' &&
  selectedAnswer.length > 0;

const firstFocusableIndex =
  !isDetailsStep && hasSelection && currentQuestion
    ? currentQuestion.options.findIndex(
        (option) => option.value === selectedAnswer,
      )
    : 0;

// JSX ------------------------------------------------------------------------
return (
  <section className="flex flex-1 flex-col rounded-3xl border border-border/60 bg-card/80 p-8 shadow-lg shadow-primary/10 backdrop-blur">

  <div className="mb-4">
    <Progress
      currentStep={currentStep + 1}
      totalSteps={totalSteps}
      label={`Step ${currentStep + 1} of ${totalSteps}`}
    />
  </div>


  {/* Question UI – only when NOT on the details step */}
    {!isDetailsStep && (
      <>
        <div className="mt-8 space-y-4">
          <div className="space-y-2">
            <h2 id={headingId} className="text-2xl font-semibold tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">{promptText}</p>
          </div>
        </div>

        <div
          role="radiogroup"
          aria-labelledby={headingId}
          className="grid gap-4 sm:grid-cols-2"
          aria-busy={isLoadingSession}
        >
          {currentQuestion!.options.map((option, index) => {
            const isSelected = option.value === selectedAnswer;
            const tabIndex =
              isSelected || firstFocusableIndex === index ? 0 : -1;

            return (
              <OptionCard
                key={option.value}
                label={option.label}
                description={option.description}
                selected={isSelected}
                onSelect={() =>
                  handleSelect(currentQuestion!.id, option.value)
                }
                disabled={isLoadingSession || submitting}
                tabIndex={tabIndex}
              />
            );
          })}
        </div>
      </>
    )}

    {/* Details step – guest name + allergens */}
    {isDetailsStep && (
      <div className="mt-6 space-y-4">
        {/* Name */}
        <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
          <label
            className="flex flex-col gap-2 text-sm font-medium"
            htmlFor="customer-name"
          >
            Who is this cocktail for?
            <span className="text-xs font-normal text-muted-foreground">
              Add the guest&apos;s name so the bar team knows who to serve.
            </span>
          </label>

          <input
            id="customer-name"
            type="text"
            inputMode="text"
            autoComplete="name"
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            placeholder="e.g. Alex"
            className="mt-3 w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        {/* Allergens / dislikes */}
        <div className="rounded-2xl border border-border/60 bg-background/70 p-5">
          <label
            className="flex flex-col gap-2 text-sm font-medium"
            htmlFor="allergens"
          >
            Allergies / dislikes
            <span className="text-xs font-normal text-muted-foreground">
              Optional – list anything the bar should avoid.
            </span>
          </label>

          <textarea
            id="allergens"
            value={allergens}
            onChange={(event) => setAllergens(event.target.value)}
            placeholder="e.g. peanuts, dairy, dislikes tequila"
            className="mt-3 w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      </div>
    )}

    {error ? (
      <p role="alert" className="mt-4 text-sm font-medium text-destructive">
        {error}
      </p>
    ) : null}

    <div className="mt-auto pt-10">
      <FooterNav
        showBack={currentStep > 0}
        onBack={handleBack}
        onNext={isLastStep ? handleSubmit : handleNext}
        nextLabel={isLastStep ? 'Reveal my cocktail' : 'Next question'}
        disabled={submitting || !canProceed}
        isSubmitting={submitting}
      />

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Need more details?{' '}
        <a
          href="/help"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          Help &amp; info
        </a>
      </p>
    </div>
  </section>
);
}
