import { BUSINESS_CONTACT } from '../../lib/contact';

export const common = {
  brand: {
    name: BUSINESS_CONTACT.brandName,
    artisanSubtitle: 'MỘC NGÔN HƯƠNG • ARTISAN VIETNAMESE TEA',
    atelier: 'Mộc Ngôn Hương Atelier',
    tagline: 'Sharing Aroma, Sending Affection',
    addressShort: '42 Hang Dieu Street, Hoan Kiem District, Hanoi',
    addressWorkshop: 'Tan Cuong Commune, Thai Nguyen City',
    hotline: BUSINESS_CONTACT.hotlineDisplay,
    email: BUSINESS_CONTACT.email,
  },
  language: {
    label: 'Language',
    switchAria: 'Switch website language',
    viShort: 'VI',
    enShort: 'EN',
    viName: 'Tiếng Việt',
    enName: 'English',
  },
  actions: {
    learnMore: 'Learn more',
    viewDetails: 'View details',
    backHome: 'Back to Home',
    close: 'Close',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    edit: 'Edit',
    retry: 'Try again',
    copy: 'Copy',
    copied: 'Copied',
    decreaseQty: 'Decrease quantity',
    increaseQty: 'Increase quantity',
    clearSelection: 'Clear selection',
  },
  labels: {
    sku: 'Product SKU',
    legacySku: 'Legacy pre-SKU order',
    quantity: 'Quantity',
    unitPrice: 'Unit price',
    subtotal: 'Subtotal',
    free: 'Free',
    totalPayment: 'Total Amount',
    currencySuffix: 'VND',
  },
  loading: {
    story: 'Opening the tea story…',
    gifting: 'Opening gifting atelier…',
    admin: 'Opening order management…',
  },
  notFound: {
    title: 'Page Not Found',
    description: 'The requested page does not exist.',
    backHome: 'Back to Home',
  },
  seo: {
    defaultTitle: 'Mộc Ngôn Hương — Sharing Aroma, Sending Affection | Artisan Vietnamese Tea',
    defaultDescription:
      'Mộc Ngôn Hương — Handcrafted Thai Nguyen flower-scented teas (An, Thương, Cảm, Nhớ) and the Tâm Ý Gift Box. Sharing aroma, sending heartfelt affection.',
    homeTitle: 'Mộc Ngôn Hương — Sharing Aroma, Sending Affection | Artisan Vietnamese Tea',
    homeDescription:
      'Explore four artisanal flower-scented Vietnamese teas from La Bang & Tan Cuong: Pomelo An, Jasmine Thuong, Chloranthus Cam, Green Rice Nho, and the Tam Y Gift Box.',
    storyTitle: 'Our Story — Tea Aroma & Unspoken Words | Mộc Ngôn Hương',
    storyDescription:
      'Discover how Mộc Ngôn Hương revives heritage Vietnamese flower-scented teas crafted alongside La Bang tea artisans in Thai Nguyen.',
    productsTitle: 'Tea Collection & Gift Sets | Mộc Ngôn Hương',
    productsDescription:
      'Shop four hand-scented Vietnamese floral tea boxes and the Tâm Ý Gift Combo with wooden scoop, peanut brittle, and QR story cards.',
    detailTitleSuffix: 'Mộc Ngôn Hương',
    contactTitle: 'Contact & Tea Lounge | Mộc Ngôn Hương',
    contactDescription:
      'Visit Mộc Ngôn Hương at 42 Hang Dieu Street, Hoan Kiem, Hanoi, or reach out for personal and gift consultations.',
    giftJourneyTitle: 'Curate Your Tea Gift | Mộc Ngôn Hương',
    giftJourneyDescription:
      'Match an emotion to a flower-scented tea and preview your custom message card.',
    corporateTitle: 'Corporate & Bespoke Event Gifting | Mộc Ngôn Hương',
    corporateDescription:
      'Thoughtful Vietnamese artisan tea gift collections crafted for executive appreciation, client milestones, and corporate events.',
    checkoutTitle: 'Checkout | Mộc Ngôn Hương',
    checkoutDescription:
      'Complete your order with instant VietQR bank transfer (BIDV) or Cash on Delivery with complimentary nationwide shipping in Vietnam.',
    authTitle: 'My Account & Orders | Mộc Ngôn Hương',
    authDescription:
      'Sign in, track your tea orders, and manage saved shipping addresses with Mộc Ngôn Hương.',
  },
} as const;
