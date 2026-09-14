import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { setupAxiosInterceptors } from './api/axiosClient';
import { Login } from './pages/Login';

// Componentes temporales para validar el enrutamiento
const Catalog = () => <h2>Pantalla /catalog (Gestión de Trámites y Cupos)</h2>;
const Requests = () => <h2>Pantalla /requests (Mis Solicitudes y Cambios de Estado)</h2>;

export default function App() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    // Establecer la primera cuenta como activa e inicializar interceptor
    if (accounts.length > 0) {
      instance.setActiveAccount(accounts[0]);
    }
    setupAxiosInterceptors(instance);
  }, [accounts, instance]);

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  return (
    <BrowserRouter>
      {isAuthenticated && (
        <nav style={{ display: 'flex', gap: '15px', padding: '15px', backgroundColor: '#f0f0f0' }}>
          <Link to="/catalog">Catálogo de Trámites</Link>
          <Link to="/requests">Solicitudes</Link>
          <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>Cerrar Sesión</button>
        </nav>
      )}

      <div style={{ padding: '20px' }}>
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login /> : <Navigate to="/catalog" />} 
          />
          <Route 
            path="/catalog" 
            element={isAuthenticated ? <Catalog /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/requests" 
            element={isAuthenticated ? <Requests /> : <Navigate to="/login" />} 
          />
          <Route 
            path="*" 
            element={<Navigate to={isAuthenticated ? "/catalog" : "/login"} />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}