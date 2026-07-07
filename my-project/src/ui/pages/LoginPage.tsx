/**
 * Pantalla de inicio de sesión
 * 
 * T079: Formulario con email y password
 * T089: Conectar con authService.login()
 */

import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { AuthService } from '../../application/services/authService';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password) {
      setError('Todos los campos son obligatorios');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Formato de email inválido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // T089: Conectar con authService.login()
      const result = await AuthService.login(formData.email, formData.password);

      if (!result.success) {
        // Manejar errores específicos
        setError(result.error || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }

      // Login exitoso: redirigir al feed
      navigate('/feed');
      
    } catch (err: any) {
      // Manejar errores inesperados
      console.error('Error en login:', err);
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Iniciar sesión</h1>
          <p>Bienvenido de vuelta a Yumeideas</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <ErrorMessage message={error} />}

          <Input
            type="email"
            name="email"
            label="Correo electrónico"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />

          <Input
            type="password"
            name="password"
            label="Contraseña"
            placeholder="Tu contraseña"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />

          <div className="login-forgot">
            <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>

        <div className="login-footer">
          <p>
            ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
