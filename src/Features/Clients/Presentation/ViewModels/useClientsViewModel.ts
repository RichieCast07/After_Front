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

  const createClient = async () => {
    if (!form.nombre_completo || !form.telefono) {
      setError("Nombre y telefono son obligatorios.");
      return false;
    }

    setSaving(true);
    try {
      const created = await clientsUseCase.createClient(form);
      setForm(initialForm);
      setSelectedClientId(created.id);
      setSearchResult(created);
      await loadClients();
      return true;
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "No fue posible crear el cliente.");
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
    loading,
    saving,
    downloading,
    error,
    handleFormChange,
    createClient,
    searchClient,
    downloadCsv,
    reload: loadClients,
  };
}