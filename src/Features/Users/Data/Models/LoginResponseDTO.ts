export interface LoginResponseDTO {
    success: boolean
    token: string    
    message: string
    user_id: number
    rol_id: number
    username: string
}