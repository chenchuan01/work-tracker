import { useState, useCallback } from 'react';
import { ToastType } from '../components/Toast';

interface ToastState {
  message: string;
  type: ToastType;
  show: boolean;
}

interface ConfirmState {
  message: string;
  title?: string;
  type?: 'danger' | 'warning' | 'info';
  show: boolean;
  onConfirm?: () => void;
}

export const useDialog = () => {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    show: false,
  });

  const [confirm, setConfirm] = useState<ConfirmState>({
    message: '',
    show: false,
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, show: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void,
    options?: {
      title?: string;
      type?: 'danger' | 'warning' | 'info';
    }
  ) => {
    return new Promise<boolean>((resolve) => {
      setConfirm({
        message,
        title: options?.title,
        type: options?.type,
        show: true,
        onConfirm: () => {
          onConfirm();
          setConfirm(prev => ({ ...prev, show: false }));
          resolve(true);
        },
      });
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirm(prev => ({ ...prev, show: false }));
  }, []);

  return {
    toast,
    confirm,
    showToast,
    hideToast,
    showConfirm,
    hideConfirm,
  };
};
