/**
 * RestaurantesGraphQL.tsx
 * Componente de ejemplo que usa GraphQL para obtener y mostrar restaurantes
 */

import { useState, useEffect } from 'react';
import { fetchRestaurantes, Restaurante } from '../../services/GraphQLService';
import '../../css/admin/Dashboard.css';

export default function RestaurantesGraphQL() {
    const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        cargarRestaurantes();
    }, []);

    const cargarRestaurantes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchRestaurantes();
            setRestaurantes(data);
        } catch (err) {
            console.error('Error al cargar restaurantes:', err);
            setError('No se pudo conectar con el servidor GraphQL. Asegúrate de que esté ejecutándose en http://localhost:3000');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>🔄 Cargando restaurantes desde GraphQL...</h2>
                <p>Conectando a http://localhost:3000/api/graphql</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>
                <h2>❌ Error</h2>
                <p>{error}</p>
                <button 
                    onClick={cargarRestaurantes}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px' }}>
            <div style={{ 
                backgroundColor: '#e7f3ff', 
                padding: '20px', 
                borderRadius: '10px',
                marginBottom: '30px',
                border: '2px solid #007bff'
            }}>
                <h2 style={{ color: '#007bff', marginBottom: '10px' }}>
                    📊 Datos desde GraphQL Server
                </h2>
                <p style={{ margin: '5px 0' }}>
                    <strong>Endpoint:</strong> http://localhost:3000/api/graphql
                </p>
                <p style={{ margin: '5px 0' }}>
                    <strong>Query:</strong> GetRestaurantes
                </p>
                <p style={{ margin: '5px 0' }}>
                    <strong>Restaurantes encontrados:</strong> {restaurantes.length}
                </p>
            </div>

            <h1 style={{ marginBottom: '30px' }}>🍽️ Restaurantes (GraphQL)</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
            }}>
                {restaurantes.map((restaurante) => (
                    <div 
                        key={restaurante.id}
                        style={{
                            backgroundColor: 'white',
                            padding: '25px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            border: '1px solid #ddd',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                        }}
                    >
                        <h3 style={{ 
                            color: '#2c3e50', 
                            marginBottom: '15px',
                            fontSize: '1.5rem',
                            borderBottom: '2px solid #007bff',
                            paddingBottom: '10px'
                        }}>
                            {restaurante.nombre}
                        </h3>
                        
                        <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#555' }}>📍 Dirección:</strong>
                            <p style={{ margin: '5px 0', color: '#666' }}>{restaurante.direccion}</p>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#555' }}>📞 Teléfono:</strong>
                            <p style={{ margin: '5px 0', color: '#666' }}>{restaurante.telefono}</p>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#555' }}>🕐 Horario:</strong>
                            <p style={{ margin: '5px 0', color: '#666' }}>{restaurante.horario}</p>
                        </div>

                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                            <span style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                padding: '5px 15px',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                fontWeight: 'bold'
                            }}>
                                Capacidad: {restaurante.capacidadTotal} personas
                            </span>
                        </div>

                        <div style={{ 
                            marginTop: '15px', 
                            fontSize: '0.8rem', 
                            color: '#999',
                            textAlign: 'right'
                        }}>
                            ID: {restaurante.id}
                        </div>
                    </div>
                ))}
            </div>

            {restaurantes.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '10px',
                    marginTop: '20px'
                }}>
                    <h3>📭 No hay restaurantes disponibles</h3>
                    <p style={{ color: '#666', marginTop: '10px' }}>
                        El servidor GraphQL está activo pero no hay datos.
                    </p>
                </div>
            )}

            <div style={{ 
                marginTop: '40px',
                padding: '20px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px'
            }}>
                <h4 style={{ color: '#856404', marginBottom: '10px' }}>ℹ️ Información</h4>
                <ul style={{ color: '#856404', lineHeight: '1.8' }}>
                    <li>Estos datos provienen del servidor <strong>GraphQL</strong> (Next.js + Apollo Server)</li>
                    <li>Puerto: <code>3000</code></li>
                    <li>Endpoint: <code>/api/graphql</code></li>
                    <li>Query utilizado: <code>GetRestaurantes</code></li>
                </ul>
            </div>
        </div>
    );
}
