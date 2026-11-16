import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../i18n';
import { normalizeLocale, SupportedLocale } from '../lib/locale';

interface LanguageSwitcherProps {
  variant?: 'header' | 'drawer';
  onAfterSelect?: () => void;
}

const LANGUAGE_OPTIONS: ReadonlyArray<{
  code: SupportedLocale;
  shortLabel: string;
  flag: string;
  nativeLabelKey: 'language.viName' | 'language.enName';
}> = [
  { code: 'vi', shortLabel: 'VI', flag: '🇻🇳', nativeLabelKey: 'language.viName' },
  { code: 'en', shortLabel: 'EN', flag: '🇬🇧', nativeLabelKey: 'language.enName' },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  onAfterSelect,
}) => {
  const { t, i18n } = useTranslation('common');
  const currentLang: SupportedLocale = normalizeLocale(i18n.language);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!isOpen || variant !== 'header') return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, variant]);

  const handleSelectLanguage = async (nextLang: SupportedLocale) => {
    await changeAppLanguage(nextLang);
    setIsOpen(false);
    if (variant === 'header') {
      triggerRef.current?.focus({ preventScroll: true });
    }
    onAfterSelect?.();
  };

  if (variant === 'drawer') {
    return (
      <div className="pt-2" role="group" aria-label={t('language.label')}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8E6746] mb-2">
          {t('language.label')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGE_OPTIONS.map((opt) => {
            const active = currentLang === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                data-testid={`drawer-lang-${opt.code}`}
                onClick={() => handleSelectLanguage(opt.code)}
                aria-pressed={active}
                className={`h-10 px-3 rounded-lg border text-[13px] font-medium flex items-center justify-center gap-2 transition-colors ${
                  active
                    ? 'bg-[#3e5641] text-[#faf8f3] border-[#3e5641]'
                    : 'bg-white text-[#222222] border-[#3e5641]/25 hover:border-[#3e5641]'
                }`}
              >
                <span aria-hidden="true">{opt.flag}</span>
                <span>{t(opt.nativeLabelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const handleMenuKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      optionRefs.current[(idx + 1) % LANGUAGE_OPTIONS.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      optionRefs.current[(idx - 1 + LANGUAGE_OPTIONS.length) % LANGUAGE_OPTIONS.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      optionRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      optionRefs.current[LANGUAGE_OPTIONS.length - 1]?.focus();
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setTimeout(() => optionRefs.current[0]?.focus(), 10);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center shrink-0">
      <button
        ref={triggerRef}
        type="button"
        data-testid="header-language-switcher"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) {
            setTimeout(() => {
              const activeIdx = LANGUAGE_OPTIONS.findIndex((o) => o.code === currentLang);
              optionRefs.current[activeIdx >= 0 ? activeIdx : 0]?.focus();
            }, 15);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${t('language.switchAria')}: ${currentLang.toUpperCase()}`}
        className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-full border border-[#3e5641]/20 bg-white/75 hover:bg-[#3e5641]/8 hover:border-[#3e5641]/40 text-[#222222] text-[12px] sm:text-[12.5px] font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Globe className="w-3.5 h-3.5 text-[#3e5641] shrink-0" aria-hidden="true" />
        <span>{currentLang === 'en' ? t('language.enShort') : t('language.viShort')}</span>
        <ChevronDown
          className={`w-3 h-3 text-[#666666] transition-transform duration-150 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          data-testid="language-switcher-menu"
          aria-label={t('language.label')}
          className="absolute right-0 top-full mt-2 w-[164px] rounded-[14px] bg-[#faf8f3] border border-[#3e5641]/20 shadow-[0_12px_32px_rgba(32,51,35,0.16)] py-1.5 z-50"
        >
          {LANGUAGE_OPTIONS.map((opt, idx) => {
            const active = currentLang === opt.code;
            return (
              <button
                key={opt.code}
                ref={(el) => {
                  optionRefs.current[idx] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                data-testid={`language-option-${opt.code}`}
                onClick={() => handleSelectLanguage(opt.code)}
                onKeyDown={(e) => handleMenuKeyDown(e, idx)}
                className={`w-full px-3.5 py-2.5 text-left text-[13px] flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#3e5641]/10 text-[#203323] font-semibold'
                    : 'text-[#333333] hover:bg-[#3e5641]/6 font-medium'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true">{opt.flag}</span>
                  <span>{t(opt.nativeLabelKey)}</span>
                </span>
                {active && <Check className="w-3.5 h-3.5 text-[#3e5641] shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
