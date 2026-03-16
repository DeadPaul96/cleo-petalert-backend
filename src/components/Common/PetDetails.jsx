import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Phone, MessageSquare, Share2, Heart } from 'lucide-react';

const PetDetails = ({ pet, onClose, onAction }) => {
  if (!pet) return null;

  const isLost = pet.type === 'lost';
  const isFound = pet.type === 'found';
  const isAdoption = !pet.type;

  return (
    <motion.div 
      className="details-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div 
        className="details-modal"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.1}
        onDragEnd={(e, info) => {
          if (info.offset.y > 100 || info.velocity.y > 300) onClose();
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="details-handle-container">
          <div className="details-handle"></div>
        </div>
        
        <div className="details-content">
          <div className="details-image-container">
            <img src={pet.image} alt={pet.name} className="details-image" />
            {(isLost || isFound) && (
              <div className={`details-badge ${isLost ? 'bg-lost' : 'bg-found'}`}>
                {isLost ? 'PERDIDO' : 'ENCONTRADO'}
              </div>
            )}
          </div>

          <div className="details-info">
            <div className="details-header">
              <div className="details-title-group">
                <h2 className="details-name">{pet.name}</h2>
                <p className="details-breed">{pet.breed} • {pet.age || 'Edad desconocida'}</p>
              </div>
              <button className="details-share-btn">
                <Share2 size={20} />
              </button>
            </div>

            <div className="details-section">
              <h3>Descripción</h3>
              <p>{pet.description}</p>
            </div>

            <div className="details-meta-list">
              <div className="details-meta-item">
                <div className="meta-icon-wrapper">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4>Ubicación</h4>
                  <p>{pet.location} • A {pet.distance || '0.5'}km de ti</p>
                </div>
              </div>

              {pet.time && (
                <div className="details-meta-item">
                  <div className="meta-icon-wrapper">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4>Visto por última vez</h4>
                    <p>Hace {pet.time}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="details-owner-card">
              <div className="owner-avatar-wrapper">
                <img src={`https://i.pravatar.cc/150?u=${pet.id}`} alt="Owner" className="owner-avatar" />
              </div>
              <div className="owner-info">
                <h4>Publicado por Carlos</h4>
                <p>Usuario verificado ✅</p>
              </div>
              <div className="owner-contact-btns">
                <button className="contact-icon-btn"><Phone size={18} /></button>
                <button className="contact-icon-btn"><MessageSquare size={18} /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="details-footer">
          {isAdoption ? (
            <button className="btn btn-primary btn-full turq-btn-solid" onClick={() => onAction('match')}>
              <Heart size={20} fill="currentColor" /> ¡Quiero Adoptar!
            </button>
          ) : (
            <button className="btn btn-primary btn-full turq-btn-solid" onClick={() => onAction('contact')}>
              <MessageSquare size={20} /> Brindar Información
            </button>
          )}
        </div>
      </motion.div>

      <style>{`
        .details-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.85); z-index: 2000; display: flex; align-items: flex-end; backdrop-filter: blur(8px); }
        .details-modal { width: 100%; height: 94vh; background: var(--bg-white); border-radius: 32px 32px 0 0; position: relative; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 -10px 40px rgba(0,0,0,0.5); }
        .details-handle-container { width: 100%; padding: 12px 0; display: flex; justify-content: center; flex-shrink: 0; }
        .details-handle { width: 45px; height: 5px; background: var(--border-color); border-radius: 10px; opacity: 0.6; }
        .details-content { flex: 1; overflow-y: auto; padding-bottom: 120px; }
        .details-image-container { position: relative; width: 100%; height: 380px; }
        .details-image { width: 100%; height: 100%; object-fit: cover; }
        .details-badge { position: absolute; top: 20px; left: 20px; padding: 8px 16px; border-radius: 12px; color: white; font-weight: 900; font-size: 12px; letter-spacing: 1px; }
        .bg-lost { background: var(--danger); }
        .bg-found { background: var(--warning); }
        .details-info { padding: 24px; }
        .details-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .details-title-group { text-align: left; }
        .details-name { font-size: 32px; font-weight: 900; color: var(--text-main); margin: 0; text-align: left; }
        .details-breed { font-size: 16px; color: var(--text-muted); margin-top: 4px; font-weight: 600; text-align: left; }
        .details-share-btn { background: var(--card-bg); border: 1px solid var(--border-color); width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-main); }
        .details-section { margin-bottom: 24px; }
        .details-section h3 { font-size: 18px; font-weight: 800; margin-bottom: 10px; color: var(--text-main); text-align: left; }
        .details-section p { color: var(--text-muted); line-height: 1.6; text-align: left; font-size: 15px; }
        .details-meta-list { display: flex; flex-direction: column; gap: 20px; margin-bottom: 32px; }
        .details-meta-item { display: flex; gap: 16px; align-items: center; }
        .meta-icon-wrapper { width: 52px; height: 52px; background: rgba(48, 213, 200, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary); }
        .details-meta-item h4 { font-size: 15px; font-weight: 800; color: var(--text-main); margin: 0; text-align: left; }
        .details-meta-item p { font-size: 14px; color: var(--text-muted); margin: 2px 0 0; text-align: left; font-weight: 500; }
        .details-owner-card { background: var(--card-bg); padding: 16px; border-radius: 20px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .owner-avatar-wrapper { width: 56px; height: 56px; border-radius: 12px; overflow: hidden; }
        .owner-avatar { width: 100%; height: 100%; object-fit: cover; }
        .owner-info { flex: 1; text-align: left; }
        .owner-info h4 { font-size: 16px; font-weight: 800; color: var(--text-main); margin: 0; text-align: left; }
        .owner-info p { font-size: 13px; color: var(--text-muted); font-weight: 600; margin: 2px 0 0; text-align: left; }
        .owner-contact-btns { display: flex; gap: 8px; }
        .contact-icon-btn { width: 40px; height: 40px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-offwhite); display: flex; align-items: center; justify-content: center; color: var(--text-main); }
        .details-footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 20px 20px 40px; background: var(--bg-white); border-top: 1px solid var(--border-color); z-index: 10; }
        .btn-full { width: 100%; padding: 18px; font-size: 16px; font-weight: 900; letter-spacing: 0.5px; border-radius: 12px; }
        .turq-btn-solid { background: var(--primary) !important; color: #000 !important; }
      `}</style>
    </motion.div>
  );
};

export default PetDetails;
