import { assetUrl } from '../lib/assets';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageRoute } from '../types';
import { PRODUCTS } from '../data/products';
import { getLocalizedProduct } from '../data/localizedCatalog';
import { normalizeLocale } from '../lib/locale';
import { MotionImage } from '../motion/MotionImage';
import { scrollBehavior, useChangeMotion } from '../motion/motion';
import './StoryChapters.css';

interface StoryPageProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
}

const emotionNames = ['AN', 'THƯƠNG', 'CẢM', 'NHỚ'];
const rawTeas = PRODUCTS.slice(0, 4);

export const StoryPage: React.FC<StoryPageProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation('story');
  const locale = normalizeLocale(i18n.language);
  const chapters = t('chapters', { returnObjects: true }) as ReadonlyArray<{ id: string; label: string }>;
  const wishParagraphs = t('wish.paragraphs', { returnObjects: true }) as ReadonlyArray<string>;
  const givingParagraphs = t('giving.paragraphs', { returnObjects: true }) as ReadonlyArray<string>;
  const teas = rawTeas.map((p) => getLocalizedProduct(p, locale));

  const [activeChapter, setActiveChapter] = useState(0);
  const [revealedChapters, setRevealedChapters] = useState<string[]>([]);
  const [teaIndex, setTeaIndex] = useState(0);
  const tea = teas[teaIndex];
  const teaMotion = useChangeMotion<HTMLDivElement>(tea.id, '.story-tea-copy', .35);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
      const id = visible[0]?.target.id;
      if (id) setActiveChapter(chapters.findIndex(chapter => chapter.id === id));
      if (visible.length) setRevealedChapters(previous => {
        const next = [...new Set([...previous, ...visible.map(entry => entry.target.id)])];
        return next.length === previous.length ? previous : next;
      });
    }, { rootMargin: '-15% 0px -45% 0px', threshold: 0 });
    chapters.forEach(chapter => {
      const element = document.getElementById(chapter.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [chapters]);

  return (
    <div className="story-page story-editorial bg-[#faf8f3]">
      {/* Original Figma photography and hero composition remain the brand foundation. */}
      <section className="relative w-full h-[460px] sm:h-[580px] lg:h-[680px] overflow-hidden bg-[#203323]">
        <picture>
          <source
            type="image/avif"
            srcSet={`${assetUrl('/assets/optimized/story-hero-768.avif')} 768w, ${assetUrl('/assets/optimized/story-hero-1280.avif')} 1280w, ${assetUrl('/assets/optimized/story-hero-1920.avif')} 1920w`}
            sizes="100vw"
          />
          <source
            type="image/webp"
            srcSet={`${assetUrl('/assets/optimized/story-hero-768.webp')} 768w, ${assetUrl('/assets/optimized/story-hero-1280.webp')} 1280w, ${assetUrl('/assets/optimized/story-hero-1920.webp')} 1920w`}
            sizes="100vw"
          />
          <img
            src={assetUrl('/assets/optimized/story-hero-1920.webp')}
            alt={t('heroAlt')}
            className="absolute inset-0 w-full h-full object-cover"
            decoding="async"
            width={1920}
            height={1440}
            fetchPriority="high"
          />
        </picture>
        <img src={assetUrl('/assets/optimized/story-hero-shade.webp')} alt="" aria-hidden="true" className="story-hero-shade absolute inset-0 w-full h-full rotate-180" />
        <div className="relative z-10 figma-container h-full flex flex-col items-center justify-end text-center pb-12 sm:pb-16 px-4">
          <h1 className="font-philosopher font-bold text-[38px] sm:text-[54px] lg:text-[68px] text-[#f7f4d5] leading-[1.1] mb-3 drop-shadow-md">
            {t('heroTitle')}
          </h1>
          <p className="text-[15px] sm:text-[18px] md:text-[20px] leading-[28px] text-[#f7f4d5]/95 max-w-[920px]">
            {t('heroLead')}
          </p>
        </div>
      </section>

      <nav className="story-chapter-nav" aria-label={t('chapterNavAria')}>
        <div className="figma-container">
          {chapters.map((chapter, index) => <button
            key={chapter.id}
            type="button"
            aria-current={activeChapter === index ? 'step' : undefined}
            onClick={() => {
              setActiveChapter(index);
              document.getElementById(chapter.id)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
            }}
          ><span>{String(index + 1).padStart(2, '0')}</span>{chapter.label}</button>)}
        </div>
        <div className="story-reading-progress" aria-hidden="true"><span style={{ transform: `scaleX(${(activeChapter + 1) / chapters.length})` }} /></div>
      </nav>

      <div className="story-chapters">
        <article id="story-wish" className="story-chapter" data-revealed={revealedChapters.includes('story-wish')} aria-labelledby="story-wish-title">
          <div className="figma-container story-editorial-grid">
            <div className="story-chapter-copy">
              <p className="story-chapter-number">{t('wish.number')}</p>
              <h2 id="story-wish-title">{t('wish.title')}</h2>
              {wishParagraphs.map((para, idx) => <p key={idx}>{para}</p>)}
              <blockquote>{t('wish.quote')}</blockquote>
            </div>
            <figure className="story-chapter-figure">
              <picture>
                <source
                  type="image/avif"
                  srcSet={`${assetUrl('/assets/optimized/story-1-768.avif')} 768w, ${assetUrl('/assets/optimized/story-1-1280.avif')} 1280w, ${assetUrl('/assets/optimized/story-1-1920.avif')} 1920w`}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <source
                  type="image/webp"
                  srcSet={`${assetUrl('/assets/optimized/story-1-768.webp')} 768w, ${assetUrl('/assets/optimized/story-1-1280.webp')} 1280w, ${assetUrl('/assets/optimized/story-1-1920.webp')} 1920w`}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <img
                  src={assetUrl('/assets/optimized/story-1-1280.webp')}
                  alt={t('wish.imageAlt')}
                  loading="lazy"
                  decoding="async"
                  width={1920}
                  height={1280}
                />
              </picture>
            </figure>
          </div>
        </article>

        <article id="story-flavors" className="story-chapter story-flavor-chapter" data-revealed={revealedChapters.includes('story-flavors')} aria-labelledby="story-flavors-title">
          <div className="figma-container">
            <div className="story-flavor-heading">
              <p className="story-chapter-number">{t('flavors.number')}</p>
              <h2 id="story-flavors-title">{t('flavors.title')}</h2>
              <p>{t('flavors.subtitle')}</p>
            </div>
            <div className="story-emotion-controls" role="group" aria-label={t('flavors.controlsAria')}>
              {teas.map((product, index) => <button key={product.id} type="button" aria-pressed={index === teaIndex} onClick={() => setTeaIndex(index)}>
                <span>{emotionNames[index]}</span><small>{product.shortName.split(' (')[0]}</small>
              </button>)}
            </div>
            <div ref={teaMotion} className="story-tea-scene">
              <div className="story-tea-visual">
                <MotionImage src={assetUrl(`/assets/optimized/tea-${tea.id}-1280.webp`)} data-original-asset={tea.image} alt={tea.shortName} loading="lazy" decoding="async" />
              </div>
              <div className="story-tea-copy" aria-live="polite" aria-atomic="true">
                <p className="story-chapter-number">{tea.emotionLabel}</p>
                <h3>{tea.name}</h3>
                <p>{tea.scentNotes[0]}</p>
                <dl>
                  <div><dt>{t('flavors.ingredientsLabel')}</dt><dd>{tea.ingredients.join(' · ')}</dd></div>
                  <div><dt>{t('flavors.brewingLabel')}</dt><dd>{tea.brewingAmount} · {tea.brewingTemp} · {tea.brewingTime}</dd></div>
                </dl>
                <button type="button" className="story-text-link" onClick={() => onNavigate('detail', tea.id)}>{t('flavors.explorePrefix')} {emotionNames[teaIndex]} <span aria-hidden="true">→</span></button>
              </div>
            </div>
          </div>
        </article>

        <article id="story-giving" className="story-chapter" data-revealed={revealedChapters.includes('story-giving')} aria-labelledby="story-giving-title">
          <div className="figma-container story-editorial-grid story-editorial-grid-reverse">
            <figure className="story-chapter-figure">
              <picture>
                <source
                  type="image/avif"
                  srcSet={`${assetUrl('/assets/optimized/story-2-768.avif')} 768w, ${assetUrl('/assets/optimized/story-2-1280.avif')} 1280w, ${assetUrl('/assets/optimized/story-2-1920.avif')} 1920w`}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <source
                  type="image/webp"
                  srcSet={`${assetUrl('/assets/optimized/story-2-768.webp')} 768w, ${assetUrl('/assets/optimized/story-2-1280.webp')} 1280w, ${assetUrl('/assets/optimized/story-2-1920.webp')} 1920w`}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <img
                  src={assetUrl('/assets/optimized/story-2-1280.webp')}
                  alt={t('giving.imageAlt')}
                  loading="lazy"
                  decoding="async"
                  width={1920}
                  height={1280}
                />
              </picture>
            </figure>
            <div className="story-chapter-copy">
              <p className="story-chapter-number">{t('giving.number')}</p>
              <h2 id="story-giving-title">{t('giving.title')}</h2>
              {givingParagraphs.map((para, idx) => <p key={idx}>{para}</p>)}
              <button type="button" className="story-text-link" onClick={() => onNavigate('gift-journey')}>{t('giving.ctaButton')} <span aria-hidden="true">→</span></button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
