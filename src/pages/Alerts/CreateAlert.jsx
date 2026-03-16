import React, { useState, useEffect } from 'react';
import { Camera as CameraIcon, MapPin, Check, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { getAuth } from 'firebase/auth';
import { BASE_URL } from '../../api';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './CreateAlert.css';

// Fix for default marker icon
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ position, setPosition }) => {
  const map = useMap();
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    // Force map to fill container after modal animation and step change
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const MapRecenter = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom(), { duration: 1.5 });
    }
  }, [position, map]);
  return null;
};

const CreateAlert = ({ onCancel, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [formData, setFormData] = useState({
    name: '', breed: '', description: '', type: 'lost', image: null, location: null
  });

  const [mapCenter, setMapCenter] = useState([9.9281, -84.0907]);

  const handlePhotoAction = async (source) => {
    setShowPhotoOptions(false);
    try {
      const image = await Camera.getPhoto({
        quality: 90, allowEditing: false, resultType: CameraResultType.Uri, source: source
      });
      setFormData({ ...formData, image: image.webPath });
    } catch (error) { console.error('Error:', error); }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const newPos = { lat: coordinates.coords.latitude, lng: coordinates.coords.longitude };
      setFormData({ ...formData, location: newPos });
      setMapCenter([newPos.lat, newPos.lng]);
    } catch (error) { alert('Activa el GPS del celular'); }
    finally { setLoading(false); }
  };

  const submitAlert = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        alert("Debes iniciar sesión para reportar.");
        setLoading(false);
        return;
      }
      const token = await auth.currentUser.getIdToken();

      let imageUrl = null;
      if (formData.image) {
        // Upload image first
        const blob = await fetch(formData.image).then(r => r.blob());
        const imageFormData = new FormData();
        imageFormData.append('file', blob, 'alert.jpg');

        const uploadRes = await fetch(`${BASE_URL}/api/images/upload?folder=alerts`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: imageFormData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        } else {
          console.error("Upload failed");
        }
      }

      const payload = {
        type: formData.type,
        species: formData.name || 'Mascota', 
        breed: formData.breed || 'Desconocida',
        description: formData.description || 'Sin descripción',
        location: { lat: formData.location.lat, lng: formData.location.lng },
        has_image: !!imageUrl,
        image_url: imageUrl
      };

      const res = await fetch(`${BASE_URL}/api/alerts/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onSuccess();
      } else {
        console.error("Failed to submit", await res.text());
        alert("Hubo un error al publicar la alerta.");
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert("Error de red. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="create-alert-overlay">
      <div className="create-alert-modal">
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-mascot-wrapper">
              <img src="/cleo_sitting.png" alt="Cleo" className="modal-mascot" />
            </div>
            <div>
              <h2 className="turq-text">Reportar Mascota</h2>
              <div className="step-indicator">Paso {step} de 3</div>
            </div>
          </div>
          <button className="close-btn-panic" onClick={onCancel}><X size={24} /></button>
        </div>

        <div className="modal-body-panic">
          {step === 1 && (
            <div className="form-step animate-in">
              <h3 className="section-title">¿Qué sucedió?</h3>
              <div className="type-selector">
                <button className={`type-btn-panic ${formData.type === 'lost' ? 'active lost' : ''}`} onClick={() => setFormData({...formData, type: 'lost'})}>Perdí mi mascota</button>
                <button className={`type-btn-panic ${formData.type === 'found' ? 'active found' : ''}`} onClick={() => setFormData({...formData, type: 'found'})}>Encontré una mascota</button>
              </div>
              <div className="input-group-panic">
                <label>Nombre (si lo sabes)</label>
                <input type="text" placeholder="Ej. Toby" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="input-group-panic">
                <label>Raza / Descripción física</label>
                <input type="text" placeholder="Ej. Labrador Dorado" value={formData.breed} onChange={(e) => setFormData({...formData, breed: e.target.value})} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step animate-in">
              <h3 className="section-title">Fotos y Detalles</h3>
              <div className="photo-upload-container-panic" onClick={() => setShowPhotoOptions(true)}>
                {formData.image ? (
                  <div className="preview-image-wrapper">
                    <img src={formData.image} alt="Preview" className="preview-image" />
                    <div className="change-photo-overlay">Cambiar foto</div>
                  </div>
                ) : (
                  <div className="photo-upload-placeholder-panic">
                    <div className="icon-circle-panic"><CameraIcon size={32} /></div>
                    <span>Tomar o subir fotos</span>
                  </div>
                )}
              </div>
              <div className="input-group-panic">
                <label>Descripción adicional</label>
                <textarea placeholder="Detalles del collar, comportamiento..." rows="4" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step animate-in">
              <h3 className="section-title">Ubicación</h3>
              <p className="step-desc">Toca el mapa para marcar el punto exacto</p>
              <div className="map-container-fixed">
                <MapContainer center={mapCenter} zoom={15} className="leaflet-full">
                  <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />
                  <MapResizer />
                  <MapRecenter position={formData.location} />
                  <LocationMarker position={formData.location} setPosition={(pos) => setFormData({...formData, location: pos})} />
                </MapContainer>
                <button className="btn-gps-float" onClick={getCurrentLocation} disabled={loading}>
                  {loading ? <Loader2 className="spinner" size={20} /> : <MapPin size={20} />}
                  GPS
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer-panic">
          <div className="footer-main-actions">
            {step > 1 ? (
              <>
                <button className="btn btn-outline" onClick={() => setStep(step - 1)}>Atrás</button>
                <button className="btn btn-primary turq-btn-solid" onClick={step < 3 ? () => setStep(step + 1) : submitAlert} disabled={(step === 3 && !formData.location) || loading}>
                  {loading && step === 3 ? <Loader2 className="spinner" size={20} /> : (step < 3 ? 'Siguiente' : 'Publicar Alerta')}
                </button>
              </>
            ) : (
              <>
                <div className="flex-1"></div> {/* Spacer to push button to right */}
                <button className="btn btn-primary turq-btn-solid" onClick={() => setStep(step + 1)}>
                  Siguiente
                </button>
              </>
            )}
          </div>
        </div>

        {showPhotoOptions && (
          <div className="action-sheet-overlay" onClick={() => setShowPhotoOptions(false)}>
            <div className="action-sheet animate-up" onClick={e => e.stopPropagation()}>
              <div className="action-sheet-header"><div className="handle"></div><p>Añadir foto de la mascota</p></div>
              <button className="action-btn-rect" onClick={() => handlePhotoAction(CameraSource.Photos)}><ImageIcon size={22} /> Galería</button>
              <button className="action-btn-rect" onClick={() => handlePhotoAction(CameraSource.Camera)}><CameraIcon size={22} /> Cámara</button>
              <button className="action-btn-rect cancel" onClick={() => setShowPhotoOptions(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .action-sheet { background: var(--sheet-bg); width: 100%; border-radius: 24px 24px 0 0; padding: 16px 20px 30px; }
        .action-sheet-header p { font-weight: 700; color: var(--text-main); font-size: 16px; margin-bottom: 12px; }
        .action-btn-rect {
          width: 100%;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 15px;
          border: none;
          background: var(--primary);
          border-radius: 12px;
          font-size: 16px;
          font-weight: 800;
          color: #000;
          margin-bottom: 10px;
          cursor: pointer;
        }
        .action-btn-rect.cancel { background: transparent; color: var(--danger); border: 1.5px solid var(--danger); justify-content: center; margin-top: 10px; }
      `}</style>
    </div>
  );
};

export default CreateAlert;
