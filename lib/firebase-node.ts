import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import dotenv from "dotenv";
dotenv.config();

// Firebase configuration with values from environment variables
// Some sensitive values need to be replaced with actual values from your .env file
const firebaseConfig = {
apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // Replace with your actual API_KEY from .env
authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
