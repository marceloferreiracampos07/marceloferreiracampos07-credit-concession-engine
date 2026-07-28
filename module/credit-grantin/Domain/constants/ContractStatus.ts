export const CONTRACT_STATUS = {
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
} as const;

export type ContratoStatus = (typeof CONTRACT_STATUS)[keyof typeof CONTRACT_STATUS];
