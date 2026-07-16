import type { UserResponseDTO } from "../../Data/Models/UserResponseDTO";

interface TeamPanelProps {
  users: UserResponseDTO[];
  selectedRole: number;
  setSelectedRole: (roleId: number) => void;
  loading: boolean;
  error: string;
  currentUserId?: number;
  onCreateClick?: () => void;
  onEdit?: (user: UserResponseDTO) => void;
  onDelete?: (user: UserResponseDTO) => void;
  onToggleActive?: (user: UserResponseDTO) => void;
}

function getRoleLabel(roleId: number) {
  if (roleId === 1) return "Admin";
  if (roleId === 2) return "RP";
  if (roleId === 3) return "Manager";
  return `Rol ${roleId}`;
}

function getRoleClass(roleId: number) {
  if (roleId === 1) return "pill-role-admin";
  if (roleId === 2) return "pill-role-rp";
  if (roleId === 3) return "pill-role-manager";
  return "pill-muted";
}

export default function TeamPanel({
  users,
  selectedRole,
  setSelectedRole,
  loading,
  error,
  currentUserId,
  onCreateClick,
  onEdit,
  onDelete,
  onToggleActive,
}: TeamPanelProps) {
  return (
    <section className="glass-panel panel-grid">
      <div>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Equipo</span>
            <h2>Alta de RPs y managers</h2>
          </div>
          <span className="status-chip">{users.length} usuarios</span>
        </div>

        {onCreateClick ? (
          <div className="action-row" style={{ marginBottom: "10px" }}>
            <button type="button" className="primary-button" onClick={onCreateClick}>
              Crear usuario
            </button>
          </div>
        ) : null}

        <div className="select-frame">
          <label htmlFor="team-role-filter">Filtrar por rol</label>
          <select
            id="team-role-filter"
            value={selectedRole}
            onChange={(event) => setSelectedRole(Number(event.target.value))}
          >
            <option value={0}>Todos</option>
            <option value={2}>RPs</option>
            <option value={3}>Managers</option>
          </select>
        </div>

        {loading ? <p className="muted-copy">Cargando equipo...</p> : null}
        {error ? <p className="inline-error">{error}</p> : null}

        <div className="collection-list">
          {users.map((user) => (
            <article key={user.id} className="collection-card list-card">
              <div className="list-card-info">
                <h3>{user.nombre_completo}</h3>
                <p>@{user.username}</p>
                <small>{user.telefono}</small>
                {user.rol_id === 2 ? <small>Comisión: {Number(user.comision_porcentaje ?? 0).toFixed(2)}%</small> : null}
              </div>
              <div className="list-card-badges">
                <span className={`pill pill-status ${user.activo ? "pill-success is-active" : "pill-danger"}`}>
                  {user.activo ? "Activo" : "Inactivo"}
                </span>
                <span className={`pill ${getRoleClass(user.rol_id)}`}>{getRoleLabel(user.rol_id)}</span>
              </div>
              {onEdit || (onToggleActive && user.id !== currentUserId) || (onDelete && user.id !== currentUserId) ? (
                <div className="list-card-actions">
                  {onEdit ? (
                    <button type="button" className="ghost-button" onClick={() => onEdit(user)}>
                      Editar
                    </button>
                  ) : null}
                  {onToggleActive && user.id !== currentUserId ? (
                    <button type="button" className="ghost-button" onClick={() => onToggleActive(user)}>
                      {user.activo ? "Desactivar" : "Activar"}
                    </button>
                  ) : null}
                  {onDelete && user.id !== currentUserId ? (
                    <button type="button" className="ghost-button ghost-danger" onClick={() => onDelete(user)}>
                      Eliminar
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
