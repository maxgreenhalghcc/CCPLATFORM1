import Link from 'next/link';
import { Button } from '@/components/ui/button';

const questions = [
  'What flavour profile do you prefer?',
  'How adventurous are you feeling?',
  'Pick a spirit you enjoy most.',
  'Preferred level of sweetness?',
  'Favourite garnish style?',
  'Ideal glassware shape?',
  'Preferred strength level?',
  'Any flavours to avoid?',
  'Choose a vibe for the evening.'
];

interface QuizPageProps {
  params: { barSlug: string };
}

export default function QuizPage({ params }: QuizPageProps) {
  const { barSlug } = params;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Your bespoke cocktail awaits</h1>
        <p className="text-muted-foreground">
          Answer the questions below and we&apos;ll craft a cocktail tailored to your tastes.
        </p>
      </div>
      <ol className="space-y-6">
        {questions.map((question, index) => (
          <li className="rounded-xl border bg-card p-6 shadow-sm" key={question}>
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {index + 1}
              </span>
              <div>
                <h2 className="text-lg font-medium">{question}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  This is a placeholder UX. Connect form state to the API in a future iteration.
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex justify-between">
        <Button asChild variant="outline">
          <Link href={`/b/${barSlug}`}>Back</Link>
        </Button>
        <Button asChild>
          <Link href="/checkout">Proceed to checkout</Link>
        </Button>
      </div>
    </div>
  );
}
