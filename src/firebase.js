
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence,signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import {getStorage} from "firebase/storage"



// YOUR WEB APP'S FIREBASE CONFIGURATION


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyADf7nZCZnvIfzWZIOuE4syzxOiW5a2STQ",
  authDomain: "italian-restaurant-project.firebaseapp.com",
  projectId: "italian-restaurant-project",
  storageBucket: "italian-restaurant-project.appspot.com",
  messagingSenderId: "470022452832",
  appId: "1:470022452832:web:c64231bb7cca801bef7505",
  measurementId: "G-61XP4PV3Q9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth= getAuth(app);

if (typeof window !== "undefined"){
  isSupported()
  .then((supported)=>{
    if (supported){
      getAnalytics(app);
      console.log("Firebase Analytics initialized");
    }
  })
  .catch((error)=> {
    console.log('Error initiailizing analytics', error)

  });
}

setPersistence(auth, browserLocalPersistence)
  .then(()=>{
    console.log("Firebase Auth persistence set to local only.")
  })
  .catch((error)=>{
    console.error("Error setting auth persistence:", error)
  })

//export the necessary firebase services


const firestore= getFirestore(app);
const storage= getStorage(app);


export { app, auth, firestore, storage,signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut};

