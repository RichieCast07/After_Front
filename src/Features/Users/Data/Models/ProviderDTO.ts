import type { LoginResponseDTO } from "./LoginResponseDTO";

export interface ProviderDTO {
    user: LoginResponseDTO | null;
    setUser: (user: LoginResponseDTO | null) => void
    logout: () => void
}
