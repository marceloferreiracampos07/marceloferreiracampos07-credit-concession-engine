export interface ReserveFundOutput {
    status: 'APPROVED' | 'REJECTED';
    contractId?: string;
    reason?: string;
}