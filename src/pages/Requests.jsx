import React, { useState } from 'react';
import { requestsClient } from '../api/axiosClient';

export const Requests = () => {
  const [formData, setFormData] = useState({
    procedureTypeId: '',
    citizenId: '',
    description: '',
  });

  const [statusUpdate, setStatusUpdate] = useState({
    requestId: '',
    status: 'ADMITIDO',
    crew: '',
  });

  const [statusMessage, setStatusMessage] = useState('');

  // POST: Vecino crea solicitud -> /api/requests
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        procedureTypeId: Number(formData.procedureTypeId),
        citizenId: formData.citizenId,
        description: formData.description,
      };

      await requestsClient.post('/api/requests', payload);
      setStatusMessage('Solicitud ingresada correctamente y cupo descontado.');
      setFormData({ procedureTypeId: '', citizenId: '', description: '' });
    } catch (error) {
      console.error("Error al crear la solicitud:", error.response?.data || error);
      const backendError = error.response?.data?.message || 'Error al conectar con el microservicio de solicitudes.';
      setStatusMessage(`Error: ${backendError}`);
    }
  };

  // PUT: Funcionario actualiza el estado de la solicitud -> /api/requests/{id}/status
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        status: statusUpdate.status,
        crew: statusUpdate.crew || null,
      };

      await requestsClient.put(`/api/requests/${statusUpdate.requestId}/status`, payload);
      setStatusMessage(`Estado actualizado a ${statusUpdate.status} exitosamente.`);
      setStatusUpdate({ requestId: '', status: 'ADMITIDO', crew: '' });
    } catch (error) {
      console.error("Error al actualizar estado:", error.response?.data || error);
      const backendError = error.response?.data?.message || 'Error al actualizar el estado.';
      setStatusMessage(`Error: ${backendError}`);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Gestión de Solicitudes Vecinales</h2>
      
      {statusMessage && (
        <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#e2e3e5', borderRadius: '4px' }}>
          <strong>{statusMessage}</strong>
        </div>
      )}

      {/* Formulario Crear Solicitud */}
      <section style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Crear Solicitud de Trámite (Vecino)</h3>
        <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            type="number" 
            placeholder="ID del Trámite (Ej: 1)" 
            value={formData.procedureTypeId} 
            onChange={(e) => setFormData({ ...formData, procedureTypeId: e.target.value })} 
            required 
          />
          <input 
            type="text" 
            placeholder="RUT / DNI del Ciudadano (Ej: 12345678-9)" 
            value={formData.citizenId} 
            onChange={(e) => setFormData({ ...formData, citizenId: e.target.value })} 
            required 
          />
          <textarea 
            placeholder="Detalles / Motivo de la solicitud" 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
            required 
          />
          <button type="submit" style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
            Enviar Solicitud
          </button>
        </form>
      </section>

      {/* Formulario Cambio de Estado */}
      <section style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <h3>Cambiar Estado de Solicitud (Funcionario)</h3>
        <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            type="number" 
            placeholder="ID de la Solicitud (Ej: 1)" 
            value={statusUpdate.requestId} 
            onChange={(e) => setStatusUpdate({ ...statusUpdate, requestId: e.target.value })} 
            required 
          />
          <select 
            value={statusUpdate.status} 
            onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
            style={{ padding: '8px' }}
          >
            <option value="INGRESADO">INGRESADO</option>
            <option value="ADMITIDO">ADMITIDO</option>
            <option value="EN_GESTION">EN_GESTION</option>
            <option value="EN_TERRENO">EN_TERRENO</option>
            <option value="RESUELTO">RESUELTO</option>
            <option value="RECHAZADO">RECHAZADO</option>
          </select>
          <input 
            type="text" 
            placeholder="Cuadrilla Asignada (Opcional)" 
            value={statusUpdate.crew} 
            onChange={(e) => setStatusUpdate({ ...statusUpdate, crew: e.target.value })} 
          />
          <button type="submit" style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
            Actualizar Estado
          </button>
        </form>
      </section>
    </div>
  );
};