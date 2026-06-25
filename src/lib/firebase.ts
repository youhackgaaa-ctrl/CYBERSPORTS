import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  enableMultiTabIndexedDbPersistence, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDviJUsNOfYIM-4yfKqsGB2GKQoxFfdzOA",
  authDomain: "project-a7d5c6da-4b3a-4c55-954.firebaseapp.com",
  projectId: "project-a7d5c6da-4b3a-4c55-954",
  storageBucket: "project-a7d5c6da-4b3a-4c55-954.firebasestorage.app",
  messagingSenderId: "22108168233",
  appId: "1:22108168233:web:689945395213b2e7960166"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with standard settings for maximum compatibility
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
}, "ai-studio-13428611-0a73-4207-be9f-e8c6e3431b4c");
