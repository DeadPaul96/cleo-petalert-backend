import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Share2, AlertTriangle } from 'lucide-react';
import './AmberCard.css';

const AmberCard = ({ pet, onClick }) => {
  const isLost = pet.type === 'lost';
  
  return (
    <motion.div 
      className={`amber-card type-${pet.type}`}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="amber-badge">
        <AlertTriangle size={12} fill="currentColor" />
        <span>{isLost ? 'ALERTA: PERDIDA' : 'ENCONTRADA'}</span>
      </div>

      <div className="amber-image-wrapper">
        <img src={pet.image} alt={pet.name} className="amber-image" />
        <div className="amber-distance-pill">A {pet.distance}km</div>
      </div>

      <div className="amber-main-content">
        <div className="amber-header-row">
          <h3 className="amber-pet-name">{pet.name}</h3>
          <span className="amber-pet-breed">{pet.breed}</span>
        </div>

        <p className="amber-desc-text">{pet.description}</p>

        <div className="amber-info-grid">
          <div className="info-tag">
            <MapPin size={12} />
            <span>{pet.location}</span>
          </div>
          <div className="info-tag">
            <Clock size={12} />
            <span>{pet.time}</span>
          </div>
        </div>

        <div className="amber-footer-actions">
          <button className="amber-btn-main turq-btn">LO HE VISTO</button>
          <button className="amber-btn-icon" onClick={(e) => { e.stopPropagation(); }}>
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .amber-card {
          border-radius: 18px;
          overflow: hidden;
          background: var(--card-bg);
          border: 2.5px solid; /* Marco total */
          position: relative;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          margin-bottom: 12px;
          width: 100%;
        }

        .type-lost { border-color: var(--danger); }
        .type-found { border-color: var(--warning); }

        .amber-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.5px;
          color: white;
        }
        .type-lost .amber-badge { background: var(--danger); }
        .type-found .amber-badge { background: var(--warning); }

        .amber-image-wrapper { height: 160px; position: relative; } /* Más pequeña */
        .amber-image { width: 100%; height: 100%; object-fit: cover; }

        .amber-distance-pill {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
        }

        .amber-main-content { padding: 12px; }
        .amber-header-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .amber-pet-name { font-size: 18px; font-weight: 900; color: var(--text-main); margin: 0; text-align: left; }
        .amber-pet-breed { font-size: 12px; font-weight: 700; color: var(--primary); }

        .amber-desc-text { font-size: 13px; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px; text-align: left; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        .amber-info-grid { display: flex; gap: 12px; margin-bottom: 12px; }
        .info-tag { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted); font-weight: 600; }

        .amber-footer-actions { display: flex; gap: 8px; }
        .turq-btn {
          flex: 1;
          background: var(--primary) !important; /* Turquesa */
          color: #000 !important; /* Texto negro para contraste */
          border: none;
          padding: 12px;
          border-radius: 10px;
          font-weight: 900;
          font-size: 13px;
          letter-spacing: 0.5px;
          cursor: pointer;
        }
        .amber-btn-icon {
          width: 44px;
          background: var(--bg-offwhite);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-main);
          cursor: pointer;
        }
      `}</style>
    </motion.div>
  );
};

export default AmberCard;
