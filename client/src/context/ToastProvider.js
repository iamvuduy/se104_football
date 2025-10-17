import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

// Single Toast Component
const Toast = ({ message, type, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            // Wait for animation to finish before removing the toast
            setTimeout(onClose, 400);
        }, 4000); // Auto-dismiss after 4 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    const SuccessIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
        </svg>
    );

    const ErrorIcon = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );

    return (
        <div className={`toast ${type} ${isExiting ? 'exiting' : ''}`}>
            <div className="toast-icon">
                {type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
            </div>
            <div className="toast-message">{message}</div>
        </div>
    );
};

// Toast Provider
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((type, message) => {
        const id = Date.now() + Math.random();
        setToasts(prevToasts => [...prevToasts, { id, type, message }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        type={toast.type}
                        message={toast.message}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
