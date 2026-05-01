export type CommandType = 'restart' | 'set_interval' | 'set_apn';
export type CommandStatus = 'pending' | 'sent' | 'executed' | 'failed';

export interface CommandParameters {
  seconds?: number;
  apn?: string;
}

export interface DeviceCommand {
  id: string;
  deviceId: string;
  imei: string;
  commandType: CommandType;
  parameters: CommandParameters | null;
  status: CommandStatus;
  response: unknown | null;
  sentAt: string;
  executedAt: string | null;
  createdAt: string;
}
