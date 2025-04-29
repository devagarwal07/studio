
import { db } from '@/lib/firebase';
import type { PointRequest } from '@/types';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp, // Import Timestamp
  serverTimestamp, // Use serverTimestamp for creation time
  writeBatch, // Use batch for atomic updates
} from 'firebase/firestore';
import { addPointsToMember } from './memberService'; // Import member service

const requestsCollectionRef = collection(db, 'pointRequests');

/**
 * Submits a new point request to Firestore.
 */
export const submitPointRequest = async (
    requestData: Omit<PointRequest, 'id' | 'requestedAt' | 'status'>
): Promise<string> => {
  const docRef = await addDoc(requestsCollectionRef, {
    ...requestData,
    requestedAt: serverTimestamp(), // Use server timestamp
    status: 'pending',
  });
  return docRef.id; // Return the newly created document ID
};

/**
 * Fetches all point requests, optionally filtering by status.
 * Orders by requestedAt descending.
 */
export const getPointRequests = async (status?: PointRequest['status']): Promise<PointRequest[]> => {
  let q;
  if (status) {
    q = query(
        requestsCollectionRef,
        where('status', '==', status),
        orderBy('requestedAt', 'desc')
    );
  } else {
    q = query(requestsCollectionRef, orderBy('requestedAt', 'desc'));
  }

  const querySnapshot = await getDocs(q);
  const requests: PointRequest[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    // Convert Firestore Timestamp to JavaScript Date object
    const requestedAt = data.requestedAt instanceof Timestamp ? data.requestedAt.toDate() : new Date();
    requests.push({
        id: doc.id,
        ...data,
        requestedAt: requestedAt,
        points: data.points ?? 0 // Ensure points has a default value
    } as PointRequest);
  });
  return requests;
};

/**
 * Updates the status of a point request.
 */
export const updateRequestStatus = async (
    requestId: string,
    status: 'approved' | 'rejected'
): Promise<void> => {
  const requestDocRef = doc(db, 'pointRequests', requestId);
  await updateDoc(requestDocRef, {
    status: status,
  });
};


/**
 * Approves a point request: updates its status and adds points to the member.
 * Uses a batch write for atomicity.
 */
export const approvePointRequest = async (request: PointRequest): Promise<void> => {
  if (!request.points || request.points <= 0) {
    throw new Error("Cannot approve request with invalid points value.");
  }
  if (!request.memberId) {
      throw new Error("Cannot approve request without a member ID.");
  }

  const batch = writeBatch(db);
  const requestDocRef = doc(db, 'pointRequests', request.id);
  const memberDocRef = doc(db, 'members', request.memberId);

  // 1. Update request status to 'approved'
  batch.update(requestDocRef, { status: 'approved' });

  // 2. Increment member points
  batch.update(memberDocRef, { points: increment(request.points) });

  // Commit the batch
  await batch.commit();
};


/**
 * Rejects a point request by updating its status.
 */
export const rejectPointRequest = async (requestId: string): Promise<void> => {
  const requestDocRef = doc(db, 'pointRequests', requestId);
  await updateDoc(requestDocRef, {
    status: 'rejected',
  });
};

// Add other request-related functions as needed (e.g., fetching requests for a specific member)
export const getMemberPointRequests = async (memberId: string): Promise<PointRequest[]> => {
    const q = query(
        requestsCollectionRef,
        where('memberId', '==', memberId),
        orderBy('requestedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const requests: PointRequest[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const requestedAt = data.requestedAt instanceof Timestamp ? data.requestedAt.toDate() : new Date();
        requests.push({
            id: doc.id,
            ...data,
            requestedAt: requestedAt,
            points: data.points ?? 0
        } as PointRequest);
    });
    return requests;
};
