import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { setupAxiosInterceptors } from './api/axiosClient';
import { Login } from './pages/Login';
import { Catalog } from './pages/Catalog';
import { Requests } from './pages/Requests';
import { Audit } from './pages/Audit';
import { Dashboard } from './pages/Dashboard';
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
        console.error("Error procesando redirección de MSAL:", error);
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

  const activeAccount = instance.getActiveAccount();
  const userRoles = activeAccount?.idTokenClaims?.roles || [];

  // Permisos por módulo
  const canAccessDashboard = true; // Todos los autenticados
  const canAccessCatalog = userRoles.includes('Admin') || userRoles.includes('Funcionario');
  const canAccessRequests = userRoles.includes('Admin') || userRoles.includes('Funcionario') || userRoles.includes('Vecino');
  const canAccessAudit = userRoles.includes('Admin') || userRoles.includes('Auditor');

  // Determinar la ruta por defecto según jerarquía de roles
  const getHomeRoute = () => {
    if (!isAuthenticated) return "/login";
    if (canAccessDashboard) return "/dashboard";
    if (canAccessCatalog) return "/catalog";
    if (canAccessRequests) return "/requests";
    if (canAccessAudit) return "/audit";
    return "/login";
  };

  return (
    <BrowserRouter>
      {isAuthenticated && (
        <nav style={{ display: 'flex', gap: '15px', padding: '15px', backgroundColor: '#eef2f5', alignItems: 'center' }}>
          <Link to="/dashboard" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#0078d4' }}>
            Inicio
          </Link>

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

          {canAccessAudit && (
            <Link to="/audit" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#0078d4' }}>
              Auditoría
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
            element={!isAuthenticated ? <Login /> : <Navigate to={getHomeRoute()} replace />}
          />

          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <ProtectedRoute allowedRoles={['Admin', 'Funcionario', 'Auditor', 'Vecino']}>
                  <Dashboard />
                </ProtectedRoute>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

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

          <Route
            path="/audit"
            element={
              isAuthenticated ? (
                <ProtectedRoute allowedRoles={['Admin', 'Auditor']}>
                  <Audit />
                </ProtectedRoute>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="*"
            element={<Navigate to={getHomeRoute()} replace />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}