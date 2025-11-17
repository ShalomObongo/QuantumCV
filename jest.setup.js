import '@testing-library/jest-dom';

// Mock environment variables
process.env.GOOGLE_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-firebase-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-sender';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
