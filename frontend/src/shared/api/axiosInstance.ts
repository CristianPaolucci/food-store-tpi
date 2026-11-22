import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true, // Vital para enviar y recibir la cookie HttpOnly
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores globales sin romper el catálogo ni rutas públicas
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);