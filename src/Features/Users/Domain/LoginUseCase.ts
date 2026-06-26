import { UserRepository } from "../Data/Repository/UserRepository";

const repository = new UserRepository

export const loginUseCase = {
    async loginUseCase (username: string, password: string) {
        return await repository.login(username, password)
    }
}