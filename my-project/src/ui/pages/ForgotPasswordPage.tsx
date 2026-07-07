/**
 * Pantalla de recuperación de contraseña
 * 
 * T080: Formulario con email para enviar link de recuperación
 * T090: Conectar con authService.sendPasswordReset()
 */

import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { AuthService } from '../../application/services/authService';
import './ForgotPasswordPage.css';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
    setSuccess(false);
  };

  const validateForm = (): boolean => {
    if (!email) {
      setError('El correo electrónico es obligatorio');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Formato de email inválido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // T090: Conectar con authService.sendPasswordReset()
      const result = await AuthService.sendPasswordReset(email);

      if (!result.success) {
        // Manejar errores específicos
        setError(result.error || 'Error al enviar el correo de recuperación');
        setLoading(false);
        return;
      }

      // Envío exitoso
      setSuccess(true);
      
    } catch (err: any) {
      // Manejar errores inesperados
      console.error('Error en recuperación de contraseña:', err);
      setError(err.message || 'Error al enviar el correo de recuperación. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <h1>Recuperar contraseña</h1>
          <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña</p>
        </div>

        {success ? (
          <div className="forgot-password-success">
            <div className="success-icon">✓</div>
            <h2>Correo enviado</h2>
            <p>
              Hemos enviado un enlace de recuperación a <strong>{email}</strong>.
              Por favor revisa tu bandeja de entrada y sigue las instrucciones.
            </p>
            <p className="success-note">
              Si no ves el correo, revisa tu carpeta de spam.
            </p>
            <div className="success-actions">
              <Link to="/login">
                <Button variant="primary" fullWidth>
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="forgot-password-form">
            {error && <ErrorMessage message={error} />}

            <Input
              type="email"
              name="email"
              label="Correo electrónico"
              placeholder="tu@email.com"
              value={email}
              onChange={handleChange}
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </Button>

            <div className="forgot-password-back">
              <Link to="/login">← Volver al inicio de sesión</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
