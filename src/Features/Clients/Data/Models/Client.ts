export interface ClientDTO {
  id: number;
  nombre_completo: string;
  telefono: string;
  fecha_registro?: string;
}

export interface ClientPayload {
  nombre_completo: string;
  telefono: string;
}