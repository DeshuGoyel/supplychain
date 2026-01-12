'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import Button from '@/components/Common/Button';
import Input from '@/components/Common/Input';
import Alert from '@/components/Common/Alert';
import { useAuth } from '@/hooks/useAuth';

const LoginForm: React.FC = () => {
  const { isLoading, error: authError } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (requiresTwoFactor) {
      if (!twoFactorCode) {
        setLocalError('Please enter your 2FA code');
        return;
      }
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/2fa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, code: twoFactorCode })
        });
        const data = await response.json();
        if (data.success) {
          localStorage.setItem('token', data.token);
          window.location.href = '/dashboard';
        } else {
          setLocalError(data.message || 'Invalid 2FA code');
        }
      } catch (err) {
        setLocalError('An error occurred during 2FA verification');
      }
      return;
    }

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setUserId(data.userId);
      } else if (data.success) {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
      } else {
        setLocalError(data.message || 'Login failed');
      }
    } catch {
      setLocalError('An error occurred during login');
    }
  };

  const error = localError || authError;

  return (
    <div className="w-full max-w-md space-y-8 p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Sign in</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your credentials to access your dashboard
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && <Alert variant="error">{error}</Alert>}

        {requiresTwoFactor ? (
          <div className="space-y-4">
            <Input
              label="Two-Factor Authentication Code"
              id="twoFactorCode"
              name="twoFactorCode"
              type="text"
              required
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              placeholder="123456"
            />
            <p className="text-sm text-gray-600">
              Enter the 6-digit code from your authenticator app or a backup code.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <Input
                label="Email address"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@acme.com"
              />

              <div className="relative">
                <Input
                  label="Password"
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  window.location.href = `${apiUrl}/api/auth/oauth/google?returnTo=${encodeURIComponent('/dashboard')}`;
                }}
                className="w-full border border-gray-300 rounded-md py-2 text-sm font-medium hover:bg-gray-50"
              >
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = `${apiUrl}/api/auth/oauth/github?returnTo=${encodeURIComponent('/dashboard')}`;
                }}
                className="w-full border border-gray-300 rounded-md py-2 text-sm font-medium hover:bg-gray-50"
              >
                Continue with GitHub
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>
          </>
        )}

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
        >
          {requiresTwoFactor ? 'Verify & Sign in' : 'Sign in'}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
