// Migration Configuration - SAFELY move data between Firebase databases
// IMPORTANT: This configuration allows reading from source and writing to destination

const sourceFirebaseConfig = {
    apiKey: "AIzaSyCjeUlPrNXZ9yiElYp9mu_I_S6GMU1XRO4",
    authDomain: "asset-3a5ef.firebaseapp.com",
    databaseURL: "https://asset-3a5ef-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "asset-3a5ef",
    storageBucket: "asset-3a5ef.firebasestorage.app",
    messagingSenderId: "740017515624",
    appId: "1:740017515624:web:6bbd54b0255a4674f8dfdd",
    measurementId: "G-VQL64K3549"
};

const destinationFirebaseConfig = {
    apiKey: "AIzaSyDhYTiWflm90SZTySJMDlBpGu7WHzkUaL4",
    authDomain: "manager-8ac68.firebaseapp.com",
    databaseURL: "https://manager-8ac68-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "manager-8ac68",
    storageBucket: "manager-8ac68.firebasestorage.app",
    messagingSenderId: "978586727124",
    appId: "1:978586727124:web:34e5fe89cc51f35b37c141",
    measurementId: "G-XPC0DXSBNZ"
};

// Initialize both Firebase apps (source and destination)
const sourceApp = firebase.initializeApp(sourceFirebaseConfig, 'source');
const destinationApp = firebase.initializeApp(destinationFirebaseConfig, 'destination');

// Get database references
const sourceDatabase = sourceApp.database();
const destinationDatabase = destinationApp.database();

// Data structure validation
const expectedDataStructure = {
    accounts: {
        accountId: {
            name: 'string',
            type: 'string',
            balance: 'number',
            currency: 'string',
            createdAt: 'string',
            updatedAt: 'string'
        }
    },
    balanceHistory: {
        accountId: {
            historyId: {
                amount: 'number',
                type: 'string', // 'deposit' | 'withdrawal' | 'transfer'
                description: 'string',
                timestamp: 'string',
                balanceBefore: 'number',
                balanceAfter: 'number'
            }
        }
    }
};

module.exports = {
    sourceDatabase,
    destinationDatabase,
    expectedDataStructure
};
