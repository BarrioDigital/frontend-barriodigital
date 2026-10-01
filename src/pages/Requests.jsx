import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { requestsClient, catalogClient } from '../api/axiosClient';

const cleanRut = (rut) => rut.replace(/[^0-9kK]/g, '');

const formatRut = (rutRaw) => {
  const cleaned = cleanRut(rutRaw).toUpperCase();
  if (!cleaned) return '';
  if (cleaned.length === 1) return cleaned;
  
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  let formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
};

const validateRut = (rutRaw) => {
  const cleaned = cleanRut(rutRaw).toUpperCase();
  if (cleaned.length < 8) return false;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDvNum = 11 - (sum % 11);
  let expectedDv = '';
  if (expectedDvNum === 11) expectedDv = '0';
  else if (expectedDvNum === 10) expectedDv = 'K';
  else expectedDv = expectedDvNum.toString();

  return dv === expectedDv;
};

export function Requests() {
  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();
  const userRoles = activeAccount?.idTokenClaims?.roles || [];
  const canManage = userRoles.includes('Admin') || userRoles.includes('Funcionario');

  const [requests, setRequests] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [newRequest, setNewRequest] = useState({
    procedureTypeId: '',
    citizenId: '',
    description: ''
  });

  const [rutError, setRutError] = useState('');
  const [showDetail, setShowDetail] = useState(false);

  // Modal / Selector Paginado de Trámites
  const [showModalProcedure, setShowModalProcedure] = useState(false);
  const [procSearch, setProcSearch] = useState('');
  const [procModalPage, setProcModalPage] = useState(1);
  const procModalItemsPerPage = 5;

  // Paginación Tabla Solicitudes
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const handleRutChange = (e) => {
    const val = e.target.value;
    const formatted = formatRut(val);
    
    setNewRequest({ ...newRequest, citizenId: formatted });

    if (cleanRut(formatted).length > 1) {
      if (!validateRut(formatted)) {
        setRutError('El RUT ingresado no es válido. Ej: 12.345.678-9 o 30.093.931-K');
      } else {
        setRutError('');
      }
    } else {
      setRutError('');
    }
  };

  const selectedProcedure = procedures.find(
    (p) => p.id.toString() === newRequest.procedureTypeId.toString()
  );

  const isQuotaAvailable = selectedProcedure ? selectedProcedure.availableQuota > 0 : true;

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);

    if (!newRequest.procedureTypeId) {
      alert('Debe seleccionar un trámite.');
      return;
    }

    if (!validateRut(newRequest.citizenId)) {
      setRutError('Debe ingresar un RUT chileno válido antes de continuar.');
      return;
    }

    if (selectedProcedure && selectedProcedure.availableQuota <= 0) {
      alert('No es posible ingresar la solicitud: El trámite seleccionado no tiene cupos disponibles.');
      return;
    }

    try {
      await requestsClient.post('/api/requests', {
        ...newRequest,
        procedureTypeId: parseInt(newRequest.procedureTypeId, 10)
      });
      setNewRequest({ procedureTypeId: '', citizenId: '', description: '' });
      setShowDetail(false);
      setRutError('');
      setCurrentPage(1);
      setSuccessMsg('Solicitud ingresada con éxito.');
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
      setSuccessMsg('Estado y cuadrilla actualizados correctamente.');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar estado/cuadrilla');
    }
  };

  const filteredProcedures = procedures.filter(p => 
    p.name.toLowerCase().includes(procSearch.toLowerCase()) || 
    p.code.toLowerCase().includes(procSearch.toLowerCase())
  );

  const totalProcModalPages = Math.ceil(filteredProcedures.length / procModalItemsPerPage) || 1;
  const currentProcModalItems = filteredProcedures.slice(
    (procModalPage - 1) * procModalItemsPerPage,
    procModalPage * procModalItemsPerPage
  );

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

  const sortedRequests = [...requests].reverse();
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage) || 1;
  const currentRequests = sortedRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container py-4">
      <h2 className="fw-bold text-primary mb-4">Gestión de Solicitudes</h2>

      {error && <div className="alert alert-danger shadow-sm">{error}</div>}
      {successMsg && <div className="alert alert-success shadow-sm alert-dismissible fade show" role="alert">{successMsg}</div>}

      {/* Formulario de Ingreso */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-primary text-white fw-semibold">
          Ingresar Nueva Solicitud
        </div>
        <div className="card-body">
          <form onSubmit={handleCreateSubmit} className="row g-3">
            
            {/* Campo Tipo de Trámite como Botón Único con Lupa */}
            <div className="col-md-6">
              <label className="form-label fw-bold d-block">Tipo de Trámite</label>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className={`btn ${selectedProcedure ? 'btn-outline-primary fw-semibold' : 'btn-primary'} text-start flex-grow-1`}
                  onClick={() => setShowModalProcedure(true)}
                >
                  🔍 {selectedProcedure ? `[${selectedProcedure.code}] ${selectedProcedure.name}` : 'Seleccionar trámite'}
                </button>

                {selectedProcedure && (
                  <button
                    type="button"
                    className={`btn ${showDetail ? 'btn-info text-white' : 'btn-outline-info'}`}
                    onClick={() => setShowDetail(!showDetail)}
                  >
                    {showDetail ? 'Ocultar' : 'Ver detalle'}
                  </button>
                )}
              </div>
            </div>

            {/* RUT */}
            <div className="col-md-6">
              <label className="form-label fw-bold">RUT / ID Ciudadano</label>
              <input
                type="text"
                className={`form-control ${rutError ? 'is-invalid' : ''}`}
                placeholder="Ej: 30.093.931-1"
                value={newRequest.citizenId}
                onChange={handleRutChange}
                maxLength="12"
                required
              />
              {rutError ? (
                <div className="invalid-feedback d-block fw-semibold">{rutError}</div>
              ) : (
                <div className="form-text">Formato automático aplicado: XX.XXX.XXX-X</div>
              )}
            </div>

            {showDetail && selectedProcedure && (
              <div className="col-12">
                <div className="alert alert-info border-info mb-0 d-flex justify-content-between align-items-center shadow-sm">
                  <div>
                    <h6 className="fw-bold mb-1">
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

            {!isQuotaAvailable && (
              <div className="col-12">
                <div className="alert alert-warning mb-0 text-dark border-warning">
                  ⚠ <strong>Sin cupos disponibles:</strong> El trámite seleccionado ha agotado sus cupos diarios.
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
              <button 
                type="submit" 
                className="btn btn-success px-4" 
                disabled={!isQuotaAvailable || !!rutError || !newRequest.procedureTypeId}
              >
                Enviar Solicitud
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL TRÁMITES SOLICITUDES */}
      {showModalProcedure && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Seleccionar Tipo de Trámite</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModalProcedure(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Filtrar por código o nombre de trámite..."
                    value={procSearch}
                    onChange={(e) => {
                      setProcSearch(e.target.value);
                      setProcModalPage(1);
                    }}
                  />
                </div>

                <div className="list-group mb-3">
                  {currentProcModalItems.length === 0 ? (
                    <div className="text-center py-3 text-muted">No se encontraron trámites coincidentes.</div>
                  ) : (
                    currentProcModalItems.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${newRequest.procedureTypeId.toString() === p.id.toString() ? 'active' : ''}`}
                        onClick={() => {
                          setNewRequest({ ...newRequest, procedureTypeId: p.id.toString() });
                          setShowModalProcedure(false);
                        }}
                      >
                        <div>
                          <span className="badge bg-secondary me-2">{p.code}</span>
                          <strong>{p.name}</strong>
                          <div className="small text-muted">{p.description || 'Sin descripción'}</div>
                        </div>
                        <span className={`badge ${p.availableQuota > 0 ? 'bg-success' : 'bg-danger'}`}>
                          {p.availableQuota > 0 ? `${p.availableQuota} cupos` : 'Sin cupos'}
                        </span>
                      </button>
                    ))
                  )}
                </div>

                {filteredProcedures.length > procModalItemsPerPage && (
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <span className="small text-muted">
                      Página {procModalPage} de {totalProcModalPages}
                    </span>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${procModalPage === 1 ? 'disabled' : ''}`}>
                        <button type="button" className="page-link" onClick={() => setProcModalPage(prev => prev - 1)}>Anterior</button>
                      </li>
                      <li className={`page-item ${procModalPage === totalProcModalPages ? 'disabled' : ''}`}>
                        <button type="button" className="page-link" onClick={() => setProcModalPage(prev => prev + 1)}>Siguiente</button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModalProcedure(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Tabla */}
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
                      <td><span className="fw-semibold">{req.citizenId}</span></td>
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

        {sortedRequests.length > itemsPerPage && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
            <span className="small text-muted">
              Página {currentPage} de {totalPages} ({sortedRequests.length} registros en total)
            </span>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage((prev) => prev - 1)}>Anterior</button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(page)}>{page}</button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage((prev) => prev + 1)}>Siguiente</button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}