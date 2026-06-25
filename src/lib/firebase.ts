import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDviJUsNOfYIM-4yfKqsGB2GKQoxFfdzOA",
  authDomain: "project-a7d5c6da-4b3a-4c55-954.firebaseapp.com",
  projectId: "project-a7d5c6da-4b3a-4c55-954",
  storageBucket: "project-a7d5c6da-4b3a-4c55-954.firebasestorage.app",
  messagingSenderId: "107735387751",
  appId: "1:107735387751:web:ba46b97d7b230f8e588ec2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
