'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = params.get('token');
    const twoFactor = params.get('requiresTwoFactor');
    const uid = params.get('userId');

    const returnTo = params.get('returnTo') || '/dashboard';

    if (token) {
      localStorage.setItem('token', token);
      router.replace(returnTo);
      return;
    }

    if (twoFactor === 'true' && uid) {
      setRequiresTwoFactor(true);
      setUserId(uid);
      setLoading(false);
      return;
    }

    setError('OAuth login failed. Please try again.');
    setLoading(false);
  }, [params, router]);

  const verify2fa = async () => {
    setError(null);

    if (!userId) {
      setError('Missing userId');
      return;
    }

    if (!code) {
      setError('Please enter your 2FA code');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      });

      const data = await response.json();
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        router.replace(params.get('returnTo') || '/dashboard');
        return;
      }

      setError(data.message || 'Invalid code');
    } catch {
      setError('2FA verification failed');
    }
  };

  if (loading) return <div className="p-6">Signing you in...</div>;

  if (!requiresTwoFactor) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">OAuth Sign-in Error</h1>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-xl font-bold">Two-Factor Verification</h1>
        <p className="text-sm text-gray-600">Enter the 6-digit code from your authenticator app or a backup code.</p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          className="w-full border border-gray-300 rounded-md p-2"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={verify2fa}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
        >
          Verify
        </button>
      </div>
    </div>
  );
}
