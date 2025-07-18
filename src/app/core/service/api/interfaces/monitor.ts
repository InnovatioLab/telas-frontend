export interface IMonitorAlert {
  id: string;
  monitorId: string;
  title: string;
  description: string;
  timestamp: Date;
  status: 'critical' | 'warning' | 'resolved' | 'acknowledged';
  deviceId: string;
  acknowledgeReason?: string;
}
