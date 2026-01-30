// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDhYTiWflm90SZTySJMDlBpGu7WHzkUaL4",
    authDomain: "manager-8ac68.firebaseapp.com",
    databaseURL: "https://manager-8ac68-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "manager-8ac68",
    storageBucket: "manager-8ac68.firebasestorage.app",
    messagingSenderId: "978586727124",
    appId: "1:978586727124:web:34e5fe89cc51f35b37c141",
    measurementId: "G-XPC0DXSBNZ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();

// Database references
const accountsRef = database.ref('accounts');
const balanceHistoryRef = database.ref('balanceHistory');

