export interface IMessageQueue {
    add(jobName: string, data: any): Promise<void>;
}