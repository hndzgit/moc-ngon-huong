import { assetUrl } from '../lib/assets';
import { usePresenceMotion, useChangeMotion } from '../motion/motion';
import { useDialogLifecycle } from './useDialogLifecycle';
import { FigmaIcon } from './FigmaIcon';
import React, { useState, useEffect } from 'react';
import { CartItem, PageRoute } from '../types';
import { FIGMA_PRODUCT_COPY, getOrderMedia } from '../data/figmaMedia';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout?: (productIds:string[]) => void;
  onNavigate: (page: PageRoute, productId?: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onNavigate,
  onCheckout,
}) => {
  const {ref,present,phase}=usePresenceMotion<HTMLDivElement>(isOpen,'cart');
  useDialogLifecycle(present,onClose,ref);
  const itemMotion=useChangeMotion<HTMLDivElement>(items.map(i=>`${i.product.id}:${i.quantity}`).join(','),'[data-quantity], [data-empty-copy]',.18,false,present);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // Default newly added items to checked
  useEffect(() => {
    setSelectedIds((prev) => {
      const next: Record<string, boolean> = {};
      for (const item of items) next[item.product.id] = prev[item.product.id] ?? true;
      return next;
    });
  }, [items]);

  if (!present) return null;

  const toggleSelect = (productId: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [productId]: !(prev[productId] ?? true),
    }));
  };

  const subtotal = items.reduce((sum, item) => {
    const isChecked = selectedIds[item.product.id] ?? true;
    return isChecked ? sum + item.product.price * item.quantity : sum;
  }, 0);

  return (
    <div ref={ref} data-motion-phase={phase} className="cart-drawer fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel (Figma 127:8439 & 127:8870) */}
      <aside
        inert={!isOpen}
        className="relative z-10 w-full max-w-[558px] bg-white h-full shadow-2xl flex flex-col justify-between"
        role="dialog" aria-modal="true" aria-label="Giỏ hàng"
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="sr-only font-philosopher font-bold text-[26px] md:text-[28px] text-[#222222]">
            Giỏ hàng
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#222222] transition-colors text-[20px]"
            aria-label="Đóng giỏ hàng"
          >
            <FigmaIcon name="closeModal" />
          </button>
        </div>

        {/* Drawer Body */}
        {items.length === 0 ? (
          /* Variant 2: Empty Cart State (Figma 127:8870) */
          <div ref={itemMotion} className="flex-1 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-[72px] h-[72px] rounded-full bg-[#f5f2ed] flex items-center justify-center mb-5 text-[#3e5641]">
              <FigmaIcon name="emptyCart" />
            </div>
            <h3 data-empty-copy className="font-philosopher font-bold text-[24px] text-[#222222] mb-2">
              Giỏ hàng trống
            </h3>
            <p className="text-[14px] md:text-[15px] text-[#666666] max-w-[280px] leading-[22px]">
              Có vẻ như bạn chưa chọn được vị trà ưng ý nào.
            </p>
            <button type="button" onClick={() => { onClose(); onNavigate('products'); }} className="mt-10 w-full min-h-[62px] border border-[#3e5641] rounded-full text-[#3e5641] text-[20px]">Tiếp tục mua sắm</button>
          </div>
        ) : (
          /* Variant 1: Populated Cart Items List (Figma 127:8439) */
          <div ref={itemMotion} className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-gray-100">
            {items.map(({ product, quantity, giftConfiguration }) => {
              const checked = selectedIds[product.id] ?? true;
              return (
                <div
                  key={product.id}
                  className="cart-item py-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelect(product.id)}
                      className="w-4 h-4 rounded accent-[#3e5641] cursor-pointer shrink-0"
                      aria-label={`Chọn ${product.name}`}
                    />

                    <img
                      src={assetUrl(getOrderMedia(product.id)?.image || product.image)}
                      style={{ objectPosition: getOrderMedia(product.id)?.position }}
                      alt={product.name}
                      onClick={() => {
                        const baseId = product.id.endsWith('-le')
                          ? product.id === 'combo-tam-y-le'
                            ? 'hop-qua-tam-y'
                            : product.id.replace('-le', '')
                          : product.id;
                        onNavigate('detail', baseId);
                        onClose();
                      }}
                      className="w-[82px] h-[62px] rounded-[8px] object-cover shrink-0 cursor-pointer border border-black/5"
                    />

                    <div className="min-w-0 flex-1">
                      <h3
                        onClick={() => {
                          const baseId = product.id.endsWith('-le')
                            ? product.id === 'combo-tam-y-le'
                              ? 'hop-qua-tam-y'
                              : product.id.replace('-le', '')
                            : product.id;
                          onNavigate('detail', baseId);
                          onClose();
                        }}
                        className="font-philosopher font-bold text-[16px] md:text-[17px] text-[#222222] hover:text-[#3e5641] transition-colors cursor-pointer leading-snug truncate"
                      >
                        {product.id === 'hop-qua-tam-y' ? 'Hộp Quà Tâm Ý' : FIGMA_PRODUCT_COPY[product.id]?.title || product.name}
                      </h3>
                      <p className="cart-item-subtitle text-[12px] text-[#222] mt-1">
                        {product.emotion === 'COMBO' ? 'AN · THƯƠNG · CẢM · NHỚ' : {AN:'Trà Hương Hoa Bưởi',THUONG:'Trà Hương Hoa Nhài',CAM:'Trà Hương Hoa Sói',NHO:'Trà Hương Cốm',ALL:'Các hương trà'}[product.emotion]}
                      </p>
                      <p className="cart-item-price text-[14px] text-[#444444] mt-1">
                        {product.price.toLocaleString('en-US')}đ
                      </p>
                      {giftConfiguration&&<p className="text-[10px] leading-4 text-[#3e5641] mt-1">Có bản nháp thiệp · xem tại thanh toán</p>}
                    </div>
                  </div>

                  {/* Quantity Stepper (- 1 +) */}
                  <div className="h-[34px] px-2.5 rounded-[6px] border border-[#222222]/30 flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(product.id, -1)}
                      className="text-[#222222] hover:text-[#3e5641] font-medium text-[15px] px-0.5"
                      aria-label="Giảm số lượng"
                    >
                      -
                    </button>
                    <span data-quantity className="min-w-[14px] text-center text-[13px] font-semibold text-[#222222]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(product.id, 1)}
                      disabled={quantity >= Math.min(99, product.stock)}
                      className="text-[#222222] hover:text-[#3e5641] font-medium text-[15px] px-0.5 disabled:opacity-35 disabled:cursor-not-allowed"
                      aria-label="Tăng số lượng"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Drawer Footer: Subtotal & Checkout CTA (Figma 127:8439) */}
        {items.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-white space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[16px] text-[#222222] font-medium">
                Tạm tính
              </span>
              <span className="font-bold text-[20px] md:text-[22px] text-[#222222]">
                {subtotal.toLocaleString('en-US')}đ
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const selected=items.filter(item=>selectedIds[item.product.id] ?? true).map(item=>item.product.id);
                if (onCheckout) onCheckout(selected);
                else { onClose(); onNavigate('checkout'); }
              }}
              disabled={subtotal <= 0}
              className="disabled:opacity-40 w-full h-[50px] rounded-full bg-[#3e5641] text-[#f7f4d5] font-semibold text-[16px] hover:bg-[#203323] transition-colors flex items-center justify-center shadow-md"
            >
              Thanh Toán Ngay
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
