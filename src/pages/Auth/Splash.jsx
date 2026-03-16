import React, { useState, useEffect } from 'react';
import './Splash.css';

const Splash = ({ onComplete }) => {
  const [animationClass, setAnimationClass] = useState('fade-in');

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationClass('fade-out');
      setTimeout(onComplete, 1000); // 1s after fade out starts
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`splash-container ${animationClass}`}>
      <div className="splash-content">
        <div className="logo-icon-wrapper animate-float">
          <img src="/cleo_icon.png" alt="Cleo PetAlert" className="splash-mascot" />
        </div>
        <h1 className="splash-title">Cleo</h1>
        <p className="splash-tagline">PetAlert</p>
      </div>
      <div className="splash-footer">
        <div className="loader-bar">
          <div className="loader-progress"></div>
        </div>
      </div>
    </div>
  );
};

export default Splash;
