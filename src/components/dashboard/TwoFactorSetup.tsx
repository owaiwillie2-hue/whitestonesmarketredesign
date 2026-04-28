import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { Shield, Copy, Check } from 'lucide-react';

export const TwoFactorSetup = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('two_factor_enabled')
      .eq('user_id', user.id)
      .single();

    setIs2FAEnabled(profile?.two_factor_enabled || false);
  };

  const generateTOTP = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .single();

    // Generate a random secret
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: 'Whitestones Markets',
      label: profile?.email || user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret,
    });

    // Generate QR code
    const otpauth = totp.toString();
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    setSecret(secret.base32);
    setQrCode(qrCodeDataUrl);
    setShowSetupDialog(true);
  };

  const handleEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Verify the code
      const totp = new OTPAuth.TOTP({
        issuer: 'Whitestones Markets',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret,
      });

      const isValid = totp.validate({ token: verificationCode, window: 1 }) !== null;

      if (!isValid) {
        toast.error('Invalid verification code. Please try again.');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          two_factor_secret: secret,
          two_factor_enabled: true,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Log activity via edge function
      await supabase.functions.invoke('log-activity', {
        body: {
          userId: user.id,
          action: '2fa_enabled',
          ip: 'N/A',
          userAgent: navigator.userAgent,
        },
      });


      toast.success('Two-factor authentication enabled successfully!');
      setIs2FAEnabled(true);
      setShowSetupDialog(false);
      setVerificationCode('');
      setSecret('');
      setQrCode('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disableCode || disableCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Get current secret
      const { data: profile } = await supabase
        .from('profiles')
        .select('two_factor_secret')
        .eq('user_id', user.id)
        .single();

      if (!profile?.two_factor_secret) {
        toast.error('2FA is not enabled');
        return;
      }

      // Verify the code
      const totp = new OTPAuth.TOTP({
        issuer: 'Whitestones Markets',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: profile.two_factor_secret,
      });

      const isValid = totp.validate({ token: disableCode, window: 1 }) !== null;

      if (!isValid) {
        toast.error('Invalid verification code. Please try again.');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          two_factor_secret: null,
          two_factor_enabled: false,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Log activity via edge function
      await supabase.functions.invoke('log-activity', {
        body: {
          userId: user.id,
          action: '2fa_disabled',
          ip: 'N/A',
          userAgent: navigator.userAgent,
        },
      });


      toast.success('Two-factor authentication disabled successfully!');
      setIs2FAEnabled(false);
      setShowDisableDialog(false);
      setDisableCode('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success('Secret key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-secondary">security</span>
        <h2 className="font-headline-md text-headline-md">Security</h2>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-surface-container-low">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <div>
              <span className="font-label-md block">Two-Factor Auth</span>
              <span className={`text-xs font-medium ${is2FAEnabled ? 'text-on-tertiary-container' : 'text-on-surface-variant'}`}>
                {is2FAEnabled ? 'Currently Enabled' : 'Not Enabled'}
              </span>
            </div>
          </div>
          {is2FAEnabled ? (
            <button className="text-error text-sm font-label-md active:scale-95 transition-transform" onClick={() => setShowDisableDialog(true)}>
              Disable
            </button>
          ) : (
            <button className="text-secondary text-sm font-label-md active:scale-95 transition-transform" onClick={generateTOTP}>
              Enable
            </button>
          )}
        </div>
      </div>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan this QR code with Google Authenticator or any TOTP authenticator app
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex flex-col items-center space-y-4">
                <img src={qrCode} alt="QR Code" className="w-48 h-48 border rounded-lg" />
                <div className="w-full space-y-2">
                  <Label className="text-xs text-muted-foreground">Manual Entry Key</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={secret}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={copySecret}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Enter 6-Digit Code</Label>
              <Input
                id="verificationCode"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <Button
              onClick={handleEnable2FA}
              className="w-full"
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify and Enable'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your 6-digit code from Google Authenticator to confirm
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disableCode">Verification Code</Label>
              <Input
                id="disableCode"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <Button
              onClick={handleDisable2FA}
              variant="destructive"
              className="w-full"
              disabled={loading || disableCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Disable 2FA'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
