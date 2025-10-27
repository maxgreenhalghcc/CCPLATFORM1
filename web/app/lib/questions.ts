export interface QuizOption {
  value: string;
  label: string;
  description?: string;
}

export interface QuizQuestion {
  id: string;
  title: string;
  prompt: string;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'season',
    title: 'Choose your season',
    prompt: 'Which time of year matches your current vibe?',
    options: [
      { value: 'spring', label: 'Spring Bloom', description: 'Crisp botanicals and fresh starts.' },
      { value: 'summer', label: 'Summer Heat', description: 'Tropical fruit and long evenings.' },
      { value: 'autumn', label: 'Autumn Spice', description: 'Warm notes and comforting spice.' },
      { value: 'winter', label: 'Winter Hearth', description: 'Rich flavours by the fire.' }
    ]
  },
  {
    id: 'house',
    title: 'Pick a bar interior',
    prompt: 'Where are you taking your friends tonight?',
    options: [
      { value: 'art_deco', label: 'Art Deco Lounge', description: 'Glamour, velvet and brass accents.' },
      { value: 'tropical', label: 'Tropical Hideaway', description: 'Palm fronds, neon and tiki energy.' },
      { value: 'minimal', label: 'Minimal Loft', description: 'Clean lines, curated playlists.' },
      { value: 'speakeasy', label: 'Secret Speakeasy', description: 'Low lights and whispered passwords.' }
    ]
  },
  {
    id: 'taste_sentence',
    title: 'Finish the sentence',
    prompt: 'Tonight I want something…',
    options: [
      { value: 'bright', label: 'Bright & Zesty', description: 'Citrus-led with sparkling lift.' },
      { value: 'spiced', label: 'Spiced & Complex', description: 'Layers of warmth and intrigue.' },
      { value: 'herbal', label: 'Herbal & Refreshing', description: 'Green, vibrant and garden-fresh.' },
      { value: 'indulgent', label: 'Indulgent & Silky', description: 'Luxurious texture with depth.' }
    ]
  },
  {
    id: 'music',
    title: 'Set the soundtrack',
    prompt: 'What music is playing while you sip?',
    options: [
      { value: 'jazz', label: 'Late-night Jazz', description: 'Smoky horns and slow tempo.' },
      { value: 'disco', label: 'Studio Disco', description: 'Glitter balls and floorfillers.' },
      { value: 'indie', label: 'Indie Playlist', description: 'Guitars, hooks and singalongs.' },
      { value: 'lofi', label: 'Lo-fi Beats', description: 'Downtempo focus and mellow moods.' }
    ]
  },
  {
    id: 'candle',
    title: 'Pick a candle scent',
    prompt: 'Strike a match and set the mood.',
    options: [
      { value: 'citrus', label: 'Citrus Peel', description: 'Lemon zest and sparkling oils.' },
      { value: 'floral', label: 'Night-blooming Floral', description: 'Soft petals and perfume.' },
      { value: 'wood', label: 'Smoked Cedar', description: 'Amber, wood and campfire glow.' },
      { value: 'spice', label: 'Cardamom Spice', description: 'Sweet spice with subtle heat.' }
    ]
  },
  {
    id: 'base_spirit',
    title: 'Choose a base spirit',
    prompt: 'Which bottle are we reaching for first?',
    options: [
      { value: 'gin', label: 'Gin', description: 'Juniper, botanicals and balance.' },
      { value: 'vodka', label: 'Vodka', description: 'Clean canvas for bold flavours.' },
      { value: 'rum', label: 'Rum', description: 'Molasses, spice and sunshine.' },
      { value: 'tequila', label: 'Tequila', description: 'Agave brightness and zip.' }
    ]
  },
  {
    id: 'post_meal',
    title: 'After-dinner ritual',
    prompt: 'How do you close the night?',
    options: [
      { value: 'espresso', label: 'Espresso Shot', description: 'Sharp, short and energising.' },
      { value: 'dessert', label: 'Chocolate Dessert', description: 'Rich cocoa indulgence.' },
      { value: 'cheese', label: 'Cheese Board', description: 'Savory, salty and refined.' },
      { value: 'fresh_air', label: 'Fresh Air Walk', description: 'Cool breeze and reflection.' }
    ]
  },
  {
    id: 'colour',
    title: 'Colour palette',
    prompt: 'What hue should the cocktail glow with?',
    options: [
      { value: 'amber', label: 'Amber Sunrise', description: 'Golden warmth and sparkle.' },
      { value: 'crimson', label: 'Crimson Velvet', description: 'Deep reds and plush textures.' },
      { value: 'emerald', label: 'Emerald City', description: 'Vibrant greens and freshness.' },
      { value: 'midnight', label: 'Midnight Indigo', description: 'Inky blues and mystery.' }
    ]
  },
  {
    id: 'sweetness',
    title: 'Sweetness level',
    prompt: 'Dial in the sweetness balance.',
    options: [
      { value: 'dry', label: 'Dry & Structured', description: 'Barely any sweetness.' },
      { value: 'balanced', label: 'Balanced', description: 'Equal parts sweet and tart.' },
      { value: 'lush', label: 'Lush & Dessert-like', description: 'Decadent and smooth.' }
    ]
  }
];

export const CONTACT_QUESTION_ID = 'contact';
