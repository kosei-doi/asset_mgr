# Firebase Security Rules

## Quick Setup for Development

To fix the `PERMISSION_DENIED` error, update your Firebase Realtime Database security rules:

### Steps:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `asset-3a5ef`
3. Navigate to **Realtime Database** → **Rules** tab
4. Replace the rules with the following:

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

5. Click **Publish** button
6. Refresh your application

### What These Rules Do:
- Allow anyone to read and write to `/accounts` path
- Allow anyone to read and write to `/balanceHistory` path
- Suitable for personal/development use

### For Production (More Secure):
If you want to add authentication later, you can use:

```json
{
  "rules": {
    "accounts": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "balanceHistory": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

This requires users to be authenticated before accessing data.

