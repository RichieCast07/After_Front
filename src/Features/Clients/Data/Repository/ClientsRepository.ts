import { apiRequest } from "../../../../Core/Api/apiClient";
import type { ClientDTO, ClientPayload } from "../Models/Client";

function normalizeBaseUrl() {
  const configured = import.meta.env.VITE_API_URL ?? "http://localhost:8000/";
  return configured.endsWith("/") ? configured : `${configured}/`;
}

function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem("after.user.session");
    if (!rawSession) {
      return null;
    }

    const parsed = JSON.parse(rawSession) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

export class ClientsRepository {
  getClients() {
    return apiRequest<ClientDTO[]>("clients");
  }

  createClient(payload: ClientPayload) {
    return apiRequest<ClientDTO>("clients", {
      method: "POST",
      body: payload,
    });
  }

  searchByPhone(phone: string) {
    return apiRequest<ClientDTO>(`clients/search?telefono=${encodeURIComponent(phone)}`);
  }

  updateClient(id: number, data: { nombre_completo?: string; telefono?: string }) {
    return apiRequest<ClientDTO>(`clients/${id}`, { method: "PATCH", body: data });
  }

  async downloadClientsCsv() {
    const token = getToken();
    const response = await fetch(new URL("clients/export/csv", normalizeBaseUrl()).toString(), {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      throw new Error("No fue posible descargar el archivo CSV de clientes.");
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition") ?? "";
    const fileNameMatch = contentDisposition.match(/filename=([^;]+)/i);
    const fileName = fileNameMatch?.[1]?.replace(/"/g, "") || "clientes.csv";

    return { blob, fileName };
  }
}