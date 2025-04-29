
import { db } from '@/lib/firebase';
import type { Member } from '@/types';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  increment,
  Timestamp, // Use Timestamp for date fields if needed
} from 'firebase/firestore';

const membersCollectionRef = collection(db, 'members');

/**
 * Creates or updates a member document in Firestore.
 * Uses UID as the document ID.
 */
export const createOrUpdateMember = async (memberData: Omit<Member, 'id'>, uid: string): Promise<void> => {
  const memberDocRef = doc(db, 'members', uid);
  // Use setDoc with merge: true to create or update fields without overwriting the entire document
  // unless that's the desired behavior. For signup, a simple setDoc is usually fine.
  await setDoc(memberDocRef, memberData);
};

/**
 * Fetches a specific member by their UID.
 */
export const getMemberById = async (uid: string): Promise<Member | null> => {
  const memberDocRef = doc(db, 'members', uid);
  const docSnap = await getDoc(memberDocRef);
  if (docSnap.exists()) {
    // Explicitly cast the data to the Member type
    // Ensure Firestore data structure matches the Member type
    return { id: docSnap.id, ...docSnap.data() } as Member;
  } else {
    return null;
  }
};

/**
 * Fetches all members, ordered by points descending.
 */
export const getAllMembers = async (): Promise<Member[]> => {
  const q = query(membersCollectionRef, orderBy('points', 'desc'));
  const querySnapshot = await getDocs(q);
  const members: Member[] = [];
  querySnapshot.forEach((doc) => {
    members.push({ id: doc.id, ...doc.data() } as Member);
  });
  return members;
};

/**
 * Increments a member's points. Used when a point request is approved.
 */
export const addPointsToMember = async (uid: string, pointsToAdd: number): Promise<void> => {
    if (pointsToAdd <= 0) {
        console.warn("Attempted to add zero or negative points.");
        return;
    }
  const memberDocRef = doc(db, 'members', uid);
  await updateDoc(memberDocRef, {
    points: increment(pointsToAdd),
  });
};

// Add other member-related functions as needed (e.g., update profile info)
