import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X, Check } from 'lucide-react';
import './PetCard.css';

const PetCard = ({ pet, onSwipe, onDetails, isDraggable = true }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);

  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-150, -50], [1, 0]);
  const likeScale = useTransform(x, [50, 150], [0.5, 1.2]);
  const nopeScale = useTransform(x, [-150, -50], [1.2, 0.5]);

  return (
    <motion.div
      className="pet-swipe-card turq-glow"
      drag={isDraggable ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate, zIndex: isDraggable ? 10 : 1 }}
      onDragEnd={(e, info) => {
        if (info.offset.x > 100) onSwipe('right');
        else if (info.offset.x < -100) onSwipe('left');
      }}
      exit={{ x: x.get() > 0 ? 1000 : -1000, opacity: 0, transition: { duration: 0.3 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onDetails(pet)}
    >
      <motion.div className="swipe-indicator match" style={{ opacity: likeOpacity, scale: likeScale }}>
        <Check size={50} strokeWidth={4} />
      </motion.div>
      <motion.div className="swipe-indicator reject" style={{ opacity: nopeOpacity, scale: nopeScale }}>
        <X size={50} strokeWidth={4} />
      </motion.div>

      <div className="card-image-container">
        <img src={pet.image} alt={pet.name} className="card-pet-img" />
        <div className="card-gradient"></div>
        <div className="card-info-overlay">
          <div className="info-text">
            <h2 className="pet-name-main">{pet.name}, <span className="pet-age-main">{pet.age}</span></h2>
            <p className="pet-breed-main">{pet.breed}</p>
          </div>
        </div>
      </div>
      
      <div className="card-footer-actions">
        <button className="swipe-action-btn skip" onClick={(e) => { e.stopPropagation(); onSwipe('left'); }}>
          <X size={28} />
        </button>
        <button className="swipe-action-btn heart" onClick={(e) => { e.stopPropagation(); onSwipe('right'); }}>
          <Heart size={28} fill="currentColor" />
        </button>
      </div>

      <style>{`
        .pet-swipe-card {
          width: 100%;
          height: 100%;
          border-radius: 32px;
          background: var(--card-bg);
          overflow: hidden;
          position: absolute;
          top: 0; /* FIXED: Ensure absolute alignment */
          left: 0; /* FIXED: Ensure absolute alignment */
          border: 1px solid var(--border-color);
          touch-action: none;
          cursor: pointer;
        }
        .turq-glow { box-shadow: 0 15px 35px rgba(48, 213, 200, 0.2) !important; }

        .card-image-container { width: 100%; height: 100%; position: relative; }
        .card-pet-img { width: 100%; height: 100%; object-fit: cover; }
        .card-gradient { position: absolute; bottom: 0; left: 0; right: 0; height: 60%; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%); }

        .card-info-overlay { position: absolute; bottom: 100px; left: 24px; right: 24px; color: white; text-align: left; }
        .pet-name-main { font-size: 28px; font-weight: 900; margin: 0; text-shadow: 0 2px 10px rgba(0,0,0,0.5); text-align: left; }
        .pet-age-main { font-weight: 400; font-size: 22px; }
        .pet-breed-main { font-size: 15px; font-weight: 600; opacity: 0.9; margin-top: 4px; text-align: left; }

        .card-footer-actions { position: absolute; bottom: 24px; width: 100%; display: flex; justify-content: center; gap: 30px; }
        .swipe-action-btn { width: 64px; height: 64px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0,0,0,0.3); transition: transform 0.1s; }
        .swipe-action-btn:active { transform: scale(0.9); }
        .swipe-action-btn.skip { background: #fff; color: #ff4757; }
        .swipe-action-btn.heart { background: var(--primary); color: #000; }

        .swipe-indicator { position: absolute; top: 40px; padding: 12px; border-radius: 50%; border: 4px solid; z-index: 20; background: rgba(255,255,255,0.1); backdrop-filter: blur(5px); }
        .swipe-indicator.match { left: 30px; color: var(--primary); border-color: var(--primary); transform: rotate(-15deg); }
        .swipe-indicator.reject { right: 30px; color: #ff4757; border-color: #ff4757; transform: rotate(15deg); }
      `}</style>
    </motion.div>
  );
};

export default PetCard;
