export interface SummaryMetricsDTO {
  total_boletos_vendidos: number;
  total_ingresos: number;
  total_comisiones_rp: number;
  boletos_activos: number;
  boletos_usados: number;
}

export interface RpMetricDTO {
  rp_id: number;
  username: string;
  boletos_vendidos: number;
  ingresos_totales: number;
  comisiones_totales: number;
}

export interface EventMetricDTO {
  evento_id: number;
  nombre: string;
  boletos_vendidos: number;
  ingresos_totales: number;
  comisiones_rp: number;
  boletos_activos: number;
  boletos_usados: number;
}

export interface EventPhaseMetricDTO {
  fase_id: number;
  nombre: string;
  precio: number;
  boletos_vendidos: number;
  ingresos_totales: number;
}