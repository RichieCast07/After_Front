export interface RegisterUserDTO {
  username: string;
  telefono: number;
  rol_id: number;
  password: string;
  nombre_completo: string;
  comision_porcentaje?: number;
}
