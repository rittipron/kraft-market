'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import { StoreHeader } from '@/components/store/StoreHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type Step = 'cart' | 'info' | 'payment' | 'success';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  note: string;
}

const EMPTY_INFO: CustomerInfo = { name: '', email: '', phone: '', address: '', note: '' };

export default function CartPage() {
  const { items, removeItem, updateQty, clearCart, subtotal, vat, total } = useCartStore();
  const [step, setStep] = useState<Step>('cart');
  const [info, setInfo] = useState<CustomerInfo>(EMPTY_INFO);
  const [payMethod, setPayMethod] = useState<'promptpay' | 'card'>('promptpay');
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [orderNum, setOrderNum] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState('');

  const DISCOUNT = couponApplied ? Math.round(subtotal() * 0.1) : 0;
  const finalTotal = total() - DISCOUNT;

  const applyCoupon = () => {
    if (coupon.toUpperCase() === 'KRAFT10') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('รหัสคูปองไม่ถูกต้อง');
      setCouponApplied(false);
    }
  };

  const placeOrder = async () => {
    setPlacing(true);
    setPlaceError('');
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            qty: i.qty,
            image: i.image,
          })),
          paymentMethod,
          shippingName: info.name,
          shippingPhone: info.phone,
          shippingEmail: info.email,
          shippingAddress: info.address,
          note: info.note,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `สั่งซื้อไม่สำเร็จ (${res.status})`);
      }

      const order = await res.json();
      setOrderNum(order.receiptNumber || order._id);
      clearCart();
      setStep('success');
    } catch (err: any) {
      setPlaceError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setPlacing(false);
    }
  };

  const canProceed = info.name && info.email && info.phone && info.address;

  return (
    <>
      <StoreHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Steps */}
        <div className="flex items-center gap-2 mb-10">
          {(['cart', 'info', 'payment'] as const).map((s, i) => {
            const labels = { cart: 'ตะกร้า', info: 'ข้อมูล', payment: 'ชำระ' };
            const done = ['cart', 'info', 'payment', 'success'].indexOf(step) > i;
            const active = step === s;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${done ? 'bg-[var(--good)] text-white' : active ? 'bg-[var(--coral)] text-white' : 'bg-[var(--bg-2)] text-[var(--ink-4)]'}`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-medium ${active ? 'text-[var(--ink)]' : 'text-[var(--ink-4)]'}`}>{labels[s]}</span>
                {i < 2 && <div className="w-8 h-px bg-[var(--line)] mx-1" />}
              </div>
            );
          })}
        </div>

        {/* Step: Cart */}
        {step === 'cart' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <h1 className="font-display text-2xl font-bold">ตะกร้าสินค้า</h1>
              {items.length === 0 ? (
                <div className="text-center py-20 text-[var(--ink-4)]">
                  <div className="text-5xl mb-4">🛒</div>
                  <p className="font-semibold mb-2">ตะกร้าว่างเปล่า</p>
                  <Link href="/" className="text-sm text-[var(--coral)] hover:underline">← กลับเลือกสินค้า</Link>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.productId} className="flex gap-4 bg-[var(--surface)] rounded-2xl p-4 border border-[var(--line)]">
                    <div className="w-20 h-20 rounded-xl bg-[var(--bg-2)] overflow-hidden shrink-0">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🛍️</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--ink)] line-clamp-2">{item.name}</p>
                      <p className="text-[var(--coral)] font-bold mt-1">฿{item.price.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQty(item.productId, item.qty - 1)} className="w-7 h-7 rounded-full border border-[var(--line)] flex items-center justify-center hover:bg-[var(--bg-2)] transition-colors text-sm">−</button>
                        <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.productId, item.qty + 1)} className="w-7 h-7 rounded-full border border-[var(--line)] flex items-center justify-center hover:bg-[var(--bg-2)] transition-colors text-sm">+</button>
                        <span className="ml-auto font-bold text-sm">฿{(item.price * item.qty).toLocaleString()}</span>
                        <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-600 ml-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-4">
                {/* Coupon */}
                <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--line)]">
                  <h3 className="font-semibold text-sm mb-3">คูปองส่วนลด</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={coupon}
                      onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponError(''); }}
                      placeholder="KRAFT10"
                      className="flex-1 px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)] uppercase"
                    />
                    <button onClick={applyCoupon} className="px-3 py-2 bg-[var(--ink)] text-white text-sm rounded-lg hover:bg-[var(--ink-2)] transition-colors">
                      ใช้
                    </button>
                  </div>
                  {couponApplied && <p className="text-xs text-[var(--good)] mt-1">✓ ส่วนลด 10% (KRAFT10)</p>}
                  {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                </div>

                {/* Summary */}
                <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--line)] space-y-3">
                  <h3 className="font-semibold">สรุปคำสั่งซื้อ</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-[var(--ink-3)]"><span>ยอดรวม</span><span>฿{subtotal().toLocaleString()}</span></div>
                    {couponApplied && <div className="flex justify-between text-[var(--good)]"><span>ส่วนลด 10%</span><span>-฿{DISCOUNT.toLocaleString()}</span></div>}
                    <div className="flex justify-between text-[var(--ink-3)]"><span>VAT 7%</span><span>฿{vat().toLocaleString()}</span></div>
                    <div className="flex justify-between text-[var(--ink-3)]"><span>ค่าจัดส่ง</span><span className="text-[var(--good)]">ฟรี</span></div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t border-[var(--line)]">
                      <span>รวมทั้งหมด</span>
                      <span className="text-[var(--coral)]">฿{finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <button onClick={() => setStep('info')} className="w-full py-3 bg-[var(--coral)] text-white font-bold rounded-xl hover:bg-[var(--coral-deep)] transition-colors">
                    ดำเนินการต่อ →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Info */}
        {step === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="font-display text-2xl font-bold mb-6">ข้อมูลจัดส่ง</h1>
              <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--line)] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[var(--ink-3)] block mb-1">ชื่อ-นามสกุล *</label>
                    <input value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} className="w-full px-3 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]" placeholder="ชื่อ นามสกุล" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--ink-3)] block mb-1">เบอร์โทร *</label>
                    <input value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} className="w-full px-3 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]" placeholder="08X-XXX-XXXX" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-3)] block mb-1">อีเมล *</label>
                  <input type="email" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} className="w-full px-3 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-3)] block mb-1">ที่อยู่จัดส่ง *</label>
                  <textarea value={info.address} onChange={(e) => setInfo({ ...info, address: e.target.value })} rows={3} className="w-full px-3 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)] resize-none" placeholder="บ้านเลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--ink-3)] block mb-1">หมายเหตุ (ถ้ามี)</label>
                  <input value={info.note} onChange={(e) => setInfo({ ...info, note: e.target.value })} className="w-full px-3 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]" placeholder="ข้อความถึงผู้ขาย..." />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep('cart')} className="px-4 py-2 border border-[var(--line)] rounded-xl text-sm hover:bg-[var(--bg-2)] transition-colors">← กลับ</button>
                <button disabled={!canProceed} onClick={() => setStep('payment')} className="flex-1 py-3 bg-[var(--coral)] text-white font-bold rounded-xl hover:bg-[var(--coral-deep)] transition-colors disabled:opacity-40">
                  เลือกวิธีชำระ →
                </button>
              </div>
            </div>

            <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--line)] h-fit space-y-3">
              <h3 className="font-semibold text-sm">สรุปคำสั่งซื้อ ({items.length} รายการ)</h3>
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-xs text-[var(--ink-3)]">
                  <span className="truncate pr-2">{item.name} × {item.qty}</span>
                  <span>฿{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[var(--line)] flex justify-between font-bold">
                <span>รวม</span><span className="text-[var(--coral)]">฿{finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step: Payment */}
        {step === 'payment' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="font-display text-2xl font-bold mb-6">วิธีชำระเงิน</h1>
              <div className="space-y-3">
                {(['promptpay', 'card'] as const).map((m) => {
                  const labels = { promptpay: { icon: '📱', title: 'PromptPay', sub: 'สแกน QR Code ชำระเงินผ่านธนาคาร' }, card: { icon: '💳', title: 'บัตรเครดิต / เดบิต', sub: 'Visa, Mastercard, JCB' } };
                  return (
                    <button
                      key={m}
                      onClick={() => setPayMethod(m)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors text-left ${payMethod === m ? 'border-[var(--coral)] bg-[var(--coral-soft)]' : 'border-[var(--line)] hover:border-[var(--line-2)]'}`}
                    >
                      <span className="text-2xl">{labels[m].icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{labels[m].title}</p>
                        <p className="text-xs text-[var(--ink-4)]">{labels[m].sub}</p>
                      </div>
                      <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${payMethod === m ? 'border-[var(--coral)] bg-[var(--coral)]' : 'border-[var(--line)]'}`}>
                        {payMethod === m && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {placeError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {placeError}
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep('info')} disabled={placing} className="px-4 py-2 border border-[var(--line)] rounded-xl text-sm hover:bg-[var(--bg-2)] transition-colors disabled:opacity-40">← กลับ</button>
                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="flex-1 py-3 bg-[var(--coral)] text-white font-bold rounded-xl hover:bg-[var(--coral-deep)] transition-colors disabled:opacity-60"
                >
                  {placing ? 'กำลังส่งคำสั่งซื้อ...' : `ยืนยันคำสั่งซื้อ ฿${finalTotal.toLocaleString()}`}
                </button>
              </div>
            </div>

            <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--line)] h-fit space-y-3">
              <h3 className="font-semibold text-sm">ส่งไปที่</h3>
              <div className="text-xs text-[var(--ink-3)] space-y-1">
                <p className="font-medium text-[var(--ink)]">{info.name}</p>
                <p>{info.phone}</p>
                <p>{info.email}</p>
                <p className="leading-relaxed">{info.address}</p>
              </div>
              <div className="pt-2 border-t border-[var(--line)] flex justify-between font-bold">
                <span>รวม</span><span className="text-[var(--coral)]">฿{finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center py-16 max-w-sm mx-auto">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="font-display text-2xl font-bold text-[var(--good)] mb-2">สั่งซื้อสำเร็จ!</h1>
            <p className="text-[var(--ink-4)] text-sm mb-1">เลขที่คำสั่งซื้อ</p>
            <p className="font-mono font-bold text-lg mb-6">{orderNum}</p>
            <p className="text-sm text-[var(--ink-3)] mb-8">เราจะส่งอีเมลยืนยันไปที่ <strong>{info.email}</strong> เร็วๆ นี้</p>
            <div className="flex flex-col gap-3">
              <Link href="/" className="py-3 bg-[var(--coral)] text-white font-bold rounded-xl hover:bg-[var(--coral-deep)] transition-colors">
                ช้อปต่อ
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
