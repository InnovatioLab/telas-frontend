export class Notification {
  id: string;
  reference: string;
  message: string;
  actionUrl: string;
  visualized: boolean;
  createdAt?: Date;

  constructor(data?: Partial<Notification>) {
    this.id = data?.id || '';
    this.reference = data?.reference || '';
    this.message = data?.message || '';
    this.actionUrl = data?.actionUrl || '';
    this.visualized = data?.visualized || false;
    this.createdAt = data?.createdAt;
  }
}
