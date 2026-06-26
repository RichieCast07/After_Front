export interface TicketDTO {
  id: number;
  codigo: string;
  cliente_id: number;
  cliente_nombre?: string;
  cliente_telefono?: string;
  rp_id: number;
  rp_nombre?: string;
  evento_id: number;
  evento_nombre?: string;
  codigo_evento?: string;
  fase_id: number;
  fase_nombre?: string;
  tipo_boleto: string;
  precio: number;
  comision_rp?: number | null;
  estado: "ACTIVO" | "USADO";
  qr_payload?: string;
  public_url?: string;
  fecha_venta?: string;
  fecha_uso?: string | null;
}

export interface TicketPayload {
  cliente_nombre: string;
  cliente_telefono: string;
  rp_id: number;
  evento_id: number;
  tipo_boleto?: string;
}