import { useEffect, useState } from "react";
import type {
    EventMetricDTO,
    EventPhaseMetricDTO,
    RpMetricDTO,
    SummaryMetricsDTO,
} from "../../Data/Models/Metric";
import { metricsUseCase } from "../../Domain/MetricsUseCase";

export function useMetricsViewModel(eventId: number | null) {
  const [summary, setSummary] = useState<SummaryMetricsDTO | null>(null);
  const [rpMetrics, setRpMetrics] = useState<RpMetricDTO[]>([]);
  const [eventRpMetrics, setEventRpMetrics] = useState<RpMetricDTO[]>([]);
  const [eventMetrics, setEventMetrics] = useState<EventMetricDTO | null>(null);
  const [phaseMetrics, setPhaseMetrics] = useState<EventPhaseMetricDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const [summaryData, rpData] = await Promise.all([
        metricsUseCase.getSummary(),
        metricsUseCase.getRpMetrics(),
      ]);

      setRpMetrics(rpData);

      if (eventId) {
        const [eventData, phaseData, eventRpData] = await Promise.all([
          metricsUseCase.getEventMetrics(eventId),
          metricsUseCase.getEventPhaseMetrics(eventId),
          metricsUseCase.getEventRpMetrics(eventId),
        ]);
        setEventMetrics(eventData);
        setPhaseMetrics(phaseData);
        setEventRpMetrics(eventRpData);
        setSummary({
          total_boletos_vendidos: eventData.boletos_vendidos,
          total_ingresos: eventData.ingresos_totales,
          total_comisiones_rp: eventData.comisiones_rp,
          boletos_activos: eventData.boletos_activos,
          boletos_usados: eventData.boletos_usados,
        });
      } else {
        setSummary(summaryData);
        setEventMetrics(null);
        setPhaseMetrics([]);
        setEventRpMetrics([]);
      }

      setError("");
    } catch (metricsError) {
      setError(metricsError instanceof Error ? metricsError.message : "No fue posible cargar las metricas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMetrics();
  }, [eventId]);

  return {
    summary,
    rpMetrics,
    eventRpMetrics,
    eventMetrics,
    phaseMetrics,
    loading,
    error,
    reload: loadMetrics,
  };
}