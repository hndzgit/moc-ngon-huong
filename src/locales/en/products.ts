export const products = {
  collectionPage: {
    brandKicker: 'MỘC NGÔN HƯƠNG',
    title: 'Our Tea Collection',
    quote: '“A pot of tea is sometimes reason enough for us to pause and stay awhile.”',
  },
  card: {
    viewProductAria: 'View {{name}}',
    detailAria: 'Details for {{name}}',
  },
  search: {
    dialogAria: 'Search products',
    placeholder: 'Search teas, aromas, or SKUs...',
    clearAria: 'Clear search keyword',
    closeAria: 'Close search',
    emptyPrefix: 'No matching results found for “',
    emptySuffix: '”. Please try another keyword',
    recentlyViewed: 'Recently Viewed',
    clearRecent: 'Clear',
    allProductsHeading: 'Products by Mộc Ngôn Hương',
  },
  detail: {
    imageFallbackAlt: 'Product photo {{index}}',
    skuLabel: 'Product SKU:',
    qtyTitle: 'Quantity',
    stockNote: 'In stock • Handcrafted packaging',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    scentLabel: 'Fragrance notes:',
    giftForLabel: 'Thoughtful gift for:',
    relatedHeading: 'More Teas from Mộc Ngôn Hương',
    reviewsHeading: 'Customer Reviews',
    reviewsEmptyTitle: 'No online reviews published for this tea yet',
    reviewsEmptyBody:
      'Mộc Ngôn Hương only publishes verified impressions from customers who have completed an order and tasted our teas. Need help choosing an aroma? Our tea team is always glad to advise.',
    reviewsContactCta: 'Contact Us for Advice',
    serviceBadges: [
      { icon: 'group' as const, title: 'Express Dispatch', subtitle: 'Same-day within Hanoi' },
      { icon: 'dollar' as const, title: 'Cash on Delivery', subtitle: 'Pay upon delivery' },
      { icon: 'box' as const, title: 'Vacuum Sealed', subtitle: 'Available on request' },
      { icon: 'airplane' as const, title: 'Air Freight', subtitle: 'Da Nang & HCMC' },
    ],
  },
} as const;
