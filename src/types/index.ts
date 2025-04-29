
export interface Member {
  id: string; // Corresponds to Firebase Auth UID
  name: string; // Display Name
  email: string; // Email address
  points: number;
  role: 'member' | 'admin'; // Added role field
}

export interface PointRequest {
  id: string; // Firestore document ID
  memberId: string; // Firebase Auth UID of the member
  memberName: string; // Denormalized for easier display
  description: string;
  requestedAt: Date; // Store as Firestore Timestamp, convert on fetch
  status: 'pending' | 'approved' | 'rejected';
  points: number; // Points requested
}
