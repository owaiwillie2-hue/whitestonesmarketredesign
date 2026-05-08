import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type ModalType = 'success' | 'error' | 'confirm' | 'loading' | null;

interface ModalOptions {
  title?: string;
  message?: string;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextType {
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, options?: { confirmText?: string, cancelText?: string }) => void;
  showLoading: (message?: string) => void;
  hide: () => void;
}

export let globalModal: ModalContextType | null = null;

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [options, setOptions] = useState<ModalOptions>({});

  const hide = () => {
    setIsOpen(false);
    setTimeout(() => {
      setModalType(null);
      setOptions({});
    }, 300);
  };

  const showSuccess = (title: string, message?: string) => {
    setModalType('success');
    setOptions({ title, message });
    setIsOpen(true);
  };

  const showError = (title: string, message?: string) => {
    setModalType('error');
    setOptions({ title, message });
    setIsOpen(true);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, customOpts?: { confirmText?: string, cancelText?: string }) => {
    setModalType('confirm');
    setOptions({ title, message, onConfirm, ...customOpts });
    setIsOpen(true);
  };

  const showLoading = (message?: string) => {
    setModalType('loading');
    setOptions({ message });
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (options.onConfirm) {
      options.onConfirm();
    }
    hide();
  };

  const contextValue = { showSuccess, showError, showConfirm, showLoading, hide };
  globalModal = contextValue;

  return (
    <ModalContext.Provider value={contextValue}>
      {children}

      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open && modalType !== 'loading') hide();
      }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none" hideCloseButton>
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            {modalType === 'loading' && (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 border-t-primary rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Processing</h3>
                <p className="text-slate-500 dark:text-slate-400">{options.message || 'Please wait...'}</p>
              </div>
            )}

            {modalType === 'success' && (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{options.title}</h3>
                {options.message && <p className="text-slate-500 dark:text-slate-400 mb-8">{options.message}</p>}
                <button onClick={hide} className="w-full py-4 bg-primary text-white rounded-2xl font-bold active:scale-[0.98] transition-transform">
                  Continue
                </button>
              </div>
            )}

            {modalType === 'error' && (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-error rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{options.title}</h3>
                {options.message && <p className="text-slate-500 dark:text-slate-400 mb-8">{options.message}</p>}
                <button onClick={hide} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Close
                </button>
              </div>
            )}

            {modalType === 'confirm' && (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{options.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8">{options.message}</p>
                <div className="flex w-full gap-3">
                  <button onClick={hide} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    {options.cancelText || 'Cancel'}
                  </button>
                  <button onClick={handleConfirm} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold active:scale-[0.98] transition-transform shadow-lg shadow-primary/20">
                    {options.confirmText || 'Confirm'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within ModalProvider');
  return context;
};
