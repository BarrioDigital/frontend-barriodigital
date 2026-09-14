import React, { useEffect, useState } from 'react';
import { axiosClient } from '../api/axiosClient';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const Reports = () => {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {

    const cargarReportes = async () => {

      try {

        const response = await axiosClient.get(
          '/api/report/top-procedures?range=last7d'
        );

        const resultado = Object.entries(response.data).map(
          ([procedureId, cantidad]) => ({
            procedureId: `Trámite ${procedureId}`,
            cantidad
          })
        );

        setData(resultado);

      } catch (error) {

        console.error(error);
        setError('No se pudieron cargar los reportes.');

      } finally {

        setLoading(false);

      }

    };

    cargarReportes();

  }, []);

  if (loading) {
    return <p>Cargando reportes...</p>;
  }

  return (

    <div>

      <h2 style={{ textAlign: 'center' }}>
        Reportes
      </h2>

      <p style={{ textAlign: 'center' }}>
        Trámites más solicitados durante los últimos 7 días
      </p>

      {error && (
        <p style={{ textAlign: 'center' }}>
          {error}
        </p>
      )}

      <div
        style={{
          marginTop: '30px',
          padding: '25px',
          border: '1px solid #ddd',
          borderRadius: '10px',
          height: '420px'
        }}
      >

        {data.length === 0 ? (

          <p style={{ textAlign: 'center' }}>
            No existen datos para mostrar.
          </p>

        ) : (

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart data={data}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="procedureId" />

              <YAxis allowDecimals={false} />

              <Tooltip />

              <Bar
                dataKey="cantidad"
                name="Cantidad de solicitudes"
              />

            </BarChart>

          </ResponsiveContainer>

        )}

      </div>

    </div>

  );

};