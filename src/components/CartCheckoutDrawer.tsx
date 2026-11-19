import React, { useMemo, useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Gift,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatBdt, t } from '../i18n/translations';
import { DhakaArea, PaymentMethod } from '../types';

export const CartCheckoutDrawer: React.FC = () => {
  const {
    language,
    user,
    cart,
    cartOpen,
    setCartOpen,
    coupons,
    deliveryZones,
    updateCartQty,
    removeFromCart,
    placeOrder,
    requireAuth,
    setActiveTab,
  } = useApp();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    user?.addresses[0]?.id || ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bKash');
  const [paymentAccount, setPaymentAccount] = useState(user?.phone || '+880 1711-482910');

  const activeAddress = useMemo(() => {
    if (!user || user.addresses.length === 0) return null;
    return user.addresses.find((a) => a.id === selectedAddressId) || user.addresses[0];
  }, [user, selectedAddressId]);

  const subtotalBdt = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPriceBdt * item.quantity, 0),
    [cart]
  );

  const deliveryZone = useMemo(() => {
    const area: DhakaArea = activeAddress?.area || user?.area || 'Dhanmondi';
    return deliveryZones.find((z) => z.area === area) || deliveryZones[0];
  }, [activeAddress, user, deliveryZones]);

  const appliedCoupon = useMemo(
    () => coupons.find((c) => c.code === appliedCouponCode && c.active),
    [coupons, appliedCouponCode]
  );

  const discountBdt = useMemo(() => {
    if (!appliedCoupon || subtotalBdt < appliedCoupon.minOrderBdt) return 0;
    if (appliedCoupon.discountType === 'flat') return appliedCoupon.value;
    return Math.round((subtotalBdt * appliedCoupon.value) / 100);
  }, [appliedCoupon, subtotalBdt]);

  const deliveryFeeBdt = cart.length > 0 ? deliveryZone.feeBdt : 0;
  const totalBdt = Math.max(0, subtotalBdt - discountBdt + deliveryFeeBdt);

  if (!cartOpen) return null;

  const handleApplyCoupon = () => {
    setCouponError('');
    const found = coupons.find(
      (c) => c.code.toUpperCase() === couponInput.trim().toUpperCase() && c.active
    );
    if (!found) {
      setCouponError('Invalid or inactive coupon. Try DHAKA10 or PETLOVE200.');
      return;
    }
    if (subtotalBdt < found.minOrderBdt) {
      setCouponError(`Minimum order of ${formatBdt(found.minOrderBdt)} required for ${found.code}.`);
      return;
    }
    setAppliedCouponCode(found.code);
  };

  const handleCheckout = () => {
    // M11: No guest checkout
    requireAuth('Complete checkout', () => {
      if (!activeAddress) return;
      const prefix =
        paymentMethod === 'bKash'
          ? 'BKX'
          : paymentMethod === 'Nagad'
          ? 'NGD'
          : paymentMethod === 'Card'
          ? 'SSL'
          : 'COD';
      const ref = `${prefix}${Math.floor(100000 + Math.random() * 899999)}PL`;
      const created = placeOrder({
        address: activeAddress,
        paymentMethod,
        paymentRef: ref,
        couponCode: appliedCoupon?.code,
        discountBdt,
        deliveryFeeBdt,
      });
      if (created) {
        setAppliedCouponCode(null);
        setCouponInput('');
        setActiveTab('shop');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-slate-900/45" onClick={() => setCartOpen(false)} />

      <aside className="relative ml-auto w-full max-w-lg bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-teal-600" strokeWidth={2} />
            <h2 className="text-base font-bold text-slate-900">
              Cart &amp; Dhaka Checkout ({cart.reduce((s, c) => s + c.quantity, 0)})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-900 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#F9F9F9] border border-slate-200 text-slate-400 mx-auto flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" strokeWidth={2} />
              </div>
              <p className="text-sm font-semibold text-slate-900">{t(language, 'cart_empty')}</p>
              <p className="text-xs text-slate-500">
                Add pet food, treats, litter, or redeem a 100-Treat free reward pouch.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  setActiveTab('shop');
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer"
              >
                Browse Monthly Packages
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-[#F9F9F9] flex items-start gap-3"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-lg object-cover bg-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 leading-snug">
                          {item.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          aria-label="Remove item"
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.subtitle}</p>
                      <div className="mt-2.5 flex items-center justify-between">
                        {item.type === 'reward' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                            <Gift className="w-3.5 h-3.5" strokeWidth={2} />
                            Free 100-Treat Reward (৳0)
                          </span>
                        ) : (
                          <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white">
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.id, -1)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" strokeWidth={2} />
                            </button>
                            <span className="px-2.5 text-xs font-mono font-semibold tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.id, 1)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" strokeWidth={2} />
                            </button>
                          </div>
                        )}
                        <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                          {item.unitPriceBdt === 0
                            ? '৳0'
                            : formatBdt(item.unitPriceBdt * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section (M11) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-teal-600" strokeWidth={2} />
                  <span>Promo Coupon (Try DHAKA10 or PETLOVE200)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-xs text-rose-600">{couponError}</p>}
                {appliedCoupon && (
                  <p className="text-xs text-teal-700 font-medium">
                    Applied {appliedCoupon.code}: saving {formatBdt(discountBdt)}
                  </p>
                )}
              </div>

              {/* Delivery Address & Dhaka Zone Fee (M11) */}
              {user && activeAddress ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" strokeWidth={2} />
                    <span>Dhaka Delivery Address</span>
                  </label>
                  <select
                    value={activeAddress.id}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs font-medium border border-slate-300 rounded-lg bg-white"
                  >
                    {user.addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.label} — {addr.street}, {addr.area}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    Zone: {deliveryZone.area} · {deliveryZone.estimatedHours} · Fee:{' '}
                    <span className="font-mono font-semibold text-slate-800">
                      {formatBdt(deliveryZone.feeBdt)}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  Guest checkout is disabled for safety. Sign in with your Dhaka mobile number to select your delivery address.
                </div>
              )}

              {/* Local Payments Selector (M12: bKash, Nagad, Card, COD) */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-700">
                  Local Payment Method (Bangladesh)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'bKash', label: 'bKash', sub: 'Instant MFS', icon: Smartphone },
                      { id: 'Nagad', label: 'Nagad', sub: 'Instant MFS', icon: Smartphone },
                      { id: 'Card', label: 'Card (SSLCommerz)', sub: 'Visa / Master / Amex', icon: CreditCard },
                      { id: 'COD', label: 'Cash on Delivery', sub: 'Pay Dhaka rider', icon: Banknote },
                    ] as const
                  ).map((pm) => {
                    const Icon = pm.icon;
                    const active = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${active ? 'text-teal-700' : 'text-slate-500'}`} strokeWidth={2} />
                          <span className="text-xs font-bold text-slate-900">{pm.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{pm.sub}</p>
                      </button>
                    );
                  })}
                </div>

                {(paymentMethod === 'bKash' || paymentMethod === 'Nagad') && (
                  <input
                    type="tel"
                    value={paymentAccount}
                    onChange={(e) => setPaymentAccount(e.target.value)}
                    placeholder={`Enter ${paymentMethod} wallet number (+880 1XXX-XXXXXX)`}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Order Summary */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-slate-200 bg-[#F9F9F9] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatBdt(subtotalBdt)}</span>
              </div>
              {discountBdt > 0 && (
                <div className="flex justify-between text-teal-700 font-medium">
                  <span>Coupon Discount</span>
                  <span className="font-mono tabular-nums">-{formatBdt(discountBdt)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery ({deliveryZone.area})</span>
                <span className="font-mono tabular-nums">{formatBdt(deliveryFeeBdt)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="font-mono tabular-nums">{formatBdt(totalBdt)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full py-3 px-4 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
              <span>
                {user
                  ? `Place Order via ${paymentMethod} · ${formatBdt(totalBdt)}`
                  : 'Sign In to Checkout'}
              </span>
            </button>

            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" strokeWidth={2} />
              <span>Certified Bangladesh gateway · Cancel free before packing</span>
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};
