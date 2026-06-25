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
  messagingSenderId: "107735387751",
  appId: "1:107735387751:web:ba46b97d7b230f8e588ec2"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings for better reliability on slow networks
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({}),
  ignoreUndefinedProperties: true,
}, "ai-studio-13428611-0a73-4207-be9f-e8c6e3431b4c");
