import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { catalogClient } from '../api/axiosClient';

const PROCEDURE_CATALOG = [
  {
    code: 'TRM-01',
    category: 'TRM-01 (Permisos de Edificación y Obras)',
    names: [
      'Permiso de Obra Menor',
      'Permiso de Edificación Nueva',
      'Certificado de Recepción Definitiva de Obras',
      'Certificado de Numeral Municipal'
    ]
  },
  {
    code: 'TRM-02',
    category: 'TRM-02 (Licencias de Conducir e Inspección)',
    names: [
      'Obtención Licencia de Conducir Clase B',
      'Renovación Licencia de Conducir',
      'Duplicado de Licencia de Conducir',
      'Licencia Profesional Clase A1 / A2 / A4'
    ]
  },
  {
    code: 'TRM-03',
    category: 'TRM-03 (Patentes Comerciales y Actividades)',
    names: [
      'Patente Comercial Definitiva',
      'Patente Microempresa Familiar (MEF)',
      'Patente Profesional / Técnica',
      'Permiso para Feria Libre / Comerciante Ambulante'
    ]
  },
  {
    code: 'TRM-04',
    category: 'TRM-04 (Aseo, Ornato y Gestión de Residuos)',
    names: [
      'Exención / Cobro de Derechos de Aseo Domiciliario',
      'Solicitud de Retiro de Escombros y Enseres',
      'Certificado de Deuda de Aseo'
    ]
  },
  {
    code: 'TRM-05',
    category: 'TRM-05 (Asistencia Social y Subsidios)',
    names: [
      'Postulación a Subsidio de Agua Potable (SAP)',
      'Registro Social de Hogares (Actualización / Solicitud)',
      'Entrega de Ayuda Social de Emergencia'
    ]
  },
  {
    code: 'TRM-06',
    category: 'TRM-06 (Uso de Espacios Públicos y Eventos)',
    names: [
      'Permiso de Ocupación de Bien Nacional de Uso Público',
      'Autorización de Eventos Comunitarios en Vía Pública',
      'Arriendo / Reserva de Multicanchas Deportivas'
    ]
  }
];

export function Catalog() {
  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();
  const userRoles = activeAccount?.idTokenClaims?.roles || [];
  const isAdmin = userRoles.includes('Admin');

  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal selector para el Nombre del Trámite en Catálogo
  const [showModalName, setShowModalName] = useState(false);
  const [nameSearch, setNameSearch] = useState('');
  const [modalNamePage, setModalNamePage] = useState(1);
  const modalItemsPerPage = 5;

  // Paginación Tabla Principal
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Formulario
  const [newProcedure, setNewProcedure] = useState({
    code: '',
    name: '',
    customName: '',
    description: '',
    dailyQuota: ''
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

  const handleCodeChange = (e) => {
    setNewProcedure({
      ...newProcedure,
      code: e.target.value,
      name: '',
      customName: ''
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);

    const finalName = newProcedure.name === 'CUSTOM' ? newProcedure.customName.trim() : newProcedure.name;

    if (!finalName) {
      alert('Por favor ingrese o seleccione un nombre válido para el trámite.');
      return;
    }

    const dailyQuotaNumber = parseInt(newProcedure.dailyQuota, 10);

    try {
      await catalogClient.post('/api/catalog/procedures', {
        code: newProcedure.code,
        name: finalName,
        description: newProcedure.description,
        dailyQuota: dailyQuotaNumber,
        availableQuota: dailyQuotaNumber
      });

      setNewProcedure({ code: '', name: '', customName: '', description: '', dailyQuota: '' });
      setCurrentPage(1);
      setSuccessMsg('Trámite registrado e integrado al catálogo exitosamente.');
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
        addedQuota: parseInt(addedQuota, 10)
      });
      setSelectedId(null);
      setAddedQuota('');
      setSuccessMsg('Cupos añadidos correctamente.');
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

  // Lista de nombres dinámicos
  const selectedCategoryObj = PROCEDURE_CATALOG.find((cat) => cat.code === newProcedure.code);
  let availableNames = selectedCategoryObj ? [...selectedCategoryObj.names] : [];

  if (newProcedure.code) {
    const existingCustomNames = procedures
      .filter((p) => p.code === newProcedure.code && !availableNames.includes(p.name))
      .map((p) => p.name);

    availableNames = [...new Set([...availableNames, ...existingCustomNames])];
  }

  // Búsqueda y Paginación dentro del Modal de Catálogo
  const filteredNames = availableNames.filter((n) =>
    n.toLowerCase().includes(nameSearch.toLowerCase())
  );

  const totalModalPages = Math.ceil(filteredNames.length / modalItemsPerPage) || 1;
  const currentModalNames = filteredNames.slice(
    (modalNamePage - 1) * modalItemsPerPage,
    modalNamePage * modalItemsPerPage
  );

  const sortedProcedures = [...procedures].reverse();
  const totalPages = Math.ceil(sortedProcedures.length / itemsPerPage) || 1;
  const currentProcedures = sortedProcedures.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary mb-0">Catálogo de Trámites</h2>
      </div>

      {error && <div className="alert alert-danger shadow-sm">{error}</div>}
      {successMsg && <div className="alert alert-success shadow-sm alert-dismissible fade show" role="alert">{successMsg}</div>}

      {/* Formulario de creación */}
      {isAdmin && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-primary text-white fw-semibold">
            Crear Nuevo Trámite
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateSubmit} className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">1. Código de Categoría</label>
                <select
                  className="form-select"
                  value={newProcedure.code}
                  onChange={handleCodeChange}
                  required
                >
                  <option value="">-- Seleccione un código --</option>
                  {PROCEDURE_CATALOG.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo Nombre del Trámite como Botón Único SIN Lupa */}
              <div className="col-md-6">
                <label className="form-label fw-bold d-block">2. Nombre del Trámite</label>
                <button
                  type="button"
                  className={`btn ${newProcedure.name ? 'btn-outline-primary fw-semibold' : 'btn-primary'} w-100 text-start`}
                  disabled={!newProcedure.code}
                  onClick={() => setShowModalName(true)}
                >
                  {!newProcedure.code
                    ? '-- Primero seleccione un código --'
                    : newProcedure.name === 'CUSTOM'
                    ? '➕ OTRO (Escribir manualmente...)'
                    : newProcedure.name || 'Seleccionar trámite'}
                </button>
              </div>

              {newProcedure.name === 'CUSTOM' && (
                <div className="col-md-12">
                  <div className="p-3 bg-light rounded border">
                    <label className="form-label fw-bold text-primary">Nombre personalizado del Trámite</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ingrese el nombre exacto del nuevo trámite personalizado..."
                      value={newProcedure.customName}
                      onChange={(e) => setNewProcedure({ ...newProcedure, customName: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="col-md-8">
                <label className="form-label fw-bold">Descripción</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Descripción detallada del trámite municipal..."
                  value={newProcedure.description}
                  onChange={(e) => setNewProcedure({ ...newProcedure, description: e.target.value })}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-bold">Cupo Diario</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  placeholder="Ej: 50"
                  value={newProcedure.dailyQuota}
                  onChange={(e) => setNewProcedure({ ...newProcedure, dailyQuota: e.target.value })}
                  required
                />
              </div>

              <div className="col-12 text-end mt-3">
                <button type="submit" className="btn btn-success px-4" disabled={!newProcedure.name}>
                  Registrar Trámite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOMBRE DEL TRÁMITE (CATÁLOGO) */}
      {showModalName && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">Seleccionar Nombre del Trámite</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModalName(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar nombre de trámite..."
                    value={nameSearch}
                    onChange={(e) => {
                      setNameSearch(e.target.value);
                      setModalNamePage(1);
                    }}
                  />
                </div>

                <div className="list-group mb-3">
                  {currentModalNames.length === 0 && !nameSearch ? (
                    <div className="text-center py-3 text-muted">No hay nombres registrados para esta categoría.</div>
                  ) : (
                    currentModalNames.map((name, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`list-group-item list-group-item-action ${newProcedure.name === name ? 'active' : ''}`}
                        onClick={() => {
                          setNewProcedure({ ...newProcedure, name: name });
                          setShowModalName(false);
                        }}
                      >
                        {name}
                      </button>
                    ))
                  )}

                  {/* Opción para escribir personalizado */}
                  <button
                    type="button"
                    className={`list-group-item list-group-item-action text-primary fw-bold ${newProcedure.name === 'CUSTOM' ? 'active text-white' : ''}`}
                    onClick={() => {
                      setNewProcedure({ ...newProcedure, name: 'CUSTOM' });
                      setShowModalName(false);
                    }}
                  >
                    ➕ OTRO (Escribir manualmente...)
                  </button>
                </div>

                {filteredNames.length > modalItemsPerPage && (
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <span className="small text-muted">
                      Página {modalNamePage} de {totalModalPages}
                    </span>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${modalNamePage === 1 ? 'disabled' : ''}`}>
                        <button type="button" className="page-link" onClick={() => setModalNamePage(prev => prev - 1)}>Anterior</button>
                      </li>
                      <li className={`page-item ${modalNamePage === totalModalPages ? 'disabled' : ''}`}>
                        <button type="button" className="page-link" onClick={() => setModalNamePage(prev => prev + 1)}>Siguiente</button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModalName(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recarga de Cupos */}
      {isAdmin && selectedId && (
        <div className="card shadow-sm border-info mb-4 bg-light">
          <div className="card-body">
            <h5 className="card-title text-info fw-bold">Añadir Cupos al Trámite #ID: {selectedId}</h5>
            <form onSubmit={handleAddQuotaSubmit} className="row g-3 align-items-center mt-1">
              <div className="col-auto">
                <input
                  type="number"
                  min="1"
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

      {/* Tabla */}
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
                {currentProcedures.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? "7" : "6"} className="text-center py-4 text-muted">
                      No hay trámites registrados en el catálogo.
                    </td>
                  </tr>
                ) : (
                  currentProcedures.map((proc) => (
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

        {sortedProcedures.length > itemsPerPage && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
            <span className="small text-muted">
              Página {currentPage} de {totalPages} ({sortedProcedures.length} registros en total)
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