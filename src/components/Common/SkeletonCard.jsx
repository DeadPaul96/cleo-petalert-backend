import React from 'react';
import { motion } from 'framer-motion';

const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-badge"></div>
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-line-title"></div>
        <div className="skeleton-line-text"></div>
        <div className="skeleton-line-text short"></div>
        <div className="skeleton-footer">
          <div className="skeleton-btn"></div>
          <div className="skeleton-btn small"></div>
        </div>
      </div>
      <style>{`
        .skeleton-card {
          background: var(--card-bg);
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid var(--border-color);
          margin-bottom: 20px;
          position: relative;
        }
        .skeleton-badge { height: 30px; background: var(--bg-offwhite); width: 100%; }
        .skeleton-image { height: 200px; background: var(--bg-offwhite); width: 100%; }
        .skeleton-content { padding: 16px; }
        .skeleton-line-title { height: 24px; background: var(--bg-offwhite); width: 60%; margin-bottom: 12px; border-radius: 4px; }
        .skeleton-line-text { height: 16px; background: var(--bg-offwhite); width: 90%; margin-bottom: 8px; border-radius: 4px; }
        .skeleton-line-text.short { width: 40%; }
        .skeleton-footer { display: flex; gap: 10px; margin-top: 15px; }
        .skeleton-btn { height: 44px; background: var(--bg-offwhite); flex: 1; border-radius: 14px; }
        .skeleton-btn.small { flex: 0 0 50px; }

        .skeleton-badge, .skeleton-image, .skeleton-line-title, .skeleton-line-text, .skeleton-btn {
          background: linear-gradient(90deg, var(--bg-offwhite) 25%, var(--border-color) 50%, var(--bg-offwhite) 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default SkeletonCard;
