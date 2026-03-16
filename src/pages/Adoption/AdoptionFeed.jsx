import React, { useState, useEffect } from 'react';
import PetCard from '../../components/Adoption/PetCard';
import './AdoptionFeed.css';
import { AnimatePresence } from 'framer-motion';
import { getAuth } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { BASE_URL } from '../../api';

const AdoptionFeed = ({ onMatch, onDetails, onChatCreated }) => {
  const [pets, setPets] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) {
        // Not logged in yet – show nothing
        setLoading(false);
        return;
      }
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${BASE_URL}/api/adoptions/feed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Map backend fields to the shape PetCard expects
        const mapped = data.map(p => ({
          id: p.id,
          name: p.name,
          age: p.age_months ? `${Math.floor(p.age_months / 12)} año(s)` : 'Desconocida',
          breed: p.breed || p.species,
          description: p.description,
          image: p.image_url || 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=800',
          is_vaccinated: p.is_vaccinated,
          is_neutered: p.is_neutered,
          owner_id: p.owner_id
        }));
        setPets(mapped);
        setCurrentIndex(0);
      }
    } catch (e) {
      console.error("Error fetching adoption feed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction) => {
    const pet = pets[currentIndex];
    if (!pet) return;

    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${BASE_URL}/api/adoptions/swipe`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ pet_id: pet.id, direction: direction === 'right' ? 'like' : 'pass' })
        });

        if (res.ok && direction === 'right') {
          const result = await res.json();
          // Trigger match animation and notify parent about the new chat
          onMatch(pet);
          if (result.conversation_id && onChatCreated) {
            onChatCreated(result.conversation_id);
          }
        }
      }
    } catch (e) {
      console.error("Swipe API error:", e);
      if (direction === 'right') onMatch(pet); // Still show animation even if API fails
    }

    setCurrentIndex(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="empty-feed animate-in" style={{justifyContent: 'center'}}>
        <Loader2 size={48} className="spinner" style={{color: 'var(--primary)'}} />
        <p style={{marginTop: 16}}>Buscando amigos...</p>
      </div>
    );
  }

  if (currentIndex >= pets.length) {
    return (
      <div className="empty-feed animate-in">
        <div className="empty-mascot-wrapper">
          <img src="/cleo_standing.png" alt="Cleo" className="empty-mascot" />
        </div>
        <h3>¡Eso es todo por ahora!</h3>
        <p>Cleo y yo volveremos pronto con más amigos.</p>
        <button className="btn btn-primary" onClick={fetchFeed}>Recargar</button>
      </div>
    );
  }

  return (
    <div className="adoption-feed-container">
      <div className="card-stack">
        <AnimatePresence initial={false}>
          {pets.slice(currentIndex, currentIndex + 2).reverse().map((pet) => {
            const isCurrent = pet.id === pets[currentIndex]?.id;
            return (
              <PetCard 
                key={pet.id} 
                pet={pet} 
                onSwipe={isCurrent ? handleSwipe : () => {}}
                onDetails={onDetails}
                isDraggable={isCurrent}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdoptionFeed;

