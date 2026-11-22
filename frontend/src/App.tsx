import { useEffect } from 'react';
import { AppRoutes } from './routes/AppRoutes';
import { useAuthStore } from './store/authStore';

function App() {
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    // Verificamos si hay una sesión activa mediante la cookie HttpOnly al iniciar[cite: 23, 25]
    checkSession();
  }, [checkSession]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <AppRoutes />
    </div>
  );
}

export default App;