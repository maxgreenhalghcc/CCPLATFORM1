export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface QuizQuestion {
  id:
    | 'season'
    | 'house'
    | 'taste'
    | 'music'
    | 'scent'
    | 'base'
    | 'afterMeal'
    | 'colour'
    | 'sweetness';
  title: string;
  prompt: string;
  options: QuestionOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'season',
    title: 'Pick a season',
    prompt: 'When do you want this cocktail to shine?',
    options: [
      { value: 'spring', label: 'Spring', description: 'Fresh & floral' },
      { value: 'summer', label: 'Summer', description: 'Bright & vibrant' },
      { value: 'autumn', label: 'Autumn', description: 'Warm & spiced' },
      { value: 'winter', label: 'Winter', description: 'Rich & comforting' },
    ],
  },
  {
    id: 'house',
    title: 'Choose a dream escape',
    prompt: 'Where would you sip this drink?',
    options: [
      { value: 'beach', label: 'Beach house' },
      { value: 'mountain', label: 'Mountain hideaway' },
      { value: 'city', label: 'City penthouse' },
      { value: 'forest', label: 'Forest cabin' },
    ],
  },
  {
    id: 'taste',
    title: 'Describe your ideal flavour',
    prompt: 'Pick the statement that resonates with your palate.',
    options: [
      { value: 'bold', label: 'Bold & adventurous' },
      { value: 'classic', label: 'Timeless classic' },
      { value: 'fresh', label: 'Zesty & fresh' },
      { value: 'smooth', label: 'Silky smooth' },
    ],
  },
  {
    id: 'music',
    title: 'Set the soundtrack',
    prompt: 'What’s playing in the background?',
    options: [
      { value: 'jazz', label: 'Late-night jazz' },
      { value: 'soul', label: 'Soul & r&b' },
      { value: 'electronic', label: 'Ambient electronic' },
      { value: 'indie', label: 'Indie favourites' },
    ],
  },
  {
    id: 'scent',
    title: 'Choose an aroma',
    prompt: 'Pick the fragrance that draws you in.',
    options: [
      { value: 'citrus', label: 'Citrus zest' },
      { value: 'herbal', label: 'Fresh herbs' },
      { value: 'floral', label: 'Floral bouquet' },
      { value: 'smoke', label: 'Smoky embers' },
    ],
  },
  {
    id: 'base',
    title: 'Pick a base spirit',
    prompt: 'Select the spirit to anchor your cocktail.',
    options: [
      { value: 'gin', label: 'Gin' },
      { value: 'vodka', label: 'Vodka' },
      { value: 'rum', label: 'Rum' },
      { value: 'whiskey', label: 'Whiskey' },
    ],
  },
  {
    id: 'afterMeal',
    title: 'Post-meal vibe',
    prompt: 'How should this drink feel after dinner?',
    options: [
      { value: 'fruit', label: 'Light & fruity' },
      { value: 'digestif', label: 'Digestif-style' },
      { value: 'coffee', label: 'Coffee-infused' },
      { value: 'dessert', label: 'Dessert-like' },
    ],
  },
  {
    id: 'colour',
    title: 'Pick a colour palette',
    prompt: 'Which hue should the cocktail lean into?',
    options: [
      { value: 'gold', label: 'Golden' },
      { value: 'pink', label: 'Blush pink' },
      { value: 'amber', label: 'Amber' },
      { value: 'emerald', label: 'Emerald' },
    ],
  },
  {
    id: 'sweetness',
    title: 'How sweet should it be?',
    prompt: 'Dial in the sweetness level.',
    options: [
      { value: 'dry', label: 'Dry' },
      { value: 'medium', label: 'Balanced' },
      { value: 'sweet', label: 'Dessert-like' },
      { value: 'surprise', label: 'Surprise me' },
    ],
  },
];
