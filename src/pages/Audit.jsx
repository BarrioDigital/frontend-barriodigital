import React, { useEffect, useState } from 'react';
import { axiosClient } from '../api/axiosClient';

export const Audit = () => {
  const [events, setEvents] = useState([]);
  const [requestId, setRequestId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarTodos = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axiosClient.get('/api/audit');
      setEvents(response.data);

    } catch (error) {
      console.error(error);
      setError('No se pudo cargar la auditoría.');

    } finally {
      setLoading(false);
    }
  };

  const buscarPorSolicitud = async () => {
    if (!requestId) {
      cargarTodos();
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axiosClient.get(
        `/api/audit/request/${requestId}`
      );

      setEvents(response.data);

    } catch (error) {
      console.error(error);
      setError('No se pudo consultar la solicitud.');

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodos();
  }, []);

  return (
    <div>

      <h2 style={{ textAlign: 'center' }}>
        Auditoría
      </h2>

      <p style={{ textAlign: 'center' }}>
        Historial cronológico de cambios de las solicitudes
      </p>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginTop: '25px',
          marginBottom: '30px'
        }}
      >

        <input
          type="number"
          placeholder="ID de solicitud"
          value={requestId}
          onChange={(e) => setRequestId(e.target.value)}
          style={{
            padding: '10px',
            width: '200px',
            border: '1px solid #ccc',
            borderRadius: '6px'
          }}
        />

        <button
          onClick={buscarPorSolicitud}
          style={{
            padding: '10px 18px',
            cursor: 'pointer'
          }}
        >
          Buscar
        </button>

        <button
          onClick={() => {
            setRequestId('');
            cargarTodos();
          }}
          style={{
            padding: '10px 18px',
            cursor: 'pointer'
          }}
        >
          Ver todos
        </button>

      </div>

      {loading && (
        <p style={{ textAlign: 'center' }}>
          Cargando auditoría...
        </p>
      )}

      {error && (
        <p style={{ textAlign: 'center' }}>
          {error}
        </p>
      )}

      {!loading && !error && events.length === 0 && (
        <p style={{ textAlign: 'center' }}>
          No existen eventos de auditoría.
        </p>
      )}

      {!loading && !error && events.length > 0 && (

        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto'
          }}
        >

          {events.map((event) => (

            <div
              key={event.id}
              style={{
                borderLeft: '4px solid #0078d4',
                padding: '15px 20px',
                marginBottom: '20px',
                backgroundColor: '#f7f9fb',
                borderRadius: '6px'
              }}
            >

              <h3>
                Solicitud #{event.requestId}
              </h3>

              <p>
                Estado:
                {' '}
                {event.oldStatus || 'Sin estado'}
                {' → '}
                <strong>
                  {event.newStatus || 'Sin estado'}
                </strong>
              </p>

              <p>
                Evento:
                {' '}
                {event.eventType || 'Sin información'}
              </p>

              <p>
                Fecha:
                {' '}
                {event.eventTimestamp
                  ? new Date(event.eventTimestamp)
                      .toLocaleString('es-CL')
                  : 'Sin fecha'}
              </p>

            </div>

          ))}

        </div>

      )}

    </div>
  );
};