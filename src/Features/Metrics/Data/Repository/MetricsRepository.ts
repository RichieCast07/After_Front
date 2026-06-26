import { apiRequest } from "../../../../Core/Api/apiClient";
import type {
  EventMetricDTO,
  EventPhaseMetricDTO,
  RpMetricDTO,
  SummaryMetricsDTO,
} from "../Models/Metric";

export class MetricsRepository {
  getSummary() {
    return apiRequest<SummaryMetricsDTO>("metrics/summary");
  }

  getRpMetrics() {
    return apiRequest<RpMetricDTO[]>("metrics/rps");
  }

  getEventMetrics(eventId: number) {
    return apiRequest<EventMetricDTO>(`metrics/event/${eventId}`);
  }

  getEventRpMetrics(eventId: number) {
    return apiRequest<RpMetricDTO[]>(`metrics/event/${eventId}/rps`);
  }

  getEventPhaseMetrics(eventId: number) {
    return apiRequest<EventPhaseMetricDTO[]>(`metrics/event/${eventId}/phases`);
  }
}