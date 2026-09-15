import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { catalogClient } from '../api/axiosClient';

export function Catalog() {
  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();
  const userRoles = activeAccount?.idTokenClaims?.roles || [];
  const isAdmin = userRoles.includes('Admin');

  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newProcedure, setNewProcedure] = useState({
    code: '',
    name: '',
    description: '',
    dailyQuota: '',
    availableQuota: ''
  });

  const [selectedId, setSelectedId] = useState(null);
  const [addedQuota, setAddedQuota] = useState('');

  const fetchProcedures = async () => {
    try {
      setLoading(true);
      const response = await catalogClient.get('/api/catalog/procedures');
      setProcedures(response.data);
      setError(null);
    } catch (err) {
      console.error('Error cargando catálogo:', err);
      setError('No se pudo conectar con el servicio de catálogo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcedures();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await catalogClient.post('/api/catalog/procedures', {
        ...newProcedure,
        dailyQuota: parseInt(newProcedure.dailyQuota),
        availableQuota: parseInt(newProcedure.availableQuota)
      });
      setNewProcedure({ code: '', name: '', description: '', dailyQuota: '', availableQuota: '' });
      fetchProcedures();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear el trámite');
    }
  };

  const handleAddQuotaSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      await catalogClient.put(`/api/catalog/procedures/${selectedId}/add-quota`, {
        addedQuota: parseInt(addedQuota)
      });
      setSelectedId(null);
      setAddedQuota('');
      fetchProcedures();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al recargar cupo');
    }
  };

  if (loading) return <div>Cargando catálogo...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      <h2>Catálogo de Trámites</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {/* Formulario visible solo para Admins */}
      {isAdmin && (
        <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '6px', backgroundColor: '#f8f9fa' }}>
          <h3>Crear Nuevo Trámite</h3>
          <form onSubmit={handleCreateSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input
              type="text"
              placeholder="Código (ej: TRM-01)"
              value={newProcedure.code}
              onChange={(e) => setNewProcedure({ ...newProcedure, code: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Nombre del trámite"
              value={newProcedure.name}
              onChange={(e) => setNewProcedure({ ...newProcedure, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Descripción"
              value={newProcedure.description}
              onChange={(e) => setNewProcedure({ ...newProcedure, description: e.target.value })}
              style={{ gridColumn: 'span 2' }}
            />
            <input
              type="number"
              placeholder="Cupo Diario"
              value={newProcedure.dailyQuota}
              onChange={(e) => setNewProcedure({ ...newProcedure, dailyQuota: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Cupo Disponible Inicial"
              value={newProcedure.availableQuota}
              onChange={(e) => setNewProcedure({ ...newProcedure, availableQuota: e.target.value })}
              required
            />
            <button type="submit" style={{ gridColumn: 'span 2', padding: '8px', cursor: 'pointer' }}>
              Registrar Trámite
            </button>
          </form>
        </div>
      )}

      {/* Tabla con registros de la base de datos */}
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ backgroundColor: '#eaeaea' }}>
            <th>ID</th>
            <th>Código</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Cupo Diario</th>
            <th>Cupo Disponible</th>
            {isAdmin && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {procedures.map((proc) => (
            <tr key={proc.id}>
              <td>{proc.id}</td>
              <td>{proc.code}</td>
              <td>{proc.name}</td>
              <td>{proc.description || 'N/A'}</td>
              <td>{proc.dailyQuota}</td>
              <td>{proc.availableQuota}</td>
              {isAdmin && (
                <td>
                  <button onClick={() => setSelectedId(proc.id)}>+ Añadir Cupos</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal / Panel secundario de adición de cupos para Admin */}
      {isAdmin && selectedId && (
        <div style={{ padding: '15px', border: '1px solid #0078d4', borderRadius: '6px', backgroundColor: '#f0f6ff' }}>
          <h3>Añadir Cupos al Trámite ID: {selectedId}</h3>
          <form onSubmit={handleAddQuotaSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="number"
              placeholder="Cantidad a sumar"
              value={addedQuota}
              onChange={(e) => setAddedQuota(e.target.value)}
              required
            />
            <button type="submit">Guardar</button>
            <button type="button" onClick={() => setSelectedId(null)}>Cancelar</button>
          </form>
        </div>
      )}
    </div>
  );
}