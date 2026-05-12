'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

function parseJwt(token: string) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

function OAuthCallbackInner() {
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth_token', error: error || 'no_token' }, window.location.origin);
        window.close();
      }
      return;
    }

    const payload = parseJwt(token);
    if (!payload) {
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth_token', error: 'invalid_token' }, window.location.origin);
        window.close();
      }
      return;
    }

    const user = { id: payload.sub, email: payload.email, name: payload.name ?? payload.email, role: payload.role };

    if (window.opener) {
      window.opener.postMessage({ type: 'oauth_token', token, user }, window.location.origin);
      window.close();
    } else {
      // Fallback: direct navigation (not in popup)
      localStorage.setItem('kraft_customer_token', token);
      window.location.href = '/account';
    }
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--coral)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-[var(--ink-4)]">กำลังเข้าสู่ระบบ...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[var(--coral)] border-t-transparent rounded-full animate-spin" /></div>}>
      <OAuthCallbackInner />
    </Suspense>
  );
}
