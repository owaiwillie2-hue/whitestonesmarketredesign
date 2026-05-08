import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  Camera, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileCheck, 
  Shield,
  AlertCircle,
  Info,
  Check,
  X
} from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

// Document types based on country
const getDocumentTypesForCountry = (country: string) => {
  const countrySpecificDocs: Record<string, Array<{ value: string; label: string }>> = {
    'US': [
      { value: 'passport', label: 'Passport' },
      { value: 'drivers_license', label: "Driver's License" },
      { value: 'state_id', label: 'State ID Card' },
      { value: 'ssn_card', label: 'Social Security Card' }
    ],
    'UK': [
      { value: 'passport', label: 'Passport' },
      { value: 'drivers_license', label: "Driver's License" },
      { value: 'national_id', label: 'National ID Card' },
      { value: 'residence_permit', label: 'Residence Permit' }
    ],
    'CA': [
      { value: 'passport', label: 'Passport' },
      { value: 'drivers_license', label: "Driver's License" },
      { value: 'citizenship_card', label: 'Citizenship Card' },
      { value: 'health_card', label: 'Health Card' }
    ],
    'IN': [
      { value: 'passport', label: 'Passport' },
      { value: 'aadhar_card', label: 'Aadhar Card' },
      { value: 'pan_card', label: 'PAN Card' },
      { value: 'voters_id', label: "Voter's ID" }
    ],
    'NG': [
      { value: 'passport', label: 'Passport' },
      { value: 'national_id', label: 'National ID Card' },
      { value: 'voters_card', label: "Voter's Card" },
      { value: 'nin_slip', label: 'NIN Slip' }
    ],
    'ZA': [
      { value: 'passport', label: 'Passport' },
      { value: 'smart_id_card', label: 'Smart ID Card' },
      { value: 'drivers_license', label: "Driver's License" }
    ],
    'AU': [
      { value: 'passport', label: 'Passport' },
      { value: 'drivers_license', label: "Driver's License" },
      { value: 'proof_of_age_card', label: 'Proof of Age Card' }
    ],
    'DE': [
      { value: 'passport', label: 'Passport' },
      { value: 'personalausweis', label: 'Personalausweis' },
      { value: 'drivers_license', label: "Driver's License" }
    ],
    'FR': [
      { value: 'passport', label: 'Passport' },
      { value: 'carte_identite', label: "Carte d'Identité" },
      { value: 'drivers_license', label: "Driver's License" }
    ]
  };
  
  return countrySpecificDocs[country] || [
    { value: 'passport', label: 'Passport' },
    { value: 'national_id', label: 'National ID Card' },
    { value: 'drivers_license', label: "Driver's License" }
  ];
};

const KYC = () => {
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [documentType, setDocumentType] = useState<string>('');
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [cameraMode, setCameraMode] = useState<'front' | 'back' | 'selfie' | null>(null);
  const [userCountry, setUserCountry] = useState<string>('');
  const [availableDocTypes, setAvailableDocTypes] = useState<Array<{ value: string; label: string }>>([]);
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchKYCStatus();
    fetchUserCountry();
    return () => {
      stopCamera();
    };
  }, []);

  const fetchUserCountry = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('country')
      .eq('user_id', user.id)
      .single();

    if (profile?.country) {
      setUserCountry(profile.country);
      setAvailableDocTypes(getDocumentTypesForCountry(profile.country));
    } else {
      setAvailableDocTypes(getDocumentTypesForCountry(''));
    }
  };

  const fetchKYCStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setKycStatus(data);
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return { valid: false, error: 'Please upload a JPG, PNG, WebP, or PDF file' };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }
    return { valid: true };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      toast({
        title: 'Invalid File',
        description: validation.error,
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      if (type === 'front') {
        setIdFrontFile(file);
        setIdFrontPreview(preview);
      } else if (type === 'back') {
        setIdBackFile(file);
        setIdBackPreview(preview);
      } else {
        setSelfieFile(file);
        setSelfiePreview(preview);
      }
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async (type: 'front' | 'back' | 'selfie') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: type === 'selfie' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraMode(type);
    } catch (error) {
      toast({
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings',
        variant: 'destructive'
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraMode(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !cameraMode) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `${cameraMode}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const preview = canvas.toDataURL('image/jpeg');

      if (cameraMode === 'front') {
        setIdFrontFile(file);
        setIdFrontPreview(preview);
      } else if (cameraMode === 'back') {
        setIdBackFile(file);
        setIdBackPreview(preview);
      } else {
        setSelfieFile(file);
        setSelfiePreview(preview);
      }

      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentType) {
      toast({
        title: 'Document Type Required',
        description: 'Please select your document type',
        variant: 'destructive'
      });
      return;
    }

    if (!idFrontFile || !idBackFile || !selfieFile) {
      toast({
        title: 'Missing Documents',
        description: 'Please upload all required documents',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload ID front
      const frontExt = idFrontFile.name.split('.').pop();
      const frontFileName = `${user.id}/id-front-${Date.now()}.${frontExt}`;
      const { error: frontError } = await supabase.storage
        .from('kyc-documents')
        .upload(frontFileName, idFrontFile);
      if (frontError) throw frontError;

      // Upload ID back
      const backExt = idBackFile.name.split('.').pop();
      const backFileName = `${user.id}/id-back-${Date.now()}.${backExt}`;
      const { error: backError } = await supabase.storage
        .from('kyc-documents')
        .upload(backFileName, idBackFile);
      if (backError) throw backError;

      // Upload selfie
      const selfieExt = selfieFile.name.split('.').pop();
      const selfieFileName = `${user.id}/selfie-${Date.now()}.${selfieExt}`;
      const { error: selfieError } = await supabase.storage
        .from('kyc-documents')
        .upload(selfieFileName, selfieFile);
      if (selfieError) throw selfieError;

      // Combine all document URLs into one field as required by schema
      const documentUrl = JSON.stringify({
        id_front: frontFileName,
        id_back: backFileName,
        selfie: selfieFileName
      });

      // Save to database
      const { error } = await supabase.from('kyc_documents').insert({
        user_id: user.id,
        document_type: documentType,
        document_url: documentUrl,
        status: 'pending'
      });

      if (error) throw error;

      toast({
        title: 'KYC Documents Submitted',
        description: 'Your documents are under review. You will be notified once verified.',
      });

      fetchKYCStatus();
      setCurrentStep(1);
      setDocumentType('');
      setIdFrontFile(null);
      setIdFrontPreview(null);
      setIdBackFile(null);
      setIdBackPreview(null);
      setSelfieFile(null);
      setSelfiePreview(null);
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: any = {
      pending: { 
        icon: 'pending', 
        label: 'Verification Pending', 
        className: 'bg-surface-container-highest text-secondary' 
      },
      under_review: { 
        icon: 'hourglass_top', 
        label: 'Under Review', 
        className: 'bg-blue-100 text-blue-600' 
      },
      approved: { 
        icon: 'check_circle', 
        label: 'Verified', 
        className: 'bg-green-100 text-green-600' 
      },
      rejected: { 
        icon: 'error', 
        label: 'Rejected', 
        className: 'bg-red-100 text-red-600' 
      }
    };
    const config = configs[status] || configs.pending;
    return (
      <div className="mb-8 glass-card border border-outline-variant p-4 rounded-xl flex items-center gap-4 bg-white/70">
        <div className={`w-12 h-12 rounded-full ${config.className} flex items-center justify-center`}>
          <span className="material-symbols-outlined">{config.icon}</span>
        </div>
        <div>
          <span className="font-label-md text-label-md text-secondary block">STATUS</span>
          <span className="font-headline-md text-body-md font-bold text-on-surface">{config.label}</span>
        </div>
      </div>
    );
  };

  const getProgressPercentage = () => {
    let progress = 0;
    if (documentType) progress += 25;
    if (idFrontFile) progress += 25;
    if (idBackFile) progress += 25;
    if (selfieFile) progress += 25;
    return progress;
  };

  const UploadSection = ({ 
    label, 
    type, 
    file, 
    preview, 
    onChange,
    helpText,
    requirements
  }: { 
    label: string; 
    type: 'front' | 'back' | 'selfie'; 
    file: File | null; 
    preview: string | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    helpText: string;
    requirements: string[];
  }) => (
    <div className="space-y-3">
      <label className="font-label-md text-label-md text-on-surface flex justify-between items-center">
        <span>{label}</span>
        <span className="text-xs text-on-surface-variant">{file ? 'Uploaded' : 'Required'}</span>
      </label>
      
      {preview ? (
        <div className="relative aspect-[1.6/1] w-full rounded-xl overflow-hidden border-2 border-green-500 shadow-sm group">
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-md">
            <span className="material-symbols-outlined text-[20px]">check</span>
          </div>
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              className="bg-white text-error px-4 py-2 rounded-full font-label-md flex items-center gap-2 active:scale-95 transition-all"
              onClick={() => {
                if (type === 'front') {
                  setIdFrontFile(null);
                  setIdFrontPreview(null);
                } else if (type === 'back') {
                  setIdBackFile(null);
                  setIdBackPreview(null);
                } else {
                  setSelfieFile(null);
                  setSelfiePreview(null);
                }
              }}
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Remove
            </button>
          </div>
        </div>
      ) : type === 'selfie' ? (
        <div className="p-6 bg-secondary-container rounded-xl flex items-center justify-between border border-secondary/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-white bg-surface shadow-sm overflow-hidden flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-3xl">face</span>
            </div>
            <div className="max-w-[180px]">
              <h3 className="font-label-md font-bold text-on-secondary-container">Take a Selfie</h3>
              <p className="text-xs text-on-secondary-container/80">{helpText}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              type="button"
              onClick={() => startCamera(type)}
              className="w-10 h-10 bg-white text-secondary rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined">camera_alt</span>
            </button>
            <button 
              type="button"
              onClick={() => document.getElementById(`${type}-upload`)?.click()}
              className="w-10 h-10 bg-white/50 text-secondary rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">upload</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative aspect-[1.6/1] w-full rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low flex flex-col items-center justify-center group overflow-hidden active:scale-[0.98] transition-all">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">
            {type === 'front' ? 'add_a_photo' : 'contact_page'}
          </span>
          <p className="font-label-md text-on-surface-variant mb-4">Tap to capture or upload</p>
          <div className="flex gap-2 z-10 relative">
            <button
              type="button"
              className="px-4 py-2 bg-white rounded-full shadow-sm font-label-md text-sm border border-slate-200 flex items-center gap-2"
              onClick={() => startCamera(type)}
            >
              <span className="material-symbols-outlined text-[18px]">camera</span> Camera
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-white rounded-full shadow-sm font-label-md text-sm border border-slate-200 flex items-center gap-2"
              onClick={() => document.getElementById(`${type}-upload`)?.click()}
            >
              <span className="material-symbols-outlined text-[18px]">upload</span> Upload
            </button>
          </div>
        </div>
      )}
      <input
        id={`${type}-upload`}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />
    </div>
  );



  if (cameraMode) {
    return (
      <div className="space-y-6 max-w-md mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="font-headline-md text-headline-md text-on-surface">Capture Photo</h2>
            <p className="font-body-md text-on-surface-variant text-sm">Position your document clearly within the frame</p>
          </div>
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[3/4] sm:aspect-video flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-4 border-2 border-white/50 rounded-xl pointer-events-none" />
          </div>
          <div className="flex gap-4">
            <button onClick={capturePhoto} className="flex-1 py-4 bg-primary text-white font-label-md rounded-full active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">photo_camera</span> Capture
            </button>
            <button onClick={stopCamera} className="px-6 py-4 bg-surface-container-highest text-on-surface font-label-md rounded-full active:scale-95 transition-all">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto pb-24">
      {/* Title Section */}
      <section className="mb-2">
        <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">Verify Identity</h1>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          To comply with financial regulations and secure your account, please complete your identity verification.
        </p>
      </section>

      {/* Status Indicator */}
      {kycStatus && getStatusBadge(kycStatus.status)}

      {kycStatus?.rejection_reason && (
        <div className="bg-error-container/20 border border-error-container p-4 rounded-xl flex items-start gap-3">
          <span className="material-symbols-outlined text-error mt-0.5">error</span>
          <div>
            <p className="font-label-md text-error font-bold">Rejection Reason</p>
            <p className="text-sm text-on-surface-variant mt-1">{kycStatus.rejection_reason}</p>
          </div>
        </div>
      )}

      {(!kycStatus || kycStatus.status === 'rejected') && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="font-label-md text-label-md text-on-surface flex justify-between items-center">
              <span>Document Type</span>
            </label>
            <div className="relative">
              <select 
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-4 font-body-md focus:ring-2 focus:ring-secondary-container transition-all appearance-none"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="">Select document type</option>
                {availableDocTypes.map((docType) => (
                  <option key={docType.value} value={docType.value}>{docType.label}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
            </div>
          </div>

          {documentType && (
            <div className="space-y-6">
              <UploadSection
                label="Identity Document (Front)"
                type="front"
                file={idFrontFile}
                preview={idFrontPreview}
                onChange={(e) => handleFileSelect(e, 'front')}
                helpText="Upload the front side"
                requirements={[]}
              />

              <UploadSection
                label="Identity Document (Back)"
                type="back"
                file={idBackFile}
                preview={idBackPreview}
                onChange={(e) => handleFileSelect(e, 'back')}
                helpText="Upload the back side"
                requirements={[]}
              />

              <UploadSection
                label="Live Facial Scan (Selfie)"
                type="selfie"
                file={selfieFile}
                preview={selfiePreview}
                onChange={(e) => handleFileSelect(e, 'selfie')}
                helpText="Take a selfie holding your ID"
                requirements={[]}
              />

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={loading || !idFrontFile || !idBackFile || !selfieFile}
                  className="w-full h-14 bg-primary text-white font-headline-md rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <><span className="material-symbols-outlined animate-spin">progress_activity</span> Submitting...</>
                  ) : (
                    <>Submit Documents <span className="material-symbols-outlined">arrow_forward</span></>
                  )}
                </button>
                <p className="text-center font-label-md text-xs text-outline leading-tight mt-4">
                  Your data is encrypted and processed according to our Privacy Policy.
                </p>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default KYC;
