import type { LoginResponseDTO } from "../Models/LoginResponseDTO"
import { apiRequest } from "../../../../Core/Api/apiClient";
import type { RegisterUserDTO } from "../Models/RegisterUserDTO";
import type { RegisterUserResponseDTO, UsersListResponseDTO } from "../Models/UserResponseDTO";

export class UserRepository {
    async login (username: string, password: string): Promise<LoginResponseDTO>{
        return apiRequest<LoginResponseDTO>("users/auth/login", {
            method: 'POST',
            body: { username, password },
            auth: false,
        });
    }

    getUsers(): Promise<UsersListResponseDTO> {
        return apiRequest<UsersListResponseDTO>("users");
    }

    getUsersByRole(roleId: number): Promise<UsersListResponseDTO> {
        return apiRequest<UsersListResponseDTO>(`users/role/${roleId}`);
    }

    createUser(payload: RegisterUserDTO): Promise<RegisterUserResponseDTO> {
        return apiRequest<RegisterUserResponseDTO>("users", {
            method: "POST",
            body: payload,
        });
    }

    // en caso de ocuparse mas metodos aqui se dejan
    // en el ejemplo de requerir un registro o una alta de usuarios, 
    // se coloca aqui la logica y se ejecuta en un caso de uso aislado
}