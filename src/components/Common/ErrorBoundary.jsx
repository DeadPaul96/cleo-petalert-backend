import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-content animate-in">
            <div className="error-icon">
              <AlertTriangle size={60} color="var(--danger)" />
            </div>
            <h1>¡Ups! Algo salió mal</h1>
            <p>Hemos tenido un pequeño problema técnico. No te preocupes, tus mascotas están a salvo.</p>
            
            <div className="error-actions">
              <button 
                className="btn btn-primary" 
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={20} /> Reintentar
              </button>
              <button 
                className="btn btn-outline" 
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/';
                }}
              >
                <Home size={20} /> Ir al Inicio
              </button>
            </div>
          </div>

          <style>{`
            .error-boundary-container {
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
              background: var(--bg-white); /* FIXED: Using theme variable */
              text-align: center;
            }
            .error-content h1 {
              font-size: 28px;
              font-weight: 800;
              margin: 20px 0 10px;
              color: var(--text-main);
            }
            .error-content p {
              color: var(--text-muted);
              font-size: 16px;
              line-height: 1.5;
              margin-bottom: 30px;
            }
            .error-icon {
              background: rgba(255, 71, 87, 0.1);
              width: 100px;
              height: 100px;
              border-radius: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto;
            }
            .error-actions {
              display: flex;
              flex-direction: column;
              gap: 12px;
              width: 100%;
              max-width: 300px;
            }
            .error-actions .btn {
              width: 100%;
              padding: 16px;
              font-weight: 700;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
