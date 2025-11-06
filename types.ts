export type FarmType = 'layers' | 'broilers' | 'fish';

export interface AdviceMessage {
    type: 'critical' | 'warning' | 'positive';
    message: string;
}
