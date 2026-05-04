// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCtNQ1epsgV4Ut4qFH0Ol6mqwFB1KCob64",
  authDomain: "workstream-a5bc6.firebaseapp.com",
  projectId: "workstream-a5bc6",
  storageBucket: "workstream-a5bc6.firebasestorage.app",
  messagingSenderId: "827017410467",
  appId: "1:827017410467:web:9db7cdaa027249cca48c16",
  measurementId: "G-TZJMBJX5D0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);