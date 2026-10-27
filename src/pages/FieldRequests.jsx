import React, { useEffect, useState } from 'react';
import { requestsClient } from '../api/axiosClient';

export function FieldRequests() {
  const [fieldRequests, setFieldRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFieldRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await requestsClient.get('/api/requests');
      const data = Array.isArray(res.data) ? res.data : [];
      // Filtrar únicamente las solicitudes asignadas a trabajo en terreno
      const filtered = data.filter((req) => req.status === 'EN_TERRENO');
      setFieldRequests(filtered);
    } catch (err) {
      console.error('Error al obtener solicitudes en terreno:', err);
      setError('No se pudo cargar el listado de órdenes en terreno.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFieldRequests();
  }, []);

  const handleResolve = async (id, crewName) => {
    if (!window.confirm(`¿Confirmar la resolución del trabajo en terreno para la solicitud #${id}?`)) return;

    try {
      await requestsClient.put(`/api/requests/${id}/status`, {
        status: 'RESUELTO',
        crew: crewName || 'Cuadrilla Terreno'
      });
      alert(`Solicitud #${id} finalizada exitosamente.`);
      fetchFieldRequests();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      alert('Error al intentar resolver la solicitud.');
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-primary mb-1">Solicitudes en Terreno</h2>
          <p className="text-muted mb-0">Panel operativo para gestión y resolución de trabajos asignados a cuadrillas.</p>
        </div>
        <button className="btn btn-outline-primary fw-semibold" onClick={fetchFieldRequests}>
          🔄 Actualizar
        </button>
      </div>

      {error && <div className="alert alert-danger shadow-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Cargando órdenes de trabajo...</p>
        </div>
      ) : (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-dark text-white fw-semibold">
            Órdenes Activas en Terreno ({fieldRequests.length})
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Folio</th>
                  <th>RUT Vecino</th>
                  <th>Detalle / Dirección</th>
                  <th>Cuadrilla Asignada</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {fieldRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      No hay trabajos pendientes en terreno en este momento.
                    </td>
                  </tr>
                ) : (
                  fieldRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="fw-bold">#{req.id}</td>
                      <td>{req.citizenId}</td>
                      <td>{req.taskDetails || 'Sin descripción'}</td>
                      <td>
                        <span className="badge bg-warning text-dark fs-6">
                          👷 {req.assignedCrew || 'Sin asignar'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-info text-dark">{req.status}</span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-success btn-sm fw-semibold"
                          onClick={() => handleResolve(req.id, req.assignedCrew)}
                        >
                          ✅ Marcar Resuelto
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}