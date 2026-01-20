importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// This service worker will not initialize Firebase until it receives the configuration
// from the main application. This avoids errors from missing placeholder values.

let firebaseInitialized = false;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_FIREBASE_CONFIG') {
    // Avoid re-initializing
    if (firebaseInitialized) return;

    // Initialize Firebase with the config from the main app
    firebase.initializeApp(event.data.payload);
    firebaseInitialized = true;

    const messaging = firebase.messaging();

    // Set up the background message handler
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      
      const notificationTitle = payload.notification?.title || 'New Notification';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new message.',
        icon: '/favicon.svg',
        data: payload.data,
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
}); 