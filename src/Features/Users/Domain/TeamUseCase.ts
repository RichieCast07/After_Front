import { UserRepository } from "../Data/Repository/UserRepository";
import type { RegisterUserDTO } from "../Data/Models/RegisterUserDTO";
import type { UpdateUserDTO } from "../Data/Models/UpdateUserDTO";

const repository = new UserRepository();

export const teamUseCase = {
  getUsers: () => repository.getUsers(),
  getUsersByRole: (roleId: number) => repository.getUsersByRole(roleId),
  createUser: (payload: RegisterUserDTO) => repository.createUser(payload),
  updateUser: (id: number, payload: UpdateUserDTO) => repository.updateUser(id, payload),
  deleteUser: (id: number) => repository.deleteUser(id),
};
