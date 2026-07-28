import { IReserveFundUseCase } from "../../application/ports/IReserveFundUseCase.js";
import { ReserveFundSchema } from "./dtos/reservefundDto.js";
import { z } from "zod";
import { IController, IHttpRequest, IHttpResponse } from "../ports/IHttp.js";
import { HTTP_STATUS, DOMAIN_ERROR_HTTP_MAP } from "../constants/HttpErrors.js";
import { DomainError } from "../../Domain/errors/DomainErrors.js";

export class ReserveFundController implements IController {
    constructor(private readonly useCase: IReserveFundUseCase) {}

    async handle(request: IHttpRequest): Promise<IHttpResponse> {
        try {
            const data = ReserveFundSchema.parse(request.body);
            const resultado = await this.useCase.executar(data);

            return { statusCode: HTTP_STATUS.OK, body: resultado };
        } catch (error: unknown) {
            if (error instanceof z.ZodError) {
                return {
                    statusCode: HTTP_STATUS.BAD_REQUEST,
                    body: {
                        error: "Dados inválidos",
                        details: error.issues.map(e => `${e.path.join(".")}: ${e.message}`),
                    },
                };
            }

            if (error instanceof DomainError) {
                const statusCode = DOMAIN_ERROR_HTTP_MAP[error.code] ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
                return { statusCode, body: { error: error.code } };
            }

            return {
                statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
                body: { error: "Erro interno do servidor" },
            };
        }
    }
}
