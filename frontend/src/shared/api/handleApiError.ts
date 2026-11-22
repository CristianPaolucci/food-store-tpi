import axios from 'axios';

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((err) => err.msg).join(', ');
    }
  }
  return 'Ocurrió un error inesperado en el servidor.';
};