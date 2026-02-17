// web/app/b/[barSlug]/quiz/questions.ts

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
    | 'abv_lane';
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
      { value: 'beach house', label: 'Beach house', description: 'Breezy & refreshing' },
      { value: 'modern house', label: 'Modern house', description: 'Clean & sophisticated' },
      { value: 'haunted house', label: 'Haunted house', description: 'Dark & enigmatic' },
      { value: 'tree house', label: 'Tree house', description: 'Earthy & adventurous' },
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
        description: 'Harmonious & well-rounded',
      },
      {
        label: 'Subtle tastes which advertise freshness',
        value: 'subtle tastes which advertise freshness',
        description: 'Light, crisp & delicate',
      },
      {
        label: 'Refreshing and vibrant flavours which awaken my senses',
        value: 'refreshing and vibrant flavours which awaken my senses',
        description: 'Bright, zesty & energising',
      },
      {
        label: 'A sweet tooth indulging in rich flavours',
        value: 'a sweet tooth indulging in rich flavours',
        description: 'Dessert-like & indulgent',
      },
    ],
  },
  {
    id: 'music_preference',
    title: 'Set the soundtrack',
    prompt: 'What’s playing in the background?',
    options: [
      { value: 'jazz/blues', label: 'Jazz / blues', description: 'Smooth & soulful' },
      { value: 'pop', label: 'Pop', description: 'Upbeat & playful' },
      { value: 'rock', label: 'Rock', description: 'Bold & electrifying' },
      { value: 'rap', label: 'Rap', description: 'Rhythmic & intense' },
    ],
  },
  {
    id: 'aroma_preference',
    title: 'Choose an aroma',
    prompt: 'Pick the fragrance that draws you in.',
    options: [
      { value: 'citrus', label: 'Citrus zest', description: 'Bright & invigorating' },
      { value: 'floral', label: 'Floral bouquet', description: 'Soft & aromatic' },
      { value: 'woody', label: 'Campfire wood', description: 'Smoky & earthy' },
      { value: 'sweet', label: 'Sweet sugar', description: 'Warm & indulgent' },
    ],
  },
  {
    id: 'base_spirit',
    title: 'Pick a base spirit',
    prompt: 'Select the spirit to anchor your cocktail.',
    options: [
      { value: 'gin', label: 'Gin', description: 'Herbal & aromatic' },
      { value: 'vodka', label: 'Vodka', description: 'Clean & versatile' },
      { value: 'rum', label: 'Rum', description: 'Warm & characterful' },
      { value: 'tequila', label: 'Tequila', description: 'Vibrant & earthy' },
    ],
  },
  {
    id: 'bitterness_tolerance',
    title: 'Bitterness level',
    prompt: 'How do you feel about bitterness?',
    options: [
      { label: 'Low', value: 'low', description: 'Soft & gentle' },
      { label: 'Medium', value: 'medium', description: 'Balanced & noticeable' },
      { label: 'High', value: 'high', description: 'Bold & assertive' },
    ],
  },
  {
    id: 'sweetener_question',
    title: 'How sweet should it be?',
    prompt: 'Dial in the sweetness level.',
    options: [
      { label: 'Classic', value: 'classic', description: 'Balanced & familiar' },
      { label: 'Rich', value: 'rich', description: 'Decadent & syrupy' },
      { label: 'Floral', value: 'floral', description: 'Light & perfumed' },
      { label: 'Zesty', value: 'zesty', description: 'Bright & tangy' },
    ],
  },
  {
    id: 'abv_lane',
    title: 'How strong should it be?',
    prompt: 'Dial in the booze level.',
    options: [
      { label: 'Low', value: 'low', description: 'Light & easy-going' },
      { label: 'Medium', value: 'medium', description: 'Smooth & balanced' },
      { label: 'Strong', value: 'strong', description: 'Bold & spirited' },
    ],
  },
];


export const CONTACT_QUESTION_ID = 'contact';
export const ALLERGENS_QUESTION_ID = 'allergens';
