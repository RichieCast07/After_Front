export interface UserResponseDTO {
  id: number;
  nombre_completo: string;
  username: string;
  telefono: number | string;
  rol_id: number;
  comision_porcentaje?: number;
  activo: boolean;
  fecha_creacion?: string;
}

export interface UsersListResponseDTO {
  success: boolean;
  count: number;
  data: UserResponseDTO[];
}

export interface RegisterUserResponseDTO {
  success: boolean;
  message: string;
  data: UserResponseDTO;
}
