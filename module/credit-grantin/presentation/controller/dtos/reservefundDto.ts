import { z } from "zod";

export const ReserveFundSchema = z.object({
    tenantId: z.string().uuid(),
    proposalId: z.string().uuid(),
    amount: z.number().int().positive(),
});

