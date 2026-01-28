import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import './ToastProvider.css';

const ToastContext = createContext({ success: () => {}, error: () => {}, info: () => {}, warn: () => {} });

export const useToast = () => useContext(ToastContext);

let idCounter = 0;

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, timeout = 3000) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    if (timeout) {
      setTimeout(() => remove(id), timeout);
    }
  }, [remove]);

  const api = useMemo(() => ({
    success: (msg) => push('success', msg),
    error: (msg) => push('error', msg, 4000),
    info: (msg) => push('info', msg),
    warn: (msg) => push('warn', msg),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} role="status">
            <span>{t.message}</span>
            <button className="toast-close" onClick={() => remove(t.id)} aria-label="Close">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;


