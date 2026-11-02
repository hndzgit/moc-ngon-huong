export type TeaStatus = 'An' | 'Thương' | 'Cảm' | 'Nhớ';

export interface Product {
  id: string;
  name: string;
  subName?: string;
  status: TeaStatus;
  statusLabel: string;
  price: number;
  originalPrice?: number;
  description: string;
  longDescription?: string;
  scentNotes: string;
  perfectGiftFor: string;
  images: string[];
  stock: number;
  rating: number;
  reviewsCount: number;
  tag: string;
  isSignature?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  giftBoxIncluded?: boolean;
  handwrittenNote?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber?: string;
  address?: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
  verifiedPurchase: boolean;
  avatar?: string;
  images?: string[];
}
