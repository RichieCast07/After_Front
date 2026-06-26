import { useState } from "react";
import FormModal from "../../../Shared/Presentation/Components/FormModal";
import TeamPanel from "../Components/TeamPanel";
import { useTeamViewModel } from "../ViewModels/useTeamViewModel";

export default function AdminTeamTabPage() {
  const teamVm = useTeamViewModel();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const submit = async () => {
    const success = await teamVm.submit();
    if (success) {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <TeamPanel
        users={teamVm.users}
        selectedRole={teamVm.selectedRole}
        setSelectedRole={teamVm.setSelectedRole}
        loading={teamVm.loading}
        error={teamVm.error}
        onCreateClick={() => setIsModalOpen(true)}
      />

      {isModalOpen ? (
        <FormModal title="Crear usuario operativo" subtitle="Equipo" onClose={() => setIsModalOpen(false)}>
          <div className="field-grid">
            <label>
              <span>Nombre completo</span>
              <input value={teamVm.form.nombre_completo} onChange={(event) => teamVm.handleChange("nombre_completo", event.target.value)} />
            </label>
            <label>
              <span>Usuario</span>
              <input value={teamVm.form.username} onChange={(event) => teamVm.handleChange("username", event.target.value)} />
            </label>
            <label>
              <span>Teléfono</span>
              <input value={String(teamVm.form.telefono || "")} onChange={(event) => teamVm.handleChange("telefono", event.target.value)} />
            </label>
            <label>
              <span>Contraseña</span>
              <input type="password" value={teamVm.form.password} onChange={(event) => teamVm.handleChange("password", event.target.value)} />
            </label>
            <label>
              <span>Rol</span>
              <select value={teamVm.form.rol_id} onChange={(event) => teamVm.handleChange("rol_id", Number(event.target.value))}>
                <option value={2}>RP</option>
                <option value={3}>Manager</option>
              </select>
            </label>
            {teamVm.form.rol_id === 2 ? (
              <label>
                <span>Comisión RP (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={String(teamVm.form.comision_porcentaje ?? 10)}
                  onChange={(event) => teamVm.handleChange("comision_porcentaje", Number(event.target.value))}
                />
              </label>
            ) : null}
          </div>

          <div className="action-row">
            <button type="button" className="primary-button" disabled={teamVm.saving} onClick={() => void submit()}>
              {teamVm.saving ? "Guardando..." : "Crear"}
            </button>
            <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
          </div>
        </FormModal>
      ) : null}
    </>
  );
}
