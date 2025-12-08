# Setup Instructions

This document provides step-by-step instructions for setting up and running the Financial Asset Management Web Application.

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A Firebase account (free tier is sufficient)
- A text editor or IDE (optional, for customization)

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "asset-management")
4. Follow the setup wizard:
   - Disable Google Analytics (optional, not required for this app)
   - Click "Create project"
5. Wait for project creation to complete

### Step 2: Enable Realtime Database

1. In your Firebase project, click on "Realtime Database" in the left sidebar
2. Click "Create Database"
3. Choose a location (select the closest region to you)
4. Choose security rules:
   - For development: Start in "Test mode" (allows read/write for 30 days)
   - For production: Set up proper authentication rules (see Security section)
5. Click "Enable"

### Step 3: Get Firebase Configuration

1. In Firebase Console, click the gear icon next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (`</>`) to add a web app
5. Register your app with a nickname (e.g., "Asset Management App")
6. Copy the Firebase configuration object (it looks like this):

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### Step 4: Configure Firebase in the Application

1. Open `js/firebase-config.js` in your project
2. Replace the placeholder configuration with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();
```

## Project Setup

### Step 1: Download/Clone Project Files

Ensure you have all project files in your workspace:
- `index.html`
- `css/styles.css`
- `js/` directory with all JavaScript files

### Step 2: Install Dependencies (CDN)

The application uses CDN links for external libraries. These are included in `index.html`:
- Firebase SDK
- Chart.js

No package manager installation is required.

### Step 3: Update Firebase Configuration

As described in Step 4 above, update `js/firebase-config.js` with your Firebase credentials.

## Running the Application

### Local Development

1. Open `index.html` in your web browser
   - Option 1: Double-click `index.html`
   - Option 2: Right-click → "Open with" → Choose your browser
   - Option 3: Use a local server (recommended for development)

### Using a Local Server (Recommended)

For better development experience, use a local server:

**Python 3:**
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

**Node.js (http-server):**
```bash
npx http-server -p 8000
```

**VS Code:**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

## Database Structure

After running the application, your Firebase Realtime Database will have this structure:

```
{
  "accounts": {
    "accountId1": {
      "accountName": "Mitsubishi UFJ Bank",
      "accountType": "Savings",
      "createdAt": "2024-01-01T00:00:00Z",
      "latestBalance": 1000000
    },
    "accountId2": { ... }
  },
  "balanceHistory": {
    "accountId1": {
      "historyId1": {
        "balance": 1000000,
        "inputDate": "2024-01-01T00:00:00Z",
        "memo": "Initial balance"
      },
      "historyId2": { ... }
    }
  }
}
```

## Security Configuration

### Development Mode (Test Mode)

For initial development, Test mode allows read/write access for 30 days. This is fine for personal use.

### Production Security Rules

For production, update your Firebase Realtime Database rules:

1. Go to Firebase Console → Realtime Database → Rules
2. Replace with appropriate rules:

```json
{
  "rules": {
    "accounts": {
      ".read": true,
      ".write": true
    },
    "balanceHistory": {
      ".read": true,
      ".write": true
    }
  }
}
```

**Note**: For better security, consider implementing Firebase Authentication and restricting access to authenticated users only.

## Troubleshooting

### Issue: Firebase connection errors

**Solution**: 
- Verify Firebase configuration in `js/firebase-config.js`
- Check that Realtime Database is enabled in Firebase Console
- Ensure database URL is correct

### Issue: CORS errors

**Solution**: 
- Use a local server instead of opening HTML file directly
- Check Firebase security rules

### Issue: Charts not displaying

**Solution**:
- Verify Chart.js CDN link is loaded
- Check browser console for JavaScript errors
- Ensure data exists in Firebase before rendering charts

### Issue: Data not saving

**Solution**:
- Check Firebase security rules allow write access
- Verify database reference path is correct
- Check browser console for error messages

## Next Steps

After setup:
1. Test adding your first account
2. Record an initial balance
3. Verify data appears in Firebase Console
4. Check that dashboard displays correctly
5. Test charts and history features

## Support

For issues or questions:
- Check browser console for error messages
- Verify Firebase Console for data structure
- Review this documentation

