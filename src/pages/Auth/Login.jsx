import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Chrome, Loader2 } from 'lucide-react';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from '../../firebase';
import { BASE_URL } from '../../api';
import './Login.css';

const Login = ({ onLogin, onSwitchToRegister, onForgotPassword }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // 1. Native Google Sign-In
      const result = await FirebaseAuthentication.signInWithGoogle({
        serverClientId: '1009293685870-0poqi9jvnii0mau2771skekfiu0plror.apps.googleusercontent.com'
      });
      
      if (!result.credential?.idToken) {
        throw new Error("No idToken received from native Google Login");
      }

      // 2. Sync with Firebase JS SDK
      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      const userCredential = await signInWithCredential(auth, credential);
      
      // 3. Get ID Token for Backend
      const token = await userCredential.user.getIdToken();
      
      // 4. Backend synchronization
      const response = await fetch(`${BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        onLogin(userData);
      } else {
        console.error("Backend auth failed", await response.text());
        alert("Error al conectar con el servidor.");
      }
    } catch (error) {
      console.error("Native Google Login Error", error);
      alert("Error al iniciar sesión con Google nativo.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="auth-container animate-in">
      <div className="auth-header">
        <div className="login-mascot-container animate-float">
          <img src="/cleo_sitting.png" alt="Cleo" className="login-mascot" />
        </div>
        <h1>¡Hola de nuevo!</h1>
        <p>Entra para ayudar a las mascotas de tu zona.</p>
      </div>

      <div className="auth-form">
        <div className="auth-input-group">
          <label><Mail size={18} /> Email</label>
          <input type="email" placeholder="tu@email.com" />
        </div>

        <div className="auth-input-group">
          <label><Lock size={18} /> Contraseña</label>
          <div className="password-wrapper">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
            />
            <button 
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button className="forgot-password" onClick={onForgotPassword}>
          ¿Olvidaste tu contraseña?
        </button>

        <button className="btn btn-primary btn-large" onClick={() => onLogin()} disabled={loading}>
          Iniciar Sesión
        </button>
      </div>

      <div className="auth-divider">
        <span>O continúa con</span>
      </div>

      <div className="social-auth">
        <button className="social-btn google" onClick={handleGoogleLogin} disabled={loading}>
          {loading ? <Loader2 className="spinner" size={24} /> : <Chrome size={24} />}
        </button>
      </div>

      <div className="auth-footer">
        ¿No tienes cuenta? <button onClick={onSwitchToRegister} disabled={loading}>Regístrate gratis</button>
      </div>
    </div>
  );
};

export default Login;

