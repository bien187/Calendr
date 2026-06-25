/* eslint-disable no-undef */
// Firebase Cloud Messaging service worker (background notifications).
// NOTE: service workers can't read process.env — paste your *public* web
// config below (the same values as in .env.local). These keys are not secret.
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyB8Wzq2D7sMhJZG3zugpxFvg1S-_E9KAeU",
  authDomain: "calendr-5665e.firebaseapp.com",
  projectId: "calendr-5665e",
  storageBucket: "calendr-5665e.firebasestorage.app",
  messagingSenderId: "1049406982097",
  appId: "1:1049406982097:web:0b3b2e1a134d1702eac2f0",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "Calendr", {
    body: body || "Du hast einen anstehenden Termin.",
    icon: "/logo.svg",
    badge: "/logo.svg",
    data: payload.data || {},
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/calendar"));
});
