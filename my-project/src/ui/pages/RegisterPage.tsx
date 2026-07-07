/**
 * Pantalla de registro de usuario
 * 
 * T078: Formulario con username, email, password, fecha nacimiento
 * T088: Conectar con authService.register()
 * Validación cliente de edad >= 13 años
 */

import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Usuario } from '../../domain/models/Usuario';
import { AuthService } from '../../application/services/authService';
import './RegisterPage.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fechaNacimiento: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Limpiar error al cambiar
  };

  const validateForm = (): boolean => {
    // Validar campos vacíos
    if (!formData.username || !formData.email || !formData.password || !formData.fechaNacimiento) {
      setError('Todos los campos son obligatorios');
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Formato de email inválido');
      return false;
    }

    // Validar longitud de username
    if (formData.username.length < 3 || formData.username.length > 20) {
      setError('El username debe tener entre 3 y 20 caracteres');
      return false;
    }

    // Validar formato de username
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(formData.username)) {
      setError('El username solo puede contener letras, números y guiones bajos');
      return false;
    }

    // Validar longitud de contraseña
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    // Validar edad >= 13 años (AMB-09)
    const fechaNacimiento = new Date(formData.fechaNacimiento);
    if (!Usuario.validarEdad(fechaNacimiento)) {
      const edad = Usuario.calcularEdad(fechaNacimiento);
      setError(`Debes tener al menos ${Usuario.EDAD_MINIMA} años para registrarte. Tu edad: ${edad} años`);
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
      // T088: Conectar con authService.register()
      const result = await AuthService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fechaNacimiento: new Date(formData.fechaNacimiento),
      });

      if (!result.success) {
        // Manejar errores específicos
        setError(result.error || 'Error al registrarse');
        setLoading(false);
        return;
      }

      // Registro exitoso: redirigir al feed
      navigate('/feed');
      
    } catch (err: any) {
      // Manejar errores inesperados
      console.error('Error en registro:', err);
      setError(err.message || 'Error al registrarse. Intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Crear cuenta</h1>
          <p>Únete a Yumeideas y comparte tus ideas</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && <ErrorMessage message={error} />}

          <Input
            type="text"
            name="username"
            label="Nombre de usuario"
            placeholder="tu_usuario"
            value={formData.username}
            onChange={handleChange}
            required
            autoComplete="username"
          />

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
            placeholder="Mínimo 6 caracteres"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />

          <Input
            type="password"
            name="confirmPassword"
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />

          <Input
            type="date"
            name="fechaNacimiento"
            label="Fecha de nacimiento"
            value={formData.fechaNacimiento}
            onChange={handleChange}
            required
          />

          <div className="register-info">
            <small>
              Al registrarte, confirmas que tienes al menos {Usuario.EDAD_MINIMA} años
            </small>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </Button>
        </form>

        <div className="register-footer">
          <p>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
