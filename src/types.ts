export type EmotionKey = 'ALL' | 'AN' | 'THUONG' | 'CAM' | 'NHO' | 'COMBO';

export type PageRoute = 'home' | 'story' | 'products' | 'detail' | 'contact' | 'checkout' | 'auth' | 'not-found';

export type AuthStep =
  | 'login'
  | 'activate'
  | 'register'
  | 'forgot-email'
  | 'forgot-otp'
  | 'forgot-reset'
  | 'forgot-success';

export interface IncludedFlavorItem {
  id: string;
  title: string;
  subtitle: string;
  emotion: EmotionKey;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  shortName: string;
  code: string;
  emotion: EmotionKey;
  emotionLabel: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  stock: number;
  rating: number;
  reviewsCount: number;
  weight: string;
  packaging: string;
  image: string;
  gallery: string[];
  badge?: string;
  shortDesc: string;
  fullDesc: string;
  storyTitle: string;
  storyParagraphs: string[];
  storyQuote: string;
  storyImage: string;
  botanicalIllustration: string;
  scentNotes: string[];
  tasteNotes: string;
  ingredients: string[];
  brewingTemp: string;
  brewingTime: string;
  brewingAmount: string;
  perfectGiftFor: string[];
  includedFlavors?: IncludedFlavorItem[];
  isSignature?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedGiftCard?: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  productName: string;
  title?: string;
  comment: string;
  verified: boolean;
  images?: string[];
  likes?: number;
}
