import React from 'react';
import { useMsal } from '@azure/msal-react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();

  // Si no hay sesión iniciada, redirige al login
  if (!activeAccount) {
    return <Navigate to="/login" replace />;
  }

  // Extraer roles del ID Token / Acccount ID Token Claims
  const userRoles = activeAccount.idTokenClaims?.roles || [];

  // Verificar si el usuario posee al menos uno de los roles permitidos
  const hasAccess = userRoles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h2>Acceso Denegado</h2>
        <p>No tienes los permisos necesarios para acceder a esta sección.</p>
      </div>
    );
  }

  return children;
};