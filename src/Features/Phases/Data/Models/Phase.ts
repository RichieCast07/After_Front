export interface PhaseDTO {
  id: number;
  evento_id: number;
  nombre: string;
  precio: number | string;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
}

export interface PhasePayload {
  nombre: string;
  precio: number;
  fecha_inicio: string;
  fecha_fin: string;
}