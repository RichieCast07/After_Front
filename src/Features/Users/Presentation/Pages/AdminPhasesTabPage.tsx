import { useState } from "react";
import PhasesPanel from "../../../Phases/Presentation/Components/PhasesPanel";
import { usePhasesViewModel } from "../../../Phases/Presentation/ViewModels/usePhasesViewModel";
import FormModal from "../../../Shared/Presentation/Components/FormModal";
import { useAdminLayoutContext } from "./AdminLayoutPage";

export default function AdminPhasesTabPage() {
  const { eventsVm } = useAdminLayoutContext();
  const phasesVm = usePhasesViewModel(eventsVm.selectedEventId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedEvent = eventsVm.events.find((event) => event.id === eventsVm.selectedEventId);

  const submit = async () => {
    const success = await phasesVm.submit();
    if (success) {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <PhasesPanel
        eventName={selectedEvent?.nombre}
        phases={phasesVm.phases}
        loading={phasesVm.loading}
        saving={phasesVm.saving}
        error={phasesVm.error}
        onCreateClick={() => {
          phasesVm.resetForm();
          setIsModalOpen(true);
        }}
        onEdit={(phase) => {
          phasesVm.handleEdit(phase);
          setIsModalOpen(true);
        }}
        onToggle={(phaseId) => void phasesVm.toggleStatus(phaseId)}
      />

      {isModalOpen ? (
        <FormModal
          title={phasesVm.editingId ? "Actualizar fase" : "Crear fase"}
          subtitle="Fases"
          error={phasesVm.error}
          onClose={() => setIsModalOpen(false)}
        >
          <div className="field-grid">
            <label>
              <span>Nombre</span>
              <input value={phasesVm.form.nombre} onChange={(event) => phasesVm.handleChange("nombre", event.target.value)} />
            </label>
            <label>
              <span>Precio base</span>
              <input
                type="number"
                value={phasesVm.form.precio}
                onChange={(event) => phasesVm.handleChange("precio", event.target.value)}
              />
            </label>
            <label>
              <span>Inicio</span>
              <input
                type="datetime-local"
                value={phasesVm.form.fecha_inicio}
                onChange={(event) => phasesVm.handleChange("fecha_inicio", event.target.value)}
              />
            </label>
            <label>
              <span>Fin</span>
              <input
                type="datetime-local"
                value={phasesVm.form.fecha_fin}
                onChange={(event) => phasesVm.handleChange("fecha_fin", event.target.value)}
              />
            </label>
          </div>

          <div className="action-row">
            <button type="button" className="primary-button" disabled={phasesVm.saving} onClick={() => void submit()}>
              {phasesVm.saving ? "Guardando..." : phasesVm.editingId ? "Actualizar" : "Crear"}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                phasesVm.resetForm();
                setIsModalOpen(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </FormModal>
      ) : null}
    </>
  );
}
