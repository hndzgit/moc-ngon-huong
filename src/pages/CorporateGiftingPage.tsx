import { useState, type FormEvent } from 'react';
import { PRODUCTS } from '../data/products';
import { assetUrl } from '../lib/assets';
import { MotionImage } from '../motion/MotionImage';
import { FigmaIcon } from '../components/FigmaIcon';
import type { PageRoute } from '../types';
import './CorporateGiftingPage.css';

interface CorporateGiftingPageProps {
  onNavigate: (page: PageRoute, productId?: string) => void;
}

interface InquiryDraft {
  organization: string;
  name: string;
  contact: string;
  quantity: string;
  budget: string;
  occasion: string;
  requirements: string;
  productId: string;
}

const emptyDraft: InquiryDraft = {
  organization: '', name: '', contact: '', quantity: '', budget: '',
  occasion: '', requirements: '', productId: 'hop-qua-tam-y',
};
const money = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

/** A guest-only local quotation draft. No customer data is stored or transmitted. */
export function CorporateGiftingPage({ onNavigate }: CorporateGiftingPageProps) {
  const [draft, setDraft] = useState<InquiryDraft>(emptyDraft);
  const [preview, setPreview] = useState<InquiryDraft | null>(null);
  const [status, setStatus] = useState('');
  const product = PRODUCTS.find(item => item.id === draft.productId) || PRODUCTS[4];
  const previewProduct = PRODUCTS.find(item => item.id === preview?.productId) || product;
  const setField = (field: keyof InquiryDraft, value: string) => {
    setDraft(previous => ({ ...previous, [field]: value }));
    setStatus('');
  };
  const previewIsCurrent = preview && Object.keys(draft).every(key =>
    draft[key as keyof InquiryDraft] === preview[key as keyof InquiryDraft]);

  const buildPreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const contact = draft.contact.trim();
    if (!draft.organization.trim() || !draft.name.trim() || !contact) {
      setStatus('Vui lòng điền tên tổ chức, người liên hệ và email hoặc số điện thoại.');
      return;
    }
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phone = /^\+?[\d\s().-]{9,20}$/;
    const phoneDigits = contact.replace(/\D/g, '').length;
    if (!email.test(contact) && !(phone.test(contact) && phoneDigits >= 9 && phoneDigits <= 15)) {
      setStatus('Vui lòng nhập địa chỉ email hoặc số điện thoại liên hệ hợp lệ.');
      return;
    }
    const quantity = Number(draft.quantity);
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      setStatus('Số lượng dự kiến cần là số nguyên lớn hơn 0. Đây không phải số lượng tối thiểu của cửa hàng.');
      return;
    }
    setPreview({ ...draft });
    setStatus('Đã tạo bản nháp trên màn hình. Yêu cầu chưa được gửi; biểu mẫu đang chờ tích hợp dịch vụ tư vấn.');
  };

  return (
    <div className="corporate-page">
      <section className="corporate-hero" aria-labelledby="corporate-title">
        <div className="figma-container corporate-hero-grid">
          <div className="corporate-hero-copy">
            <p className="corporate-kicker">MỘC NGÔN HƯƠNG / QUÀ DOANH NGHIỆP</p>
            <h1 id="corporate-title">Lời tri ân,<br />được trao bằng<br /><em>hương trà.</em></h1>
            <p>Một món quà dành cho đối tác, đồng nghiệp hay những người đã cùng bạn đi qua một chặng đường.</p>
            <a className="corporate-button" href="#yeu-cau-doanh-nghiep" onClick={event => {
              event.preventDefault();
              document.getElementById('yeu-cau-doanh-nghiep')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
              document.getElementById('corporate-organization')?.focus({ preventScroll: true });
            }}>Chuẩn bị yêu cầu tư vấn</a>
            <span className="corporate-hero-note">Chọn ý nghĩa trước. Trao đổi chi tiết sau.</span>
          </div>
          <figure className="corporate-hero-photo">
            <img src={assetUrl('/assets/optimized/tea-hop-qua-tam-y-1280.webp')} data-original-asset="/assets/figma/combo-table.png" alt="Hộp quà Tâm Ý cùng các hộp trà Mộc Ngôn Hương" width="1536" height="1024" decoding="async" />
            <figcaption><span>01 / MỘT MÓN QUÀ, NHIỀU LỜI MUỐN GỬI</span><span>Trao hương, gửi lời thương.</span></figcaption>
          </figure>
        </div>
      </section>

      <section className="corporate-approach figma-container" aria-labelledby="corporate-approach-title">
        <div><p className="corporate-kicker">BẮT ĐẦU TỪ NGƯỜI NHẬN</p><h2 id="corporate-approach-title">Mỗi dịp trao quà,<br />một điều muốn nói.</h2></div>
        <ol>
          <li><span>01</span><div><h3>Chia sẻ ý định</h3><p>Bạn tặng ai, vào dịp nào và muốn gửi lời cảm ơn hay lời chúc gì?</p></div></li>
          <li><span>02</span><div><h3>Chọn hương trà & hộp quà</h3><p>Khám phá bốn sắc hương hiện có: AN, THƯƠNG, CẢM và NHỚ. Dùng giá catalog làm điểm bắt đầu.</p></div></li>
          <li><span>03</span><div><h3>Trao đổi trước khi đặt</h3><p>Nhu cầu thiệp, nhận diện hay cách đóng gói cần được cửa hàng xác nhận về khả năng thực hiện và chi phí.</p></div></li>
        </ol>
      </section>

      <section className="corporate-collection" aria-labelledby="corporate-collection-title">
        <div className="figma-container corporate-collection-grid">
          <div className="corporate-product-photo">
            <MotionImage src={assetUrl(`/assets/optimized/tea-${product.id}-1280.webp`)} data-original-asset={product.image} alt={product.name} loading="lazy" decoding="async" />
            <span>ẢNH SẢN PHẨM GỐC</span>
          </div>
          <div className="corporate-product-copy">
            <p className="corporate-kicker">QUÀ TỪ BỘ SƯU TẬP HIỆN CÓ</p>
            <h2 id="corporate-collection-title">Một hộp trà,<br />một lời trân trọng.</h2>
            <label htmlFor="corporate-product">Khám phá sản phẩm</label>
            <select id="corporate-product" value={draft.productId} onChange={event => setField('productId', event.target.value)}>
              {PRODUCTS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <h3>{product.name}</h3>
            <p className="corporate-price">{money(product.price)} <span>/ hộp · giá catalog</span></p>
            <p>{product.packaging}</p>
            <button type="button" className="corporate-text-link" onClick={() => onNavigate('detail', product.id)}>Xem chi tiết sản phẩm <span className="corporate-link-arrow"><FigmaIcon name="arrowRight" /></span></button>
            <p className="corporate-product-note">Giá trên chưa phải báo giá doanh nghiệp. Không áp dụng giả định về chiết khấu, số lượng tối thiểu hay thời gian giao hàng.</p>
          </div>
        </div>
      </section>

      <section id="yeu-cau-doanh-nghiep" className="corporate-inquiry figma-container" aria-labelledby="corporate-inquiry-title">
        <div className="corporate-inquiry-heading">
          <p className="corporate-kicker">MỘT VÀI THÔNG TIN ĐỂ BẮT ĐẦU</p>
          <h2 id="corporate-inquiry-title">Cùng chuẩn bị<br /><em>một món quà có ý nghĩa.</em></h2>
          <p>Điền những điều bạn đã biết. Các chi tiết còn lại có thể trao đổi trực tiếp với Mộc Ngôn Hương.</p>
          <div className="corporate-service-note"><FigmaIcon name="sms" /><p>Biểu mẫu hiện chỉ tạo bản nháp tại trang này, <strong>chưa gửi trực tuyến</strong>. Dữ liệu không được lưu khi tải lại trang.</p></div>
        </div>
        <div className="corporate-inquiry-body">
          <form onSubmit={buildPreview} className="corporate-form" aria-describedby="corporate-form-note">
            <p id="corporate-form-note">Dấu * là thông tin cần thiết để chuẩn bị bản yêu cầu.</p>
            <div className="corporate-form-grid">
              <label htmlFor="corporate-organization">Tên tổ chức *<input id="corporate-organization" name="organization" autoComplete="organization" required maxLength={160} value={draft.organization} onChange={event => setField('organization', event.target.value)} /></label>
              <label htmlFor="corporate-name">Người liên hệ *<input id="corporate-name" name="name" autoComplete="name" required maxLength={100} value={draft.name} onChange={event => setField('name', event.target.value)} /></label>
              <label className="corporate-form-wide" htmlFor="corporate-contact">Email hoặc số điện thoại *<input id="corporate-contact" name="contact" required maxLength={160} value={draft.contact} onChange={event => setField('contact', event.target.value)} inputMode="email" /></label>
              <label htmlFor="corporate-quantity">Số lượng dự kiến *<input id="corporate-quantity" name="quantity" type="number" inputMode="numeric" required min="1" step="1" value={draft.quantity} onChange={event => setField('quantity', event.target.value)} /></label>
              <label htmlFor="corporate-budget">Ngân sách dự kiến / hộp (₫)<input id="corporate-budget" name="budget" type="number" inputMode="numeric" min="0" step="1" value={draft.budget} onChange={event => setField('budget', event.target.value)} /></label>
              <label className="corporate-form-wide" htmlFor="corporate-occasion">Dịp tặng quà<select id="corporate-occasion" name="occasion" value={draft.occasion} onChange={event => setField('occasion', event.target.value)}><option value="">Có thể trao đổi sau</option><option>Tri ân đối tác</option><option>Quà cho đồng nghiệp</option><option>Lễ, Tết</option><option>Sự kiện doanh nghiệp</option><option>Dịp khác</option></select></label>
              <label className="corporate-form-wide" htmlFor="corporate-requirements">Người nhận & điều bạn muốn gửi<textarea id="corporate-requirements" name="requirements" rows={5} maxLength={1000} value={draft.requirements} onChange={event => setField('requirements', event.target.value)} placeholder="Nhóm người nhận, thông điệp hoặc nhu cầu cá nhân hóa cần trao đổi…" /><span className="corporate-field-hint">Không nhập thông tin nhạy cảm hay danh sách người nhận.</span></label>
            </div>
            <button className="corporate-button" type="submit">Xem bản yêu cầu</button>
            <p className="corporate-form-status" role="status" aria-live="polite">{status}</p>
          </form>
          {preview && <aside className="corporate-draft" aria-labelledby="corporate-draft-title">
            <p className="corporate-kicker">BẢN NHÁP / CHƯA GỬI</p>
            <h3 id="corporate-draft-title">Yêu cầu của {preview.organization}</h3>
            {!previewIsCurrent && <p className="corporate-draft-warning">Bạn đã thay đổi thông tin. Chọn “Xem bản yêu cầu” để cập nhật bản nháp này.</p>}
            <dl><div><dt>Người liên hệ</dt><dd>{preview.name}</dd></div><div><dt>Thông tin liên hệ</dt><dd>{preview.contact}</dd></div><div><dt>Sản phẩm dự kiến</dt><dd>{previewProduct.name}</dd></div><div><dt>Số lượng dự kiến</dt><dd>{preview.quantity} hộp</dd></div><div><dt>Tạm tính theo catalog</dt><dd>{money(Number(preview.quantity) * previewProduct.price)}</dd></div>{preview.budget && <div><dt>Ngân sách của bạn / hộp</dt><dd>{money(Number(preview.budget))}</dd></div>}{preview.occasion && <div><dt>Dịp tặng</dt><dd>{preview.occasion}</dd></div>}</dl>
            {preview.requirements && <p className="corporate-draft-message">{preview.requirements}</p>}
            <p>Đây là nội dung chuẩn bị trao đổi, chưa phải báo giá hay đơn đặt hàng. Cửa hàng cần xác nhận chi phí và khả năng cá nhân hóa.</p>
            <button type="button" className="corporate-text-link" onClick={() => onNavigate('contact')}>Xem thông tin liên hệ <span className="corporate-link-arrow"><FigmaIcon name="arrowRight" /></span></button>
          </aside>}
        </div>
      </section>
    </div>
  );
}
