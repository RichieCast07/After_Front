import type { ClientPayload } from "../Data/Models/Client";
import { ClientsRepository } from "../Data/Repository/ClientsRepository";

const repository = new ClientsRepository();

export const clientsUseCase = {
  getClients: () => repository.getClients(),
  createClient: (payload: ClientPayload) => repository.createClient(payload),
  searchByPhone: (phone: string) => repository.searchByPhone(phone),
  updateClient: (id: number, data: { nombre_completo?: string; telefono?: string }) =>
    repository.updateClient(id, data),
  downloadClientsCsv: () => repository.downloadClientsCsv(),
};