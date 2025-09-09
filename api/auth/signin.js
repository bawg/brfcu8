import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin (same as above)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'ID token is required' });
  }

  try {
    const auth = getAuth();
    
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Get user data
    const userRecord = await auth.getUser(decodedToken.uid);

    res.status(200).json({ 
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified
      }
    });

  } catch (error) {
    console.error('Signin verification error:', error);
    
    let errorMessage = 'Authentication failed';
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Session expired. Please sign in again';
    } else if (error.code === 'auth/invalid-id-token') {
      errorMessage = 'Invalid authentication token';
    }
    
    res.status(401).json({ error: errorMessage });
  }
}
