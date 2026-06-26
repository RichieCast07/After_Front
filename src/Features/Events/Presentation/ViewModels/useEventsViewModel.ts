import { useEffect, useState } from "react";
import type { EventDTO } from "../../Data/Models/Event";
import { eventsUseCase } from "../../Domain/EventsUseCase";

const initialForm = {
  nombre: "",
  fecha_evento: "",
  lugar: "",
  maps_url: "",
  precio_inicial: "",
};

function pickDefaultEventId(events: EventDTO[]): number | null {
  if (!events.length) {
    return null;
  }

  const now = new Date();
  const activeEvents = events
    .filter((event) => event.activo)
    .sort((first, second) => {
      const firstTime = new Date(first.fecha_evento).getTime();
      const secondTime = new Date(second.fecha_evento).getTime();

      const firstDistance = Math.abs(firstTime - now.getTime());
      const secondDistance = Math.abs(secondTime - now.getTime());
      return firstDistance - secondDistance;
    });

  const activeWithInitialPrice = activeEvents.filter((event) => Number(event.precio_inicial ?? 0) > 0);

  if (activeWithInitialPrice.length > 0) {
    return activeWithInitialPrice[0].id;
  }

  if (activeEvents.length > 0) {
    return activeEvents[0].id;
  }

  const upcomingEvents = [...events]
    .sort((first, second) => new Date(first.fecha_evento).getTime() - new Date(second.fecha_evento).getTime());
  return upcomingEvents[0]?.id ?? null;
}

export function useEventsViewModel() {
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await eventsUseCase.getEvents();
      setEvents(data);
      const suggestedId = pickDefaultEventId(data);
      setSelectedEventId((current) => {
        if (current && data.some((event) => event.id === current)) {
          return current;
        }
        return suggestedId;
      });
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los eventos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleEdit = (event: EventDTO) => {
    setEditingId(event.id);
    setForm({
      nombre: event.nombre,
      fecha_evento: event.fecha_evento.slice(0, 16),
      lugar: event.lugar ?? "",
      maps_url: event.maps_url ?? "",
      precio_inicial: "",
    });
    setSelectedEventId(event.id);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const submit = async () => {
    if (!form.nombre || !form.fecha_evento || !form.lugar) {
      setError("Nombre, fecha y lugar son obligatorios.");
      return false;
    }

    if (!editingId && !form.precio_inicial) {
      setError("El precio inicial es obligatorio al crear el evento.");
      return false;
    }

    if (!editingId && Number(form.precio_inicial) <= 0) {
      setError("El precio inicial debe ser mayor a 0.");
      return false;
    }

    setSaving(true);
    try {
      if (editingId) {
        await eventsUseCase.updateEvent(editingId, {
          nombre: form.nombre,
          fecha_evento: form.fecha_evento,
          lugar: form.lugar,
          maps_url: form.maps_url || undefined,
        });
      } else {
        const created = await eventsUseCase.createEvent({
          ...form,
          maps_url: form.maps_url || undefined,
          precio_inicial: Number(form.precio_inicial),
        });
        setSelectedEventId(created.id);
      }

      resetForm();
      await loadEvents();
      return true;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No fue posible guardar el evento.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: number) => {
    setSaving(true);
    try {
      await eventsUseCase.toggleEvent(id);
      await loadEvents();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "No fue posible cambiar el estado del evento.");
    } finally {
      setSaving(false);
    }
  };

  return {
    events,
    selectedEventId,
    setSelectedEventId,
    form,
    editingId,
    loading,
    saving,
    error,
    handleChange,
    handleEdit,
    resetForm,
    submit,
    toggleStatus,
    reload: loadEvents,
  };
}