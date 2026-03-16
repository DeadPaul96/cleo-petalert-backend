import React, { useState } from 'react';
import { Settings, LogOut, Heart, MapPin, PlusCircle, ChevronRight, Share2, ArrowLeft, User, ShieldCheck, Zap, Camera as CameraIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getAuth } from 'firebase/auth';
import { BASE_URL } from '../../api';
import './Profile.css';

const Profile = ({ 
  userData, 
  setUserData, 
  matches, 
  onUploadAdoption,
  onLogout 
}) => {
  const [subView, setSubView] = useState('main'); 
  const [loading, setLoading] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);

  // Guard: don't render if userData hasn't loaded yet
  if (!userData) return null;

  // Provide safe fallbacks for fields that may not exist on Firebase users
  const safeUser = {
    name: userData.name || userData.full_name || 'Usuario',
    email: userData.email || '',
    location: userData.location || 'Mi ubicación',
    phone: userData.phone || '',
    id: userData.id || '',
    badges: userData.badges || [],
    happyEndings: userData.happyEndings || 0,
    avatar: userData.avatar || userData.avatar_url || null,
  };

  const renderMainView = () => (
    <div className="profile-main animate-in">
      <div className="profile-header">
        <div className="profile-avatar-wrapper mascot-avatar" onClick={() => setShowAvatarOptions(true)}>
          {safeUser.avatar 
            ? <img src={safeUser.avatar} alt="Avatar" className="profile-avatar" style={{borderRadius:'50%',objectFit:'cover'}} />
            : <img src="/cleo_standing.png" alt="Cleo Mascot" className="profile-avatar" />
          }
          <div className="avatar-edit-badge"><CameraIcon size={14} /></div>
          <div className="online-status"></div>
        </div>
        <h3>{safeUser.name}</h3>
        <p>Fan de los Labradores • {safeUser.location.split(',')[0]}</p>
      </div>

      <div className="profile-stats">
        <div className="stat-item">
          <strong>{matches.length}</strong>
          <span>Matches</span>
        </div>
        <div className="stat-item highlight-stat">
          <Heart size={18} fill="var(--primary)" color="var(--primary)" />
          <strong>{safeUser.happyEndings}</strong>
          <span>Finales Felices</span>
        </div>
      </div>

      <div className="profile-actions">
        <h3>Administrar</h3>
        <button className="profile-btn highlight" onClick={onUploadAdoption}>
          <PlusCircle size={20} />
          <span>Subir mascota para adopción</span>
          <ChevronRight size={18} />
        </button>
        <button className="profile-btn" onClick={() => setSubView('matches')}>
          <Heart size={20} />
          <span>Mis Match de Adopción</span>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="profile-settings">
        <button className="profile-btn" onClick={() => setSubView('settings')}>
          <Settings size={20} />
          <span>Configuración de cuenta</span>
          <ChevronRight size={18} />
        </button>
        <button className="profile-btn logout" onClick={onLogout}>
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  const renderMatchesView = () => (
    <div className="profile-subview animate-in">
      <div className="subview-header">
        <button className="back-btn" onClick={() => setSubView('main')}><ArrowLeft /></button>
        <h3>Mis Matches</h3>
      </div>
      
      {matches.length === 0 ? (
        <div className="empty-subview">
          <img src="/cleo_sitting.png" alt="Cleo" className="empty-mascot" />
          <h4>Aún no tienes matches</h4>
          <p>Sigue buscando a tu nuevo mejor amigo en la sección de adopción.</p>
        </div>
      ) : (
        <div className="matches-list">
          {matches.map(pet => (
            <div key={pet.id} className="match-item">
              <img src={pet.image} alt={pet.name} />
              <div className="match-info">
                <h4>{pet.name}</h4>
                <p>{pet.breed}</p>
              </div>
              <button className="btn btn-primary btn-sm">Chatear</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettingsView = () => (
    <div className="profile-subview animate-in">
      <div className="subview-header">
        <button className="back-btn" onClick={() => setSubView('main')}><ArrowLeft /></button>
        <h3>Configuración</h3>
      </div>

      <div className="settings-form">
        <div className="legal-notice">
          <ShieldCheck size={20} />
          <p>La información debe ser real para cumplir con las normativas locales de bienestar animal.</p>
        </div>

        <div className="input-group">
          <label>Nombre Completo</label>
          <input 
            type="text" 
            value={safeUser.name} 
            onChange={(e) => setUserData({...userData, name: e.target.value})}
          />
        </div>

        <div className="input-group">
          <label>Identificación (Cédula/DNI)</label>
          <input 
            type="text" 
            value={safeUser.id} 
            onChange={(e) => setUserData({...userData, id: e.target.value})}
          />
        </div>

        <div className="input-group">
          <label>Teléfono de Contacto</label>
          <input 
            type="text" 
            value={safeUser.phone} 
            onChange={(e) => setUserData({...userData, phone: e.target.value})}
          />
        </div>

        <div className="input-group">
          <label>Ubicación General</label>
          <input 
            type="text" 
            value={safeUser.location} 
            onChange={(e) => setUserData({...userData, location: e.target.value})}
          />
        </div>

        <button className="btn btn-primary btn-full turq-btn-solid" onClick={handleSaveChanges} disabled={loading}>
          {loading ? <Loader2 className="spinner" size={20} /> : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );

  const handleAvatarAction = async (source) => {
    setShowAvatarOptions(false);
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: source
      });
      
      // Upload immediately
      setLoading(true);
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      
      const blob = await fetch(image.webPath).then(r => r.blob());
      const imageFormData = new FormData();
      imageFormData.append('file', blob, 'avatar.jpg');

      const uploadRes = await fetch(`${BASE_URL}/api/images/upload?folder=avatars`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: imageFormData
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        // Update user profile in backend
        await fetch(`${BASE_URL}/api/users/profile`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ avatar_url: uploadData.url })
        });
        
        setUserData({ ...userData, avatar: uploadData.url });
      }
    } catch (error) {
      console.error('Error al cambiar avatar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken();
      
      const res = await fetch(`${BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          full_name: safeUser.name,
          id_number: safeUser.id,
          phone: safeUser.phone,
          location: safeUser.location
        })
      });

      if (res.ok) {
        setSubView('main');
      } else {
        alert("Error al guardar los cambios.");
      }
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      {subView === 'main' && renderMainView()}
      {subView === 'matches' && renderMatchesView()}
      {subView === 'settings' && renderSettingsView()}

      {showAvatarOptions && (
        <div className="action-sheet-overlay" onClick={() => setShowAvatarOptions(false)}>
          <div className="action-sheet animate-up" onClick={e => e.stopPropagation()}>
            <div className="action-sheet-header">
              <div className="handle"></div>
              <p>Cambiar Foto de Perfil</p>
            </div>
            <button className="action-btn-turq" onClick={() => handleAvatarAction(CameraSource.Photos)}>
              <ImageIcon size={22} /> Galería
            </button>
            <button className="action-btn-turq" onClick={() => handleAvatarAction(CameraSource.Camera)}>
              <CameraIcon size={22} /> Cámara
            </button>
            <button className="action-btn-turq cancel" onClick={() => setShowAvatarOptions(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
