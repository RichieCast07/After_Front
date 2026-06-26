import type {
    EventMetricDTO,
    EventPhaseMetricDTO,
    RpMetricDTO,
    SummaryMetricsDTO,
} from "../../Data/Models/Metric";

interface MetricsPanelProps {
  summary: SummaryMetricsDTO | null;
  rpMetrics: RpMetricDTO[];
  eventMetrics: EventMetricDTO | null;
  phaseMetrics: EventPhaseMetricDTO[];
  loading: boolean;
  error: string;
  currentUserId?: number;
  compact?: boolean;
  onSelectRp?: (rpId: number) => void;
  onOpenSoldTickets?: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function MetricsPanel({
  summary,
  rpMetrics,
  eventMetrics,
  phaseMetrics,
  loading,
  error,
  currentUserId,
  compact = false,
  onSelectRp,
  onOpenSoldTickets,
}: MetricsPanelProps) {
  const personalMetric = currentUserId ? rpMetrics.find((metric) => metric.rp_id === currentUserId) : null;

  return (
    <section className="glass-panel metrics-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Metrics</span>
          <h2>{compact ? "Ritmo comercial" : "Monitoreo en tiempo real"}</h2>
        </div>
      </div>

      {loading ? <p className="muted-copy">Actualizando metricas...</p> : null}
      {error ? <p className="inline-error">{error}</p> : null}

      {summary ? (
        <div className="stats-grid">
          <article
            className={`stat-card ${onOpenSoldTickets ? "stat-card-clickable" : ""}`}
            role={onOpenSoldTickets ? "button" : undefined}
            tabIndex={onOpenSoldTickets ? 0 : undefined}
            onClick={() => onOpenSoldTickets?.()}
            onKeyDown={(event) => {
              if (!onOpenSoldTickets) {
                return;
              }

              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpenSoldTickets();
              }
            }}
          >
            <span>Boletos vendidos</span>
            <strong>{summary.total_boletos_vendidos}</strong>
            {onOpenSoldTickets ? <small>Ver lista</small> : null}
          </article>
          <article className="stat-card">
            <span>Ingresos</span>
            <strong>{formatCurrency(summary.total_ingresos)}</strong>
          </article>
          <article className="stat-card">
            <span>Comisiones</span>
            <strong>{formatCurrency(summary.total_comisiones_rp)}</strong>
          </article>
          <article className="stat-card">
            <span>Boletos activos</span>
            <strong>{summary.boletos_activos}</strong>
          </article>
        </div>
      ) : null}

      {personalMetric ? (
        <div className="highlight-card">
          <strong>{personalMetric.username}</strong>
          <span>
            {personalMetric.boletos_vendidos} boletos vendidos • {formatCurrency(personalMetric.ingresos_totales)} generados
          </span>
        </div>
      ) : null}

      {eventMetrics ? (
        <div className="detail-grid">
          <article className="detail-card">
            <h3>{eventMetrics.nombre}</h3>
            <p>{eventMetrics.boletos_vendidos} boletos</p>
            <small>{formatCurrency(eventMetrics.ingresos_totales)} en ingresos</small>
          </article>
          <article className="detail-card">
            <h3>Comisiones del evento</h3>
            <p>{formatCurrency(eventMetrics.comisiones_rp)}</p>
            <small>Basado en el evento seleccionado • {phaseMetrics.length} fases analizadas</small>
          </article>
        </div>
      ) : null}

      {!compact && rpMetrics.length > 0 ? (
        <div className="leaderboard-wrap">
          <h3>{eventMetrics ? "Top 10 RPs del evento" : "Top 10 RPs por boletos vendidos"}</h3>
          <div className="collection-list compact-list rp-sales-list">
            {rpMetrics.slice(0, 10).map((metric, index) => (
              <article key={metric.rp_id} className="collection-card compact-ticket-card rp-compact-card rp-ranking-card">
                <div className="rp-rank-badge">#{index + 1}</div>
                <div className="rp-compact-main">
                  <h3>{metric.username}</h3>
                  <p>{metric.boletos_vendidos} boletos</p>
                </div>
                <div className="collection-actions metrics-compact-actions">
                  <span className="pill pill-success">{formatCurrency(metric.ingresos_totales)}</span>
                  {onSelectRp ? (
                    <button type="button" className="ghost-button" onClick={() => onSelectRp(metric.rp_id)}>
                      Ver RP
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
