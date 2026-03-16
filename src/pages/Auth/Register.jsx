import React, { useState } from 'react';
import { User, Mail, Lock, Phone, CreditCard, Chrome, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from '../../firebase';
import { BASE_URL } from '../../api';
import './Register.css';

const Register = ({ onRegister, onBackToLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      
      if (!result.credential?.idToken) {
        throw new Error("No idToken received from native Google Register");
      }

      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      const userCredential = await signInWithCredential(auth, credential);
      
      const token = await userCredential.user.getIdToken();
      
      // 1. Get our internal Postgres User ID based on Firebase Token
      const userRes = await fetch(`${BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (userRes.ok) { onRegister(await userRes.json()); }
      else { alert("Error al registrar con el servidor."); }
    } catch (error) {
      console.error("Social Login Error", error);
      alert("Error al intentar registrarse.");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container animate-in compact-auth">
      <div className="register-content">
        <button className="back-btn-top" onClick={onBackToLogin}>
          <ArrowLeft size={24} />
        </button>

        <div className="auth-header-compact">
          <div className="register-mascot-wrapper-small">
            <img src="/cleo_sitting.png" alt="Cleo" className="register-mascot-small" />
          </div>
          <h1>Crea tu cuenta</h1>
          <p>Ayuda a las mascotas de tu zona.</p>
        </div>

        <div className="auth-form-dense">
          <div className="auth-input-group-dense">
            <label><User size={16} /> Nombre completo</label>
            <input type="text" placeholder="Ej. Juan Pérez" />
          </div>

          <div className="auth-input-group-dense">
            <label><CreditCard size={16} /> Identificación (Cédula/DNI)</label>
            <input type="text" placeholder="Número de identidad" />
          </div>

          <div className="auth-input-group-dense">
            <label><Mail size={16} /> Correo electrónico</label>
            <input type="email" placeholder="tu@email.com" />
          </div>

          <div className="auth-input-group-dense">
            <label><Phone size={16} /> Número de teléfono</label>
            <input type="tel" placeholder="Ej. +506 8888 8888" />
          </div>

          <div className="auth-input-group-dense">
            <label><Lock size={16} /> Contraseña</label>
            <div className="password-wrapper-dense">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
              />
              <button
                className="toggle-password-dense"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="auth-input-group-dense">
            <label><Lock size={16} /> Confirmar contraseña</label>
            <div className="password-wrapper-dense">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repite tu contraseña"
              />
              <button
                className="toggle-password-dense"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-large-dense" onClick={onRegister}>
            Registrarse
          </button>
        </div>

        <div className="auth-divider-dense">
          <span>O regístrate con</span>
        </div>

        <div className="social-auth-dense">
          <button className="social-btn-small google" onClick={() => handleSocialLogin(googleProvider)} disabled={loading}>
            {loading ? <Loader2 className="spinner" size={20} /> : <Chrome size={20} />}
          </button>
        </div>

        <div className="auth-footer-dense">
          ¿Ya tienes cuenta? <button onClick={onBackToLogin}>Inicia sesión</button>
        </div>
      </div>
      <style>{`
        .compact-auth { padding: 10px 20px; }
        .back-btn-top { background: none; border: none; color: var(--text-main); padding: 5px 0; margin-bottom: 10px; display: flex; align-items: center; }
        .auth-header-compact { margin-bottom: 20px; text-align: center; }
        .auth-header-compact h1 { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .auth-header-compact p { font-size: 14px; color: var(--text-muted); }
        .register-mascot-wrapper-small { width: 60px; height: 60px; margin: 0 auto 10px; background: var(--bg-offwhite); border-radius: 15px; padding: 8px; border: 1px solid var(--border-color); }
        .register-mascot-small { width: 100%; height: 100%; object-fit: contain; }

        .auth-form-dense { width: 100%; }
        .auth-input-group-dense { margin-bottom: 12px; }
        .auth-input-group-dense label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--text-main); margin-bottom: 6px; text-transform: uppercase; }
        .auth-input-group-dense input { padding: 12px; font-size: 15px; }

        .password-wrapper-dense { position: relative; }
        .toggle-password-dense { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); }

        .btn-large-dense { width: 100%; padding: 16px; font-size: 16px; margin-top: 10px; }
        .auth-divider-dense { display: flex; align-items: center; gap: 10px; margin: 15px 0; color: var(--text-muted); font-size: 12px; }
        .auth-divider-dense::before, .auth-divider-dense::after { content: ""; flex: 1; height: 1px; background: var(--border-color); }

        .social-auth-dense { display: flex; gap: 12px; justify-content: center; margin-bottom: 15px; }
        .social-btn-small { width: 48px; height: 48px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--card-bg); display: flex; align-items: center; justify-content: center; color: var(--text-main); }

        .auth-footer-dense { text-align: center; font-size: 14px; padding-bottom: 20px; }
        .auth-footer-dense button { background: none; border: none; color: var(--primary); font-weight: 700; }
      `}</style>
    </div>
  );
};

export default Register;
