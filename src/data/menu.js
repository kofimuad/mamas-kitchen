// ─── PLATE ORDERS — Saturdays ───────────────────────────────
export const plateItems = [
  {
    id: 'jollof-chicken',
    name: 'Jollof Rice with Chicken',
    price: 25,
    available: true,
    description: 'Classic Ghanaian party jollof rice served with seasoned fried chicken.',
    tags: ['Jollof', 'Chicken', 'Rice'],
    category: 'Jollof',
    image: '/images/jollof-chicken-plate.jpg',
  },
  {
    id: 'jollof-fish',
    name: 'Jollof Rice with Whole Fish',
    price: 28,
    available: true,
    description: 'Smoky jollof rice paired with a whole seasoned fried fish.',
    tags: ['Jollof', 'Fish', 'Rice'],
    category: 'Jollof',
    image: '/images/jollof-plate.jpg',
  },
  {
    id: 'check-check',
    name: 'Check Check',
    price: 25,
    available: true,
    description: 'A beloved Ghanaian street food favourite — hearty, spicy and deeply satisfying.',
    tags: ['Street Food', 'Spicy'],
    category: 'Speciality',
    image: '/images/jollof-plate-2.jpg',
  },
  {
    id: 'fufu-soup',
    name: 'Fufu and Chicken Light Soup',
    price: 28,
    available: true,
    description: 'Hand-pounded fufu served with a rich, aromatic chicken light soup.',
    tags: ['Fufu', 'Soup', 'Chicken'],
    category: 'Soup',
    image: '/images/fufu-kontomire.jpg',
  },
  {
    id: 'red-red',
    name: 'Red Red',
    price: 12,
    available: true,
    description: 'Classic black-eyed peas stew in rich palm oil, served with sweet fried plantains.',
    tags: ['Black Eye Peas', 'Plantain', 'Palm Oil'],
    category: 'Speciality',
    image: '/images/red-red.webp',
  },
]

// ─── TRAY ORDERS — Wednesdays ────────────────────────────────
export const trayItems = [
  // Jollof
  {
    id: 'tray-jollof-plain',
    name: 'Plain Jollof Tray',
    price: 55,
    available: true,
    description: 'A full tray of smoky, perfectly seasoned Ghanaian party jollof rice.',
    tags: ['Jollof', 'Tray', 'Vegetarian'],
    category: 'Jollof',
    image: '/images/jollof-plate.jpg',
  },
  {
    id: 'tray-jollof-chicken',
    name: 'Chicken Jollof Tray',
    price: 65,
    available: true,
    description: 'Jollof rice tray loaded with seasoned chicken pieces throughout.',
    tags: ['Jollof', 'Chicken', 'Tray'],
    category: 'Jollof',
    image: '/images/jollof-chicken-tray.jpg',
  },
  {
    id: 'tray-jollof-suya',
    name: 'Suya Jollof Tray',
    price: 75,
    available: true,
    description: 'Jollof rice tray with tender suya-spiced meat — smoky and bold.',
    tags: ['Jollof', 'Suya', 'Tray'],
    category: 'Jollof',
    image: '/images/jollof-goat.jpg',
  },
  {
    id: 'tray-jollof-goat',
    name: 'Goat Jollof Tray',
    price: 85,
    available: true,
    description: 'Jollof rice tray with slow-cooked goat meat — the ultimate crowd pleaser.',
    tags: ['Jollof', 'Goat', 'Tray'],
    category: 'Jollof',
    image: '/images/jollof-plate-2.jpg',
  },
  // Fried Rice
  {
    id: 'tray-fried-plain',
    name: 'Plain Fried Rice Tray',
    price: 55,
    available: true,
    description: 'A full tray of perfectly seasoned Ghanaian-style fried rice.',
    tags: ['Fried Rice', 'Tray', 'Vegetarian'],
    category: 'Fried Rice',
    image: '/images/jollof-plate.jpg',
  },
  {
    id: 'tray-fried-chicken',
    name: 'Chicken Fried Rice Tray',
    price: 65,
    available: true,
    description: 'Fried rice tray with juicy seasoned chicken pieces.',
    tags: ['Fried Rice', 'Chicken', 'Tray'],
    category: 'Fried Rice',
    image: '/images/jollof-chicken-plate.jpg',
  },
  {
    id: 'tray-fried-suya',
    name: 'Suya Fried Rice Tray',
    price: 75,
    available: true,
    description: 'Fried rice tray with smoky suya-spiced meat.',
    tags: ['Fried Rice', 'Suya', 'Tray'],
    category: 'Fried Rice',
    image: '/images/jollof-goat.jpg',
  },
  {
    id: 'tray-fried-goat',
    name: 'Goat Fried Rice Tray',
    price: 85,
    available: true,
    description: 'Fried rice tray with tender slow-cooked goat meat.',
    tags: ['Fried Rice', 'Goat', 'Tray'],
    category: 'Fried Rice',
    image: '/images/jollof-plate-2.jpg',
  },
  // Other
  {
    id: 'tray-egusi-rice',
    name: 'Egusi Tray with Rice',
    price: null,
    available: true,
    description: 'Rich, hearty egusi stew served with a full tray of white rice.',
    tags: ['Egusi', 'Soup', 'Tray'],
    category: 'Other',
    image: '/images/egusi.webp',
  },
  {
    id: 'tray-egusi-eba',
    name: 'Egusi Tray with Eba',
    price: null,
    available: true,
    description: 'Egusi stew served with 5 balls of freshly made eba.',
    tags: ['Egusi', 'Eba', 'Tray'],
    category: 'Other',
    image: '/images/egusi.webp',
  },
  {
    id: 'tray-chicken',
    name: 'Chicken Tray',
    price: null,
    available: true,
    description: 'A full tray of Mama\'s perfectly seasoned, slow-cooked chicken.',
    tags: ['Chicken', 'Tray'],
    category: 'Other',
    image: '/images/cooking-pot.jpg',
  },
  {
    id: 'tray-goat',
    name: 'Goat Tray',
    price: null,
    available: true,
    description: 'Tender slow-cooked goat meat, seasoned the Ghanaian way.',
    tags: ['Goat', 'Tray'],
    category: 'Other',
    image: '/images/jollof-goat.jpg',
  },
]

// ─── CATEGORIES ──────────────────────────────────────────────
export const plateCategories = ['Jollof', 'Soup', 'Speciality']
export const trayCategories  = ['Jollof', 'Fried Rice', 'Other']

// ─── CUTOFF TIMES ────────────────────────────────────────────
export const cutoffs = {
  plate: { day: 'Thursday', hour: 20 }, // 8 PM Thursday → Saturday delivery
  tray:  { day: 'Monday',   hour: 20 }, // 8 PM Monday   → Wednesday delivery
}

// ─── FOOD NAME SUGGESTIONS (by category, for Admin Menu Editor) ──
export const foodSuggestions = {
  Jollof: [
    'Plain Jollof', 'Chicken Jollof', 'Suya Jollof', 'Goat Jollof',
    'Fish Jollof', 'Beef Jollof', 'Jollof Rice with Chicken', 'Jollof Rice with Whole Fish',
  ],
  'Fried Rice': [
    'Plain Fried Rice', 'Chicken Fried Rice', 'Suya Fried Rice',
    'Goat Fried Rice', 'Shrimp Fried Rice', 'Mixed Fried Rice',
  ],
  Soup: [
    'Fufu and Chicken Light Soup', 'Fufu and Goat Light Soup',
    'Banku and Tilapia', 'Groundnut Soup', 'Palm Nut Soup', 'Okra Soup',
  ],
  Speciality: [
    'Check Check', 'Red Red', 'Kelewele', 'Kontomire Stew',
    'Waakye', 'Ampesi', 'Beans and Plantain',
  ],
  Other: [
    'Chicken Tray', 'Goat Tray', 'Egusi Tray with Rice', 'Egusi Tray with Eba',
    'Kontomire Tray', 'Plantain Tray', 'Assorted Meat Tray',
  ],
}
