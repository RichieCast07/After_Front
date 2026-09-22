import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EventsPanel from "../../../Events/Presentation/Components/EventsPanel";
import type { useEventsViewModel } from "../../../Events/Presentation/ViewModels/useEventsViewModel";
import FormModal from "../../../Shared/Presentation/Components/FormModal";

interface AdminEventSelectionPageProps {
  eventsVm: ReturnType<typeof useEventsViewModel>;
  onEnter: (eventId: number) => void;
}

export default function AdminEventSelectionPage({ eventsVm, onEnter }: AdminEventSelectionPageProps) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openCreateModal = () => {
    eventsVm.resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (eventId: number) => {
    const selected = eventsVm.events.find((event) => event.id === eventId);
    if (!selected) {
      return;
    }
    eventsVm.handleEdit(selected);
    setIsModalOpen(true);
  };

  const submit = async () => {
    const success = await eventsVm.submit();
    if (success) {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <EventsPanel
        events={eventsVm.events}
        selectedEventId={eventsVm.selectedEventId}
        setSelectedEventId={eventsVm.setSelectedEventId}
        loading={eventsVm.loading}
        saving={eventsVm.saving}
        error={eventsVm.error}
        onCreateClick={openCreateModal}
        onEdit={(event) => openEditModal(event.id)}
        onToggle={(id) => void eventsVm.toggleStatus(id)}
        onViewDetails={(id) => navigate(`/dashboard/events/${id}`)}
        onEnter={onEnter}
      />

      {isModalOpen ? (
        <FormModal
          title={eventsVm.editingId ? "Actualizar evento" : "Crear evento"}
          subtitle="Editor"
          error={eventsVm.error}
          onClose={() => setIsModalOpen(false)}
        >
          <div className="field-grid">
            <label>
              <span>Nombre</span>
              <input value={eventsVm.form.nombre} onChange={(event) => eventsVm.handleChange("nombre", event.target.value)} />
            </label>
            <label>
              <span>Fecha y hora</span>
              <input
                type="datetime-local"
                value={eventsVm.form.fecha_evento}
                onChange={(event) => eventsVm.handleChange("fecha_evento", event.target.value)}
              />
            </label>
            <label>
              <span>Lugar</span>
              <input value={eventsVm.form.lugar} onChange={(event) => eventsVm.handleChange("lugar", event.target.value)} />
            </label>
            <label>
              <span>URL de Maps</span>
              <input value={eventsVm.form.maps_url} onChange={(event) => eventsVm.handleChange("maps_url", event.target.value)} />
            </label>
            <label>
              <span>Precio inicial (General)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={eventsVm.form.precio_inicial}
                onChange={(event) => eventsVm.handleChange("precio_inicial", event.target.value)}
                disabled={Boolean(eventsVm.editingId)}
              />
            </label>
          </div>

          <div className="action-row">
            <button type="button" className="primary-button" disabled={eventsVm.saving} onClick={() => void submit()}>
              {eventsVm.saving ? "Guardando..." : eventsVm.editingId ? "Actualizar" : "Crear"}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                eventsVm.resetForm();
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
