import { ReserveFundInput } from "../dto/ReserveFundInput.js";
import { ReserveFundOutput } from "../dto/ReserveFundOutput.js";

export interface IReserveFundUseCase {
    executar(entrada: ReserveFundInput): Promise<ReserveFundOutput>;
}
