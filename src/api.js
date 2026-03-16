// Centralized API configuration to switch between local dev and production
export const BASE_URL = import.meta.env.PROD 
  ? 'https://cleo-petalert-backend.onrender.com' 
  : ''; 

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  return fetch(url, options);
};
