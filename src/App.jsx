import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { setupAxiosInterceptors } from './api/axiosClient';
import { Login } from './pages/Login';
import { Catalog } from './pages/Catalog';
import { Requests } from './pages/Requests';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      <div style={{ padding: '40px', textAlign: 'center', fontSize: '18px', color: '#fff' }}>
        Iniciando sesión en BarrioDigital...
      </div>
    );
  }

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: '/' });
  };

  const activeAccount = instance.getActiveAccount();
  const userRoles = activeAccount?.idTokenClaims?.roles || [];

  // Permisos estrictos por rol
  const canAccessCatalog = userRoles.includes('Admin') || userRoles.includes('Funcionario');
  const canAccessRequests = userRoles.includes('Admin') || userRoles.includes('Funcionario') || userRoles.includes('Vecino');

  return (
    <BrowserRouter>
      {isAuthenticated && (
        <nav style={{ display: 'flex', gap: '15px', padding: '15px', backgroundColor: '#eef2f5', alignItems: 'center' }}>
          {canAccessCatalog && (
            <Link to="/catalog" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#0078d4' }}>
              Catálogo de Trámites
            </Link>
          )}

          {canAccessRequests && (
            <Link to="/requests" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#0078d4' }}>
              Solicitudes
            </Link>
          )}

          <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#333' }}>
            Usuario: {activeAccount?.name || activeAccount?.username}
          </span>
          <button onClick={handleLogout} style={{ cursor: 'pointer', padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc' }}>
            Cerrar Sesión
          </button>
        </nav>
      )}

      <div style={{ padding: '20px' }}>
        <Routes>
          <Route
            path="/login"
            element={!isAuthenticated ? <Login /> : <Navigate to={canAccessCatalog ? "/catalog" : canAccessRequests ? "/requests" : "/login"} replace />}
          />

          {/* Catalog: Exclusivo Admin y Funcionario */}
          <Route
            path="/catalog"
            element={
              isAuthenticated ? (
                <ProtectedRoute allowedRoles={['Admin', 'Funcionario']}>
                  <Catalog />
                </ProtectedRoute>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Requests: Exclusivo Admin, Funcionario y Vecino */}
          <Route
            path="/requests"
            element={
              isAuthenticated ? (
                <ProtectedRoute allowedRoles={['Admin', 'Funcionario', 'Vecino']}>
                  <Requests />
                </ProtectedRoute>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Redirección por defecto */}
          <Route
            path="*"
            element={
              <Navigate
                to={
                  !isAuthenticated
                    ? "/login"
                    : canAccessCatalog
                    ? "/catalog"
                    : canAccessRequests
                    ? "/requests"
                    : "/login"
                }
                replace
              />
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}