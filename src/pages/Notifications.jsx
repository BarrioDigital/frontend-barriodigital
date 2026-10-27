import React, { useState } from 'react';
import { requestsClient } from '../api/axiosClient';

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

export function Notifications() {
  const [citizenId, setCitizenId] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleRutChange = (e) => {
    setCitizenId(formatRut(e.target.value));
  };

  const fetchNotifications = async () => {
    if (!citizenId.trim()) {
      alert('Por favor ingrese un RUT válido.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      
      // Obtener el historial completo persistido en la BD
      const res = await requestsClient.get(`/api/requests/notifications?citizenId=${encodeURIComponent(citizenId.trim())}`);
      const rawData = Array.isArray(res.data) ? res.data : [];

      // =========================================================================
      // AGRUPACIÓN POR requestId EN MEMORIA CLIENTE
      // =========================================================================
      const groupedMap = rawData.reduce((acc, current) => {
        const reqId = current.requestId;

        // Si por alguna razón un registro no posee requestId, se muestra independiente
        if (!reqId) {
          acc[`single_${current.id}`] = { ...current };
          return acc;
        }

        if (!acc[reqId]) {
          // Si es la primera vez que encontramos esta solicitud, la registramos en el mapa
          acc[reqId] = { ...current };
        } else {
          // Si ya existía una entrada para este requestId, aplicamos la unificación:
          const existing = acc[reqId];

          // 1. Si cualquiera de las notificaciones viene como 'RESUELTO', forzamos el estado a RESUELTO
          const isResolved = current.status === 'RESUELTO' || existing.status === 'RESUELTO';
          const finalStatus = isResolved ? 'RESUELTO' : current.status;

          // 2. Definimos el mensaje unificado si la solicitud está resuelta
          let finalMessage = existing.message;
          if (isResolved) {
            finalMessage = 'Tu solicitud ha sido RESUELTA.';
          } else if (new Date(current.createdAt) > new Date(existing.createdAt)) {
            finalMessage = current.message;
          }

          // 3. Conservamos la fecha más reciente
          const latestDate = new Date(current.createdAt) > new Date(existing.createdAt) 
            ? current.createdAt 
            : existing.createdAt;

          acc[reqId] = {
            ...existing,
            status: finalStatus,
            message: finalMessage,
            createdAt: latestDate
          };
        }

        return acc;
      }, {});

      // Convertir el objeto agrupado a un Array y ordenarlo por fecha descendente
      const groupedList = Object.values(groupedMap).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setNotifications(groupedList);
      setSearched(true);
    } catch (err) {
      console.error('Error al consultar notificaciones:', err);
      setError('No se pudo obtener el historial de notificaciones.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = (reqId, citizenRut) => {
    const content = `=================================================\n` +
                    `      MUNICIPALIDAD DE BARRIO DIGITAL\n` +
                    `      CERTIFICADO DE TRAMITE RESUELTO\n` +
                    `=================================================\n\n` +
                    `FOLIO SOLICITUD : #${reqId}\n` +
                    `RUT VECINO      : ${citizenRut}\n` +
                    `ESTADO          : RESUELTO\n` +
                    `FECHA EMISION   : ${new Date().toLocaleString('es-CL')}\n\n` +
                    `El presente documento acredita la resolucion exitosa\n` +
                    `de su requerimiento en la plataforma BarrioDigital.\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Certificado_Solicitud_${reqId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container py-4">
      <h2 className="fw-bold text-primary mb-1">Bandeja de Notificaciones</h2>
      <p className="text-muted mb-4">Ingrese el RUT para revisar las actualizaciones de sus trámites y descargar sus comprobantes.</p>

      <div className="card shadow-sm border-0 mb-4 p-3 bg-light">
        <div className="row g-2 align-items-center">
          <div className="col-md-5">
            <input
              type="text"
              className="form-control"
              placeholder="Ej: 30.093.931-1"
              value={citizenId}
              onChange={handleRutChange}
              maxLength="12"
            />
          </div>
          <div className="col-md-3">
            <button className="btn btn-primary w-100 fw-semibold" onClick={fetchNotifications} disabled={loading}>
              {loading ? 'Consultando...' : '🔍 Buscar Notificaciones'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger shadow-sm">{error}</div>}

      {searched && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-dark text-white fw-semibold">
            Notificaciones y Certificados Encontrados ({notifications.length})
          </div>
          <div className="list-group list-group-flush">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted">
                No existen registros ni notificaciones asociadas al RUT <strong>{citizenId}</strong>.
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.requestId || n.id} className="list-group-item p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="badge bg-primary">Solicitud #{n.requestId}</span>
                      <span className={`badge ${n.status === 'RESUELTO' ? 'bg-success' : 'bg-info text-dark'}`}>
                        {n.status}
                      </span>
                      <small className="text-muted ms-2">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString('es-CL') : ''}
                      </small>
                    </div>
                    <p className="mb-0 text-secondary">{n.message}</p>
                  </div>

                  {n.status === 'RESUELTO' && (
                    <button
                      className="btn btn-success btn-sm ms-3 text-nowrap fw-semibold"
                      onClick={() => handleDownloadCertificate(n.requestId, n.citizenId)}
                    >
                      📄 Descargar Certificado
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}