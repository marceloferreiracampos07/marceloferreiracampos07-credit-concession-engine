export const EVENT_TYPES = {
    CONTRACT_APPROVED: "CONTRACT_APPROVED",
    CONTRACT_REJECTED: "CONTRACT_REJECTED",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];
