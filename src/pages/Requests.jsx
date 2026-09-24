import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { requestsClient, catalogClient } from '../api/axiosClient';

export function Requests() {
  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();
  const userRoles = activeAccount?.idTokenClaims?.roles || [];
  const canManage = userRoles.includes('Admin') || userRoles.includes('Funcionario');

  const [requests, setRequests] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showDetail, setShowDetail] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [requestsRes, catalogRes] = await Promise.all([
        requestsClient.get('/api/requests'),
        catalogClient.get('/api/catalog/procedures')
      ]);

      setRequests(requestsRes.data);
      setProcedures(catalogRes.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('No se pudo conectar con los servicios correspondientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProcedure = procedures.find(
    (p) => p.id.toString() === newRequest.procedureTypeId.toString()
  );

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await requestsClient.post('/api/requests', {
        ...newRequest,
        procedureTypeId: parseInt(newRequest.procedureTypeId)
      });
      setNewRequest({ procedureTypeId: '', citizenId: '', description: '' });
      setShowDetail(false);
      setCurrentPage(1); // Regresa a la primera página para ver el elemento recién creado
      loadData();
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
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar estado/cuadrilla');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      INGRESADO: 'bg-primary',
      ADMITIDO: 'bg-info text-dark',
      EN_GESTION: 'bg-warning text-dark',
      EN_TERRENO: 'bg-secondary',
      RESUELTO: 'bg-success',
      RECHAZADO: 'bg-danger'
    };
    return <span className={`badge ${statusMap[status] || 'bg-dark'}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center my-5">
        <div className="spinner-border text-primary me-2" role="status"></div>
        <span>Cargando datos de solicitudes...</span>
      </div>
    );
  }

  // --- ORDEN DESCENDENTE Y PAGINACIÓN ---
  const sortedRequests = [...requests].reverse();
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = sortedRequests.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="container py-4">
      <h2 className="fw-bold text-primary mb-4">Gestión de Solicitudes</h2>

      {error && <div className="alert alert-danger shadow-sm">{error}</div>}

      {/* Formulario de Ingreso */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-primary text-white fw-semibold">
          Ingresar Nueva Solicitud
        </div>
        <div className="card-body">
          <form onSubmit={handleCreateSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-bold">Tipo de Trámite</label>
              <div className="input-group">
                <select
                  className="form-select"
                  value={newRequest.procedureTypeId}
                  onChange={(e) => {
                    setNewRequest({ ...newRequest, procedureTypeId: e.target.value });
                    setShowDetail(false);
                  }}
                  required
                >
                  <option value="">-- Seleccionar Trámite Disponible --</option>
                  {procedures.map((proc) => (
                    <option key={proc.id} value={proc.id}>
                      [{proc.code}] {proc.name}
                    </option>
                  ))}
                </select>

                {selectedProcedure && (
                  <button
                    type="button"
                    className={`btn ${showDetail ? 'btn-info text-white' : 'btn-outline-info'}`}
                    onClick={() => setShowDetail(!showDetail)}
                    title="Ver detalle del trámite"
                  >
                    <i className="bi bi-question-circle-fill me-1"></i>
                    {showDetail ? 'Ocultar' : 'Ver detalle'}
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">RUT / ID Ciudadano</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: 12345678-9"
                value={newRequest.citizenId}
                onChange={(e) => setNewRequest({ ...newRequest, citizenId: e.target.value })}
                required
              />
            </div>

            {showDetail && selectedProcedure && (
              <div className="col-12">
                <div className="alert alert-info border-info mb-0 d-flex justify-content-between align-items-center shadow-sm">
                  <div>
                    <h6 className="fw-bold mb-1">
                      <i className="bi bi-info-circle me-2"></i>
                      {selectedProcedure.name} ({selectedProcedure.code})
                    </h6>
                    <p className="mb-0 text-dark small">
                      <strong>Descripción:</strong> {selectedProcedure.description || 'Sin descripción registrada.'}
                    </p>
                  </div>
                  <div className="text-end ps-3">
                    <span className="d-block small text-muted">Cupos disponibles</span>
                    <span className={`badge fs-6 ${selectedProcedure.availableQuota > 0 ? 'bg-success' : 'bg-danger'}`}>
                      {selectedProcedure.availableQuota}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="col-12">
              <label className="form-label fw-bold">Descripción del Requerimiento</label>
              <input
                type="text"
                className="form-control"
                placeholder="Detalle de la solicitud ingresada..."
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
              />
            </div>

            <div className="col-12 text-end mt-3">
              <button type="submit" className="btn btn-success px-4">
                Enviar Solicitud
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Panel de Gestión */}
      {canManage && updateData.requestId && (
        <div className="card shadow-sm border-success mb-4 bg-light">
          <div className="card-body">
            <h5 className="card-title text-success fw-bold">Gestionar Solicitud #{updateData.requestId}</h5>
            <form onSubmit={handleUpdateStatusSubmit} className="row g-3 mt-1 align-items-end">
              <div className="col-md-5">
                <label className="form-label fw-bold">Estado</label>
                <select
                  className="form-select"
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                >
                  <option value="INGRESADO">INGRESADO</option>
                  <option value="ADMITIDO">ADMITIDO</option>
                  <option value="EN_GESTION">EN_GESTION</option>
                  <option value="EN_TERRENO">EN_TERRENO</option>
                  <option value="RESUELTO">RESUELTO</option>
                  <option value="RECHAZADO">RECHAZADO</option>
                </select>
              </div>

              <div className="col-md-5">
                <label className="form-label fw-bold">Cuadrilla Asignada</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre o ID de la cuadrilla"
                  value={updateData.crew}
                  onChange={(e) => setUpdateData({ ...updateData, crew: e.target.value })}
                />
              </div>

              <div className="col-md-2 d-flex gap-2">
                <button type="submit" className="btn btn-success w-100">Actualizar</button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setUpdateData({ requestId: null, status: 'INGRESADO', crew: '' })}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla con historial */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>RUT Ciudadano</th>
                  <th>ID Trámite</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Cuadrilla Asignada</th>
                  <th>Fecha Creación</th>
                  {canManage && <th className="text-center">Acción</th>}
                </tr>
              </thead>
              <tbody>
                {currentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? "8" : "7"} className="text-center py-4 text-muted">
                      No existen solicitudes registradas.
                    </td>
                  </tr>
                ) : (
                  currentRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="fw-bold">{req.id}</td>
                      <td>{req.citizenId}</td>
                      <td><span className="badge bg-light text-dark border">{req.procedureTypeId}</span></td>
                      <td>{req.description || 'N/A'}</td>
                      <td>{getStatusBadge(req.status)}</td>
                      <td>
                        {req.assignedCrew ? (
                          <span className="fw-semibold">{req.assignedCrew}</span>
                        ) : (
                          <span className="text-muted small"><em>Sin asignar</em></span>
                        )}
                      </td>
                      <td className="small">
                        {req.createdAt ? new Date(req.createdAt).toLocaleString('es-CL') : 'N/A'}
                      </td>
                      {canManage && (
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-success"
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginador */}
        {sortedRequests.length > itemsPerPage && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
            <span className="small text-muted">
              Página {currentPage} de {totalPages} ({sortedRequests.length} registros en total)
            </span>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage((prev) => prev - 1)}>
                  Anterior
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(page)}>
                    {page}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage((prev) => prev + 1)}>
                  Siguiente
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}