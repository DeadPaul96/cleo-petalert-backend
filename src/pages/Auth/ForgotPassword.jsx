import React from 'react';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import './Login.css'; // Reuse login styles for consistency

const ForgotPassword = ({ onBack }) => {
  return (
    <div className="auth-container animate-in">
      <button className="back-btn-auth" onClick={onBack}>
        <ArrowLeft size={24} />
      </button>

      <div className="auth-header" style={{ marginTop: '20px' }}>
        <div className="login-mascot-container animate-float">
          <img src="/cleo_sitting.png" alt="Cleo" className="login-mascot" />
        </div>
        <h1 style={{ fontSize: '24px' }}>¿Olvidaste tu contraseña?</h1>
        <p style={{ maxWidth: '80%', margin: '8px auto 0' }}>
          No te preocupes, introduce tu correo y te enviaremos las instrucciones.
        </p>
      </div>

      <div className="auth-form" style={{ marginTop: '30px' }}>
        <div className="auth-input-group">
          <label><Mail size={18} /> Correo electrónico</label>
          <input type="email" placeholder="tu@email.com" />
        </div>

        <button className="btn btn-primary btn-large" style={{ marginTop: '20px' }}>
          <Send size={20} /> Enviar instrucciones
        </button>
      </div>

      <div className="auth-footer" style={{ marginTop: 'auto' }}>
        <button onClick={onBack}>Volver al inicio de sesión</button>
      </div>

      <style>{`
        .back-btn-auth {
          background: none;
          border: none;
          color: var(--text-main);
          padding: 10px 0;
          display: flex;
          align-items: center;
          width: fit-content;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
