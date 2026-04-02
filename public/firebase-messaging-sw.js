importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCqUHzo4ceBolB0mK3A5nhbX8-7stSay5I",
  authDomain: "car-lift-98b84.firebaseapp.com",
  projectId: "car-lift-98b84",
  storageBucket: "car-lift-98b84.firebasestorage.app",
  messagingSenderId: "536354127386",
  appId: "1:536354127386:web:3efd32efb30f184a919ba3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification?.title || 'New Booking Received';
  const notificationOptions = {
    body: payload.notification?.body || 'A new booking request has been submitted.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: payload.data || {},
    actions: [{ action: 'open', title: 'View Booking' }]
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/carlift-admin')
  );
});
