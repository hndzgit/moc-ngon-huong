import { assetUrl } from '../lib/assets';
import React, { useEffect, useState } from 'react';
import { PageRoute } from '../types';
import { PRODUCTS } from '../data/products';
import { MotionImage } from '../motion/MotionImage';
import { scrollBehavior, useChangeMotion } from '../motion/motion';
import './StoryChapters.css';

interface StoryPageProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
}

const chapters = [
  { id: 'story-wish', label: 'Khởi nguồn' },
  { id: 'story-flavors', label: 'Bốn sắc hương' },
  { id: 'story-giving', label: 'Lời muốn gửi' },
];
const emotionNames = ['AN', 'THƯƠNG', 'CẢM', 'NHỚ'];
const teas = PRODUCTS.slice(0, 4);

export const StoryPage: React.FC<StoryPageProps> = ({ onNavigate }) => {
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
  }, []);

  return (
    <div className="story-page story-editorial bg-[#faf8f3]">
      {/* Original Figma photography and hero composition remain the brand foundation. */}
      <section className="relative w-full h-[460px] sm:h-[580px] lg:h-[680px] overflow-hidden bg-[#203323]">
        <img
          src={assetUrl('/assets/figma/story-hero.png')}
          alt="Câu chuyện thương hiệu Mộc Ngôn Hương"
          className="absolute inset-0 w-full h-full object-cover"
          decoding="async"
          width={4032} height={3024}
        />
        <img src={assetUrl('/assets/figma/originals/90128.png')} alt="" aria-hidden="true" className="story-hero-shade absolute inset-0 w-full h-full rotate-180" />
        <div className="relative z-10 figma-container h-full flex flex-col items-center justify-end text-center pb-12 sm:pb-16 px-4">
          <h1 className="font-philosopher font-bold text-[38px] sm:text-[54px] lg:text-[68px] text-[#f7f4d5] leading-[1.1] mb-3 drop-shadow-md">
            Mộc Ngôn Hương
          </h1>
          <p className="text-[15px] sm:text-[18px] md:text-[20px] leading-[28px] text-[#f7f4d5]/95 max-w-[920px]">
            Mộc gợi sự tự nhiên và trà Việt; Ngôn là lời muốn nói; Hương là trải nghiệm cảm xúc thông qua trà.
          </p>
        </div>
      </section>

      <nav className="story-chapter-nav" aria-label="Các chương câu chuyện trà">
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
              <p className="story-chapter-number">01 / Khởi nguồn</p>
              <h2 id="story-wish-title">Một Mong Muốn Giản Dị</h2>
              <p>Mộc Ngôn Hương bắt đầu từ một mong muốn giản dị: biến trà – một thức quà quen thuộc – thành một cách để mọi người dễ dàng gửi gắm tình cảm đến những người mình trân trọng. Chúng tôi lựa chọn trà làm nền tảng bởi trà mang sự mộc mạc, tinh tế và gần gũi, rồi kết hợp cùng những hương hoa quen thuộc để tạo nên những sắc thái cảm xúc khác nhau.</p>
              <p>Với Mộc Ngôn Hương, mỗi hương trà không chỉ được tạo ra để thưởng thức mà còn để gợi lên một điều muốn nói, một cảm xúc muốn trao. Vì vậy, chúng tôi tin rằng một món quà ý nghĩa không nhất thiết phải lớn lao, chỉ cần được lựa chọn bằng sự chân thành.</p>
              <blockquote>Trao hương, gửi lời thương.</blockquote>
            </div>
            <figure className="story-chapter-figure">
              <img src={assetUrl('/assets/figma/story-1.png')} alt="Hộp trà Mộc Ngôn Hương và các phụ kiện trong hộp quà" loading="lazy" decoding="async" width={4096} height={2731} />
              <figcaption>Một món quà được bắt đầu bằng sự chân thành.</figcaption>
            </figure>
          </div>
        </article>

        <article id="story-flavors" className="story-chapter story-flavor-chapter" data-revealed={revealedChapters.includes('story-flavors')} aria-labelledby="story-flavors-title">
          <div className="figma-container">
            <div className="story-flavor-heading">
              <p className="story-chapter-number">02 / Bốn sắc hương</p>
              <h2 id="story-flavors-title">Mỗi hương trà, một điều muốn nói.</h2>
              <p>Khám phá hương, vị và cách pha từ thông tin sản phẩm hiện có.</p>
            </div>
            <div className="story-emotion-controls" role="group" aria-label="Khám phá bốn cảm xúc">
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
                  <div><dt>Thành phần</dt><dd>{tea.ingredients.join(' · ')}</dd></div>
                  <div><dt>Cách pha</dt><dd>{tea.brewingAmount} · {tea.brewingTemp} · {tea.brewingTime}</dd></div>
                </dl>
                <button type="button" className="story-text-link" onClick={() => onNavigate('detail', tea.id)}>Khám phá {emotionNames[teaIndex]} <span aria-hidden="true">→</span></button>
              </div>
            </div>
          </div>
        </article>

        <article id="story-giving" className="story-chapter" data-revealed={revealedChapters.includes('story-giving')} aria-labelledby="story-giving-title">
          <div className="figma-container story-editorial-grid story-editorial-grid-reverse">
            <figure className="story-chapter-figure">
              <img src={assetUrl('/assets/figma/story-2.png')} alt="Khay trà Mộc Ngôn Hương giữa không gian vườn" loading="lazy" decoding="async" width={4096} height={2731} />
              <figcaption>Chọn một hương trà để thay lời muốn nói.</figcaption>
            </figure>
            <div className="story-chapter-copy">
              <p className="story-chapter-number">03 / Lời muốn gửi</p>
              <h2 id="story-giving-title">Gửi Gắm Những Điều Khó Nói</h2>
              <p>Mộc Ngôn Hương ra đời từ mong muốn giúp mọi người dễ dàng gửi gắm những điều khó nói qua một món quà ý nghĩa. Chúng tôi mong khách hàng sau khi trải nghiệm không chỉ cảm nhận được chất lượng của trà mà còn thấy mình đã chọn đúng một hương trà để thay lời muốn nói – Bưởi là An, Nhài là Thương, Hoa Sói là Cảm, Cốm là Nhớ.</p>
              <p>Nếu Mộc Ngôn Hương là một con người, đó sẽ là một người trầm ấm, mộc mạc, tinh tế và chân thành, thể hiện sự quan tâm một cách nhẹ nhàng. Điểm khác biệt của thương hiệu không nằm ở việc tạo ra một loại trà mới, mà ở cách kết nối hương trà với cảm xúc và biến trà thành một món quà mang thông điệp.</p>
              <p>Bên cạnh trải nghiệm, Mộc Ngôn Hương chú trọng lựa chọn trà Thái Nguyên và kiểm soát chất lượng từ nguồn nguyên liệu đến thành phẩm, để mỗi món quà vừa có ý nghĩa về cảm xúc vừa đảm bảo giá trị thực.</p>
              <button type="button" className="story-text-link" onClick={() => onNavigate('gift-journey')}>Chọn điều bạn muốn gửi <span aria-hidden="true">→</span></button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
