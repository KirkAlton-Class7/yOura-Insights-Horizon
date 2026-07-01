import { useState } from 'react';
import Toast from '../components/Toast';
import { ToastContext } from './toast';

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ title: '', message: '', type: 'success', visible: false });

  const showToast = (content) => {
    if (typeof content === 'string') {
      setToast({ title: '', message: content, type: 'success', visible: true });
      return;
    }

    setToast({
      title: content.title || '',
      message: content.message || '',
      type: content.type || 'error',
      visible: true,
    });
  };

  const hideToast = () => {
    setToast(current => ({ ...current, visible: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        title={toast.title}
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
}
