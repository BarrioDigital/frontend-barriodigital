import React, { useState } from 'react';
import { axiosClient } from '../api/axiosClient';

export const Catalog = () => {
  const [procedure, setProcedure] = useState({ name: '', description: '', dailyQuota: '' });
  const [quotaUpdate, setQuotaUpdate] = useState({ procedureId: '', newQuota: '' });
  const [statusMessage, setStatusMessage] = useState('');

  // POST: Crear Trámite
  const handleCreateProcedure = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/catalog/procedures', procedure);
      setStatusMessage('Trámite creado exitosamente.');
      setProcedure({ name: '', description: '', dailyQuota: '' });
    } catch (error) {
      console.error(error);
      setStatusMessage('Error al crear el trámite.');
    }
  };

  // PUT: Gestión de Cupos Diarios
  const handleUpdateQuota = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.put(`/catalog/procedures/${quotaUpdate.procedureId}/quota`, {
        quota: quotaUpdate.newQuota,
      });
      setStatusMessage('Cupos actualizados correctamente.');
      setQuotaUpdate({ procedureId: '', newQuota: '' });
    } catch (error) {
      console.error(error);
      setStatusMessage('Error al actualizar los cupos.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Catálogo de Trámites y Gestión de Cupos</h2>
      {statusMessage && <p style={{ color: 'blue', fontWeight: 'bold' }}>{statusMessage}</p>}

      {/* Formulario Crear Trámite (Admin/Funcionario) */}
      <section style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>Crear Nuevo Trámite</h3>
        <form onSubmit={handleCreateProcedure} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
          <button type="submit" style={{ backgroundColor: '#0078d4', color: 'white', border: 'none', padding: '10px' }}>
            Guardar Trámite
          </button>
        </form>
      </section>

      {/* Formulario Actualizar Cupos */}
      <section style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
        <h3>Actualizar Cupos Diarios</h3>
        <form onSubmit={handleUpdateQuota} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="ID del Trámite" 
            value={quotaUpdate.procedureId} 
            onChange={(e) => setQuotaUpdate({ ...quotaUpdate, procedureId: e.target.value })} 
            required 
          />
          <input 
            type="number" 
            placeholder="Nuevo Cupo Diario" 
            value={quotaUpdate.newQuota} 
            onChange={(e) => setQuotaUpdate({ ...quotaUpdate, newQuota: e.target.value })} 
            required 
          />
          <button type="submit" style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px' }}>
            Actualizar Cupo
          </button>
        </form>
      </section>
    </div>
  );
};