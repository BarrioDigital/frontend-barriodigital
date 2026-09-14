import React, { useState } from 'react';
import { axiosClient } from '../api/axiosClient';

export const Requests = () => {
  const [requestData, setRequestData] = useState({ procedureId: '', details: '' });
  const [updateStatusData, setUpdateStatusData] = useState({ requestId: '', newStatus: 'RESUELTO' });
  const [statusMessage, setStatusMessage] = useState('');

  // POST: Vecino crea solicitud
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/requests', requestData);
      setStatusMessage('Solicitud enviada con éxito.');
      setRequestData({ procedureId: '', details: '' });
    } catch (error) {
      console.error(error);
      setStatusMessage('Error al crear la solicitud.');
    }
  };

  // PUT: Funcionario cambia el estado de la solicitud
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.put(`/requests/${updateStatusData.requestId}/status`, {
        status: updateStatusData.newStatus,
      });
      setStatusMessage(`Estado actualizado a ${updateStatusData.newStatus}.`);
      setUpdateStatusData({ requestId: '', newStatus: 'RESUELTO' });
    } catch (error) {
      console.error(error);
      setStatusMessage('Error al actualizar el estado.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Gestión de Solicitudes Vecinales</h2>
      {statusMessage && <p style={{ color: 'blue', fontWeight: 'bold' }}>{statusMessage}</p>}

      {/* Formulario Crear Solicitud (Vecino) */}
      <section style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>Crear Solicitud de Trámite (Vecino)</h3>
        <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="ID del Trámite a Solicitar" 
            value={requestData.procedureId} 
            onChange={(e) => setRequestData({ ...requestData, procedureId: e.target.value })} 
            required 
          />
          <textarea 
            placeholder="Detalles / Motivo de la solicitud" 
            value={requestData.details} 
            onChange={(e) => setRequestData({ ...requestData, details: e.target.value })} 
            required 
          />
          <button type="submit" style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', padding: '10px' }}>
            Enviar Solicitud
          </button>
        </form>
      </section>

      {/* Tabla Operativa / Cambio de Estado (Funcionario) */}
      <section style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h3>Gestión de Estado (Funcionario)</h3>
        <form onSubmit={handleUpdateStatus} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="ID de Solicitud" 
            value={updateStatusData.requestId} 
            onChange={(e) => setUpdateStatusData({ ...updateStatusData, requestId: e.target.value })} 
            required 
          />
          <select 
            value={updateStatusData.newStatus} 
            onChange={(e) => setUpdateStatusData({ ...updateStatusData, newStatus: e.target.value })}
          >
            <option value="INGRESADO">INGRESADO</option>
            <option value="EN_PROCESO">EN_PROCESO</option>
            <option value="RESUELTO">RESUELTO</option>
            <option value="RECHAZADO">RECHAZADO</option>
          </select>
          <button type="submit" style={{ backgroundColor: '#ffc107', color: 'black', border: 'none', padding: '10px' }}>
            Actualizar Estado
          </button>
        </form>
      </section>
    </div>
  );
};