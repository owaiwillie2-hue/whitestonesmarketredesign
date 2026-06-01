import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';

export const AdminSettings = () => {
  const [settings, setSettings] = useState({
    deposit_address: '',
    deposit_qr_url: '',
    company_address: '',
    company_phone: '',
    company_email: ''
  });
  const [loading, setLoading] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string>('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('website_settings')
        .select('*');

      if (data) {
        const settingsObj: any = {};
        data.forEach(item => {
          settingsObj[item.key] = item.value;
        });
        setSettings(prev => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let qrUrl = settings.deposit_qr_url;

      // Upload QR file if provided
      if (qrFile) {
        const fileExt = qrFile.name.split('.').pop();
        const fileName = `qr-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('settings')
          .upload(fileName, qrFile, { upsert: true });

        if (uploadError) throw uploadError;

        // Get public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('settings')
          .getPublicUrl(fileName);
        
        qrUrl = publicUrl;
      }

      const updates = Object.entries({...settings, deposit_qr_url: qrUrl}).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
      }));

      for (const update of updates) {
        await supabase
          .from('website_settings')
          .upsert(update, { onConflict: 'key' });
      }

      toast.success('Settings saved successfully');
      setQrFile(null);
      setQrPreview('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveQr = () => {
    setQrFile(null);
    setQrPreview('');
    setSettings({ ...settings, deposit_qr_url: '' });
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden font-['Plus_Jakarta_Sans']">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Website Settings</h1>
          <p className="text-xs text-slate-500 mt-1">Configure platform deposit parameters and company info</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading} 
          className="h-10 rounded-xl text-xs font-bold bg-primary hover:bg-primary/95 text-white flex items-center justify-center gap-1.5 transition-all shadow-sm px-4"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Deposit Information */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
              Deposit Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="deposit_address" className="text-xs font-bold text-slate-900 dark:text-white">Bitcoin Deposit Address</Label>
              <Textarea
                id="deposit_address"
                value={settings.deposit_address}
                onChange={(e) => setSettings({ ...settings, deposit_address: e.target.value })}
                placeholder="bc1q..."
                rows={2}
                className="text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary focus-visible:ring-1 p-3"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deposit_qr_file" className="text-xs font-bold text-slate-900 dark:text-white block">Bitcoin QR Code</Label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:bg-slate-50 dark:hover:bg-slate-800/20 hover:border-primary/50 transition-all duration-200 flex flex-col items-center justify-center text-center">
                <input
                  id="deposit_qr_file"
                  type="file"
                  accept="image/*"
                  onChange={handleQrFileChange}
                  className="hidden"
                />
                <label htmlFor="deposit_qr_file" className="cursor-pointer flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[36px] text-slate-400">cloud_upload</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to upload QR image</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG, GIF up to 5MB</span>
                </label>
              </div>
              
              {(qrPreview || settings.deposit_qr_url) && (
                <div className="mt-4 p-4 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 rounded-xl flex items-center gap-4 justify-between">
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900 shrink-0">
                    <img 
                      src={qrPreview || settings.deposit_qr_url} 
                      alt="QR Code Preview" 
                      className="h-24 w-24 object-contain rounded"
                    />
                  </div>
                  <Button 
                    type="button"
                    variant="destructive" 
                    onClick={handleRemoveQr}
                    className="h-9 px-3 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Remove QR Code
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">corporate_fare</span>
              Company Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_address" className="text-xs font-bold text-slate-900 dark:text-white">Physical Address</Label>
              <Textarea
                id="company_address"
                value={settings.company_address}
                onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                placeholder="123 Financial District..."
                rows={2}
                className="text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary focus-visible:ring-1 p-3"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company_phone" className="text-xs font-bold text-slate-900 dark:text-white">Phone Number</Label>
              <Input
                id="company_phone"
                value={settings.company_phone}
                onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="h-10 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary focus-visible:ring-1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company_email" className="text-xs font-bold text-slate-900 dark:text-white">Support Email Address</Label>
              <Input
                id="company_email"
                type="email"
                value={settings.company_email}
                onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                placeholder="contact@company.com"
                className="h-10 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus-visible:ring-primary focus-visible:ring-1"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;

