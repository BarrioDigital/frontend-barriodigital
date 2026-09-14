import React, { useState } from 'react';
import { catalogClient } from '../api/axiosClient';

export const Catalog = () => {
  const [procedure, setProcedure] = useState({
    code: '',
    name: '',
    description: '',
    dailyQuota: ''
  });

  const [quotaUpdate, setQuotaUpdate] = useState({
    procedureId: '',
    addedQuota: ''
  });

  const [statusMessage, setStatusMessage] = useState('');

  // POST: Crear Trámite -> /api/catalog/procedures
  const handleCreateProcedure = async (e) => {
    e.preventDefault();
    try {
      const quotaNum = Number(procedure.dailyQuota);

      // JSON exacto requerido por ProcedureType.java
      const payload = {
        code: procedure.code,
        name: procedure.name,
        description: procedure.description,
        dailyQuota: quotaNum,
        availableQuota: quotaNum // Al crearse, los cupos disponibles son iguales al cupo diario inicial
      };

      await catalogClient.post('/api/catalog/procedures', payload);
      setStatusMessage('Trámite creado exitosamente en la base de datos.');
      setProcedure({ code: '', name: '', description: '', dailyQuota: '' });
    } catch (error) {
      console.error("Error al crear el trámite:", error.response?.data || error);
      const backendError = error.response?.data?.message || 'Error al conectar con el backend.';
      setStatusMessage(`Error: ${backendError}`);
    }
  };

  // PUT: Agregar Cupos -> /api/catalog/procedures/{id}/add-quota
  const handleUpdateQuota = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        addedQuota: Number(quotaUpdate.addedQuota)
      };

      await catalogClient.put(`/api/catalog/procedures/${quotaUpdate.procedureId}/add-quota`, payload);
      setStatusMessage('Cupos agregados exitosamente.');
      setQuotaUpdate({ procedureId: '', addedQuota: '' });
    } catch (error) {
      console.error("Error al actualizar cupos:", error.response?.data || error);
      const backendError = error.response?.data?.message || 'Error al actualizar cupos.';
      setStatusMessage(`Error: ${backendError}`);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Catálogo de Trámites y Gestión de Cupos</h2>
      
      {statusMessage && (
        <div style={{ padding: '10px', marginBottom: '15px', backgroundColor: '#e2e3e5', borderRadius: '4px' }}>
          <strong>{statusMessage}</strong>
        </div>
      )}

      {/* Formulario Crear Trámite */}
      <section style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Crear Nuevo Trámite</h3>
        <form onSubmit={handleCreateProcedure} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Código Único (Ej: LIC-001)" 
            value={procedure.code} 
            onChange={(e) => setProcedure({ ...procedure, code: e.target.value })} 
            required 
          />
          <input 
            type="text" 
            placeholder="Nombre del Trámite" 
            value={procedure.name} 
            onChange={(e) => setProcedure({ ...procedure, name: e.target.value })} 
            required 
          />
          <textarea 
            placeholder="Descripción" 
            value={procedure.description} 
            onChange={(e) => setProcedure({ ...procedure, description: e.target.value })} 
            required 
          />
          <input 
            type="number" 
            placeholder="Cupo Diario Inicial" 
            value={procedure.dailyQuota} 
            onChange={(e) => setProcedure({ ...procedure, dailyQuota: e.target.value })} 
            required 
          />
          <button type="submit" style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
            Guardar Trámite
          </button>
        </form>
      </section>

      {/* Formulario Agregar Cupos */}
      <section style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <h3>Agregar Cupos a Trámite Existente</h3>
        <form onSubmit={handleUpdateQuota} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            type="number" 
            placeholder="ID del Trámite (Ej: 1)" 
            value={quotaUpdate.procedureId} 
            onChange={(e) => setQuotaUpdate({ ...quotaUpdate, procedureId: e.target.value })} 
            required 
          />
          <input 
            type="number" 
            placeholder="Cantidad de cupos a agregar" 
            value={quotaUpdate.addedQuota} 
            onChange={(e) => setQuotaUpdate({ ...quotaUpdate, addedQuota: e.target.value })} 
            required 
          />
          <button type="submit" style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
            Agregar Cupos
          </button>
        </form>
      </section>
    </div>
  );
};