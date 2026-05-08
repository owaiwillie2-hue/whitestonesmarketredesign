import { toast as sonnerToast } from 'sonner';
import { globalModal } from '@/contexts/ModalContext';

// Custom wrapper around sonner toast that delegates success and error to our new ModalContext
export const toast = {
  ...sonnerToast,
  success: (msg: string | React.ReactNode, data?: any) => {
    if (globalModal && typeof msg === 'string') {
      globalModal.showSuccess('Success', msg);
      return '';
    }
    return sonnerToast.success(msg, data);
  },
  error: (msg: string | React.ReactNode, data?: any) => {
    if (globalModal && typeof msg === 'string') {
      globalModal.showError('Error', msg);
      return '';
    }
    return sonnerToast.error(msg, data);
  },
  // Keep info exactly as is, so small notifications (like real-time alerts) stay as popups
  info: (msg: string | React.ReactNode, data?: any) => {
    return sonnerToast.info(msg, data);
  },
  loading: (msg: string | React.ReactNode, data?: any) => {
    if (globalModal && typeof msg === 'string') {
      globalModal.showLoading(msg);
      return 'loading';
    }
    return sonnerToast.loading(msg, data);
  },
  dismiss: (id?: string | number) => {
    if (globalModal && id === 'loading') {
      globalModal.hide();
    }
    return sonnerToast.dismiss(id);
  }
};
