'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { QUIZ_QUESTIONS, CONTACT_QUESTION_ID } from '@/app/lib/questions';
import { OptionCard } from '@/app/components/OptionCard';
import { Progress } from '@/app/components/Progress';
import { FooterNav } from '@/app/components/FooterNav';
import { getApiUrl } from '@/lib/utils';

interface QuizFlowProps {
  barSlug: string;
  outroText?: string;
}

interface CreateSessionResponse {
  session_id: string;
  bar_id: string;
}

interface SubmitQuizResponse {
  order_id: string;
}

interface QuizAnswerPayload {
  question_id: string;
  value: { choice: string };
}

function resolveCheckoutPath(checkoutUrl: string, orderId: string): string {
  try {
    const parsed = new URL(checkoutUrl);
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return path || `/receipt?orderId=${orderId}`;
  } catch (error) {
    if (checkoutUrl.startsWith('/')) {
      return checkoutUrl;
    }
    return `/receipt?orderId=${orderId}`;
  }
}

export default function QuizFlow({ barSlug, outroText }: QuizFlowProps) {
  const router = useRouter();
  const apiUrl = useMemo(getApiUrl, []);
  const totalSteps = QUIZ_QUESTIONS.length;
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState('');
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
        const response = await fetch(`${apiUrl}/quiz/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ bar_slug: barSlug })
        });

        if (!response.ok) {
          throw new Error(`Failed to start quiz session: ${response.status}`);
        }

        const data = (await response.json()) as CreateSessionResponse;
        if (!cancelled) {
          setSessionId(data.session_id);
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

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const canProceed = Boolean(selectedAnswer) && Boolean(sessionId) && !isLoadingSession;
  const isLastStep = currentStep === totalSteps - 1;

  const handleSelect = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      setError(null);
    },
    []
  );

  const handleNext = useCallback(() => {
    if (!currentQuestion) {
      return;
    }

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
    if (!currentQuestion || !sessionId) {
      setError('Your session is still starting. Please wait a moment.');
      return;
    }

    if (!answers[currentQuestion.id]) {
      setError('Choose an option to continue.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const answerPayload: QuizAnswerPayload[] = QUIZ_QUESTIONS.map((question) => ({
      question_id: question.id,
      value: { choice: answers[question.id] }
    }));

    answerPayload.push({
      question_id: CONTACT_QUESTION_ID,
      value: { choice: contact.trim() }
    });

    try {
      const submitResponse = await fetch(`${apiUrl}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          answers: answerPayload
        })
      });

      if (!submitResponse.ok) {
        throw new Error(`Submit failed with status ${submitResponse.status}`);
      }

      const submitData = (await submitResponse.json()) as SubmitQuizResponse;
      const orderId = submitData.order_id;

      const checkoutResponse = await fetch(`${apiUrl}/orders/${orderId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!checkoutResponse.ok) {
        throw new Error(`Checkout failed with status ${checkoutResponse.status}`);
      }

      const checkoutData = (await checkoutResponse.json()) as { checkout_url: string };
      const redirectPath = resolveCheckoutPath(checkoutData.checkout_url, orderId);
      router.push(redirectPath);
    } catch (submitError) {
      setError('We hit a snag mixing your cocktail. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [answers, apiUrl, contact, currentQuestion, router, sessionId]);

  if (!currentQuestion) {
    return null;
  }

  const headingId = `quiz-question-${currentQuestion.id}`;
  const hasSelection = typeof selectedAnswer === 'string' && selectedAnswer.length > 0;
  const firstFocusableIndex = hasSelection
    ? currentQuestion.options.findIndex((option) => option.value === selectedAnswer)
    : 0;

  return (
    <section className="flex flex-1 flex-col rounded-3xl border border-border/60 bg-card/80 p-8 shadow-lg shadow-primary/10 backdrop-blur">
      <Progress
        currentStep={currentStep + 1}
        totalSteps={totalSteps}
        label={`Step ${currentStep + 1} of ${totalSteps}`}
      />

      <div className="mt-8 space-y-4">
        <div className="space-y-2">
          <h2 id={headingId} className="text-2xl font-semibold tracking-tight">
            {currentQuestion.title}
          </h2>
          <p className="text-sm text-muted-foreground">{currentQuestion.prompt}</p>
        </div>

        <div
          role="radiogroup"
          aria-labelledby={headingId}
          className="grid gap-4 sm:grid-cols-2"
          aria-busy={isLoadingSession}
        >
          {currentQuestion.options.map((option, index) => {
            const isSelected = option.value === selectedAnswer;
            const tabIndex = isSelected || firstFocusableIndex === index ? 0 : -1;
            return (
              <OptionCard
                key={option.value}
                label={option.label}
                description={option.description}
                selected={isSelected}
                onSelect={() => handleSelect(currentQuestion.id, option.value)}
                disabled={isLoadingSession || submitting}
                tabIndex={tabIndex}
              />
            );
          })}
        </div>

        {isLastStep ? (
          <div className="mt-6 rounded-2xl border border-border/60 bg-background/70 p-5">
            <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="contact-preference">
              Stay in the loop
              <span className="text-xs font-normal text-muted-foreground">
                Drop an email or phone number if you&apos;d like a copy of your recipe.
              </span>
            </label>
            <input
              id="contact-preference"
              type="text"
              inputMode="email"
              autoComplete="email"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="you@example.com"
              className="mt-3 w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-auto pt-10">
        <FooterNav
          showBack={currentStep > 0}
          onBack={handleBack}
          onNext={isLastStep ? handleSubmit : handleNext}
          nextLabel={isLastStep ? 'Reveal my cocktail' : 'Next question'}
          disabled={submitting || !canProceed}
          isSubmitting={submitting}
        />
        {outroText ? (
          <p className="mt-6 text-center text-xs text-muted-foreground">{outroText}</p>
        ) : null}
      </div>
    </section>
  );
}
