import React, { useEffect } from "react";
import "./NotificationModal.css";

const NotificationModal = ({ show, type, message, onClose }) => {
  useEffect(() => {
    if (show) {
      // Auto close after 3 seconds for warning/info
      if (type === "warning" || type === "info") {
        const timer = setTimeout(() => {
          onClose();
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [show, type, onClose]);

  if (!show) {
    return null;
  }

  const SuccessIcon = () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );

  const ErrorIcon = () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );

  const WarningIcon = () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );

  const InfoIcon = () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );

  const getIcon = () => {
    switch (type) {
      case "success":
        return <SuccessIcon />;
      case "error":
        return <ErrorIcon />;
      case "warning":
        return <WarningIcon />;
      case "info":
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "success":
        return "Thành công!";
      case "error":
        return "Thất bại!";
      case "warning":
        return "Thông báo!";
      case "info":
        return "Thông tin!";
      default:
        return "Thông báo!";
    }
  };

  return (
    <div className={`modal-overlay ${show ? "visible" : ""}`}>
      <div className={`notification-modal ${type}`}>
        <div className="modal-icon">{getIcon()}</div>
        <div className="toast-content">
          <h2 className="modal-title">{getTitle()}</h2>
          <p className="modal-message">{message}</p>
        </div>
        <button className="modal-close-button" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default NotificationModal;
