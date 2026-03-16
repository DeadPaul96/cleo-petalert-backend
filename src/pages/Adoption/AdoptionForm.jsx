import React, { useState } from 'react';
import './AdoptionForm.css';

const AdoptionForm = ({ pet, onCancel, onSubmit }) => {
  const [answers, setAnswers] = useState({
    ownHome: null,
    hasSpace: null,
    hasIncome: null,
    willingVisits: null
  });

  const questions = [
    { id: 'ownHome', text: '¿Tiene casa propia?' },
    { id: 'hasSpace', text: '¿Tiene espacio en su casa para tener la mascota?' },
    { id: 'hasIncome', text: '¿Tiene orden patronal o salario fijo que puedas demostrar?' },
    { id: 'willingVisits', text: '¿Estás dispuesto a recibir visitas programadas para verificar la salud de la mascota?' }
  ];

  const canSubmit = Object.values(answers).every(val => val !== null);

  return (
    <div className="adoption-form-overlay">
      <div className="adoption-form-modal animate-in">
        <div className="form-header">
          <div className="pet-thumb">
            <img src={pet.image} alt={pet.name} />
          </div>
          <div>
            <h3>Solicitud para {pet.name}</h3>
            <p>Formulario de Adopción</p>
          </div>
        </div>

        <div className="form-body">
          <p className="form-intro">Por favor, responde honestamente a las siguientes preguntas:</p>
          
          {questions.map(q => (
            <div key={q.id} className="question-item">
              <p>{q.text}</p>
              <div className="options">
                <button 
                  className={`opt-btn ${answers[q.id] === true ? 'yes' : ''}`}
                  onClick={() => setAnswers({...answers, [q.id]: true})}
                >
                  SÍ
                </button>
                <button 
                  className={`opt-btn ${answers[q.id] === false ? 'no' : ''}`}
                  onClick={() => setAnswers({...answers, [q.id]: false})}
                >
                  NO
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="form-footer">
          <button className="btn btn-outline" onClick={onCancel}>Cancelar</button>
          <button 
            className="btn btn-primary" 
            disabled={!canSubmit}
            onClick={() => onSubmit(answers)}
          >
            Enviar Solicitud
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdoptionForm;
