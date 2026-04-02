# Car Lift Booking App

## Overview
A React-based car lift / ride booking application with route browsing, monthly plan booking, Firebase Auth, Firestore real-time database, FCM push notifications, and an admin panel.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Routing**: React Router v6
- **State/Data**: TanStack React Query + Firebase Firestore
- **UI**: shadcn/ui + Tailwind CSS (dark red theme)
- **Auth**: Firebase Auth (email/password)
- **Database**: Firebase Firestore (real-time, with localStorage fallback)
- **Push Notifications**: Firebase Cloud Messaging (FCM) + Service Worker
- **PDF**: jsPDF

## Pages
- `/` — Book Ride (route carousel + monthly booking form)
- `/my-rides` — User's ride history
- `/auth` — Attractive Login/Signup with Firebase Auth
- `/carlift-admin` — Admin Panel (bookings, routes, settings, revenue)
- `*` — 404 Not Found

## Firebase Config
Project: `car-lift-98b84`  
VAPID Key: Set in `src/lib/firebase.ts`

### Firebase Collections (Firestore)
- `bookings` — All booking documents
- `adminNotifications` — Admin notification records
- `adminTokens` — FCM tokens for push notifications
- `users` — User profiles with `role: 'user' | 'admin'`
- `settings/carImages` — Car image URLs

### Admin Setup
1. Create admin user in Firebase Console → Authentication
2. In Firestore, create `users/{uid}` doc with `{ role: 'admin', email: '...', name: '...' }`
3. The admin will then be routed to `/carlift-admin` on login

## Key Files
- `src/lib/firebase.ts` — Firebase init, auth, db, messaging
- `src/lib/firestoreStore.ts` — Firestore CRUD + FCM token saving
- `src/lib/store.ts` — localStorage helpers + type definitions
- `public/firebase-messaging-sw.js` — FCM background notification handler
- `public/manifest.json` — PWA manifest (admin only)
- `src/pages/AuthPage.tsx` — Firebase Auth UI (login/signup)
- `src/pages/AdminPanel.tsx` — Admin dashboard with tabs
- `src/pages/BookRide.tsx` — Booking form (saves to Firestore)
- `src/components/Layout.tsx` — Banner + Navbar (no logo)

## Admin Panel Features
- **Bookings tab**: Real-time bookings via Firestore onSnapshot, status management, car assignment, invoice PDF, WhatsApp
- **Routes tab**: Pickup/dropoff location management
- **Settings tab**: Car image management (URL-based), revenue summary, per-vehicle revenue, push notification status

## Revenue Tracking
- Parsed from fare string "Rs XXXXX/month"
- Shows: Total Generated, Collected (approved), Pending (pending bookings)
- Displayed in header stats + Revenue Overview bar + Settings tab

## FCM Push Notifications (Architecture)
- Admin FCM token saved to `adminTokens` Firestore collection
- Service worker at `/firebase-messaging-sw.js` handles background messages
- For offline push: Deploy Cloud Function that triggers on `bookings` collection write and sends FCM to all tokens in `adminTokens`
- Client-side: Firestore onSnapshot handles real-time updates when app is open

## Replit Configuration
- Dev server: port 5000, host 0.0.0.0
- Workflow: `npm run dev`
- Deploy: `npm run build` → `node ./dist/index.cjs`
