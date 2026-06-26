export interface EventTicketTypeDTO {
  id: number;
  evento_id: number;
  nombre: string;
  activo: boolean;
  fecha_creacion?: string;
}

export interface EventTicketTypePayload {
  nombre: string;
  precio_inicial?: number;
}

export interface PhaseTicketTypePriceDTO {
  ticket_type_id: number;
  nombre: string;
  activo: boolean;
  precio: number;
}
