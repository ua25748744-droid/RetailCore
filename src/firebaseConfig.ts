// Firebase configuration using compat (namespaced) API
// Your web app's Firebase configuration

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCYqqJJPHKZeqm9CvpHSLBUoqJHPSknRVI",
    authDomain: "retailcore-pos-51b36.firebaseapp.com",
    projectId: "retailcore-pos-51b36",
    storageBucket: "retailcore-pos-51b36.firebasestorage.app",
    messagingSenderId: "457544700940",
    appId: "1:457544700940:web:e81edb28527849ecd74a29",
    measurementId: "G-YWTV4QHZ87"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export default firebase;
