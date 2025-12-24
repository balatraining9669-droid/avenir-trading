# Quick Setup Guide for Avenir Trading

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Set Up Firebase

1. Go to https://console.firebase.google.com/
2. Click "Add project" and create a new project
3. Give it a name (e.g., "avenir-trading")
4. Disable Google Analytics (optional)
5. Click "Create Project"

### Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get Started"
3. Enable "Email/Password" sign-in method

### Create Firestore Database
1. Go to "Firestore Database"
2. Click "Create database"
3. Start in "production mode"
4. Choose a location (closest to you)

### Enable Storage
1. Go to "Storage"
2. Click "Get Started"
3. Start in "production mode"

### Get Firebase Config
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click web icon (</>)
4. Register app with nickname "Avenir Trading"
5. Copy the firebaseConfig values

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_WHATSAPP_PHONE_NUMBER=919876543210
```

## Step 4: Set Up Firebase Security Rules

### Firestore Rules
In Firebase Console → Firestore Database → Rules, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /materials/{materialId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /buyRequests/{requestId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow create: if request.auth != null;
    }
  }
}
```

### Storage Rules
In Firebase Console → Storage → Rules, paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /materials/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Step 5: Start Development Server
```bash
npm run dev
```

App will be available at http://localhost:3000

## Step 6: Create Admin Account

1. Open http://localhost:3000
2. Click "Register as Buyer"
3. Fill in your details and register
4. Go to Firebase Console → Firestore Database
5. Find the `users` collection
6. Click on your user document
7. Change `role` from `buyer` to `admin`
8. Log out and log back in

You're now an admin! 🎉

## Usage

### As Admin:
- Click "Add New Material" to add granite materials
- Upload photos, add factory details, owner info, and pricing
- Mark materials as available or sold
- Edit or delete materials

### As Buyer:
- Browse available materials
- Filter by availability
- Click "I'm Interested" to send a buy request
- Your contact info will be sent via WhatsApp

## Need Help?

Check the full README.md for detailed documentation and deployment instructions.
