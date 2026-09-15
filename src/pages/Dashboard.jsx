import React from 'react';
import { useMsal } from '@azure/msal-react';

export function Dashboard() {
  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();
  const roles = activeAccount?.idTokenClaims?.roles || [];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Bienvenido al Panel Principal</h2>
      <p>Hola, <strong>{activeAccount?.name || activeAccount?.username}</strong></p>
      <p>Tus roles asignados son: {roles.join(', ') || 'Sin roles'}</p>
    </div>
  );
}