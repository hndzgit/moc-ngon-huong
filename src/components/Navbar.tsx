import { assetUrl } from '../lib/assets';
import { usePresenceMotion, useChangeMotion } from '../motion/motion';
import { BrandLogo } from './BrandLogo';
import { FigmaIcon } from './FigmaIcon';
import { LanguageSwitcher } from './LanguageSwitcher';
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageRoute } from '../types';
import { PRODUCTS } from '../data/products';
import { getLocalizedProduct } from '../data/localizedCatalog';
import { formatVnd, normalizeLocale } from '../lib/locale';

interface NavbarProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute, productId?: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  userEmail?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  cartCount,
  onOpenCart,
  onOpenSearch,
  onOpenAuth,
  userEmail,
}) => {
  const { t, i18n } = useTranslation('navigation');
  const locale = normalizeLocale(i18n.language);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menu = usePresenceMotion<HTMLDivElement>(mobileMenuOpen,'menu');
  const dropdown = usePresenceMotion<HTMLDivElement>(dropdownOpen,'menu');
  const countMotion = useChangeMotion<HTMLSpanElement>(cartCount,undefined,.18);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{setMobileMenuOpen(false);setDropdownOpen(false)},[currentPage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinkClass = (active: boolean) =>
    `motion-nav-link relative py-1.5 text-[16px] xl:text-[24px] transition-colors duration-200 flex items-center gap-1.5 cursor-pointer ${
      active
        ? 'text-[#222222] font-normal after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#3e5641]'
        : 'text-[#333333] hover:text-[#3e5641] font-normal'
    }`;

  return (
    <header className="site-header relative z-40 w-full bg-white">
      {/* Top Announcement Bar (Figma 1920x54, #3e5641) */}
      <div className="w-full announcement h-[42px] md:h-[44px] bg-[#3e5641] flex items-center justify-center px-4">
        <p className="text-[#f7f4d5] text-[13px] md:text-[16px] font-medium tracking-wide text-center">
          {t('announcement')}
        </p>
      </div>

      {/* Main Header Container (Left-aligned Logo + Nav Links, Right Utility Icons) */}
      <div className="figma-container header-main h-[76px] md:h-[104px] flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Brand Logo */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center text-left focus:outline-none group shrink-0"
            aria-label={t('homeAria')}
          >
            <BrandLogo />
          </button>

          {/* Left-Aligned Navigation Links matching Figma 92:3684 */}
          <nav className="hidden md:flex items-center gap-6" aria-label={t('mainNavAria')}>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className={navLinkClass(currentPage === 'home')}
            >
              {t('links.home')}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('story')}
              className={navLinkClass(currentPage === 'story')}
            >
              {t('links.story')}
            </button>

            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
              onFocus={() => setDropdownOpen(true)}
              onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setDropdownOpen(false);}}
            >
              <button
                type="button"
                onClick={() => {
                  onNavigate('products');
                  setDropdownOpen(false);
                }}
                className={navLinkClass(currentPage === 'products' || currentPage === 'detail')}
                aria-expanded={dropdownOpen}
              >
                <span>{t('links.products')}</span>
              </button>

              {dropdown.present && (
                <div ref={dropdown.ref} data-motion-phase={dropdown.phase} inert={!dropdownOpen} className="absolute left-0 top-full pt-2 w-[290px] z-50">
                  <div className="bg-white rounded-[12px] shadow-[0_12px_36px_rgba(32,51,35,0.16)] border border-[#3e5641]/15 py-2 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('products');
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[13.5px] font-semibold text-[#3e5641] hover:bg-[#f5f2ed] transition-colors border-b border-gray-100 flex items-center justify-between"
                    >
                      <span>{t('dropdown.allProducts')}</span>
                      <span className="text-[12px] text-[#c89f5d]">{t('dropdown.viewAll')}</span>
                    </button>
                    {PRODUCTS.map((rawProd) => {
                      const prod = getLocalizedProduct(rawProd, locale);
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => {
                            onNavigate('detail', prod.id);
                            setDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-[13.5px] text-[#222222] hover:bg-[#f5f2ed] hover:text-[#3e5641] transition-colors flex items-center gap-3"
                        >
                          <img
                            src={assetUrl(prod.image)}
                            alt={prod.shortName}
                            className="w-8 h-8 rounded-[6px] object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{prod.shortName}</p>
                            <p className="text-[11.5px] text-[#3e5641] font-semibold">
                              {formatVnd(prod.price, locale, 'compact-en')}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                    <button type="button" onClick={()=>onNavigate('gift-journey')} className="w-full text-left px-4 py-3 text-[13px] text-[#3e5641] border-t border-gray-100">{t('links.giftJourney')}</button>
                    <button type="button" onClick={()=>onNavigate('corporate')} className="w-full text-left px-4 py-3 text-[13px] text-[#3e5641]">{t('links.corporate')}</button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className={navLinkClass(currentPage === 'contact')}
            >
              {t('links.contact')}
            </button>
          </nav>
        </div>

        {/* Utility Icons (Right) */}
        <div className="flex items-center gap-2 sm:gap-5">
          <button
            type="button"
            onClick={event=>{event.currentTarget.focus({preventScroll:true});onOpenSearch()}}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
            aria-label={t('searchAria')}
          >
            <img src={assetUrl("/assets/figma/icon-search.svg")} alt={t('searchAlt')} className="w-[28px] h-[28px]" />
          </button>

          <LanguageSwitcher variant="header" />

          <button
            type="button"
            onClick={onOpenAuth}
            className="h-9 px-2 rounded-full flex items-center gap-1.5 hover:bg-black/5 transition-colors"
            aria-label={t('accountAria')}
          >
            <img src={assetUrl(currentPage === 'contact' ? '/assets/figma/originals/d0415.svg' : '/assets/figma/icon-user.svg')} alt={t('accountAlt')} className="w-[28px] h-[28px]" />
            {userEmail && (
              <span className="hidden lg:inline-block text-[12.5px] font-medium text-[#3e5641] max-w-[100px] truncate">
                {userEmail.split('@')[0]}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={event=>{event.currentTarget.focus({preventScroll:true});onOpenCart()}}
            className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
            aria-label={t('cartAria')}
          >
            <img src={assetUrl(currentPage === 'contact' ? '/assets/figma/originals/2dc38.svg' : '/assets/figma/icon-cart.svg')} alt={t('cartAlt')} className="w-[28px] h-[28px]" />
            {cartCount > 0 && (
              <span ref={countMotion} className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#3e5641] text-[#f7f4d5] text-[10.5px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 text-[#203323]"
            aria-label={t('mobileMenuAria')}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {menu.present && (
        <div id="mobile-navigation" ref={menu.ref} data-motion-phase={menu.phase} inert={!mobileMenuOpen} className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[16px] font-medium text-[#222222]"
          >
            {t('links.home')}
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigate('story');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[16px] font-medium text-[#222222]"
          >
            {t('links.story')}
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigate('products');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[16px] font-medium text-[#222222]"
          >
            {t('links.products')}
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigate('contact');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-[16px] font-medium text-[#222222]"
          >
            {t('links.contact')}
          </button>
          <button type="button" onClick={()=>{onNavigate('gift-journey');setMobileMenuOpen(false);}} className="block w-full text-left py-2 text-[16px] font-medium text-[#222222]">{t('links.giftJourney')}</button>
          <button type="button" onClick={()=>{onNavigate('corporate');setMobileMenuOpen(false);}} className="block w-full text-left py-2 text-[16px] font-medium text-[#222222]">{t('links.corporate')}</button>
          <div className="pt-2 border-t border-gray-100">
            <LanguageSwitcher variant="drawer" onAfterSelect={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
};
