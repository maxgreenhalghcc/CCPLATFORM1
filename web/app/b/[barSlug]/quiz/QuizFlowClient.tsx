'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { QUIZ_QUESTIONS, CONTACT_QUESTION_ID, ALLERGENS_QUESTION_ID } from '@/app/lib/questions';
import { apiFetch } from '@/app/lib/api';
import { OptionCard } from '@/app/components/OptionCard';
import { AnimatePresence, motion, DURATION, EASE, useMotionSafe } from '@/app/components/motion';
import { AppShell } from '@/app/components/AppShell';
import { ProgressHeader } from '@/app/components/ProgressHeader';
import { QuestionStepLayout } from '@/app/components/QuestionStepLayout';
import { CraftingStateCard, deriveFlavourKeywords } from '@/app/components/CraftingStateCard';
import { MotionButton } from '@/components/ui/motion-button';
import { getApiUrl } from '@/lib/utils';
import * as Sentry from '@sentry/nextjs';

const PAYMENTS_ENABLED =
  (process.env.NEXT_PUBLIC_FEATURE_ENABLE_PAYMENT ?? 'true').toLowerCase() !== 'false';

interface QuizFlowProps {
  barSlug: string;
  barName?: string;
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

function resolveCheckoutPath(checkoutUrl: string, orderId: string): string {
  try {
    if (!checkoutUrl) {
      throw new Error('Missing checkout URL');
    }
    const parsed = new URL(checkoutUrl);
    return parsed.toString() || `/receipt?orderId=${orderId}`;
  } catch (error) {
    if (checkoutUrl && checkoutUrl.startsWith('/')) {
      return checkoutUrl;
    }
    return `/receipt?orderId=${orderId}`;
  }
}

export default function QuizFlow({ barSlug, barName, outroText }: QuizFlowProps) {
  const router = useRouter();
  const apiUrl = useMemo(getApiUrl, []);
  const detailsStepIndex = QUIZ_QUESTIONS.length;
  const totalSteps = QUIZ_QUESTIONS.length + 1;
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState('');
  const [allergens, setAllergens] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const safe = useMotionSafe();
  const flavourKeywords = deriveFlavourKeywords(answers);

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
          if (response.status === 404) {
            setError('This bar is paused right now. Please speak to staff.');
            return;
          }
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

  const isDetailsStep = currentStep === detailsStepIndex;

  const currentQuestion = !isDetailsStep
    ? QUIZ_QUESTIONS[currentStep]
    : null;

  const selectedAnswer = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;

  const canProceed =
    (isDetailsStep && Boolean(sessionId) && !isLoadingSession) ||
    (!isDetailsStep &&
      Boolean(selectedAnswer) &&
      Boolean(sessionId) &&
      !isLoadingSession);

  const isLastStep = currentStep === totalSteps - 1;

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
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [answers, currentQuestion, totalSteps]);

  const handleBack = useCallback(() => {
    setError(null);
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!sessionId) {
      setError('Your session is still starting. Please wait a moment.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const answerPayload: QuizAnswerPayload[] = QUIZ_QUESTIONS.map((question) => ({
      questionId: question.id,
      value: { choice: answers[question.id] ?? '' },
    }));

    if (contact.trim()) {
      answerPayload.push({
        questionId: CONTACT_QUESTION_ID,
        value: { choice: contact.trim() },
      });
    }

    if (allergens.trim()) {
      answerPayload.push({
        questionId: ALLERGENS_QUESTION_ID,
        value: { choice: allergens.trim() },
      });
    }

    try {
      await Sentry.startSpan({ name: 'quiz.submit', op: 'ui.action' }, async () => {
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

        if (!PAYMENTS_ENABLED) {
          router.push(`/receipt?orderId=${orderId}` as any);
          return;
        }

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

        if (redirectPath.startsWith('http')) {
          window.location.href = redirectPath;
        } else {
          router.push(redirectPath as any);
        }
      });
    } catch (submitError) {
      Sentry.captureException(submitError);
      setError('We hit a snag mixing your cocktail. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [answers, allergens, apiUrl, contact, router, sessionId]);

  if (!currentQuestion && !isDetailsStep) {
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

  const stepKey = isDetailsStep ? 'details' : currentQuestion!.id;

  return (
    <AppShell>
      <CraftingStateCard
        barName={barName ?? barSlug}
        flavourKeywords={flavourKeywords}
        visible={submitting}
      />

      <QuestionStepLayout
        header={
          <ProgressHeader
            currentStep={currentStep + 1}
            totalSteps={totalSteps}
            onBack={handleBack}
            showBack={currentStep > 0}
          />
        }
        footer={
          <div className="flex flex-col gap-3">
            {error && (
              <p role="alert" className="text-center text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            <MotionButton
              variant="pill"
              size="xl"
              glowOnHover
              disabled={submitting || !canProceed}
              onClick={isLastStep ? handleSubmit : handleNext}
            >
              {submitting ? 'Mixing your cocktail…' : isLastStep ? 'Reveal my cocktail' : 'Next question'}
            </MotionButton>
            <p className="text-center text-xs text-muted-foreground">
              Need help?{' '}
              <a href="/help" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                Info &amp; FAQ
              </a>
            </p>
          </div>
        }
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={stepKey}
            custom={direction}
            initial={safe ? { opacity: 0, y: direction > 0 ? 16 : -16 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            exit={safe ? { opacity: 0, y: direction > 0 ? -16 : 16 } : undefined}
            transition={{ duration: DURATION.normal, ease: EASE.out }}
            className="flex flex-col gap-6"
          >
            {!isDetailsStep && (
              <div className="space-y-1.5">
                <h2 id={headingId} className="font-display text-2xl font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
                <p className="text-sm text-muted-foreground">{promptText}</p>
              </div>
            )}

            {!isDetailsStep && (
              <div
                role="radiogroup"
                aria-labelledby={headingId}
                className="grid gap-3 sm:grid-cols-2"
                aria-busy={isLoadingSession}
              >
                {currentQuestion!.options.map((option, index) => {
                  const isSelected = option.value === selectedAnswer;
                  const tabIndex = isSelected || firstFocusableIndex === index ? 0 : -1;
                  return (
                    <OptionCard
                      key={option.value}
                      label={option.label}
                      description={option.description}
                      selected={isSelected}
                      onSelect={() => handleSelect(currentQuestion!.id, option.value)}
                      disabled={isLoadingSession || submitting}
                      tabIndex={tabIndex}
                    />
                  );
                })}
              </div>
            )}

            {isDetailsStep && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h2 id={headingId} className="font-display text-2xl font-semibold tracking-tight text-foreground">
                    {title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{promptText}</p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card/80 p-5">
                  <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="customer-name">
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
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. Alex"
                    className="mt-3 w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div className="rounded-2xl border border-border/60 bg-card/80 p-5">
                  <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="allergens">
                    Allergies / dislikes
                    <span className="text-xs font-normal text-muted-foreground">
                      Optional — list anything the bar should avoid.
                    </span>
                  </label>
                  <textarea
                    id="allergens"
                    value={allergens}
                    onChange={(e) => setAllergens(e.target.value)}
                    placeholder="e.g. peanuts, dairy, dislikes tequila"
                    className="mt-3 w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </QuestionStepLayout>
    </AppShell>
  );
}
