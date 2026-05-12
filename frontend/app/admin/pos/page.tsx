'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { promptPayQRUrl } from '@/lib/promptpay';

const PROMPTPAY_ID = '0800000001';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const TERMINAL_ID = 'POS-001';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}
interface CartState { items: CartItem[]; subtotal: number; vat: number; total: number; }
interface Product { _id: string; name: string; price: number; stock: number; images: string[]; sku: string; }

type PaymentMethod = 'cash' | 'promptpay' | 'card';
type ModalState = 'idle' | 'select' | 'cash' | 'promptpay' | 'card' | 'processing' | 'success';

export default function POSPage() {
  const socketRef = useRef<Socket | null>(null);
  const [cart, setCart] = useState<CartState>({ items: [], subtotal: 0, vat: 0, total: 0 });
  const [modal, setModal] = useState<ModalState>('idle');
  const [cashReceived, setCashReceived] = useState('');
  const [receipt, setReceipt] = useState<{ orderId: string; receiptNumber: string; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Load real products from API
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kraft_token') : '';
    fetch(`${BASE}/products?limit=100&status=active`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setProducts(d.items ?? []))
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, []);

  const filteredProducts = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
    : products;

  useEffect(() => {
    const socket = io(`${WS_URL}/pos`, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('terminal:open', { terminalId: TERMINAL_ID, staffId: 'staff-1' });
    });

    socket.on('cart:loaded', setCart);
    socket.on('cart:updated', setCart);
    socket.on('cart:cleared', setCart);

    socket.on('payment:processing', () => setModal('processing'));
    socket.on('payment:success', (data) => {
      setReceipt(data);
      setModal('success');
    });
    socket.on('payment:failed', ({ reason }) => {
      setError(reason);
      setModal('select');
    });

    return () => { socket.disconnect(); };
  }, []);

  const addToCart = useCallback((product: Product) => {
    socketRef.current?.emit('cart:add', {
      terminalId: TERMINAL_ID,
      productId: product._id,
      name: product.name,
      price: product.price,
      qty: 1,
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    socketRef.current?.emit('cart:remove', { terminalId: TERMINAL_ID, productId });
  }, []);

  const confirmPayment = useCallback((method: PaymentMethod) => {
    socketRef.current?.emit('payment:confirm', { terminalId: TERMINAL_ID, method });
  }, []);

  const change = cashReceived ? parseFloat(cashReceived) - cart.total : 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 bg-[var(--ink)] text-white flex items-center px-4 gap-4 text-sm">
        <span className="font-display font-bold text-[var(--coral)]">POS Terminal</span>
        <span className="text-white/40">|</span>
        <span className="text-white/70">{TERMINAL_ID}</span>
        <button
          onClick={() => socketRef.current?.emit('cart:clear', { terminalId: TERMINAL_ID })}
          className="ml-auto text-white/50 hover:text-white transition-colors text-xs"
        >
          ล้างตะกร้า
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Products */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg)]">
          <div className="p-3 border-b border-[var(--line)] bg-[var(--surface)]">
            <input
              type="search"
              placeholder="ค้นหาสินค้า หรือ SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--line)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {productsLoading ? (
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-[var(--surface)] rounded-xl p-3 border border-[var(--line)] animate-pulse">
                    <div className="aspect-square bg-[var(--bg-2)] rounded-lg mb-2" />
                    <div className="h-3 bg-[var(--bg-2)] rounded mb-1" />
                    <div className="h-4 bg-[var(--bg-2)] rounded w-16" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-[var(--ink-4)]">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-sm">{search ? `ไม่พบ "${search}"` : 'ไม่มีสินค้า'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p) => (
                  <button
                    key={p._id}
                    onClick={() => addToCart(p)}
                    disabled={p.stock === 0}
                    className="bg-[var(--surface)] rounded-xl p-3 text-left border border-[var(--line)] hover:border-[var(--coral)] hover:shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="aspect-square bg-[var(--bg-2)] rounded-lg mb-2 flex items-center justify-center text-3xl opacity-50">
                      {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover rounded-lg" alt="" /> : '🛍️'}
                    </div>
                    <p className="text-xs font-medium text-[var(--ink)] line-clamp-2">{p.name}</p>
                    <p className="text-[var(--coral)] font-bold text-sm mt-1">฿{p.price.toLocaleString()}</p>
                    {p.stock === 0 ? (
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">สินค้าหมด</span>
                    ) : p.stock < 5 ? (
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">เหลือ {p.stock}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-80 xl:w-96 bg-[var(--surface)] border-l border-[var(--line)] flex flex-col">
          <div className="px-4 py-3 border-b border-[var(--line)]">
            <h2 className="font-display font-bold text-base">บิลปัจจุบัน</h2>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {cart.items.length === 0 ? (
              <p className="text-center text-[var(--ink-4)] text-sm py-10">ยังไม่มีสินค้า</p>
            ) : (
              cart.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-[var(--ink-4)] text-xs">x{item.qty} × ฿{item.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-bold text-[var(--coral)]">฿{(item.price * item.qty).toLocaleString()}</span>
                    <button onClick={() => removeFromCart(item.productId)} className="ml-1 text-red-400 hover:text-red-600">×</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-[var(--line)] px-4 py-3 space-y-2">
            <div className="flex justify-between text-sm text-[var(--ink-3)]">
              <span>ยอดรวม</span><span>฿{cart.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--ink-3)]">
              <span>VAT 7%</span><span>฿{cart.vat.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-display font-bold text-lg pt-1 border-t border-[var(--line)]">
              <span>รวมทั้งหมด</span><span className="text-[var(--coral)]">฿{cart.total.toLocaleString()}</span>
            </div>
            <button
              disabled={cart.items.length === 0}
              onClick={() => { setError(null); setModal('select'); }}
              className="w-full py-3 bg-[var(--coral)] text-white font-bold rounded-xl hover:bg-[var(--coral-deep)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
            >
              💳 ชำระเงิน
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {modal !== 'idle' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-sm shadow-2xl">
            {modal === 'select' && (
              <div className="p-6">
                <h2 className="font-display font-bold text-xl mb-1">เลือกวิธีชำระ</h2>
                <p className="text-[var(--coral)] font-bold text-lg mb-5">฿{cart.total.toLocaleString()}</p>
                {error && <p className="text-red-500 text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}
                <div className="space-y-3">
                  <button onClick={() => setModal('cash')} className="w-full p-4 border-2 border-[var(--line)] hover:border-[var(--coral)] rounded-xl text-left flex items-center gap-3 transition-colors">
                    <span className="text-2xl">💵</span>
                    <div><p className="font-semibold">เงินสด</p><p className="text-xs text-[var(--ink-4)]">รับเงินสดและทอนเงิน</p></div>
                  </button>
                  <button onClick={() => { setModal('promptpay'); confirmPayment('promptpay'); }} className="w-full p-4 border-2 border-[var(--line)] hover:border-[var(--coral)] rounded-xl text-left flex items-center gap-3 transition-colors">
                    <span className="text-2xl">📱</span>
                    <div><p className="font-semibold">PromptPay</p><p className="text-xs text-[var(--ink-4)]">QR Code พร้อมเพย์</p></div>
                  </button>
                  <button onClick={() => { setModal('card'); confirmPayment('card'); }} className="w-full p-4 border-2 border-[var(--line)] hover:border-[var(--coral)] rounded-xl text-left flex items-center gap-3 transition-colors">
                    <span className="text-2xl">💳</span>
                    <div><p className="font-semibold">บัตรเครดิต / เดบิต</p><p className="text-xs text-[var(--ink-4)]">Visa, Mastercard, JCB</p></div>
                  </button>
                </div>
                <button onClick={() => setModal('idle')} className="w-full mt-4 py-2 text-sm text-[var(--ink-4)] hover:text-[var(--ink)] transition-colors">ยกเลิก</button>
              </div>
            )}

            {modal === 'cash' && (
              <div className="p-6">
                <h2 className="font-display font-bold text-xl mb-1">รับเงินสด</h2>
                <p className="text-[var(--ink-3)] text-sm mb-4">ยอดชำระ <span className="text-[var(--coral)] font-bold text-lg">฿{cart.total.toLocaleString()}</span></p>
                <div className="mb-4">
                  <label className="text-xs text-[var(--ink-4)] block mb-1">รับเงินมา</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-2xl font-bold text-center border-2 border-[var(--coral)] rounded-xl py-3 focus:outline-none"
                    autoFocus
                  />
                </div>
                {cashReceived && (
                  <div className={`text-center text-lg font-bold mb-4 ${change >= 0 ? 'text-[var(--good)]' : 'text-red-500'}`}>
                    ทอน: ฿{change >= 0 ? change.toLocaleString() : '(ไม่พอ)'}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 mb-4">
  {[50, 100, 200, 500, 1000, cart.total].map((v) => (
    <button key={v} onClick={() => setCashReceived(String(v))} className="py-2 text-sm bg-[var(--bg-2)] hover:bg-[var(--coral-soft)] rounded-lg transition-colors font-medium">
      {v === cart.total ? 'พอดี' : `฿${v}`}
    </button>
  ))}
</div>
                <button
                  disabled={!cashReceived || change < 0}
                  onClick={() => confirmPayment('cash')}
                  className="w-full py-3 bg-[var(--coral)] text-white font-bold rounded-xl hover:bg-[var(--coral-deep)] transition-colors disabled:opacity-40"
                >
                  ยืนยันการชำระเงิน
                </button>
                <button onClick={() => setModal('select')} className="w-full mt-2 py-2 text-sm text-[var(--ink-4)] hover:text-[var(--ink)]">← กลับ</button>
              </div>
            )}

            {modal === 'promptpay' && (
              <div className="p-6 text-center">
                <h2 className="font-display font-bold text-xl mb-2">PromptPay QR</h2>
                <p className="text-[var(--coral)] font-bold text-2xl mb-4">฿{cart.total.toLocaleString()}</p>
                <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden border border-[var(--line)] mb-4 bg-white p-2">
                  <img
                    src={promptPayQRUrl(PROMPTPAY_ID, cart.total)}
                    alt="PromptPay QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-[var(--ink-4)] mb-1">พร้อมเพย์: {PROMPTPAY_ID}</p>
                <p className="text-sm text-[var(--ink-4)] mb-4">สแกน QR Code เพื่อชำระเงิน<br />รอการยืนยันจากธนาคาร...</p>
                <div className="flex justify-center gap-1 mb-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[var(--coral)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <button onClick={() => setModal('select')} className="text-sm text-[var(--ink-4)] hover:text-[var(--ink)]">ยกเลิก</button>
              </div>
            )}

            {modal === 'card' && (
              <div className="p-6 text-center">
                <h2 className="font-display font-bold text-xl mb-2">รูดบัตร</h2>
                <p className="text-[var(--coral)] font-bold text-2xl mb-6">฿{cart.total.toLocaleString()}</p>
                <div className="text-5xl mb-4 animate-pulse">💳</div>
                <p className="text-sm text-[var(--ink-4)] mb-6">กำลังรอสัญญาณจากเครื่องรูด...</p>
                <button onClick={() => setModal('select')} className="text-sm text-[var(--ink-4)] hover:text-[var(--ink)]">ยกเลิก</button>
              </div>
            )}

            {modal === 'processing' && (
              <div className="p-6 text-center">
                <div className="text-5xl mb-4 animate-spin">⚙️</div>
                <p className="font-semibold">กำลังประมวลผล...</p>
              </div>
            )}

            {modal === 'success' && receipt && (
              <div className="p-6 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="font-display font-bold text-xl text-[var(--good)] mb-2">ชำระเงินสำเร็จ!</h2>
                <p className="text-sm text-[var(--ink-4)]">เลขที่ใบเสร็จ</p>
                <p className="font-mono font-bold text-lg mt-1 mb-1">{receipt.receiptNumber}</p>
                <p className="text-[var(--coral)] font-bold text-xl mb-5">฿{receipt.total.toLocaleString()}</p>
                <div className="space-y-2">
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/pos/receipt/${receipt.orderId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-[var(--line)] text-[var(--ink)] text-sm font-semibold rounded-xl hover:bg-[var(--bg-2)] transition-colors"
                  >
                    🖨️ พิมพ์ใบเสร็จ
                  </a>
                  <button
                    onClick={() => { setModal('idle'); setReceipt(null); setCashReceived(''); }}
                    className="w-full py-3 bg-[var(--coral)] text-white font-bold rounded-xl hover:bg-[var(--coral-deep)] transition-colors"
                  >
                    บิลถัดไป
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
