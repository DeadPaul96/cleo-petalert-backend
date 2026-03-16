import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import './MatchSuccess.css';

const MatchSuccess = ({ pet, onContinue }) => {
  return (
    <motion.div 
      className="match-success-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="match-particles"
        initial={{ scale: 0 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <Sparkles size={100} color="var(--primary-light)" />
      </motion.div>

      <div className="match-content">
        <motion.div 
          className="match-title"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          ¡HAS HECHO MATCH CON {pet.name.toUpperCase()}!
        </motion.div>

        <div className="match-images">
          <motion.div 
            className="user-img"
            initial={{ x: -100, opacity: 0, rotate: -15 }}
            animate={{ x: 20, opacity: 1, rotate: -5 }}
            transition={{ type: 'spring', damping: 12 }}
          >
            <img src="https://i.pravatar.cc/150?u=me" alt="Tú" />
          </motion.div>
          <motion.div 
            className="pet-img"
            initial={{ x: 100, opacity: 0, rotate: 15 }}
            animate={{ x: -20, opacity: 1, rotate: 5 }}
            transition={{ type: 'spring', damping: 12 }}
          >
            <img src={pet.image} alt={pet.name} />
          </motion.div>
          
          <motion.div 
            className="match-heart"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1] }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Heart size={60} fill="var(--primary)" color="var(--primary)" />
          </motion.div>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          A {pet.name} le ha gustado tu perfil también. <br/>
          Completa el formulario para enviarle tu solicitud.
        </motion.p>

        <motion.button 
          className="btn btn-primary btn-large"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={onContinue}
          whileTap={{ scale: 0.95 }}
        >
          Completar Formulario
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MatchSuccess;
