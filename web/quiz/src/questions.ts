export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface QuizQuestion {
  id:
    | 'season'
    | 'house_type'
    | 'dining_style'
    | 'music_preference'
    | 'aroma_preference'
    | 'base_spirit'
    | 'bitterness_tolerance'
    | 'sweetener_question'
    | 'carbonation_texture'
    | 'foam_toggle'
    | 'abv_lane'
    | 'allergens';
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
    id: 'house_type',
    title: 'Choose a dream escape',
    prompt: 'Where would you sip this drink?',
    options: [
      { value: 'beach house', label: 'Beach house' },
      { value: 'modern house', label: 'Modern house' },
      { value: 'haunted house', label: 'Haunted house' },
      { value: 'tree house', label: 'Tree house' },
    ],
  },
  {
    id: 'dining_style',
    title: 'Describe your ideal experience',
    prompt: 'Pick the statement that resonates with your palate.',
    options: [
      {
        label: 'A balanced blend of flavours',
        value: 'a balanced blend of flavours',
      },
      {
        label: 'Subtle tastes which advertise freshness',
        value: 'subtle tastes which advertise freshness',
      },
      {
        label: 'Refreshing and vibrant flavours which awaken my senses',
        value: 'refreshing and vibrant flavours which awaken my senses',
      },
      {
        label: 'A sweet tooth indulging in rich flavours',
        value: 'a sweet tooth indulging in rich flavours',
      },
    ],
  },
  {
    id: 'music_preference',
    title: 'Set the soundtrack',
    prompt: 'What’s playing in the background?',
    options: [
      { value: 'jazz/blues', label: 'Late-night jazz' },
      { value: 'rap', label: 'Soul & R&B' },
      { value: 'pop', label: 'Ambient electronic' },
      { value: 'rock', label: 'Indie favourites' },
    ],
  },
  {
    id: 'aroma_preference',
    title: 'Choose an aroma',
    prompt: 'Pick the fragrance that draws you in.',
    options: [
      { value: 'citrus', label: 'Citrus zest' },
      { value: 'woody', label: 'Campfire wood' },
      { value: 'floral', label: 'Floral bouquet' },
      { value: 'sweet', label: 'Sweet sugar' },
    ],
  },
  {
    id: 'base_spirit',
    title: 'Pick a base spirit',
    prompt: 'Select the spirit to anchor your cocktail.',
    options: [
      { value: 'gin', label: 'Gin' },
      { value: 'vodka', label: 'Vodka' },
      { value: 'rum', label: 'Rum' },
      { value: 'tequila', label: 'Tequila' },
    ],
  },
  {
    id: 'bitterness_tolerance',
    title: 'Bitterness level',
    prompt: 'How do you feel about bitterness?',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'High', value: 'high' },
    ],
  },
  {
    id: 'sweetener_question',
    title: 'How sweet should it be?',
    prompt: 'Dial in the sweetness level.',
    options: [
      { label: 'Classic', value: 'classic' },
      { label: 'Rich', value: 'rich' },
      { label: 'Floral', value: 'floral' },
      { label: 'Zesty', value: 'zesty' },
    ],
  },
  {
    id: 'abv_lane',
    title: 'How strong should it be?',
    prompt: 'Dial in the booze level.',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'Strong', value: 'strong' },
    ],
  },
];
