import type { UserResponseDTO } from "../../Data/Models/UserResponseDTO";

interface TeamPanelProps {
  users: UserResponseDTO[];
  selectedRole: number;
  setSelectedRole: (roleId: number) => void;
  loading: boolean;
  error: string;
  onCreateClick?: () => void;
}

function getRoleLabel(roleId: number) {
  if (roleId === 1) return "Admin";
  if (roleId === 2) return "RP";
  if (roleId === 3) return "Manager";
  return `Rol ${roleId}`;
}

export default function TeamPanel({
  users,
  selectedRole,
  setSelectedRole,
  loading,
  error,
  onCreateClick,
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
            <article key={user.id} className="collection-card">
              <div>
                <h3>{user.nombre_completo}</h3>
                <p>@{user.username}</p>
                <small>{user.telefono}</small>
                {user.rol_id === 2 ? <small>Comisión: {Number(user.comision_porcentaje ?? 0).toFixed(2)}%</small> : null}
              </div>
              <div className="collection-actions">
                <span className="pill pill-success">{getRoleLabel(user.rol_id)}</span>
                <span className={`pill ${user.activo ? "pill-success" : "pill-muted"}`}>
                  {user.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
