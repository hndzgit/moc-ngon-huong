import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDialogLifecycle } from '../components/useDialogLifecycle';
import { useAuth } from '../context/AuthContext';
import { assetUrl } from '../lib/assets';
import { PRODUCTS, LOOSE_TEA_PRODUCTS } from '../data/products';
import type { OrderRecord, OrderStatus, PaymentStatus, PageRoute } from '../types';
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Store,
  MapPin,
  Phone,
  Mail,
  User as UserIcon,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface AdminPageProps {
  onNavigate?: (page: PageRoute, productId?: string) => void;
}

export function AdminPage({ onNavigate }: AdminPageProps) {
  const { user, loading: authLoading, getIdToken, login, logout } = useAuth();

  // Authentication & Authorization state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  // Orders data state
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Modals & Actions
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<OrderRecord | null>(null);
  const detailDialog=useRef<HTMLDivElement>(null);
  const cancelDialog=useRef<HTMLDivElement>(null);
  useDialogLifecycle(Boolean(selectedOrder&&user),()=>setSelectedOrder(null),detailDialog);
  useDialogLifecycle(Boolean(orderToCancel&&user),()=>setOrderToCancel(null),cancelDialog);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Catalogue lookup for product thumbnails
  const allCatalog = useMemo(() => [...PRODUCTS, ...LOOSE_TEA_PRODUCTS], []);
  const getItemThumbnail = (item: { productId: string; image?: string }) => {
    if (item.image) return assetUrl(item.image);
    const found = allCatalog.find((p) => p.id === item.productId);
    return assetUrl(found?.image || '/assets/optimized/order-thumb-buoi-an.webp');
  };

  // Format currency
  const formatMoney = (n: number) => `${(n || 0).toLocaleString('vi-VN')}đ`;

  // Format date/time
  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    } catch {
      return isoStr;
    }
  };

  // Fetch orders from server
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoadingOrders(true);
    setOrdersError(null);

    try {
      const token = await getIdToken();
      if (!token) {
        setAuthErrorCode('UNAUTHENTICATED');
        setAuthErrorMessage('Không thể lấy mã phiên đăng nhập. Vui lòng đăng nhập lại.');
        setLoadingOrders(false);
        return;
      }

      const res = await fetch('/api/admin/orders?limit=100', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setAuthErrorCode('UNAUTHENTICATED');
        setAuthErrorMessage(data.error || 'Phiên làm việc đã hết hạn.');
        setOrders([]);
        return;
      }

      if (res.status === 403) {
        setAuthErrorCode(data.code || 'FORBIDDEN');
        setAuthErrorMessage(data.error || 'Tài khoản của bạn không có quyền quản trị.');
        setOrders([]);
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Lỗi tải danh sách đơn hàng (${res.status})`);
      }

      setAuthErrorCode(null);
      setAuthErrorMessage(null);
      setOrders(data.orders || []);
    } catch (err: any) {
      console.error('[Admin Orders] Fetch error:', err);
      setOrdersError(err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoadingOrders(false);
    }
  }, [user, getIdToken]);

  // Load orders on user mount or change
  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setOrders([]);
      setAuthErrorCode(null);
      setAuthErrorMessage(null);
    }
  }, [user, fetchOrders]);

  // Handle Admin Login submission
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Vui lòng nhập đầy đủ email và mật khẩu quản trị.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      await login(loginEmail.trim(), loginPassword);
      setLoginPassword('');
    } catch (err: any) {
      console.error('[Admin Login] Failed:', err);
      setLoginError(err.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle status update (one-click action)
  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    paymentStatus?: PaymentStatus
  ) => {
    setActionLoadingId(orderId);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Mất phiên đăng nhập, vui lòng tải lại trang.');

      const payload: Record<string, any> = { orderId, status: newStatus };
      if (paymentStatus) payload.paymentStatus = paymentStatus;

      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Cập nhật trạng thái thất bại.');
      }

      const updated = data.order as OrderRecord;

      // Update in-memory orders list atomically without reloading
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id || o.orderCode === updated.orderCode ? updated : o))
      );

      // Update selected order modal if open
      if (selectedOrder && (selectedOrder.id === updated.id || selectedOrder.orderCode === updated.orderCode)) {
        setSelectedOrder(updated);
      }

      const statusLabels: Record<OrderStatus, string> = {
        pending_confirmation: 'Đang chuẩn bị',
        confirmed: 'Đang chuẩn bị',
        preparing: 'Đang chuẩn bị',
        shipping: 'Đang giao hàng',
        ready_for_pickup: 'Sẵn sàng nhận',
        completed: 'Đã hoàn tất',
        cancelled: 'Đã hủy',
      };

      showToast(`Đơn hàng ${updated.orderCode} đã chuyển sang: ${statusLabels[newStatus] || newStatus}`);
    } catch (err: any) {
      alert(`Lỗi: ${err.message || 'Không thể cập nhật trạng thái đơn hàng.'}`);
    } finally {
      setActionLoadingId(null);
      setOrderToCancel(null);
    }
  };

  // Handle payment status toggle
  const handleTogglePaymentStatus = async (orderId: string, newPaymentStatus: PaymentStatus) => {
    setActionLoadingId(orderId);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Mất phiên đăng nhập.');

      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, paymentStatus: newPaymentStatus }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Cập nhật thanh toán thất bại.');
      }

      const updated = data.order as OrderRecord;
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id || o.orderCode === updated.orderCode ? updated : o))
      );

      if (selectedOrder && (selectedOrder.id === updated.id || selectedOrder.orderCode === updated.orderCode)) {
        setSelectedOrder(updated);
      }

      showToast(`Đơn hàng ${updated.orderCode} cập nhật thanh toán: ${newPaymentStatus === 'completed' ? 'Đã thanh toán' : 'Chờ thanh toán'}`);
    } catch (err: any) {
      alert(`Lỗi: ${err.message || 'Không thể cập nhật trạng thái thanh toán.'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderSt = o.orderStatus || (o as any).status;

      // Status tab filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'preparing') {
          if (orderSt !== 'preparing' && orderSt !== 'pending_confirmation' && orderSt !== 'confirmed') {
            return false;
          }
        } else if (orderSt !== statusFilter) {
          return false;
        }
      }

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const code = (o.orderCode || '').toLowerCase();
        const name = (o.customer?.fullName || '').toLowerCase();
        const phone = o.customer?.phone || '';
        const email = (o.customer?.email || '').toLowerCase();
        if (!code.includes(term) && !name.includes(term) && !phone.includes(term) && !email.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  // Paginated orders
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPageNum - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPageNum]);

  // Status Counts
  const counts = useMemo(() => {
    const c = { all: orders.length, preparing: 0, shipping: 0, ready_for_pickup: 0, completed: 0, cancelled: 0 };
    orders.forEach((o) => {
      const st = o.orderStatus || (o as any).status;
      if (st === 'preparing' || st === 'pending_confirmation' || st === 'confirmed') c.preparing++;
      else if (st === 'shipping') c.shipping++;
      else if (st === 'ready_for_pickup') c.ready_for_pickup++;
      else if (st === 'completed') c.completed++;
      else if (st === 'cancelled') c.cancelled++;
    });
    return c;
  }, [orders]);

  // Order Status Visuals
  const getStatusBadge = (order: OrderRecord) => {
    const st = order.orderStatus || (order as any).status;
    const isPickup = order.customer?.shippingMode === 'pickup';

    switch (st) {
      case 'preparing':
      case 'pending_confirmation':
      case 'confirmed':
        return {
          label: isPickup ? 'Đang chuẩn bị đơn' : 'Đang chuẩn bị giao',
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-500',
          icon: <Clock className="w-3.5 h-3.5 text-indigo-600 mr-1.5" />,
        };
      case 'shipping':
        return {
          label: 'Đang giao hàng',
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          dot: 'bg-purple-500',
          icon: <Truck className="w-3.5 h-3.5 text-purple-600 mr-1.5" />,
        };
      case 'ready_for_pickup':
        return {
          label: 'Sẵn sàng nhận tại tiệm',
          bg: 'bg-teal-50 text-teal-800 border-teal-200',
          dot: 'bg-teal-500',
          icon: <Store className="w-3.5 h-3.5 text-teal-600 mr-1.5" />,
        };
      case 'completed':
        return {
          label: isPickup ? 'Đã nhận hàng' : 'Đã giao hàng',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />,
        };
      case 'cancelled':
        return {
          label: 'Đã hủy',
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600 mr-1.5" />,
        };
      default:
        return {
          label: st,
          bg: 'bg-gray-50 text-gray-800 border-gray-200',
          dot: 'bg-gray-400',
          icon: <Clock className="w-3.5 h-3.5 text-gray-500 mr-1.5" />,
        };
    }
  };

  // Payment Status Visuals
  const getPaymentBadge = (order: OrderRecord) => {
    if (order.paymentStatus === 'completed') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check className="w-3 h-3 mr-1" /> Đã thanh toán
        </span>
      );
    }
    if (order.paymentStatus === 'refunded') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-300">
          Đã hoàn tiền
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
        {order.paymentMethod === 'cod' ? 'Thu hộ khi nhận (COD)' : 'Chờ chuyển khoản'}
      </span>
    );
  };

  // Copy UID helper
  const handleCopyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 3000);
    }
  };

  // ==========================================================================
  // VIEW: AUTH LOADING
  // ==========================================================================
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#faf8f3] px-4">
        <div className="w-12 h-12 border-4 border-[#3e5641]/20 border-t-[#3e5641] rounded-full animate-spin mb-4" />
        <p className="text-[#3e5641] font-medium">Đang kiểm tra quyền truy cập hệ thống quản trị...</p>
      </div>
    );
  }

  // ==========================================================================
  // VIEW: UNAUTHENTICATED (LOGIN FORM)
  // ==========================================================================
  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#faf8f3] py-12 px-4 sm:px-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-stone-200/80 p-8">
          <div className="text-center mb-6">
            <span className="text-[12px] font-serif uppercase tracking-[0.25em] text-[#c89f5d] font-semibold">
              Mộc Ngôn Hương
            </span>
            <h1 className="text-2xl font-philosopher font-bold text-[#3e5641] mt-1">
              Đăng Nhập Quản Trị
            </h1>
            <p className="text-stone-500 text-sm mt-2">
              Khu vực dành riêng cho chủ tiệm quản lý đơn hàng. Vui lòng đăng nhập bằng tài khoản quản lý.
            </p>
          </div>

          {loginError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Email quản trị
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="chutiem@mocngonhuong.com"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#3e5641] focus:ring-1 focus:ring-[#3e5641] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Mật khẩu
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-[#3e5641] focus:ring-1 focus:ring-[#3e5641] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#3e5641] hover:bg-[#324635] text-[#f7f4d5] font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loginLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#f7f4d5]/30 border-t-[#f7f4d5] rounded-full animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <span>Đăng nhập hệ thống</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <button
              type="button"
              onClick={() => onNavigate?.('home')}
              className="text-xs text-stone-500 hover:text-[#3e5641] transition-colors"
            >
              ← Quay lại trang chủ Mộc Ngôn Hương
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW: 403 FORBIDDEN / ADMIN_NOT_CONFIGURED
  // ==========================================================================
  if (authErrorCode === 'FORBIDDEN' || authErrorCode === 'ADMIN_NOT_CONFIGURED') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#faf8f3] py-12 px-4 sm:px-6">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-stone-200/80 p-8 text-center">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-philosopher font-bold text-[#3e5641]">
            Chưa Phân Quyền Quản Trị
          </h2>

          <p className="text-stone-600 text-sm mt-2 leading-relaxed">
            {authErrorMessage ||
              'Tài khoản của bạn đã xác thực qua Firebase nhưng chưa nằm trong danh sách quản trị viên (ADMIN_UIDS).'}
          </p>

          {/* Current User UID Box */}
          <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-stone-200 text-left">
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Email đăng nhập:
            </div>
            <div className="text-sm font-medium text-stone-800 break-all mb-3">{user.email}</div>

            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Firebase UID của bạn:
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono bg-white px-2.5 py-1.5 rounded-lg border border-stone-200 text-[#3e5641] flex-1 break-all select-all font-semibold">
                {user.uid}
              </code>
              <button
                type="button"
                onClick={handleCopyUid}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#3e5641] text-[#f7f4d5] hover:bg-[#324635] flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                {copiedUid ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedUid ? 'Đã chép' : 'Sao chép UID'}
              </button>
            </div>
          </div>

          <div className="mt-5 text-left text-xs text-stone-500 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/60 leading-relaxed">
            <strong className="text-amber-900 block mb-1">Hướng dẫn kích hoạt cho chủ tiệm:</strong>
            1. Mở trang cài đặt dự án trên <strong>Vercel</strong> → <strong>Settings</strong> → <strong>Environment Variables</strong>.<br />
            2. Thêm biến môi trường <code className="bg-white px-1 py-0.5 rounded text-stone-800 font-mono font-bold">ADMIN_UIDS</code> với giá trị là UID ở trên.<br />
            3. Nhấn <strong>Thử lại</strong> sau khi lưu biến môi trường.
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={fetchOrders}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#3e5641] hover:bg-[#324635] text-[#f7f4d5] text-sm font-medium transition-colors"
            >
              Thử lại quyền truy cập
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất / Tài khoản khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW: MAIN ADMIN ORDER MANAGEMENT DASHBOARD
  // ==========================================================================
  return (
    <div className="admin-page min-h-screen bg-[#faf8f3] text-stone-800 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#3e5641] text-[#f7f4d5] px-4 py-3 rounded-xl shadow-lg border border-[#c89f5d]/30 text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#c89f5d]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Header */}
      <header className="bg-white border-b border-stone-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3e5641] text-[#f7f4d5] flex items-center justify-center font-serif font-bold text-lg shadow-xs">
              M
            </div>
            <div>
              <p className="text-[11px] font-serif uppercase tracking-[0.2em] text-[#c89f5d] font-semibold leading-tight">
                MỘC NGÔN HƯƠNG
              </p>
              <h1 className="text-lg font-philosopher font-bold text-[#3e5641] leading-tight">
                QUẢN LÝ ĐƠN HÀNG
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quản trị viên: <strong className="text-stone-800">{user.email}</strong></span>
            </div>

            <button
              type="button"
              onClick={fetchOrders}
              disabled={loadingOrders}
              title="Tải lại danh sách"
              className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin text-[#3e5641]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => logout()}
              title="Đăng xuất"
              className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-rose-50 hover:text-rose-700 text-stone-600 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Search & Status Filters */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPageNum(1);
                }}
                placeholder="Tìm kiếm theo mã đơn (MNH-...), tên khách hàng, số điện thoại..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#3e5641] focus:ring-1 focus:ring-[#3e5641] text-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-stone-100 pt-3">
            {[
              { id: 'all', label: 'Tất cả', count: counts.all },
              { id: 'preparing', label: 'Đang chuẩn bị', count: counts.preparing },
              { id: 'shipping', label: 'Đang giao hàng', count: counts.shipping },
              { id: 'ready_for_pickup', label: 'Sẵn sàng nhận', count: counts.ready_for_pickup },
              { id: 'completed', label: 'Đã hoàn tất', count: counts.completed },
              { id: 'cancelled', label: 'Đã hủy', count: counts.cancelled },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPageNum(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-[#3e5641] text-[#f7f4d5] shadow-xs'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id ? 'bg-[#c89f5d] text-stone-900 font-bold' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Notification */}
        {ordersError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{ordersError}</span>
            </div>
            <button
              type="button"
              onClick={fetchOrders}
              className="text-xs font-semibold underline hover:text-rose-900"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loadingOrders && orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200/80 p-16 text-center">
            <div className="w-10 h-10 border-3 border-[#3e5641]/20 border-t-[#3e5641] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-stone-500 text-sm">Đang tải danh sách đơn hàng thực tế từ cơ sở dữ liệu...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-stone-200/80 p-16 text-center">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-stone-800">Không tìm thấy đơn hàng nào</h3>
            <p className="text-sm text-stone-500 mt-1">
              {searchTerm || statusFilter !== 'all'
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc chuyển sang bộ lọc trạng thái khác.'
                : 'Hiện chưa có đơn hàng nào trong hệ thống.'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          /* Orders Table (Desktop) & Cards (Mobile) */
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-50/80 text-stone-600 border-b border-stone-200 text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Mã đơn & Ngày</th>
                    <th className="py-3 px-4">Khách hàng</th>
                    <th className="py-3 px-4">Hình thức</th>
                    <th className="py-3 px-4">Tổng tiền</th>
                    <th className="py-3 px-4">Trạng thái đơn</th>
                    <th className="py-3 px-4">Thanh toán</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {paginatedOrders.map((order) => {
                    const statusVisual = getStatusBadge(order);
                    const isPickup = order.customer?.shippingMode === 'pickup';
                    const isActionLoading = actionLoadingId === order.id;
                    const st = order.orderStatus || (order as any).status;

                    return (
                      <tr
                        key={order.id || order.orderCode}
                        className="hover:bg-[#faf8f3]/60 transition-colors cursor-pointer group"
                        onClick={() => setSelectedOrder(order)}
                      >
                        {/* Order Code & Date */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-[#3e5641] group-hover:underline">
                            {order.orderCode}
                          </div>
                          <div className="text-[12px] text-stone-400 mt-0.5">
                            {formatDateTime(order.createdAt)}
                          </div>
                        </td>

                        {/* Customer Info */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-stone-900">{order.customer?.fullName}</div>
                          <div className="text-[12px] text-stone-500 font-mono">{order.customer?.phone}</div>
                        </td>

                        {/* Shipping Mode */}
                        <td className="py-3.5 px-4 text-xs">
                          {isPickup ? (
                            <span className="inline-flex items-center text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 font-medium">
                              <Store className="w-3 h-3 mr-1" /> Tại tiệm
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/60 font-medium">
                              <Truck className="w-3 h-3 mr-1" /> Giao hàng
                            </span>
                          )}
                        </td>

                        {/* Total Amount */}
                        <td className="py-3.5 px-4 font-semibold text-stone-900">
                          {formatMoney(order.total)}
                        </td>

                        {/* Order Status Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusVisual.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusVisual.dot}`} />
                            {statusVisual.label}
                          </span>
                        </td>

                        {/* Payment Status */}
                        <td className="py-3.5 px-4">
                          {getPaymentBadge(order)}
                        </td>

                        {/* One-Click Action Buttons */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Delivery Progression */}
                            {!isPickup && (
                              <>
                                {(st === 'pending_confirmation' || st === 'confirmed') && (
                                  <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={() => handleUpdateStatus(order.id, 'preparing')}
                                    className="px-2.5 py-1 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-xs"
                                  >
                                    Chuẩn bị giao
                                  </button>
                                )}
                                {st === 'preparing' && (
                                  <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={() => handleUpdateStatus(order.id, 'shipping')}
                                    className="px-2.5 py-1 text-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors shadow-xs"
                                  >
                                    Đang giao hàng →
                                  </button>
                                )}
                                {st === 'shipping' && (
                                  <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={() => handleUpdateStatus(order.id, 'completed')}
                                    className="px-2.5 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors shadow-xs"
                                  >
                                    Đã giao hàng ✓
                                  </button>
                                )}
                              </>
                            )}

                            {/* Pickup Progression */}
                            {isPickup && (
                              <>
                                {(st === 'pending_confirmation' || st === 'confirmed') && (
                                  <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={() => handleUpdateStatus(order.id, 'preparing')}
                                    className="px-2.5 py-1 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-xs"
                                  >
                                    Chuẩn bị đơn
                                  </button>
                                )}
                                {st === 'preparing' && (
                                  <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')}
                                    className="px-2.5 py-1 text-xs rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium transition-colors shadow-xs"
                                  >
                                    Sẵn sàng nhận →
                                  </button>
                                )}
                                {st === 'ready_for_pickup' && (
                                  <button
                                    type="button"
                                    disabled={isActionLoading}
                                    onClick={() => handleUpdateStatus(order.id, 'completed')}
                                    className="px-2.5 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors shadow-xs"
                                  >
                                    Đã nhận hàng ✓
                                  </button>
                                )}
                              </>
                            )}

                            {/* Cancel Order Action */}
                            {st !== 'completed' && st !== 'cancelled' && (
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => setOrderToCancel(order)}
                                className="px-2 py-1 text-xs rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                Hủy đơn
                              </button>
                            )}

                            {/* Detail Icon */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="p-1 rounded-lg text-stone-400 hover:text-[#3e5641] hover:bg-stone-100 transition-colors ml-1"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (Responsive) */}
            <div className="lg:hidden space-y-3">
              {paginatedOrders.map((order) => {
                const statusVisual = getStatusBadge(order);
                const isPickup = order.customer?.shippingMode === 'pickup';
                const isActionLoading = actionLoadingId === order.id;
                const st = order.orderStatus || (order as any).status;

                return (
                  <div
                    key={order.id || order.orderCode}
                    className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs space-y-3"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono font-bold text-[#3e5641] text-base">
                          {order.orderCode}
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          {formatDateTime(order.createdAt)}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusVisual.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusVisual.dot}`} />
                        {statusVisual.label}
                      </span>
                    </div>

                    <div className="text-xs text-stone-600 space-y-1 bg-stone-50/70 p-2.5 rounded-xl border border-stone-100">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Khách hàng:</span>
                        <span className="font-semibold text-stone-800">{order.customer?.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Số điện thoại:</span>
                        <a
                          href={`tel:${order.customer?.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono font-medium text-[#3e5641] underline"
                        >
                          {order.customer?.phone}
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Hình thức:</span>
                        <span>{isPickup ? 'Nhận tại tiệm' : 'Giao hàng tận nơi'}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-stone-200/60 font-medium">
                        <span className="text-stone-700">Tổng thanh toán:</span>
                        <span className="text-sm font-bold text-stone-900">{formatMoney(order.total)}</span>
                      </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div
                      className="flex items-center justify-between gap-2 pt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="text-xs text-[#3e5641] font-medium flex items-center gap-1 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" /> Chi tiết đơn ({order.items?.length || 0})
                      </button>

                      <div className="flex items-center gap-1.5">
                        {/* Delivery Actions */}
                        {!isPickup && (
                          <>
                            {(st === 'pending_confirmation' || st === 'confirmed') && (
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleUpdateStatus(order.id, 'preparing')}
                                className="px-3 py-1.5 text-xs rounded-xl bg-indigo-600 text-white font-medium shadow-xs"
                              >
                                Chuẩn bị giao
                              </button>
                            )}
                            {st === 'preparing' && (
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleUpdateStatus(order.id, 'shipping')}
                                className="px-3 py-1.5 text-xs rounded-xl bg-purple-600 text-white font-medium shadow-xs"
                              >
                                Đang giao →
                              </button>
                            )}
                            {st === 'shipping' && (
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleUpdateStatus(order.id, 'completed')}
                                className="px-3 py-1.5 text-xs rounded-xl bg-emerald-600 text-white font-medium shadow-xs"
                              >
                                Đã giao ✓
                              </button>
                            )}
                          </>
                        )}

                        {/* Pickup Actions */}
                        {isPickup && (
                          <>
                            {(st === 'pending_confirmation' || st === 'confirmed') && (
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleUpdateStatus(order.id, 'preparing')}
                                className="px-3 py-1.5 text-xs rounded-xl bg-indigo-600 text-white font-medium shadow-xs"
                              >
                                Chuẩn bị đơn
                              </button>
                            )}
                            {st === 'preparing' && (
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')}
                                className="px-3 py-1.5 text-xs rounded-xl bg-teal-600 text-white font-medium shadow-xs"
                              >
                                Sẵn sàng nhận →
                              </button>
                            )}
                            {st === 'ready_for_pickup' && (
                              <button
                                type="button"
                                disabled={isActionLoading}
                                onClick={() => handleUpdateStatus(order.id, 'completed')}
                                className="px-3 py-1.5 text-xs rounded-xl bg-emerald-600 text-white font-medium shadow-xs"
                              >
                                Đã nhận hàng ✓
                              </button>
                            )}
                          </>
                        )}

                        {st !== 'completed' && st !== 'cancelled' && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => setOrderToCancel(order)}
                            className="px-2.5 py-1.5 text-xs rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-stone-200/80 text-xs">
                <span className="text-stone-500">
                  Hiển thị {(currentPageNum - 1) * ITEMS_PER_PAGE + 1} -{' '}
                  {Math.min(currentPageNum * ITEMS_PER_PAGE, filteredOrders.length)} trong số{' '}
                  <strong>{filteredOrders.length}</strong> đơn hàng
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPageNum === 1}
                    onClick={() => setCurrentPageNum((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1 font-semibold text-stone-700">
                    {currentPageNum} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPageNum === totalPages}
                    onClick={() => setCurrentPageNum((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ======================================================================
          ORDER DETAIL MODAL
      ====================================================================== */}
      {selectedOrder && (
        <div
          ref={detailDialog} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            role="dialog" aria-modal="true" aria-label="Chi tiết đơn hàng" className="bg-white rounded-3xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto p-6 sm:p-8 shadow-xl border border-stone-200 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="text-xs font-serif uppercase tracking-[0.2em] text-[#c89f5d] font-bold">
                  Chi tiết đơn hàng
                </span>
                <h2 className="text-2xl font-mono font-bold text-[#3e5641] mt-0.5">
                  {selectedOrder.orderCode}
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Đặt lúc: {formatDateTime(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Current Status & Primary Actions */}
            <div className="bg-[#faf8f3] p-4 rounded-2xl border border-stone-200/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-stone-500 font-medium">Trạng thái vận chuyển:</span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                    getStatusBadge(selectedOrder).bg
                  }`}
                >
                  {getStatusBadge(selectedOrder).icon}
                  {getStatusBadge(selectedOrder).label}
                </span>
              </div>

              {/* Action Buttons inside Modal */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/60">
                <span className="text-xs font-semibold text-stone-600 mr-1">Chuyển trạng thái:</span>

                {selectedOrder.customer?.shippingMode === 'pickup' ? (
                  <>
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedOrder.id}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        selectedOrder.orderStatus === 'preparing'
                          ? 'bg-indigo-700 text-white font-bold ring-2 ring-indigo-300'
                          : 'bg-white border border-stone-200 hover:bg-indigo-50 text-indigo-800'
                      }`}
                    >
                      Đang chuẩn bị đơn
                    </button>
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedOrder.id}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'ready_for_pickup')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        selectedOrder.orderStatus === 'ready_for_pickup'
                          ? 'bg-teal-700 text-white font-bold ring-2 ring-teal-300'
                          : 'bg-white border border-stone-200 hover:bg-teal-50 text-teal-800'
                      }`}
                    >
                      Sẵn sàng nhận tại tiệm
                    </button>
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedOrder.id}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        selectedOrder.orderStatus === 'completed'
                          ? 'bg-emerald-700 text-white font-bold ring-2 ring-emerald-300'
                          : 'bg-white border border-stone-200 hover:bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      Đã nhận hàng (Hoàn tất)
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedOrder.id}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'preparing')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        selectedOrder.orderStatus === 'preparing' || selectedOrder.orderStatus === 'pending_confirmation'
                          ? 'bg-indigo-700 text-white font-bold ring-2 ring-indigo-300'
                          : 'bg-white border border-stone-200 hover:bg-indigo-50 text-indigo-800'
                      }`}
                    >
                      Đang chuẩn bị giao
                    </button>
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedOrder.id}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'shipping')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        selectedOrder.orderStatus === 'shipping'
                          ? 'bg-purple-700 text-white font-bold ring-2 ring-purple-300'
                          : 'bg-white border border-stone-200 hover:bg-purple-50 text-purple-800'
                      }`}
                    >
                      Đang giao hàng
                    </button>
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedOrder.id}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        selectedOrder.orderStatus === 'completed'
                          ? 'bg-emerald-700 text-white font-bold ring-2 ring-emerald-300'
                          : 'bg-white border border-stone-200 hover:bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      Đã giao hàng (Hoàn tất)
                    </button>
                  </>
                )}

                {selectedOrder.orderStatus !== 'cancelled' && (
                  <button
                    type="button"
                    disabled={actionLoadingId === selectedOrder.id}
                    onClick={() => setOrderToCancel(selectedOrder)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors ml-auto"
                  >
                    Hủy đơn hàng
                  </button>
                )}
              </div>
            </div>

            {/* Customer & Delivery Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="font-semibold text-stone-500 uppercase tracking-wider block">
                  Thông tin khách hàng
                </span>
                <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                  <UserIcon className="w-4 h-4 text-stone-400" />
                  <span>{selectedOrder.customer?.fullName}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-700">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <a
                    href={`tel:${selectedOrder.customer?.phone}`}
                    className="font-mono text-[#3e5641] font-semibold underline"
                  >
                    {selectedOrder.customer?.phone}
                  </a>
                </div>
                {selectedOrder.customer?.email && (
                  <div className="flex items-center gap-2 text-stone-600">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{selectedOrder.customer?.email}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="font-semibold text-stone-500 uppercase tracking-wider block">
                  Địa điểm nhận hàng
                </span>
                {selectedOrder.customer?.shippingMode === 'pickup' ? (
                  <div className="space-y-1">
                    <div className="inline-flex items-center text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded text-[11px] font-semibold">
                      <Store className="w-3 h-3 mr-1" /> Nhận tại tiệm
                    </div>
                    <p className="text-stone-700 font-medium">
                      {selectedOrder.customer?.pickupStore || '42 Phố Hàng Điếu, Hoàn Kiếm, Hà Nội'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="inline-flex items-center text-stone-700 bg-stone-200/70 px-2 py-0.5 rounded text-[11px] font-semibold">
                      <Truck className="w-3 h-3 mr-1" /> Giao hàng tận nơi
                    </div>
                    <p className="text-stone-800 leading-relaxed font-medium">
                      {selectedOrder.customer?.formattedAddress ||
                        (selectedOrder.customer?.communeName
                          ? [
                              selectedOrder.customer?.address,
                              selectedOrder.customer?.communeName,
                              selectedOrder.customer?.provinceName,
                            ]
                              .filter(Boolean)
                              .join(', ')
                          : [
                              selectedOrder.customer?.address,
                              selectedOrder.customer?.ward,
                              selectedOrder.customer?.district,
                              selectedOrder.customer?.city,
                            ]
                              .filter(Boolean)
                              .join(', '))}
                    </p>
                  </div>
                )}

                {selectedOrder.customer?.note && (
                  <div className="pt-2 border-t border-stone-200 text-stone-600 italic">
                    <strong>Ghi chú:</strong> "{selectedOrder.customer.note}"
                  </div>
                )}
              </div>
            </div>

            {/* Product List */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                Sản phẩm trong đơn ({selectedOrder.items?.length || 0})
              </span>
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center gap-3 bg-white">
                    <img
                      src={getItemThumbnail(item)}
                      alt={item.productName}
                      loading="lazy"
                      decoding="async"
                      width={56}
                      height={56}
                      className="w-14 h-14 object-cover rounded-xl border border-stone-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-stone-900 truncate">
                        {item.productName}
                      </h4>
                      <p className="text-xs text-stone-500">
                        {formatMoney(item.price)} × {item.quantity}
                      </p>
                      {item.giftConfiguration?.recipient && (
                        <p className="text-[11px] text-[#c89f5d] italic mt-0.5">
                          Tặng: {item.giftConfiguration.recipient}
                        </p>
                      )}
                    </div>
                    <div className="font-semibold text-sm text-stone-900">
                      {formatMoney(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary & Payment */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Tạm tính:</span>
                <span>{formatMoney(selectedOrder.subtotal || selectedOrder.total)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Phí vận chuyển:</span>
                <span>
                  {selectedOrder.shippingFee === 0 ? 'Miễn phí' : formatMoney(selectedOrder.shippingFee)}
                </span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Giảm giá:</span>
                  <span>-{formatMoney(selectedOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#3e5641] pt-2 border-t border-stone-200">
                <span>Tổng giá trị đơn:</span>
                <span>{formatMoney(selectedOrder.total)}</span>
              </div>

              {/* Payment Status Action */}
              <div className="pt-3 border-t border-stone-200/60 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 mr-2">Phương thức:</span>
                  <strong>
                    {selectedOrder.paymentMethod === 'cod'
                      ? 'Thanh toán tiền mặt (COD)'
                      : 'Chuyển khoản ngân hàng'}
                  </strong>
                </div>
                <div className="flex items-center gap-2">
                  {selectedOrder.paymentStatus !== 'completed' ? (
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedOrder.id}
                      onClick={() => handleTogglePaymentStatus(selectedOrder.id, 'completed')}
                      className="px-2.5 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
                    >
                      Đánh dấu ĐÃ THANH TOÁN
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedOrder.id}
                      onClick={() => handleTogglePaymentStatus(selectedOrder.id, 'pending')}
                      className="px-2 py-0.5 text-[11px] rounded border border-stone-300 text-stone-500 hover:bg-stone-100"
                    >
                      Chuyển về Chờ thanh toán
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Audit Timestamps */}
            <div className="text-[11px] text-stone-400 space-y-0.5 border-t border-stone-100 pt-3">
              <div>Mã bản ghi Firestore: <code className="font-mono text-stone-500">{selectedOrder.id}</code></div>
              {selectedOrder.statusUpdatedAt && (
                <div>Cập nhật trạng thái lần cuối: {formatDateTime(selectedOrder.statusUpdatedAt)}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          CANCELLATION CONFIRMATION MODAL
      ====================================================================== */}
      {orderToCancel && (
        <div
          ref={cancelDialog} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setOrderToCancel(null)}
        >
          <div
            role="dialog" aria-modal="true" aria-label="Xác nhận hủy đơn hàng" className="bg-white rounded-3xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-6 shadow-xl border border-stone-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-stone-900">Xác nhận hủy đơn hàng</h3>
              <p className="text-sm text-stone-600 mt-2">
                Bạn có chắc chắn muốn hủy đơn hàng{' '}
                <strong className="text-rose-700 font-mono">{orderToCancel.orderCode}</strong> của khách hàng{' '}
                <strong>{orderToCancel.customer?.fullName}</strong> không?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-sm font-medium transition-colors"
              >
                Không, giữ lại
              </button>
              <button
                type="button"
                disabled={actionLoadingId === orderToCancel.id}
                onClick={() => handleUpdateStatus(orderToCancel.id, 'cancelled')}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors shadow-xs"
              >
                {actionLoadingId === orderToCancel.id ? 'Đang hủy...' : 'Đồng ý hủy đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
