'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  const fetchSecurityStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTwoFactorEnabled(response.data.user.twoFactorEnabled);
    } catch (error) {
      console.error('Error fetching security status:', error);
    } finally {
      setLoading(false);
    }
  };

  const initiate2FA = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/enable`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrCode(response.data.qrCode);
      setShowSetup(true);
    } catch (error) {
      toast.error('Failed to initiate 2FA');
    }
  };

  const verifySetup = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/verify-setup`, {
        code: verificationCode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTwoFactorEnabled(true);
      setShowSetup(false);
      setBackupCodes(response.data.backupCodes);
      toast.success('2FA enabled successfully');
    } catch (error) {
      toast.error('Invalid verification code');
    }
  };

  const disable2FA = async () => {
    const password = prompt('Please enter your password to disable 2FA:');
    if (!password) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/disable`, {
        password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTwoFactorEnabled(false);
      toast.success('2FA disabled');
    } catch (error) {
      toast.error('Failed to disable 2FA. Check your password.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Security Settings</h1>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-lg font-medium">Two-Factor Authentication (2FA)</h2>
          <p className="text-gray-500 mb-4">Add an extra layer of security to your account.</p>
          
          {twoFactorEnabled ? (
            <div className="flex items-center space-x-4">
              <span className="text-green-600 font-medium">Enabled</span>
              <button 
                onClick={disable2FA}
                className="text-red-600 hover:underline text-sm"
              >
                Disable 2FA
              </button>
            </div>
          ) : (
            <div>
              {!showSetup ? (
                <button 
                  onClick={initiate2FA}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Enable 2FA
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm">Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy):</p>
                  <img src={qrCode} alt="2FA QR Code" className="mx-auto" />
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">Verification Code</label>
                    <input 
                      type="text" 
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      className="border border-gray-300 rounded-md p-2 w-32"
                    />
                    <button 
                      onClick={verifySetup}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 w-fit"
                    >
                      Verify & Enable
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {backupCodes.length > 0 && (
          <div className="mt-6 bg-gray-50 p-4 rounded-md">
            <h3 className="font-bold text-red-600 mb-2">Save your backup codes!</h3>
            <p className="text-sm text-gray-600 mb-4">If you lose your phone, you can use these codes to log in. Each code can only be used once.</p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <code key={i} className="bg-white p-2 border rounded text-center font-mono">{code}</code>
              ))}
            </div>
            <button 
              onClick={() => window.print()} 
              className="mt-4 text-blue-600 text-sm hover:underline"
            >
              Print backup codes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
