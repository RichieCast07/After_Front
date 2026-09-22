import { useEffect, useState } from "react";
import type { PhaseDTO } from "../../Data/Models/Phase";
import { phasesUseCase } from "../../Domain/PhasesUseCase";

const initialForm = {
  nombre: "",
  precio: "",
  fecha_inicio: "",
  fecha_fin: "",
};

export function usePhasesViewModel(eventId: number | null) {
  const [phases, setPhases] = useState<PhaseDTO[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadPhases = async () => {
    if (!eventId) {
      setPhases([]);
      setEditingId(null);
      setForm(initialForm);
      setError("");
      return;
    }

    setLoading(true);
    try {
      const data = await phasesUseCase.getPhases(eventId);
      setPhases(data);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar las fases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEditingId(null);
    setForm(initialForm);
    void loadPhases();
  }, [eventId]);

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleEdit = (phase: PhaseDTO) => {
    setError("");
    setEditingId(phase.id);
    setForm({
      nombre: phase.nombre,
      precio: String(phase.precio),
      fecha_inicio: phase.fecha_inicio.slice(0, 16),
      fecha_fin: phase.fecha_fin.slice(0, 16),
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setError("");
  };

  const submit = async () => {
    if (!eventId) {
      setError("Selecciona un evento antes de guardar fases.");
      return false;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre,
        precio: Number(form.precio),
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
      };

      if (editingId) {
        await phasesUseCase.updatePhase(eventId, editingId, payload);
      } else {
        await phasesUseCase.createPhase(eventId, payload);
      }

      resetForm();
      await loadPhases();
      return true;
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No fue posible guardar la fase.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (phaseId: number) => {
    if (!eventId) {
      return;
    }

    setSaving(true);
    try {
      await phasesUseCase.togglePhase(eventId, phaseId);
      await loadPhases();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "No fue posible cambiar el estado de la fase.");
    } finally {
      setSaving(false);
    }
  };

  return {
    phases,
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
    reload: loadPhases,
  };
}