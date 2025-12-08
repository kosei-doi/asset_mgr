// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCjeUlPrNXZ9yiElYp9mu_I_S6GMU1XRO4",
    authDomain: "asset-3a5ef.firebaseapp.com",
    databaseURL: "https://asset-3a5ef-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "asset-3a5ef",
    storageBucket: "asset-3a5ef.firebasestorage.app",
    messagingSenderId: "740017515624",
    appId: "1:740017515624:web:6bbd54b0255a4674f8dfdd",
    measurementId: "G-VQL64K3549"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();

// Database references
const accountsRef = database.ref('accounts');
const balanceHistoryRef = database.ref('balanceHistory');

