// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";  // Importer Firestore
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCzpBG-Rr_1DqaG8CViWg7q4O2nsA1O994",
  authDomain: "transport-monitoring-88175.firebaseapp.com",
  projectId: "transport-monitoring-88175",
  storageBucket: "transport-monitoring-88175.appspot.com",
  messagingSenderId: "72012108989",
  appId: "1:72012108989:web:125511e98aca4a698153d4",
  measurementId: "G-MV3NX1LE8J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);


// Export auth so it can be used in other files
export { auth };
export const db = getFirestore(app);  // Eksporter Firestore