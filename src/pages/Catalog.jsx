import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { catalogClient } from '../api/axiosClient';

// Opciones predefinidas para el Combo Box de Códigos de Trámite
const PREDEFINED_CODES = [
  { code: 'TRM-01', label: 'TRM-01 (Permisos de Edificación y Obras)' },
  { code: 'TRM-02', label: 'TRM-02 (Licencias de Conducir e Inspección)' },
  { code: 'TRM-03', label: 'TRM-03 (Patentes Comerciales y Actividades)' },
  { code: 'TRM-04', label: 'TRM-04 (Aseo, Ornato y Gestión de Residuos)' },
  { code: 'TRM-05', label: 'TRM-05 (Asistencia Social y Subsidios)' },
  { code: 'TRM-06', label: 'TRM-06 (Uso de Espacios Públicos y Eventos)' }
];

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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center my-5">
        <div className="spinner-border text-primary me-2" role="status"></div>
        <span>Cargando catálogo de trámites...</span>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary mb-0">Catálogo de Trámites</h2>
      </div>

      {error && <div className="alert alert-danger shadow-sm">{error}</div>}

      {/* Formulario de creación disponible únicamente para Admin */}
      {isAdmin && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-primary text-white fw-semibold">
            Crear Nuevo Trámite
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateSubmit} className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Código de Trámite</label>
                <select
                  className="form-select"
                  value={newProcedure.code}
                  onChange={(e) => setNewProcedure({ ...newProcedure, code: e.target.value })}
                  required
                >
                  <option value="">-- Seleccione un código --</option>
                  {PREDEFINED_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold">Nombre del Trámite</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Licencia de Conducir Clase B"
                  value={newProcedure.name}
                  onChange={(e) => setNewProcedure({ ...newProcedure, name: e.target.value })}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-bold">Descripción</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Descripción detallada del trámite municipal..."
                  value={newProcedure.description}
                  onChange={(e) => setNewProcedure({ ...newProcedure, description: e.target.value })}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold">Cupo Diario</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ej: 50"
                  value={newProcedure.dailyQuota}
                  onChange={(e) => setNewProcedure({ ...newProcedure, dailyQuota: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold">Cupo Disponible Inicial</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ej: 50"
                  value={newProcedure.availableQuota}
                  onChange={(e) => setNewProcedure({ ...newProcedure, availableQuota: e.target.value })}
                  required
                />
              </div>

              <div className="col-12 text-end mt-3">
                <button type="submit" className="btn btn-success px-4">
                  Registrar Trámite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Panel de recarga de cupos para Admin */}
      {isAdmin && selectedId && (
        <div className="card shadow-sm border-info mb-4 bg-light">
          <div className="card-body">
            <h5 className="card-title text-info fw-bold">Añadir Cupos al Trámite #ID: {selectedId}</h5>
            <form onSubmit={handleAddQuotaSubmit} className="row g-3 align-items-center mt-1">
              <div className="col-auto">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Cantidad a sumar"
                  value={addedQuota}
                  onChange={(e) => setAddedQuota(e.target.value)}
                  required
                />
              </div>
              <div className="col-auto">
                <button type="submit" className="btn btn-info text-white">Guardar</button>
              </div>
              <div className="col-auto">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setSelectedId(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de Trámites */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-striped align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Cupo Diario</th>
                  <th>Cupo Disponible</th>
                  {isAdmin && <th className="text-center">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {procedures.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? "7" : "6"} className="text-center py-4 text-muted">
                      No hay trámites registrados en el catálogo.
                    </td>
                  </tr>
                ) : (
                  procedures.map((proc) => (
                    <tr key={proc.id}>
                      <td className="fw-bold">{proc.id}</td>
                      <td><span className="badge bg-secondary">{proc.code}</span></td>
                      <td className="fw-semibold">{proc.name}</td>
                      <td>{proc.description || 'N/A'}</td>
                      <td>{proc.dailyQuota}</td>
                      <td>
                        <span className={`badge ${proc.availableQuota > 0 ? 'bg-success' : 'bg-danger'}`}>
                          {proc.availableQuota}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setSelectedId(proc.id)}
                          >
                            + Añadir Cupos
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
      </div>
    </div>
  );
}