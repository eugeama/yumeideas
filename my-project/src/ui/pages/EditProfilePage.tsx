/**
 * Pantalla de edición de perfil
 * 
 * T087: Formularios para cambiar username, cambiar contraseña,
 * T100-T102: Integración con servicios
 */

import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { UserService } from '../../application/services/userService';
import { useAuth } from '../hooks/useAuth';
import './EditProfilePage.css';

export function EditProfilePage() {
  const navigate = useNavigate();
  const { usuario, refreshUser, logout } = useAuth();

  // Formulario de username
  const [usernameForm, setUsernameForm] = useState({
    newUsername: '',
  });
  const [usernameError, setUsernameError] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Formulario de contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Modal de confirmación de borrado
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleUsernameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUsernameError('');

    if (!usuario) return;

    if (!usernameForm.newUsername.trim()) {
      setUsernameError('El username no puede estar vacío');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(usernameForm.newUsername)) {
      setUsernameError('El username debe tener entre 3 y 20 caracteres (letras, números y guiones bajos)');
      return;
    }

    setUsernameLoading(true);

    try {
      // T100: Conectar con userService.updateUsername()
      const result = await UserService.updateUsername(
        usuario.uid,
        usuario.username,
        usernameForm.newUsername
      );

      if (!result.success) {
        setUsernameError(result.error || 'Error al actualizar el username');
        setUsernameLoading(false);
        return;
      }

      await refreshUser();
      alert('Username actualizado correctamente');
      setUsernameForm({ newUsername: '' });
    } catch (err: any) {
      setUsernameError(err.message || 'Error al actualizar el username');
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!usuario) return;

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Todos los campos son obligatorios');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    setPasswordLoading(true);

    try {
      // T101: Conectar con userService.updatePassword()
      const result = await UserService.updatePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (!result.success) {
        setPasswordError(result.error || 'Error al actualizar la contraseña');
        setPasswordLoading(false);
        return;
      }

      alert('Contraseña actualizada correctamente');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setPasswordError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!usuario) return;

    setDeleteError('');

    if (deleteConfirmation !== 'BORRAR') {
      setDeleteError('Debes escribir "BORRAR" para confirmar');
      return;
    }

    if (!deletePassword) {
      setDeleteError('Debes ingresar tu contraseña actual para confirmar');
      return;
    }

    try {
      setDeleteLoading(true);

      const result = await UserService.deleteAccount(
        usuario.uid,
        usuario,
        usuario.rol,
        usuario.username,
        deletePassword
      );

      if (!result.success) {
        setDeleteError(result.error || 'Error al borrar la cuenta');
        setDeleteLoading(false);
        return;
      }

      setShowDeleteModal(false);
      setDeleteConfirmation('');
      setDeletePassword('');
      alert('Tu cuenta fue eliminada correctamente');
      await logout();
      navigate('/register', { replace: true });
    } catch (err: any) {
      setDeleteError(err.message || 'Error al borrar la cuenta');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-container">
        <header className="edit-profile-header">
          <h1>Editar perfil</h1>
          <p>Gestiona tu información personal y seguridad</p>
        </header>

        <div className="edit-sections">
          {/* Sección: Cambiar username */}
          <section className="edit-section">
            <h2>Cambiar nombre de usuario</h2>
            <form onSubmit={handleUsernameSubmit} className="edit-form">
              {usernameError && <ErrorMessage message={usernameError} />}
              
              <Input
                type="text"
                name="newUsername"
                label="Nuevo username"
                placeholder="nuevo_username"
                value={usernameForm.newUsername}
                onChange={(e) => {
                  setUsernameForm({ newUsername: e.target.value });
                  setUsernameError('');
                }}
                required
              />

              <Button
                type="submit"
                variant="primary"
                disabled={usernameLoading}
              >
                {usernameLoading ? 'Actualizando...' : 'Actualizar username'}
              </Button>
            </form>
          </section>

          {/* Sección: Cambiar contraseña */}
          <section className="edit-section">
            <h2>Cambiar contraseña</h2>
            <form onSubmit={handlePasswordSubmit} className="edit-form">
              {passwordError && <ErrorMessage message={passwordError} />}
              
              <Input
                type="password"
                name="currentPassword"
                label="Contraseña actual"
                placeholder="Tu contraseña actual"
                value={passwordForm.currentPassword}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                  setPasswordError('');
                }}
                required
                autoComplete="current-password"
              />

              <Input
                type="password"
                name="newPassword"
                label="Nueva contraseña"
                placeholder="Mínimo 6 caracteres"
                value={passwordForm.newPassword}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                  setPasswordError('');
                }}
                required
                autoComplete="new-password"
              />

              <Input
                type="password"
                name="confirmPassword"
                label="Confirmar nueva contraseña"
                placeholder="Repite la nueva contraseña"
                value={passwordForm.confirmPassword}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                  setPasswordError('');
                }}
                required
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant="primary"
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </form>
          </section>

          {/* Sección: Zona de peligro */}
          <section className="edit-section danger-zone">
            <h2>Zona de peligro</h2>
            <p className="danger-description">
              Una vez que borres tu cuenta, no hay vuelta atrás. Por favor, ten certeza.
            </p>
            <Button
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
            >
              Borrar mi cuenta
            </Button>
          </section>
        </div>
      </div>

      {/* Modal de confirmación de borrado */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteConfirmation('');
            setDeletePassword('');
            setDeleteError('');
          }}
          title="Borrar cuenta"
        >
          <div className="delete-modal-content">
            {deleteError && <ErrorMessage message={deleteError} />}
            <p className="delete-warning">
              ⚠️ Esta acción es <strong>irreversible</strong>.
            </p>
            <p>
              Al borrar tu cuenta:
            </p>
            <ul>
              <li>Se eliminarán todas tus publicaciones</li>
              <li>Se eliminarán todos tus "me gusta"</li>
              <li>Tu username quedará disponible para otros usuarios</li>
              <li>No podrás recuperar tu cuenta ni tus datos</li>
            </ul>
            <p>
              Para confirmar, escribe <strong>BORRAR</strong> en el campo de abajo:
            </p>
            <Input
              type="text"
              name="deleteConfirmation"
              placeholder="Escribe BORRAR"
              value={deleteConfirmation}
              onChange={(e) => {
                setDeleteConfirmation(e.target.value);
                setDeleteError('');
              }}
            />
            <Input
              type="password"
              name="deletePassword"
              label="Contraseña actual"
              placeholder="Tu contraseña actual"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                setDeleteError('');
              }}
              autoComplete="current-password"
            />
            <div className="delete-modal-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                  setDeletePassword('');
                  setDeleteError('');
                }}
                disabled={deleteLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'BORRAR' || !deletePassword || deleteLoading}
              >
                {deleteLoading ? 'Borrando cuenta...' : 'Borrar cuenta permanentemente'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
