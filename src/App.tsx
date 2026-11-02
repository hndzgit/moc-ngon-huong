import { assetUrl } from './lib/assets';
import { readRoute, routeHash } from './lib/routes';
import { FigmaArtwork } from './components/FigmaArtwork';
import React, { useState, useMemo, useEffect } from 'react';
import { CartItem, PageRoute, Product } from './types';
import { PRODUCTS } from './data/products';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { EmotionSelector } from './components/EmotionSelector';
import { ProductCard } from './components/ProductCard';
import { SignatureBoxSection } from './components/SignatureBoxSection';
import { Footer } from './components/Footer';
import { ChatBox } from './components/ChatBox';
import { CartDrawer } from './components/CartDrawer';
import { SearchOverlay } from './components/SearchOverlay';
import { StoryPage } from './pages/StoryPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ContactPage } from './pages/ContactPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AuthPage } from './pages/AuthPage';

const CART_STORAGE_KEY = 'mnh_cart_items_v1';
const USER_STORAGE_KEY = 'mnh_user_email_v1';

const DEFAULT_CART_ITEMS: CartItem[] = [
  { product: PRODUCTS[0], quantity: 1 },
  { product: PRODUCTS[4], quantity: 1 },
];

export function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>(()=>readRoute().page);
  const [selectedProductId, setSelectedProductId] = useState<string>(()=>readRoute().productId || 'buoi-an');

  useEffect(() => {
    const restoreRoute = () => {
      const route = readRoute();
      setCurrentPage(route.page);
      if (route.productId) setSelectedProductId(route.productId);
      setCartOpen(false);
      setSearchOpen(false);
      window.scrollTo({top:0,behavior:'instant'});
    };
    window.addEventListener('hashchange',restoreRoute);
    return () => window.removeEventListener('hashchange',restoreRoute);
  },[]);

  // Initialize Cart from localStorage with fallback to Figma 127:8439 default items
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage read errors
    }
    return DEFAULT_CART_ITEMS;
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutProductIds, setCheckoutProductIds] = useState<string[] | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem(USER_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  // Sync cartItems to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage write errors
    }
  }, [cartItems]);

  // Sync userEmail to localStorage
  useEffect(() => {
    try {
      if (userEmail) {
        localStorage.setItem(USER_STORAGE_KEY, userEmail);
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch {
      // Ignore storage write errors
    }
  }, [userEmail]);

  const handleNavigate = (page: PageRoute, productId?: string) => {
    if (productId) {
      setSelectedProductId(productId);
    }
    if (page === 'checkout') { setCartOpen(false); setCheckoutProductIds(null); }
    setCurrentPage(page);
    window.location.hash = routeHash(page, productId || selectedProductId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Map of productId -> quantity in cart for inline (- 0 +) steppers on ProductCards
  const cartQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cartItems) {
      map[item.product.id] = item.quantity;
    }
    return map;
  }, [cartItems]);

  const totalCartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  // Update quantity from inline ProductCard stepper (- 0 +)
  const handleUpdateProductQuantity = (product: Product, delta: number) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (!existing) {
        if (delta > 0) {
          return [...prev, { product, quantity: delta }];
        }
        return prev;
      }
      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) {
        return prev.filter((i) => i.product.id !== product.id);
      }
      return prev.map((i) =>
        i.product.id === product.id ? { ...i, quantity: nextQty } : i
      );
    });
  };

  // Update quantity by productId (used inside CartDrawer & CheckoutPage)
  const handleUpdateCartById = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    handleUpdateProductQuantity(product, quantity);
    setCartOpen(true);
  };

  const homepageFourProducts = PRODUCTS.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f3] text-[#222222]">
      {/* Global Header (Figma 92:3684) */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        cartCount={totalCartCount}
        onOpenCart={() => setCartOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenAuth={() => handleNavigate('auth')}
        userEmail={userEmail}
      />

      {/* Main Page Router */}
      <main className="flex-1">
        {currentPage === 'not-found' && <section className="figma-container py-20 text-center">
          <h1 className="font-philosopher text-4xl text-[#3e5641]">Không tìm thấy trang</h1>
          <p className="my-6">Đường dẫn này không tồn tại.</p>
          <button type="button" className="rounded-full border border-[#3e5641] px-8 py-3 text-[#3e5641]" onClick={()=>handleNavigate('home')}>Về trang chủ</button>
        </section>}
        {currentPage === 'home' && (
          <>
            {/* 1. Hero Banner (Figma 61:1165 & 61:1189) */}
            <Hero onNavigate={handleNavigate} />

            {/* 2. Interactive 4-Emotion Selector & Inline QR Showcase (Figma Component 5 & Component 6 - 80:4148) */}
            <EmotionSelector
              onNavigate={handleNavigate}
              onAddToCart={handleAddToCart}
            />

            {/* 3. 4-Product Grid: "Bốn Sắc Hương Trà Việt" (Figma 56:1033) */}
            <section className="home-teas py-12 md:py-16 bg-[#faf7f2]">
              <div className="figma-container">
                <div className="text-center max-w-[680px] mx-auto mb-10">
                  <p className="text-[13px] md:text-[14px] font-medium text-[#9c5435] mb-1">
                    Trà tại Mộc Ngôn Hương
                  </p>
                  <h2 className="font-philosopher font-bold text-[28px] sm:text-[36px] lg:text-[42px] text-[#203323] mb-2">
                    Bốn Sắc Hương Trà Việt
                  </h2>
                  <p className="text-[14px] text-[#666666] leading-[22px]">
                    Lựa chọn từng búp trà đạt chuẩn từ những nghệ nhân vùng chè danh tiếng Thái Nguyên.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {homepageFourProducts.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      imageSrc={`/assets/figma/originals/${['ae4e7.png', '219aa.png', '417b2.png', 'c759e.png'][index]}`}
                      product={product}
                      quantity={cartQuantities[product.id] || 0}
                      onUpdateQuantity={handleUpdateProductQuantity}
                      onSelect={(id) => handleNavigate('detail', id)}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* 4. Dark-Green Signature Gift Box "TÂM Ý" Carousel Section (Figma Component 8 - 96:3135) */}
            <SignatureBoxSection
              onNavigate={handleNavigate}
              onAddToCart={handleAddToCart}
              displayPrice={399000}
            />

            {/* 5. Multi-Sensory Unboxing Section: "Nghệ Thuật Mở Hộp Đa Giác Quan" */}
            <section className="home-unboxing py-14 md:py-20 bg-[#faf7f2]">
              <div className="figma-container">
                <div className="text-center max-w-[720px] mx-auto mb-10">
                  <p className="text-[13px] md:text-[14px] font-medium text-[#9c5435] mb-1">
                    Trải nghiệm Đa Giác Quan
                  </p>
                  <h2 className="font-philosopher font-bold text-[28px] sm:text-[36px] lg:text-[42px] text-[#203323] mb-2">
                    Nghệ Thuật Mở Hộp Đa Giác Quan
                  </h2>
                  <p className="text-[14px] text-[#666666] leading-[22px]">
                    Mỗi chi tiết đều được thiết kế tỉ mỉ để người nhận cảm nhận được sự trân quý ngay từ cái chạm tay đầu tiên.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      icon: 'kraft' as const,
                      title: 'Chất Liệu Kraft Mộc Mỹ Thuật',
                      desc: 'Bao bì sử dụng giấy tái chế tự nhiên, ép kim hoa văn lá trà cổ điển, thân thiện với môi trường và mang hơi thở tự nhiên thuần phác.',
                      tag: '01 • XÚC GIÁC MỘC MẠC',
                    },
                    {
                      icon: 'envelope' as const,
                      title: 'Dịch Vụ Viết Thiệp Nắn Nót',
                      desc: 'Bạn chỉ cần để lại lời nhắn ở bước thanh toán, đội ngũ Mộc Ngôn Hương sẽ thay bạn nắn nót từng nét chữ trên giấy ép hoa khô tự nhiên.',
                      tag: '02 • LỜI THƯƠNG ĐÍCH THỰC',
                    },
                    {
                      icon: 'spoon' as const,
                      title: 'Muỗng Gỗ Thưởng Trà Khắc Logo',
                      desc: 'Chiếc muỗng gỗ đong trà định lượng chính xác 5g cho mỗi ấm trà hoàn hảo, đồng hành cùng người nhận trong những phút giây tĩnh tại.',
                      tag: '03 • KỶ NIỆM BỀN LÂU',
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="bg-white rounded-[16px] p-6 border border-gray-200/80 shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-[10px] bg-[#faf7f2] border border-gray-200 flex items-center justify-center mb-4">
                          <FigmaArtwork name={item.icon} />
                        </div>
                        <h3 className="font-philosopher font-bold text-[19px] text-[#203323] mb-2">
                          {item.title}
                        </h3>
                        <p className="text-[13px] leading-[20px] text-[#666666] mb-5">
                          {item.desc}
                        </p>
                      </div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9c5435] pt-3 border-t border-gray-100">
                        {item.tag}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 6. Brand Philosophy Section: "Vì Sao Là Mộc Ngôn Hương?" */}
            <section className="home-philosophy pb-16 md:pb-24 pt-4 bg-[#faf7f2]">
              <div className="figma-container">
                <div className="text-center max-w-[720px] mx-auto mb-10">
                  <p className="text-[13px] md:text-[14px] font-medium text-[#9c5435] mb-1">
                    Triết lý Thương Hiệu
                  </p>
                  <h2 className="font-philosopher font-bold text-[28px] sm:text-[36px] lg:text-[42px] text-[#203323] mb-2">
                    Vì Sao Là &ldquo;Mộc Ngôn Hương&rdquo;?
                  </h2>
                  <p className="text-[14px] text-[#666666] leading-[22px]">
                    Ba chữ giản dị đại diện cho ba lời cam kết chân thành nhất của chúng mình đối với văn hóa trà Việt và thế hệ người thưởng thức trẻ.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: M - N - H Cards */}
                  <div className="lg:col-span-6 space-y-4">
                    <h3 className="font-philosopher font-bold text-[22px] text-[#203323] mb-3">
                      Mộc Ngôn Hương - Trao Hương, Gửi Lời Thương
                    </h3>

                    {[
                      {
                        letter: 'M',
                        title: 'Chân Bản Của Đất Trời - Mộc',
                        desc: '100% búp chè tươi hái vào lúc sớm sương tại Tân Cương và La Bằng. Tôn trọng trọn vẹn vị mộc chát dịu, ngọt hậu sâu sắc tự nhiên mà không pha trộn bất kỳ phụ gia nào.',
                        tags: '#TraThuanKhiet #ThaiNguyen',
                      },
                      {
                        letter: 'N',
                        title: 'Lời Khó Cất Thành Tiếng - Ngôn',
                        desc: 'Người Việt vốn kín kẽ trong cách bày tỏ cảm xúc. "Ngôn" chính là sứ mệnh biến chén trà và tấm thiệp thành tiếng nói yêu thương, lòng biết ơn và sự trân trọng chân thành.',
                        tags: '#MessageFirst #GuiLoiThuong',
                      },
                      {
                        letter: 'H',
                        title: 'Hương Hoa Thân Thuộc - Hương',
                        desc: 'Hương bưởi sau vườn mẹ, hoa nhài đêm hè thanh khiết, hoa sói cổ truyền hay nốt cốm ngây thơm. Những nốt hương mang theo linh hồn làng quê đánh thức miền ký ức bình yên.',
                        tags: '#HuongHoaViet #KyUcTuoiTho',
                      },
                    ].map((card) => (
                      <div
                        key={card.letter}
                        className="bg-white rounded-[14px] p-5 border border-gray-200/80 shadow-2xs"
                      >
                        <span className="inline-flex w-7 h-7 rounded-[6px] bg-[#3e5641]/10 text-[#3e5641] font-bold text-[13px] items-center justify-center mb-2.5">
                          {card.letter}
                        </span>
                        <h4 className="font-philosopher font-bold text-[17px] text-[#203323] mb-1.5">
                          {card.title}
                        </h4>
                        <p className="text-[12.5px] leading-[19px] text-[#666666] mb-2">
                          {card.desc}
                        </p>
                        <p className="text-[11px] text-[#9c5435] font-medium">
                          {card.tags}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Right Column: 2 Stacked Photos */}
                  <div className="lg:col-span-6 space-y-5 lg:pt-10">
                    <div className="rounded-[16px] overflow-hidden shadow-md aspect-[16/10]">
                      <img
                        src={assetUrl("/assets/figma/originals/4f921.png")}
                        alt="Hộp quà Tâm Ý Mộc Ngôn Hương"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="rounded-[16px] overflow-hidden shadow-md aspect-[16/10]">
                      <img
                        src={assetUrl("/assets/figma/combo-table.png")}
                        alt="Bộ sưu tập trà Mộc Ngôn Hương"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {currentPage === 'story' && <StoryPage onNavigate={handleNavigate} />}

        {currentPage === 'products' && (
          <ProductsPage
            onNavigate={handleNavigate}
            cartQuantities={cartQuantities}
            onUpdateQuantity={handleUpdateProductQuantity}
            onAddToCart={handleAddToCart}
          />
        )}

        {currentPage === 'detail' && (
          <ProductDetailPage
            productId={selectedProductId}
            onNavigate={handleNavigate}
            cartQuantities={cartQuantities}
            onUpdateQuantity={handleUpdateProductQuantity}
            onAddToCart={handleAddToCart}
          />
        )}

        {currentPage === 'contact' && <ContactPage onNavigate={handleNavigate} />}

        {currentPage === 'checkout' && (
          <CheckoutPage
            items={checkoutProductIds ? cartItems.filter(item=>checkoutProductIds.includes(item.product.id)) : cartItems}
            onUpdateQuantity={handleUpdateCartById}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={() => setCartItems(items=>checkoutProductIds ? items.filter(item=>!checkoutProductIds.includes(item.product.id)) : [])}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'auth' && (
          <AuthPage
            onLoginSuccess={(email) => setUserEmail(email)}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Global Footer (Figma 62:1527) */}
      <Footer onNavigate={handleNavigate} />

      {/* Global Search Overlay (Figma 127:12938, 127:13466, 127:13960) */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectProduct={(id) => handleNavigate('detail', id)}
        cartQuantities={cartQuantities}
        onUpdateQuantity={handleUpdateProductQuantity}
      />

      {/* Global Slide-over Cart Drawer (Figma 127:8439 & 127:8870) */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartById}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={(ids) => { setCheckoutProductIds(ids); setCartOpen(false); setCurrentPage('checkout'); window.location.hash = routeHash('checkout'); window.scrollTo({top:0,behavior:'instant'}); }}
        onNavigate={handleNavigate}
      />

      {/* Floating ChatBox "Mộc Ngôn Hương" (Figma 80:5091) */}
      <ChatBox onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
