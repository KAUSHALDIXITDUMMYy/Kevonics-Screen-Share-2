import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBuF_wNnUKrV5eMMPsuzf1ffJ7vNbmwokc",
  authDomain: "zommer-dc7b6.firebaseapp.com",
  projectId: "zommer-dc7b6",
  storageBucket: "zommer-dc7b6.firebasestorage.app",
  messagingSenderId: "403698753122",
  appId: "1:403698753122:web:269b03d233b61ec2567b3b",
  measurementId: "G-WH3CN290YB",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
