
import React, { useEffect } from 'react';
import './NotificationModal.css';

const NotificationModal = ({ isOpen, type, message, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      // Add a short delay for the animation to be visible
      const timer = setTimeout(() => {
        // Automatically close after a few seconds
        // onClose(); 
      }, 3000); // Adjust time as needed

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

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

  const title = type === 'success' ? 'Thành công!' : 'Thất bại!';

  return (
    <div className={`modal-overlay ${isOpen ? 'visible' : ''}`} style={{ display: 'flex' }}>
      <div className={`notification-modal ${type}`}>
        <div className="modal-icon">
          {type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
        </div>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <button className="modal-ok-button" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

export default NotificationModal;
