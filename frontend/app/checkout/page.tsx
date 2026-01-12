'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    if (success) {
      toast.success('Subscription activated successfully!');
      router.push('/dashboard/billing?success=true');
    } else if (canceled) {
      toast.error('Checkout canceled');
      router.push('/pricing');
    } else if (sessionId) {
      // Verify session with backend
      verifySession(sessionId);
    } else {
      router.push('/pricing');
    }
  }, [router, searchParams]);

  const verifySession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      // You could implement a session verification endpoint
      setLoading(false);
    } catch (error) {
      console.error('Error verifying session:', error);
      toast.error('Error verifying checkout session');
      router.push('/pricing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Processing your subscription...</h2>
          <p className="mt-4 text-gray-600">
            Please wait while we set up your subscription.
          </p>
        </div>
      </div>
    </div>
  );
}