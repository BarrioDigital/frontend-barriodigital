import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { requestsClient } from '../api/axiosClient';

export function Requests() {
  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();
  const userRoles = activeAccount?.idTokenClaims?.roles || [];
  const canManage = userRoles.includes('Admin') || userRoles.includes('Funcionario');

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newRequest, setNewRequest] = useState({
    procedureTypeId: '',
    citizenId: '',
    description: ''
  });

  const [updateData, setUpdateData] = useState({
    requestId: null,
    status: 'INGRESADO',
    crew: ''
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await requestsClient.get('/api/requests');
      setRequests(response.data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
      setError('No se pudo conectar con el servicio de solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await requestsClient.post('/api/requests', {
        ...newRequest,
        procedureTypeId: parseInt(newRequest.procedureTypeId)
      });
      setNewRequest({ procedureTypeId: '', citizenId: '', description: '' });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear la solicitud');
    }
  };

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!updateData.requestId) return;
    try {
      await requestsClient.put(`/api/requests/${updateData.requestId}/status`, {
        status: updateData.status,
        crew: updateData.crew
      });
      setUpdateData({ requestId: null, status: 'INGRESADO', crew: '' });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar estado/cuadrilla');
    }
  };

  if (loading) return <div>Cargando solicitudes...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      <h2>Gestión de Solicitudes</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {/* Formulario de creación disponible para todos los roles autorizados */}
      <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '6px', backgroundColor: '#f8f9fa' }}>
        <h3>Ingresar Nueva Solicitud</h3>
        <form onSubmit={handleCreateSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input
            type="number"
            placeholder="ID Tipo de Trámite"
            value={newRequest.procedureTypeId}
            onChange={(e) => setNewRequest({ ...newRequest, procedureTypeId: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="RUT / ID Ciudadano"
            value={newRequest.citizenId}
            onChange={(e) => setNewRequest({ ...newRequest, citizenId: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Descripción del requerimiento"
            value={newRequest.description}
            onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
            style={{ gridColumn: 'span 2' }}
          />
          <button type="submit" style={{ gridColumn: 'span 2', padding: '8px', cursor: 'pointer' }}>
            Enviar Solicitud
          </button>
        </form>
      </div>

      {/* Tabla con registros de la base de datos */}
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ backgroundColor: '#eaeaea' }}>
            <th>ID</th>
            <th>RUT Ciudadano</th>
            <th>ID Trámite</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Cuadrilla Asignada</th>
            <th>Fecha Creación</th>
            {canManage && <th>Acción</th>}
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id}>
              <td>{req.id}</td>
              <td>{req.citizenId}</td>
              <td>{req.procedureTypeId}</td>
              <td>{req.description || 'N/A'}</td>
              <td>
                <strong>{req.status}</strong>
              </td>
              <td>
                {req.assignedCrew || (
                  <span style={{ color: '#888', fontStyle: 'italic' }}>Sin asignar</span>
                )}
              </td>
              <td>{req.createdAt ? new Date(req.createdAt).toLocaleString() : 'N/A'}</td>
              {canManage && (
                <td>
                  <button
                    onClick={() =>
                      setUpdateData({
                        requestId: req.id,
                        status: req.status,
                        crew: req.assignedCrew || ''
                      })
                    }
                  >
                    Gestionar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Panel para modificar estados y cuadrillas exclusivo Funcionarios/Admins */}
      {canManage && updateData.requestId && (
        <div style={{ padding: '15px', border: '1px solid #28a745', borderRadius: '6px', backgroundColor: '#f0fff4' }}>
          <h3>Gestionar Solicitud #{updateData.requestId}</h3>
          <form onSubmit={handleUpdateStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label>
              <strong>Estado:</strong>
              <select
                value={updateData.status}
                onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                style={{ marginLeft: '10px', padding: '4px' }}
              >
                <option value="INGRESADO">INGRESADO</option>
                <option value="ADMITIDO">ADMITIDO</option>
                <option value="EN_GESTION">EN_GESTION</option>
                <option value="EN_TERRENO">EN_TERRENO</option>
                <option value="RESUELTO">RESUELTO</option>
                <option value="RECHAZADO">RECHAZADO</option>
              </select>
            </label>

            <label>
              <strong>Cuadrilla:</strong>
              <input
                type="text"
                placeholder="Nombre de la cuadrilla"
                value={updateData.crew}
                onChange={(e) => setUpdateData({ ...updateData, crew: e.target.value })}
                style={{ marginLeft: '10px', padding: '4px' }}
              />
            </label>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit">Actualizar</button>
              <button type="button" onClick={() => setUpdateData({ requestId: null, status: 'INGRESADO', crew: '' })}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}