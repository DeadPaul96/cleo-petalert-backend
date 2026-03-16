import React, { useState, useEffect } from 'react';
import { Camera as CameraIcon, MapPin, X, Plus, Info, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getAuth } from 'firebase/auth';
import { BASE_URL } from '../../api';
import './PostAdoption.css';

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

const PostAdoption = ({ onCancel, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [mapCenter, setMapCenter] = useState([9.9281, -84.0907]);

  const [formData, setFormData] = useState({
    species: '',
    breed: '',
    age: '',
    weight: '',
    description: '',
    location: null
  });

  const handlePhotoAction = async (source) => {
    setShowPhotoOptions(false);
    try {
      const image = await CapCamera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: source
      });
      if (images.length < 5) {
        setImages([...images, image.webPath]);
      }
    } catch (error) {
      console.error('Error al obtener foto:', error);
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const newPos = { lat: coordinates.coords.latitude, lng: coordinates.coords.longitude };
      setFormData({ ...formData, location: newPos });
      setMapCenter([newPos.lat, newPos.lng]);
    } catch (error) {
      alert('Activa el GPS para usar esta función');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        alert("Debes iniciar sesión.");
        setLoading(false);
        return;
      }
      const token = await auth.currentUser.getIdToken();

      // 1. Upload all images
      const uploadedUrls = [];
      for (const imgPath of images) {
        try {
          const blob = await fetch(imgPath).then(r => r.blob());
          const imageFormData = new FormData();
          imageFormData.append('file', blob, 'pet.jpg');

          const uploadRes = await fetch(`${BASE_URL}/api/images/upload?folder=adoptions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: imageFormData
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            uploadedUrls.push(uploadData.url);
          }
        } catch (e) {
          console.error("Single image upload failed", e);
        }
      }

      // 2. Submit pet data (using the first image as main for now)
      const payload = {
        name: formData.breed || 'Mascota', // Form needs a name field, using breed for now
        species: formData.species,
        breed: formData.breed,
        description: formData.description,
        age_months: parseInt(formData.age) || 12,
        size: 'medium', // Default
        is_vaccinated: true,
        is_neutered: true,
        image_url: uploadedUrls[0] || null
      };

      // Add params to URL match the backend create_adoption_listing signature
      const queryParams = new URLSearchParams({
        name: payload.name,
        species: payload.species,
        description: payload.description,
        breed: payload.breed,
        age_months: payload.age_months,
        size: payload.size,
        is_vaccinated: payload.is_vaccinated,
        is_neutered: payload.is_neutered
      });

      const res = await fetch(`${BASE_URL}/api/adoptions/?${queryParams.toString()}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        onSuccess();
      } else {
        const error = await res.text();
        console.error("Adoption post failed", error);
        alert("Error al publicar la mascota.");
      }
    } catch (e) {
      console.error("Error submitting adoption:", e);
      alert("Error de red.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-adoption-overlay">
      <div className="post-adoption-modal animate-in">
        <div className="modal-header">
          <div className="modal-header-content">
             <img src="/cleo_standing.png" alt="Cleo" className="modal-icon-small" />
             <h2 className="turq-text">Dar en Adopción</h2>
          </div>
          <button className="close-btn" onClick={onCancel}><X size={24} /></button>
        </div>

        <div className="modal-body">
          <div className="step-progress">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}></div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}></div>
          </div>

          {step === 1 && (
            <div className="form-step animate-in">
              <label className="section-label">Fotos de la mascota (Máx. 5)</label>
              <div className="image-grid">
                {images.map((img, index) => (
                  <div key={index} className="image-preview">
                    <img src={img} alt="Preview" />
                    <button className="remove-img" onClick={() => removeImage(index)}><X size={14} /></button>
                  </div>
                ))}
                {images.length < 5 && (
                  <button className="add-image-btn" onClick={() => setShowPhotoOptions(true)}>
                    <Plus size={32} />
                    <span>{images.length}/5</span>
                  </button>
                )}
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>Especie</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Gato"
                    value={formData.species}
                    onChange={(e) => setFormData({...formData, species: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label>Raza</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Mestizo" 
                    value={formData.breed}
                    onChange={(e) => setFormData({...formData, breed: e.target.value})}
                  />
                </div>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>Edad Estimada</label>
                  <input 
                    type="text" 
                    placeholder="Ej. 2 años" 
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label>Peso (kg)</label>
                  <input 
                    type="number" 
                    placeholder="0.0" 
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step animate-in">
              <div className="input-group">
                <label>Descripción breve</label>
                <textarea 
                  rows="3"
                  placeholder="Cuenta algo sobre su personalidad..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div className="input-group">
                <label>Ubicación</label>
                <p className="step-desc">Marca el punto de entrega en el mapa</p>
                <div className="map-wrapper-fixed-small">
                  <MapContainer center={mapCenter} zoom={13} className="leaflet-container-custom">
                    <TileLayer
                      url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                      attribution='&copy; Google Maps'
                    />
                    <MapResizer />
                    <MapRecenter position={formData.location} />
                    <LocationMarker position={formData.location} setPosition={(pos) => setFormData({...formData, location: pos})} />
                  </MapContainer>
                  <button className="btn-gps-float-adoption" onClick={getCurrentLocation} disabled={loading}>
                    {loading ? <Loader2 className="spinner" size={20} /> : <MapPin size={20} />}
                    GPS
                  </button>
                </div>
              </div>

              <div className="info-box">
                <Info size={18} />
                <p>Al publicar, aceptas que los interesados llenen tu formulario de requisitos.</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 1 ? (
             <div className="footer-btns">
               <div className="flex-1"></div> {/* Spacer to push button to right */}
               <button className="btn btn-primary turq-btn-solid" onClick={() => setStep(2)}>Siguiente</button>
             </div>
          ) : (
            <div className="footer-btns">
              <button className="btn btn-outline" onClick={() => setStep(1)} disabled={loading}>Atrás</button>
              <button className="btn btn-primary turq-btn-solid" onClick={handleSubmit} disabled={!formData.location || loading}>
                {loading ? <Loader2 className="spinner" size={20} /> : 'Publicar'}
              </button>
            </div>
          )}
        </div>

        {/* Custom Action Sheet Stylized as requested */}
        {showPhotoOptions && (
          <div className="action-sheet-overlay" onClick={() => setShowPhotoOptions(false)}>
            <div className="action-sheet animate-up" onClick={e => e.stopPropagation()}>
              <div className="action-sheet-header">
                <div className="handle"></div>
                <p>Añadir foto</p>
              </div>
              <button className="action-btn-turq" onClick={() => handlePhotoAction(CameraSource.Photos)}>
                <ImageIcon size={22} /> Galería
              </button>
              <button className="action-btn-turq" onClick={() => handlePhotoAction(CameraSource.Camera)}>
                <CameraIcon size={22} /> Cámara
              </button>
              <button className="action-btn-turq cancel" onClick={() => setShowPhotoOptions(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .turq-text { color: var(--primary) !important; font-weight: 900; }
        .modal-header-content { display: flex; align-items: center; gap: 10px; }
        .modal-icon-small { width: 32px; height: 32px; object-fit: contain; }

        .map-wrapper-fixed-small {
          width: 100%;
          height: 350px;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          border: 2px solid var(--border-color);
          background: #222;
          margin-top: 8px;
        }
        .leaflet-container-custom { height: 100% !important; width: 100% !important; }
        .btn-gps-float-adoption { 
          position: absolute; 
          bottom: 12px; 
          right: 12px; 
          z-index: 1000; 
          background: var(--bg-white); 
          color: var(--primary); 
          border: 2px solid var(--primary); 
          padding: 10px 18px;
          border-radius: 12px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
          font-weight: 900;
          font-size: 14px;
          cursor: pointer;
        }

        .action-sheet-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 3000; display: flex; align-items: flex-end; backdrop-filter: blur(2px); }
        .action-sheet { background: var(--modal-bg); width: 100%; border-radius: 24px 24px 0 0; padding: 16px 20px 30px; }
        .action-sheet-header { text-align: center; margin-bottom: 20px; }
        .handle { width: 40px; height: 4px; background: #e0e0e0; border-radius: 2px; margin: 0 auto 12px; }
        .action-sheet-header p { font-weight: 700; color: var(--text-main); font-size: 16px; }

        /* Stylized Action Buttons: Rectangular Turquoise */
        .action-btn-turq {
          width: 100%;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 15px;
          border: 1px solid var(--border-color);
          background: var(--primary);
          border-radius: 12px;
          font-size: 16px;
          font-weight: 800;
          color: #000;
          margin-bottom: 8px;
          cursor: pointer;
        }
        .action-btn-turq.cancel { background: transparent; color: var(--danger); border: none; justify-content: center; margin-top: 10px; }

        .turq-btn-solid { background: var(--primary) !important; color: #000 !important; font-weight: 900; }
        .flex-1 { flex: 1; }
        .footer-btns {
          display: flex;
          flex-direction: row;
          justify-content: space-between; /* Push buttons to corners */
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        .footer-btns .btn {
          flex: none;
          min-width: 140px;
        }
      `}</style>
    </div>
  );
};

export default PostAdoption;
