import { IReserveFundUseCase } from "../ports/IReserveFundUseCase.js";
import { FundNotFoundError, TenantNotFoundError } from "../../Domain/errors/DomainErrors.js";
import { ReserveFundInput } from "../dto/ReserveFundInput.js";
import { ReserveFundOutput } from "../dto/ReserveFundOutput.js";
import { Contrato } from "../../Domain/entities/Contrato.js";
import { OutboxEvent } from "../../Domain/entities/OutboxEvent.js";
import { IFundoRepository } from "../../Domain/repository/Ifundorepository.js";
import { IContratoRepository } from "../../Domain/repository/Icontratorepository.js";
import { IOutboxEventRepository } from "../../Domain/repository/IOutboxEventRepository.js";
import { ITenantRepository } from "../../Domain/repository/ITenantRepository.js";
import { IUnitOfWork } from "../ports/IUnitofWork.js";
import { CONTRACT_STATUS } from "../../Domain/constants/ContractStatus.js";
import { randomUUID } from "crypto";

export class ReserveFundUseCase implements IReserveFundUseCase {
    constructor(
        private readonly fundoRepositorio: IFundoRepository,
        private readonly contratoRepositorio: IContratoRepository,
        private readonly outboxEventRepositorio: IOutboxEventRepository,
        private readonly tenantRepositorio: ITenantRepository,
        private readonly unitOfWork: IUnitOfWork
    ) {}

    async executar(entrada: ReserveFundInput): Promise<ReserveFundOutput> {
        return this.unitOfWork.runInTransaction(async (tx) => {
            const fundo = await this.fundoRepositorio.findForUpdate(entrada.tenantId, tx);
            if (!fundo) {
                throw new FundNotFoundError();
            }

            fundo.debitar(entrada.amount);
            await this.fundoRepositorio.save(fundo, tx);

            const tenant = await this.tenantRepositorio.findById(entrada.tenantId, tx);
            if (!tenant) {
                throw new TenantNotFoundError();
            }

            const contrato = new Contrato(
                randomUUID(),
                entrada.tenantId,
                entrada.proposalId,
                entrada.amount,
                CONTRACT_STATUS.APPROVED,
                new Date()
            );
            await this.contratoRepositorio.save(contrato, tx);

            const outboxEvent = OutboxEvent.createFromContract(
                contrato,
                entrada.proposalId,
                entrada.amount,
                tenant
            );
            await this.outboxEventRepositorio.save(outboxEvent, tx);

            return {
                status: CONTRACT_STATUS.APPROVED,
                contractId: contrato.id,
            };
        });
    }
}
