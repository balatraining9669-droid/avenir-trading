# Avenir Trading

A modern web application for granite trading that connects factories with showroom owners.

## Features

### Admin Portal
- **Material Management**: Add, edit, and delete granite materials
- **Photo Upload**: Upload multiple photos for each material
- **Factory Details**: Store factory name, owner name, owner phone
- **Pricing**: Set and update rates per square foot
- **Stock Management**: Mark materials as available or sold
- **Private Notes**: Add internal notes visible only to admin

### Buyer Portal
- **Browse Materials**: View all available granite materials
- **Filter Options**: Filter by availability status
- **Buy Requests**: Express interest in materials
- **WhatsApp Integration**: Instant notification to admin via WhatsApp
- **Privacy**: Factory and owner details hidden from buyers

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase
  - Authentication (Email/Password)
  - PostgreSQL Database
  - Storage (for images)
  - Realtime subscriptions
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Supabase account (free tier available)

### Installation

1. Clone the repository:
```bash
cd avenir-trading
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - Get your Supabase URL and anon key from the Supabase dashboard

4. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_WHATSAPP_PHONE_NUMBER=919876543210
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Database Schema

### Tables

1. **users**: User profiles with roles
```sql
- uid: TEXT (unique)
- email: TEXT (unique)
- role: TEXT ('admin' or 'buyer')
- display_name: TEXT
- company_name: TEXT
- phone: TEXT
}
```

2. **materials**: Granite materials
```javascript
{
  id: string,
  factoryName: string,
  ownerName: string,
  ownerPhone: string,
  rate: number,
  images: string[],
  status: 'available' | 'sold',
  description?: string,
  notes?: string,
  createdAt: Date,
  updatedAt: Date,
  createdBy: string
}
```

3. **buyRequests**: Purchase requests from buyers
```javascript
{
  id: string,
  materialId: string,
  buyerEmail: string,
  buyerName: string,
  buyerPhone?: string,
  timestamp: Date,
  status: 'pending' | 'contacted' | 'completed'
}
```

### Storage Structure
```
materials/
  ├── timestamp_image1.jpg
  ├── timestamp_image2.jpg
  └── ...
```

### Security Rules

**Firestore Rules:**
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

**Storage Rules:**
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

## Creating Admin Account

Since buyers can self-register, you need to manually create an admin account:

1. Temporarily register as a buyer through the app
2. Go to Firebase Console → Firestore
3. Find your user document in the `users` collection
4. Change the `role` field from `buyer` to `admin`
5. Log out and log back in

## WhatsApp Integration

The app sends buy requests via WhatsApp Web. To set up:

1. Get a WhatsApp Business account
2. Update `VITE_WHATSAPP_PHONE_NUMBER` in `.env` with your number (include country code, e.g., 919876543210)
3. For production, consider using [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/business-management-api/)

## Deployment

### Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase:
```bash
firebase init
```
Select:
- Hosting
- Use existing project
- Build directory: `dist`
- Single-page app: Yes

4. Build and deploy:
```bash
npm run build
firebase deploy
```

### Deploy to Vercel/Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider

3. Set environment variables in your hosting dashboard

## Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Advanced search and filters
- [ ] Material comparison feature
- [ ] Wishlist for buyers
- [ ] Analytics dashboard for admin
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Bulk upload for materials
- [ ] Export data to Excel/PDF

## License

Private - All rights reserved

## Support

For support, email: support@avenirtrading.com
