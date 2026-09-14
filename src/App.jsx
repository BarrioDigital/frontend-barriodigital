import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { setupAxiosInterceptors } from './api/axiosClient';
import { Login } from './pages/Login';

// Vistas temporales para probar la navegación interna
const Catalog = () => <h2>Pantalla /catalog (Gestión de Trámites y Cupos)</h2>;
const Requests = () => <h2>Pantalla /requests (Mis Solicitudes y Cambios de Estado)</h2>;

export default function App() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Procesa el token devuelto por Microsoft al redirigir a la app
    instance.handleRedirectPromise()
      .then((response) => {
        if (response && response.account) {
          instance.setActiveAccount(response.account);
        } else if (accounts.length > 0 && !instance.getActiveAccount()) {
          instance.setActiveAccount(accounts[0]);
        }
        setupAxiosInterceptors(instance);
      })
      .catch((error) => {
        console.error("Error al procesar la redirección de MSAL:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [accounts, instance]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontSize: '18px' }}>
        Iniciando sesión en BarrioDigital...
      </div>
    );
  }

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: '/' });
  };

  return (
    <BrowserRouter>
      {isAuthenticated && (
        <nav style={{ display: 'flex', gap: '15px', padding: '15px', backgroundColor: '#eef2f5', alignItems: 'center' }}>
          <Link to="/catalog" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#0078d4' }}>
            Catálogo de Trámites
          </Link>
          <Link to="/requests" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#0078d4' }}>
            Solicitudes
          </Link>
          <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#333' }}>
            Usuario: {instance.getActiveAccount()?.name || instance.getActiveAccount()?.username}
          </span>
          <button onClick={handleLogout} style={{ cursor: 'pointer', padding: '5px 10px' }}>
            Cerrar Sesión
          </button>
        </nav>
      )}

      <div style={{ padding: '20px' }}>
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login /> : <Navigate to="/catalog" replace />} 
          />
          <Route 
            path="/catalog" 
            element={isAuthenticated ? <Catalog /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/requests" 
            element={isAuthenticated ? <Requests /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="*" 
            element={<Navigate to={isAuthenticated ? "/catalog" : "/login"} replace />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}