// firebase-config.js

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC7lxtxEzCVcOdEIdtRZpW8zeUrOOtJSSc",
  authDomain: "ziirtech-14582.firebaseapp.com",
  projectId: "ziirtech-14582",
  storageBucket: "ziirtech-14582.appspot.com",
  messagingSenderId: "113640437700",
  appId: "1:113640437700:web:554dbd7a98484d7aa5d691",
  measurementId: "G-YQ0T94KG20"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

console.log("Firebase inicializado correctamente desde firebase-config.js");