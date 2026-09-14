import React, { useEffect, useState } from 'react';
import { axiosClient } from '../api/axiosClient';

export const Dashboard = () => {

  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {

    const cargarKpis = async () => {

      try {

        const response = await axiosClient.get(
          '/api/report/kpis?range=last24h'
        );

        setKpis(response.data);

      } catch (error) {

        console.error(error);
        setError('No se pudieron cargar los KPIs.');

      } finally {

        setLoading(false);

      }
    };

    cargarKpis();

  }, []);

  if (loading) {
    return <p>Cargando indicadores...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (

    <div>

      <h2>Dashboard</h2>

      <p>
        Indicadores comunales de las últimas 24 horas
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginTop: '25px'
        }}
      >

        <div
          style={{
            padding: '25px',
            border: '1px solid #ddd',
            borderRadius: '10px'
          }}
        >
          <h3>Eventos procesados</h3>

          <strong style={{ fontSize: '32px' }}>
            {kpis?.totalEvents ?? 0}
          </strong>
        </div>

        <div
          style={{
            padding: '25px',
            border: '1px solid #ddd',
            borderRadius: '10px'
          }}
        >
          <h3>Trámites ingresados</h3>

          <strong style={{ fontSize: '32px' }}>
            {kpis?.createdRequests ?? 0}
          </strong>
        </div>

        <div
          style={{
            padding: '25px',
            border: '1px solid #ddd',
            borderRadius: '10px'
          }}
        >
          <h3>Trámites finalizados</h3>

          <strong style={{ fontSize: '32px' }}>
            {kpis?.completedRequests ?? 0}
          </strong>
        </div>

      </div>

    </div>

  );
};