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
      
      const res = await requestsClient.get(`/api/requests/notifications?citizenId=${encodeURIComponent(citizenId.trim())}`);
      const rawData = Array.isArray(res.data) ? res.data : [];

      // =========================================================================
      // AGRUPACIÓN INTELIGENTE POR REQUEST_ID O VENTANA TEMPORAL
      // =========================================================================
      const groupedList = [];

      // Ordenar cronológicamente ascendente para agrupar eventos cercanos
      const sortedAsc = [...rawData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      sortedAsc.forEach((item) => {
        // Intentar obtener requestId real si viene en la propiedad
        let realReqId = item.requestId;

        // Si requestId no existe, buscar coincidencia temporal con alguna notificación ya agrupada
        const itemTime = new Date(item.createdAt).getTime();

        const matchIndex = groupedList.findIndex((group) => {
          // Si ambos tienen requestId real
          if (realReqId && group.requestId && realReqId === group.requestId) {
            return true;
          }
          // Si son eventos del mismo estado 'RESUELTO' emitidos con menos de 5 segundos de diferencia
          const groupTime = new Date(group.createdAt).getTime();
          const timeDiff = Math.abs(itemTime - groupTime);
          const bothResolved = item.status === 'RESUELTO' && group.status === 'RESUELTO';

          return bothResolved && timeDiff < 5000; // Ventana de 5 segundos
        });

        if (matchIndex === -1) {
          // Si no hace match con ninguna existente, crear un nuevo grupo
          groupedList.push({
            ...item,
            displayReqId: realReqId || item.id,
            status: item.status,
            message: item.status === 'RESUELTO' ? 'Tu solicitud ha sido RESUELTA.' : item.message
          });
        } else {
          // Si hace match, unificar el grupo existente
          const group = groupedList[matchIndex];
          group.status = (item.status === 'RESUELTO' || group.status === 'RESUELTO') ? 'RESUELTO' : item.status;
          group.message = 'Tu solicitud ha sido RESUELTA.';
          if (new Date(item.createdAt) > new Date(group.createdAt)) {
            group.createdAt = item.createdAt;
          }
        }
      });

      // Ordenar la lista final de forma descendente para mostrar las más recientes arriba
      groupedList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
                <div key={n.id} className="list-group-item p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="badge bg-primary">Solicitud #{n.displayReqId}</span>
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
                      onClick={() => handleDownloadCertificate(n.displayReqId, n.citizenId)}
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