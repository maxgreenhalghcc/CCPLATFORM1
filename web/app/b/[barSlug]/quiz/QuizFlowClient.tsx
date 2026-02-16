'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QUIZ_QUESTIONS, CONTACT_QUESTION_ID } from '@/app/lib/questions';
import { apiFetch } from '@/app/lib/api';
import { OptionCard } from '@/app/components/OptionCard';
import { Progress } from '@/app/components/Progress';
import { FooterNav } from '@/app/components/FooterNav';
import { AnimatePresence, motion, DURATION, EASE, useMotionSafe } from '@/app/components/motion';
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

function resolveCheckoutPath(checkoutUrl: string, orderId: string): string {
  try {
    const parsed = new URL(checkoutUrl);
    return parsed.toString() || `/receipt?orderId=${orderId}`;
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
  const [direction, setDirection] = useState<1 | -1>(1);
  const safe = useMotionSafe();
  const [ageVerified, setAgeVerified] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('cc.ageVerified') === 'true';
  });

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
    setDirection(1);
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [answers, currentQuestion, totalSteps]);

  const handleBack = useCallback(() => {
    setError(null);
    setDirection(-1);
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
      questionId: question.id,
      value: { choice: answers[question.id] ?? '' }
    }));

    answerPayload.push({
      questionId: CONTACT_QUESTION_ID,
      value: { choice: contact.trim() }
    });

    try {
      await Sentry.startSpan({ name: 'quiz.submit', op: 'ui.action' }, async () => {
        for (const answer of answerPayload) {
          const answerResponse = await apiFetch(`${apiUrl}/quiz/sessions/${sessionId}/answers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              questionId: answer.questionId,
              value: answer.value
            })
          });

          if (!answerResponse.ok) {
            throw new Error(`Failed to record answer ${answer.questionId}`);
          }
        }

        const submitResponse = await apiFetch(`${apiUrl}/quiz/sessions/${sessionId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            final: true,
            answers: answerPayload,
            contact: contact.trim(),
          })
        });

        if (!submitResponse.ok) {
          throw new Error(`Submit failed with status ${submitResponse.status}`);
        }

        const submitData = (await submitResponse.json()) as SubmitQuizResponse;
        const orderId = submitData.orderId;

        if (!PAYMENTS_ENABLED) {
          router.push(`/receipt?orderId=${orderId}` as any);
          return;
        }

        const checkoutResponse = await apiFetch(`${apiUrl}/orders/${orderId}/checkout`, {
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
    <section className="relative flex flex-1 flex-col rounded-3xl border border-border/60 bg-card/80 p-8 shadow-lg shadow-primary/10 backdrop-blur">
      <AnimatePresence>
        {!ageVerified ? (
          <motion.div
            key="age-gate"
            initial={safe ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            exit={safe ? { opacity: 0 } : undefined}
            transition={{ duration: DURATION.micro }}
            className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl bg-background/90 p-6 backdrop-blur"
          >
            <motion.div
              initial={safe ? { opacity: 0, scale: 0.95, y: 8 } : undefined}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={safe ? { opacity: 0, scale: 0.95, y: 8 } : undefined}
              transition={{ duration: DURATION.normal, ease: EASE.out }}
              className="w-full max-w-md space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-xl"
            >
              <h2 className="text-xl font-semibold">Age confirmation</h2>
              <p className="text-sm text-muted-foreground">
                You must be 18+ to use this experience.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  onClick={() => {
                    window.localStorage.setItem('cc.ageVerified', 'true');
                    setAgeVerified(true);
                  }}
                >
                  I am 18+
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold"
                  onClick={() => router.push('/')}
                >
                  Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Progress
        currentStep={currentStep + 1}
        totalSteps={totalSteps}
        label={`Step ${currentStep + 1} of ${totalSteps}`}
      />

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentQuestion.id}
          custom={direction}
          initial={safe ? { opacity: 0, x: direction * 40 } : undefined}
          animate={{ opacity: 1, x: 0 }}
          exit={safe ? { opacity: 0, x: direction * -40 } : undefined}
          transition={{ duration: DURATION.normal, ease: EASE.out }}
          className="mt-8 space-y-4"
        >
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
          ) : null}

          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </motion.div>
      </AnimatePresence>

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
