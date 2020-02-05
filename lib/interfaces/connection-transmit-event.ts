import { ConnectionTransmitTypes } from '../constants/connection-transmit-types.enum';

export interface ConnectionTransmitEvent<T> {
    message: string;
    type: ConnectionTransmitTypes,
    input: T
}