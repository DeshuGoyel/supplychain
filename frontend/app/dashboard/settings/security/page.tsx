'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/security/2fa/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTwoFactorEnabled(response.data.data.enabled);
    } catch (err) {
      console.error('Failed to check 2FA status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/security/2fa/setup`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setQrCode(response.data.data.qrCode);
      setBackupCodes(response.data.data.backupCodes);
      setSetupMode(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/security/2fa/enable`,
        { code: verificationCode },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess('Two-factor authentication enabled successfully!');
      setTwoFactorEnabled(true);
      setSetupMode(false);
      setVerificationCode('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/security/2fa/disable`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess('Two-factor authentication disabled');
      setTwoFactorEnabled(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/security/2fa/backup-codes`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setBackupCodes(response.data.data.backupCodes);
      setSuccess('Backup codes regenerated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to regenerate backup codes');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !setupMode) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Security Settings</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication (2FA)</h2>
        
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 mb-2">
                Status: {twoFactorEnabled ? (
                  <span className="text-green-600 font-semibold">Enabled ✓</span>
                ) : (
                  <span className="text-gray-500">Disabled</span>
                )}
              </p>
              <p className="text-sm text-gray-600">
                Add an extra layer of security to your account by requiring a verification code from your authenticator app.
              </p>
            </div>
          </div>
        </div>

        {!twoFactorEnabled && !setupMode && (
          <button
            onClick={handleSetup2FA}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Enable 2FA
          </button>
        )}

        {twoFactorEnabled && (
          <div className="space-y-4">
            <button
              onClick={handleDisable2FA}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Disable 2FA
            </button>
            <button
              onClick={handleRegenerateBackupCodes}
              disabled={loading}
              className="ml-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              Regenerate Backup Codes
            </button>
          </div>
        )}

        {setupMode && (
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Step 1: Scan QR Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              {qrCode && (
                <img src={qrCode} alt="QR Code" className="border p-4 bg-white" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Step 2: Save Backup Codes</h3>
              <p className="text-sm text-gray-600 mb-4">
                Save these backup codes in a safe place. You can use them to access your account if you lose your device.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index}>{code}</div>
                ))}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(backupCodes.join('\n'));
                  setSuccess('Backup codes copied to clipboard');
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Copy to Clipboard
              </button>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Step 3: Verify</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit code from your authenticator app to complete setup
              </p>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="flex-1 px-4 py-2 border rounded-lg"
                  maxLength={6}
                />
                <button
                  onClick={handleEnable2FA}
                  disabled={loading || verificationCode.length !== 6}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Verify & Enable
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setSetupMode(false);
                setQrCode(null);
                setBackupCodes([]);
                setVerificationCode('');
              }}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              Cancel Setup
            </button>
          </div>
        )}

        {backupCodes.length > 0 && !setupMode && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Your Backup Codes</h3>
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index}>{code}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Additional Security</h2>
        <ul className="space-y-3 text-gray-700">
          <li>✓ Passwords are hashed with bcrypt</li>
          <li>✓ All connections use TLS/SSL encryption</li>
          <li>✓ Session tokens expire after inactivity</li>
          <li>✓ All admin actions are logged for audit</li>
        </ul>
      </div>
    </div>
  );
}
