import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OptionCard from '../components/OptionCard';
import Progress from '../components/Progress';
import { QUIZ_QUESTIONS } from '../questions';

interface SkinResponse {
  palette: Record<string, string>;
  logoUrl: string | null;
  title: string;
  introCopy: string | null;
}

interface SubmitResponse {
  orderId: string;
  checkoutUrl: string;
  barSlug: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4000/v1';

function applyPalette(palette: Record<string, string>) {
  const root = document.documentElement;
  const primary = palette.primary ?? palette.accent ?? '#2f27ce';
  const secondary = palette.secondary ?? '#050315';
  const accent = palette.accent ?? '#dedcff';
  const background = palette.background ?? secondary;
  const foreground = palette.foreground ?? '#fbfbfe';

  root.style.setProperty('--cc-primary', primary);
  root.style.setProperty('--cc-secondary', secondary);
  root.style.setProperty('--cc-accent', accent);
  root.style.setProperty('--cc-bg', background);
  root.style.setProperty('--cc-fg', foreground);
}

export default function QuizPage() {
  const { barSlug } = useParams();
  const navigate = useNavigate();
  const [skin, setSkin] = useState<SkinResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = QUIZ_QUESTIONS.length + 1;
  const isDetailsStep = step === QUIZ_QUESTIONS.length;
  const currentQuestion = QUIZ_QUESTIONS[step];

  useEffect(() => {
    if (!barSlug) {
      navigate('/bars/demo-bar/build', { replace: true });
      return;
    }

    let active = true;
    setLoading(true);
    fetch(`${API_BASE}/bars/${barSlug}/quiz/skin`, {
      headers: { 'x-request-id': crypto.randomUUID() },
    })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('This bar is not currently accepting quiz orders.');
          }
          throw new Error(`Failed to load skin (${response.status})`);
        }
        return (await response.json()) as SkinResponse;
      })
      .then((payload) => {
        if (!active) return;
        setSkin(payload);
        applyPalette(payload.palette ?? {});
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load bar theme.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [barSlug, navigate]);

  const canProceed = useMemo(() => {
    if (isDetailsStep) {
      return customerName.trim().length > 1 && !submitting;
    }
    if (!currentQuestion) {
      return false;
    }
    return Boolean(answers[currentQuestion.id]) && !submitting;
  }, [answers, currentQuestion, customerName, isDetailsStep, submitting]);

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setError(null);
  };

  const handleNext = () => {
    if (!canProceed) {
      setError('Choose an option to continue.');
      return;
    }
    setError(null);
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const submitQuiz = async () => {
    if (!barSlug) {
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload = {
      customer: {
        name: customerName.trim(),
        email: customerEmail.trim() || undefined,
        phone: customerPhone.trim() || undefined,
      },
      answers: QUIZ_QUESTIONS.reduce<Record<string, string>>((acc, question) => {
        acc[question.id] = answers[question.id] ?? '';
        return acc;
      }, {}),
      notes: notes.trim(),
    };

    try {
      const response = await fetch(`${API_BASE}/bars/${barSlug}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Submit failed with status ${response.status}`);
      }

      const data = (await response.json()) as SubmitResponse;
      if (data.checkoutUrl.startsWith('http')) {
        window.location.href = data.checkoutUrl;
      } else {
        window.location.href = `${window.location.origin}${data.checkoutUrl}`;
      }
    } catch (err) {
      setError('We couldn\'t create your cocktail. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) {
      return null;
    }

    const selected = answers[currentQuestion.id];

    return (
      <div className="quiz-grid" role="radiogroup" aria-label={currentQuestion.title}>
        {currentQuestion.options.map((option, index) => {
          const isSelected = option.value === selected;
          return (
            <OptionCard
              key={option.value}
              label={option.label}
              description={option.description}
              selected={isSelected}
              onClick={() => handleSelect(currentQuestion.id, option.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleSelect(currentQuestion.id, option.value);
                }
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                  event.preventDefault();
                  const nextOption = currentQuestion.options[(index + 1) % currentQuestion.options.length];
                  handleSelect(currentQuestion.id, nextOption.value);
                }
                if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  const prevIndex = (index - 1 + currentQuestion.options.length) % currentQuestion.options.length;
                  const prevOption = currentQuestion.options[prevIndex];
                  handleSelect(currentQuestion.id, prevOption.value);
                }
              }}
            />
          );
        })}
      </div>
    );
  };

  const renderDetails = () => (
    <form className="details-form" onSubmit={(event) => event.preventDefault()}>
      <label>
        Your name
        <input
          type="text"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          placeholder="Ada Lovelace"
          required
        />
      </label>
      <label>
        Email (optional)
        <input
          type="email"
          value={customerEmail}
          onChange={(event) => setCustomerEmail(event.target.value)}
          placeholder="ada@example.com"
        />
      </label>
      <label>
        Phone (optional)
        <input
          type="tel"
          value={customerPhone}
          onChange={(event) => setCustomerPhone(event.target.value)}
          placeholder="+44"
        />
      </label>
      <label>
        Notes for the bar (optional)
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Allergic to peanuts, prefer low sugar."
        />
      </label>
    </form>
  );

  if (loading) {
    return (
      <main className="page">
        <div className="page__inner">
          <p>Loading your bar theme…</p>
        </div>
      </main>
    );
  }

  if (!skin || !barSlug) {
    return (
      <main className="page">
        <div className="page__inner">
          <p>We couldn&apos;t find this bar&apos;s quiz.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page__inner">
        <header className="page__header">
          {skin.logoUrl ? <img src={skin.logoUrl} alt={`${skin.title} logo`} className="logo" /> : null}
          <h1 className="page__title">{skin.title}</h1>
          {skin.introCopy ? <p className="page__intro">{skin.introCopy}</p> : null}
        </header>

        <div className="quiz-card">
          <Progress currentStep={step + 1} totalSteps={totalSteps} />

          {error ? <div className="error-banner">{error}</div> : null}

          <div className="quiz-card__prompt">
            {isDetailsStep ? (
              <>
                <h2>Where should we send your cocktail?</h2>
                <p>Share your details and we&apos;ll send the recipe right after payment.</p>
              </>
            ) : (
              <>
                <h2>{currentQuestion?.title}</h2>
                <p>{currentQuestion?.prompt}</p>
              </>
            )}
          </div>

          {isDetailsStep ? renderDetails() : renderQuestion()}

          <div className="quiz-footer">
            <button type="button" onClick={handleBack} disabled={step === 0 || submitting}>
              Back
            </button>
            {isDetailsStep ? (
              <button type="button" className="primary" disabled={!canProceed} onClick={submitQuiz}>
                {submitting ? 'Mixing…' : 'Reveal my cocktail'}
              </button>
            ) : (
              <button type="button" className="primary" disabled={!canProceed} onClick={handleNext}>
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
