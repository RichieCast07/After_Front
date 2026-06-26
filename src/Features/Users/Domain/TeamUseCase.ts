import { UserRepository } from "../Data/Repository/UserRepository";
import type { RegisterUserDTO } from "../Data/Models/RegisterUserDTO";

const repository = new UserRepository();

export const teamUseCase = {
  getUsers: () => repository.getUsers(),
  getUsersByRole: (roleId: number) => repository.getUsersByRole(roleId),
  createUser: (payload: RegisterUserDTO) => repository.createUser(payload),
};
