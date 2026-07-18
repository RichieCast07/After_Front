import { useEffect, useState } from "react";
import type { ClientDTO } from "../../Data/Models/Client";
import { clientsUseCase } from "../../Domain/ClientsUseCase";

const initialForm = {
  nombre_completo: "",
  telefono: "",
};

export function useClientsViewModel() {
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [searchPhone, setSearchPhone] = useState("");
  const [searchResult, setSearchResult] = useState<ClientDTO | null>(null);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await clientsUseCase.getClients();
      setClients(data);
      setSelectedClientId((current) => current ?? data[0]?.id ?? null);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClients();
  }, []);

  const handleFormChange = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setError("");
  };

  const handleEdit = (client: ClientDTO) => {
    setForm({ nombre_completo: client.nombre_completo, telefono: client.telefono });
    setEditingId(client.id);
    setError("");
  };

  const submit = async () => {
    const cleanName = form.nombre_completo.trim();
    const cleanPhone = form.telefono.trim();

    if (!cleanName || !cleanPhone) {
      setError("Nombre y teléfono son obligatorios.");
      return false;
    }

    setSaving(true);
    try {
      if (editingId) {
        await clientsUseCase.updateClient(editingId, { nombre_completo: cleanName, telefono: cleanPhone });
      } else {
        const created = await clientsUseCase.createClient({ nombre_completo: cleanName, telefono: cleanPhone });
        setSelectedClientId(created.id);
        setSearchResult(created);
      }
      setForm(initialForm);
      setEditingId(null);
      await loadClients();
      return true;
    } catch (submitError) {
      const fallback = editingId ? "No fue posible actualizar el cliente." : "No fue posible crear el cliente.";
      setError(submitError instanceof Error ? submitError.message : fallback);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const searchClient = async () => {
    if (!searchPhone) {
      setError("Ingresa un telefono para buscar.");
      return;
    }

    setSaving(true);
    try {
      const client = await clientsUseCase.searchByPhone(searchPhone);
      setSearchResult(client);
      setSelectedClientId(client.id);
      setError("");
    } catch (searchError) {
      setSearchResult(null);
      setError(searchError instanceof Error ? searchError.message : "No fue posible buscar el cliente.");
    } finally {
      setSaving(false);
    }
  };

  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const { blob, fileName } = await clientsUseCase.downloadClientsCsv();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      setError("");
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "No fue posible descargar el CSV.");
    } finally {
      setDownloading(false);
    }
  };

  return {
    clients,
    selectedClientId,
    setSelectedClientId,
    searchPhone,
    setSearchPhone,
    searchResult,
    form,
    editingId,
    loading,
    saving,
    downloading,
    error,
    handleFormChange,
    resetForm,
    handleEdit,
    submit,
    searchClient,
    downloadCsv,
    reload: loadClients,
  };
}