'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
  };

  const reject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
        <p className="text-sm mb-4 md:mb-0">
          We use cookies to improve your experience. Learn more in our
          <Link href="/cookies" className="underline ml-1">Cookie Policy</Link>.
        </p>
        <div className="flex space-x-4">
          <button 
            onClick={reject}
            className="text-sm text-gray-400 hover:text-white"
          >
            Reject Optional
          </button>
          <button 
            onClick={accept}
            className="bg-blue-600 px-4 py-2 rounded text-sm font-bold hover:bg-blue-700"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
