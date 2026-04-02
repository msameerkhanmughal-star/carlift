import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCqUHzo4ceBolB0mK3A5nhbX8-7stSay5I",
  authDomain: "car-lift-98b84.firebaseapp.com",
  projectId: "car-lift-98b84",
  storageBucket: "car-lift-98b84.firebasestorage.app",
  messagingSenderId: "536354127386",
  appId: "1:536354127386:web:3efd32efb30f184a919ba3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const VAPID_KEY = "BAi3na1R6tu9F9fjGoSkJk9AULnNkMcKVF7Ylyx9SNQWTdTLm-_vhigavt-ffARw0l_0sCMeaU0lG4DfJcT5HI4";

export const ADMIN_EMAILS = ['admin@carlift.pk', 'carliftadmin@gmail.com'];

export async function getMessagingInstance() {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app);
  } catch {
    return null;
  }
}

export default app;
