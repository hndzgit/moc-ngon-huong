export type EmotionKey = 'ALL' | 'AN' | 'THUONG' | 'CAM' | 'NHO' | 'COMBO';

export type PageRoute = 'home' | 'story' | 'products' | 'detail' | 'contact' | 'checkout' | 'auth' | 'gift-journey' | 'corporate' | 'admin' | 'not-found';

export type AuthStep =
  | 'login'
  | 'register'
  | 'forgot-email'
  | 'forgot-reset'
  | 'forgot-success'
  | 'profile';

export type OrderStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'shipping'
  | 'completed'
  | 'cancelled';

export type PaymentStatus =
  | 'pending_payment'
  | 'pending'
  | 'customer_reported_paid'
  | 'paid'
  | 'completed'
  | 'payment_review'
  | 'cancelled'
  | 'failed'
  | 'refunded';

export interface OrderPaymentInstructions {
  method: 'vietqr';
  bankBin: string;
  bankShortName: string;
  bankFullName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  currency: 'VND';
  transferContent: string;
  qrPayload: string;
  qrSvgDataUrl?: string;
}

export interface PaymentAuditLogEntry {
  orderId: string;
  orderCode?: string;
  action: string;
  previousPaymentStatus: string;
  newPaymentStatus: string;
  actorType: 'customer' | 'admin' | 'system';
  actorUid?: string | null;
  actorEmail?: string | null;
  timestamp: string;
  transactionRef?: string | null;
  note?: string | null;
}

export interface NotificationDeliveryEntry {
  sent: boolean;
  sentAt?: string | null;
  messageId?: string | null;
  idempotencyKey?: string;
  lastAttemptAt?: string;
  error?: string | null;
}

export interface OrderNotificationDelivery {
  orderCreated?: NotificationDeliveryEntry;
  paymentConfirmed?: NotificationDeliveryEntry;
}

export type ProductSku =
  | 'MNH-A01'
  | 'MNH-T01'
  | 'MNH-C01'
  | 'MNH-N01'
  | 'MNH-A02'
  | 'MNH-T02'
  | 'MNH-C02'
  | 'MNH-N02'
  | 'MNH-TY';

export type ProductCategoryCode = 'CATEGORY_A_100G' | 'CATEGORY_B_200G_GIFT' | 'CATEGORY_C_COMBO';

export type ProductPublicationStatus = 'published' | 'reserved_pending_approval';

export interface SkuCatalogEntry {
  sku: ProductSku;
  productId: string;
  variantId: string;
  shortCodeName: 'AN' | 'THƯƠNG' | 'CẢM' | 'NHỚ' | 'TÂM Ý';
  productName: string;
  category: ProductCategoryCode;
  emotion: EmotionKey;
  weightGrams?: number;
  weightLabel?: string;
  price: number;
  published: boolean;
  publicationStatus: ProductPublicationStatus;
}

export interface OrderItemSnapshot {
  productId: string;
  variantId?: string;
  sku?: string;
  productName: string;
  price: number;
  quantity: number;
  weightGrams?: number;
  image?: string;
  giftConfiguration?: any;
}

export interface OrderRecord {
  id: string;
  orderCode: string;
  userId?: string | null;
  customerUid?: string | null;
  isGuestOrder?: boolean;
  linkedAt?: string | null;
  notificationSent?: boolean;
  notificationDelivery?: OrderNotificationDelivery;
  customer: {
    fullName: string;
    phone: string;
    email: string;
    address?: string;
    provinceCode?: string;
    provinceName?: string;
    communeCode?: string;
    communeName?: string;
    formattedAddress?: string;
    addressSchemaVersion?: string;
    city?: string;
    district?: string;
    ward?: string;
    shippingMode: 'delivery' | 'pickup';
    pickupStore?: string;
    note?: string;
  };
  items: OrderItemSnapshot[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: 'cod' | 'bank';
  paymentStatus: PaymentStatus;
  paymentInstructions?: OrderPaymentInstructions | null;
  customerReportedAt?: string | null;
  customerReportedByUid?: string | null;
  paymentConfirmedAt?: string | null;
  paymentConfirmedBy?: string | null;
  paymentConfirmedByEmail?: string | null;
  bankTransactionRef?: string | null;
  paymentAuditLog?: PaymentAuditLogEntry[];
  orderStatus: OrderStatus;
  status?: OrderStatus;
  createdAt: string;
  statusUpdatedAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  idempotencyKey?: string;
  schemaVersion?: string;
  /** Transient cleartext token returned only on creation/recovery; never stored in Firestore */
  recoveryToken?: string;
}

export interface IncludedFlavorItem {
  id: string;
  title: string;
  subtitle: string;
  emotion: EmotionKey;
  image: string;
}

export interface Product {
  id: string;
  sku: ProductSku;
  variantId?: string;
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
  weightGrams?: number;
  published?: boolean;
  publicationStatus?: ProductPublicationStatus;
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
  /** Local draft only; deliberately excluded from persistent cart storage. */
  giftConfiguration?: GiftConfiguration;
}

export type TeaEmotion = 'AN' | 'THUONG' | 'CAM' | 'NHO';
export interface GiftConfiguration {
  intention: string;
  emotion: TeaEmotion;
  recipient: string;
  message: string;
  cardStyle: 'botanical' | 'letter';
}
export interface GiftDraft extends GiftConfiguration { productId: string; }

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
