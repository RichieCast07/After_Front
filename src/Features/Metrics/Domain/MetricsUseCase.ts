import { MetricsRepository } from "../Data/Repository/MetricsRepository";

const repository = new MetricsRepository();

export const metricsUseCase = {
  getSummary: () => repository.getSummary(),
  getRpMetrics: () => repository.getRpMetrics(),
  getEventMetrics: (eventId: number) => repository.getEventMetrics(eventId),
  getEventRpMetrics: (eventId: number) => repository.getEventRpMetrics(eventId),
  getEventPhaseMetrics: (eventId: number) => repository.getEventPhaseMetrics(eventId),
  syncPrices: (eventoId?: number) => repository.syncPrices(eventoId),
};