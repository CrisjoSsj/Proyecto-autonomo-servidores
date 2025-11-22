import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/AuthService';
import '../../css/admin/Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.login(email, password);
      // Redirigir al dashboard después del login exitoso
      navigate('/admin');
    } catch (err: any) {
      console.error('Error en login:', err);
      const errorMessage = err.message || 'Credenciales incorrectas. Por favor, intenta de nuevo.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Chuwue Grill</h1>
          <h2 className="login-subtitle">Panel de Administración</h2>
          <p className="login-description">Inicia sesión para acceder al panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <span className="material-symbols-outlined">email</span>
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@restaurante.com"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <span className="material-symbols-outlined">lock</span>
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Iniciando sesión...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">login</span>
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="login-help-text">
            ¿Problemas para iniciar sesión? Contacta al administrador del sistema.
          </p>
          <div className="login-credentials-hint">
            <p className="hint-title">Credenciales de prueba:</p>
            <ul className="hint-list">
              <li>admin@restaurante.com / admin123</li>
              <li>crisjo@restaurante.com / secret</li>
              <li>victoria@restaurante.com / mysecretpassword</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

