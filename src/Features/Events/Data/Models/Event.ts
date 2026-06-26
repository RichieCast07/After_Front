export interface EventDTO {
  id: number;
  nombre: string;
  codigo_evento: string;
  precio_inicial?: number | null;
  fecha_evento: string;
  lugar?: string | null;
  maps_url?: string | null;
  activo: boolean;
  fecha_creacion?: string;
}

export interface EventPayload {
  nombre: string;
  fecha_evento: string;
  lugar?: string;
  maps_url?: string;
  precio_inicial: number;
}