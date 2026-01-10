'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, Download, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { TwoFactorStatus } from '@/types/sprint5';
import { sprint5API } from '@/services/sprint5';

interface TwoFactorSetupProps {
  userId: string;
}

export function TwoFactorSetup({ userId }: TwoFactorSetupProps) {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingUp, setSettingUp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showCodes, setShowCodes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, [userId]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const data = await sprint5API.getTwoFactorStatus(userId);
      setStatus(data);
    } catch (err) {
      setError('Failed to load 2FA status');
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    try {
      setSettingUp(true);
      setError(null);
      const data = await sprint5API.enableTwoFactor(userId);
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes || []);
    } catch (err) {
      setError('Failed to start 2FA setup');
    } finally {
      setSettingUp(false);
    }
  };

  const verifySetup = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    try {
      setVerifying(true);
      setError(null);
      const data = await sprint5API.verifyTwoFactorSetup(userId, verificationCode, []);
      setBackupCodes(data.backupCodes);
      setSuccess('Two-factor authentication enabled successfully!');
      await loadStatus(); // Reload to get updated status
    } catch (err) {
      setError('Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  const disableTwoFactor = async () => {
    const password = prompt('Enter your password to confirm disabling 2FA:');
    if (!password) return;

    try {
      await sprint5API.disableTwoFactor(userId, password);
      setSuccess('Two-factor authentication disabled');
      await loadStatus();
    } catch (err) {
      setError('Failed to disable 2FA');
    }
  };

  const generateNewCodes = async () => {
    try {
      const data = await sprint5API.generateBackupCodes(userId);
      setBackupCodes(data.backupCodes);
      setSuccess('New backup codes generated');
    } catch (err) {
      setError('Failed to generate backup codes');
    }
  };

  const downloadBackupCodes = () => {
    const content = `Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground">
          Manage your two-factor authentication settings
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Two-Factor Authentication</span>
            {status?.enabled && <Badge variant="secondary">Enabled</Badge>}
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!status?.enabled ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Two-factor authentication adds an extra layer of security to your account by requiring a code from your authenticator app in addition to your password.
              </p>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button onClick={startSetup} disabled={settingUp}>
                    {settingUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enable Two-Factor Authentication
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                      Follow these steps to enable 2FA on your account
                    </DialogDescription>
                  </DialogHeader>
                  
                  {qrCode ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h4 className="font-medium mb-2">Step 1: Scan QR Code</h4>
                        <img src={qrCode} alt="2FA QR Code" className="mx-auto border rounded" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Scan this QR code with your authenticator app
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Manual Entry Code</Label>
                        <div className="flex items-center space-x-2">
                          <Input value={secret} readOnly className="font-mono text-sm" />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(secret)}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="verification-code">Step 2: Enter Verification Code</Label>
                        <Input
                          id="verification-code"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          className="text-center font-mono text-lg"
                        />
                      </div>
                      
                      <Button 
                        onClick={verifySetup} 
                        disabled={verifying || !verificationCode}
                        className="w-full"
                      >
                        {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify and Enable 2FA
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Generating QR code...
                      </p>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-factor authentication is enabled</p>
                  <p className="text-sm text-muted-foreground">
                    Your account is protected with 2FA
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Backup Codes</h4>
                <p className="text-sm text-muted-foreground">
                  Use these codes to access your account if you lose your authenticator device
                </p>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View Backup Codes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Backup Codes</DialogTitle>
                      <DialogDescription>
                        Store these codes in a safe place. Each code can only be used once.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="font-mono text-sm">
                            {index + 1}. {code}
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button onClick={downloadBackupCodes} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        <Button onClick={generateNewCodes} variant="outline" size="sm">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Generate New Codes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="pt-4 border-t">
                <Button onClick={disableTwoFactor} variant="destructive">
                  Disable Two-Factor Authentication
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}