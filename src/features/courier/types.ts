export interface Delivery {
  id: number;
  trackingNumber: string;
  receiverName: string;
  receiverAddress: string;
  receiverPhone?: string;
  status: string;
  instructions?: string;
  weightKg?: number | null;
  scheduledDate: string;
  completedAt?: string | null;
  recipientName?: string;
  failureReason?: string;
  note?: string;
  proofId?: string | null;
  version: number;
}

export interface StatusUpdate {
  status: string;
  recipientName: string;
  failureReason: string;
  note: string;
  version: number;
  proofId?: string | null;
}
