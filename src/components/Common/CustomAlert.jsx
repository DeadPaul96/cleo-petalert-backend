import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const CustomAlert = ({ title, message, isOpen, onClose, type = 'success' }) => {
  if (!isOpen) return null;

  return (
    <div className="custom-alert-overlay" onClick={onClose}>
      <div className="custom-alert-card" onClick={e => e.stopPropagation()}>
        <div className="alert-icon-wrapper" style={{
          background: type === 'success' ? '#F0FFFE' : '#FFF5F5',
          color: type === 'success' ? 'var(--primary)' : 'var(--danger)'
        }}>
          {type === 'success' ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <button className="alert-btn" onClick={onClose}>Entendido</button>
      </div>
    </div>
  );
};

export default CustomAlert;
