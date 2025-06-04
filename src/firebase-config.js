// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB8ChIdi587NpP2XPNXsp0tYRcu0iP2QqY",
  authDomain: "blog-e1c78.firebaseapp.com",
  projectId: "blog-e1c78",
  storageBucket: "blog-e1c78.firebasestorage.app",
  messagingSenderId: "1011807262373",
  appId: "1:1011807262373:web:d789b4224d35b5b257df4c",
  measurementId: "G-J7M1KCG3DF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);;

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();