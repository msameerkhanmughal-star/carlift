import {
  collection, doc, setDoc, getDocs, onSnapshot,
  query, orderBy, where, deleteDoc, updateDoc, addDoc,
  serverTimestamp, getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import type { Booking, Notification } from './store';

// ─── Bookings ───────────────────────────────────────────────────────────────

export async function saveBookingToFirestore(booking: Booking): Promise<void> {
  try {
    await setDoc(doc(db, 'bookings', String(booking.id)), {
      ...booking,
      createdAt: booking.createdAt || new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Firestore save booking error:', err);
  }
}

export function subscribeToBookings(callback: (bookings: Booking[]) => void): () => void {
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
  const unsub = onSnapshot(q, (snap) => {
    const bookings: Booking[] = snap.docs.map(d => ({ ...d.data() } as Booking));
    callback(bookings);
  }, (err) => {
    console.error('Firestore bookings subscription error:', err);
  });
  return unsub;
}

export async function updateBookingInFirestore(id: number, data: Partial<Booking>): Promise<void> {
  try {
    await updateDoc(doc(db, 'bookings', String(id)), { ...data, updatedAt: serverTimestamp() });
  } catch (err) {
    console.error('Firestore update booking error:', err);
  }
}

export async function deleteBookingFromFirestore(id: number): Promise<void> {
  try {
    await deleteDoc(doc(db, 'bookings', String(id)));
  } catch (err) {
    console.error('Firestore delete booking error:', err);
  }
}

// ─── Admin Notifications ─────────────────────────────────────────────────────

export async function addNotificationToFirestore(message: string, bookingId: number): Promise<void> {
  try {
    await addDoc(collection(db, 'adminNotifications'), {
      message,
      bookingId,
      read: false,
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Firestore add notification error:', err);
  }
}

export function subscribeToNotifications(callback: (notifications: Notification[]) => void): () => void {
  const q = query(collection(db, 'adminNotifications'), orderBy('createdAt', 'desc'));
  const unsub = onSnapshot(q, (snap) => {
    const notifications: Notification[] = snap.docs.map(d => ({
      id: d.data().id || parseInt(d.id) || Date.now(),
      ...d.data(),
      _docId: d.id,
    } as Notification & { _docId: string }));
    callback(notifications);
  }, (err) => {
    console.error('Firestore notifications subscription error:', err);
  });
  return unsub;
}

export async function markNotificationReadInFirestore(docId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'adminNotifications', docId), { read: true });
  } catch (err) {
    console.error('Firestore mark notification read error:', err);
  }
}

// ─── FCM Tokens ──────────────────────────────────────────────────────────────

export async function saveAdminFCMToken(token: string): Promise<void> {
  try {
    await setDoc(doc(db, 'adminTokens', token), {
      token,
      createdAt: new Date().toISOString(),
      platform: navigator.userAgent,
    });
  } catch (err) {
    console.error('Firestore save FCM token error:', err);
  }
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function saveUserToFirestore(uid: string, data: {
  name: string; email: string; phone: string; role: 'user' | 'admin';
}): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid), { ...data, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error('Firestore save user error:', err);
  }
}

export async function getUserRoleFromFirestore(uid: string): Promise<'user' | 'admin'> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) return snap.data().role || 'user';
    return 'user';
  } catch {
    return 'user';
  }
}

// ─── Car Images ──────────────────────────────────────────────────────────────

export async function saveCarImagesToFirestore(images: Record<string, string>): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'carImages'), { images, updatedAt: serverTimestamp() });
  } catch (err) {
    console.error('Firestore save car images error:', err);
  }
}

export async function getCarImagesFromFirestore(): Promise<Record<string, string>> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'carImages'));
    if (snap.exists()) return snap.data().images || {};
    return {};
  } catch {
    return {};
  }
}
