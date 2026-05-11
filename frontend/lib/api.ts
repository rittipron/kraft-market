const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('kraft_token');
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Products ──
export const getProducts = (params?: Record<string, string>) => {
  const q = params ? `?${new URLSearchParams(params)}` : '';
  return apiFetch<{ items: Product[]; total: number; pages: number }>(`/products${q}`);
};
export const getProduct = (id: string) => apiFetch<Product>(`/products/${id}`);
export const createProduct = (data: Partial<Product>) => apiFetch<Product>('/products', { method: 'POST', body: JSON.stringify(data) });
export const updateProduct = (id: string, data: Partial<Product>) => apiFetch<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteProduct = (id: string) => apiFetch(`/products/${id}`, { method: 'DELETE' });

// ── Orders ──
export const getOrders = (params?: Record<string, string>) => {
  const q = params ? `?${new URLSearchParams(params)}` : '';
  return apiFetch<{ items: Order[]; total: number }>(`/orders${q}`);
};
export const getOrder = (id: string) => apiFetch<Order>(`/orders/${id}`);
export const updateOrderStatus = (id: string, status: string) =>
  apiFetch<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const getDashboardStats = () => apiFetch<DashboardStats>('/orders/stats/dashboard');

// ── Pages (CMS) ──
export const getPages = (status?: string) => apiFetch<Page[]>(`/pages${status ? `?status=${status}` : ''}`);
export const getPageBySlug = (slug: string) => apiFetch<Page>(`/pages/slug/${slug}`);
export const getPageById = (id: string) => apiFetch<Page>(`/pages/${id}`);
export const createPage = (data: Partial<Page>) => apiFetch<Page>('/pages', { method: 'POST', body: JSON.stringify(data) });
export const updatePage = (id: string, data: Partial<Page>) => apiFetch<Page>(`/pages/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deletePage = (id: string) => apiFetch(`/pages/${id}`, { method: 'DELETE' });

// ── Auth ──
export const login = (email: string, password: string) =>
  apiFetch<{ accessToken: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const logout = () => apiFetch('/auth/logout', { method: 'POST' });

// ── Health ──
export const getHealth = () => apiFetch<{ status: string }>('/health');

// ── Types ──
export interface Product {
  _id: string;
  name: string;
  price: number;
  sku: string;
  stock: number;
  categoryId: string;
  tags: string[];
  images: string[];
  status: 'active' | 'draft' | 'archived';
  rating: number;
  reviewCount: number;
  soldCount: number;
  description: string;
  createdAt: string;
}

export interface Order {
  _id: string;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  channel: 'online' | 'pos';
  paymentMethod: string;
  receiptNumber: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export interface Page {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'scheduled';
  blocks: PageBlock[];
  authorId: string;
  publishedAt?: string;
  createdAt: string;
}

export interface PageBlock {
  id: string;
  type: 'hero' | 'heading' | 'text' | 'image' | 'products' | 'cta' | 'columns' | 'testimonials';
  data: Record<string, any>;
  order: number;
}

export interface User {
  id?: string;
  _id?: string;
  email: string;
  name: string;
  role: string;
}

export interface DashboardStats {
  dailySales: Array<{ _id: { date: string; channel: string }; total: number; count: number }>;
  topProducts: Array<{ _id: string; name: string; sold: number; revenue: number }>;
  statusBreakdown: Array<{ _id: string; count: number }>;
}
