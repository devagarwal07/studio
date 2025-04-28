
export interface Member {
  id: string;
  name: string;
  points: number;
}

export interface PointRequest {
  id: string;
  memberId: string;
  memberName: string; // Denormalized for easier display
  description: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  points?: number; // Points to be awarded if approved
}
