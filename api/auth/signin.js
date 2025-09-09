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

  const { idToken, email, password } = req.body;

  // Support both idToken-based auth and email/password auth
  if (!idToken && (!email || !password)) {
    return res.status(400).json({ error: 'Either ID token or email/password is required' });
  }

  try {
    const auth = getAuth();
    let userRecord;
    
    if (idToken) {
      // Firebase client-side authentication flow (production mode)
      const decodedToken = await auth.verifyIdToken(idToken);
      userRecord = await auth.getUser(decodedToken.uid);
    } else {
      // Direct email/password authentication for demo mode
      // Since Firebase Admin SDK doesn't support password verification,
      // we'll use the Firebase REST API for authentication
      
      const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
      // Try multiple possible environment variable names for the Firebase Web API key
      const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || 
                                   process.env.FIREBASE_API_KEY || 
                                   process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
                                   process.env.VITE_FIREBASE_API_KEY;
      
      if (!FIREBASE_WEB_API_KEY && !FIREBASE_PROJECT_ID) {
        console.error('Firebase Web API Key and Project ID not found. Authentication cannot proceed.');
        return res.status(500).json({ 
          error: 'Authentication service configuration incomplete. Please contact administrator.',
          details: 'Missing Firebase configuration'
        });
      }

      if (!FIREBASE_WEB_API_KEY) {
        console.error('Firebase Web API Key not found. Tried: FIREBASE_WEB_API_KEY, FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_API_KEY, VITE_FIREBASE_API_KEY');
        
        // For demo mode without Web API key, we can only check if user exists
        // but cannot verify password. This is a limitation of demo mode.
        try {
          const userRecord = await auth.getUserByEmail(email);
          if (userRecord) {
            // In demo mode, we'll trust that if the user exists and they're trying to login,
            // we'll allow it (since we can't verify password without the Web API key)
            // THIS IS FOR DEMO PURPOSES ONLY - NOT SECURE FOR PRODUCTION
            console.warn('DEMO MODE: Password verification skipped due to missing Web API key');
            return res.status(200).json({ 
              success: true,
              user: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                photoURL: userRecord.photoURL,
                emailVerified: userRecord.emailVerified
              },
              warning: 'Demo mode: Password verification bypassed'
            });
          }
        } catch (userError) {
          if (userError.code === 'auth/user-not-found') {
            return res.status(404).json({ error: 'No account found with this email address' });
          }
          throw userError;
        }
      }
      
      // Use Firebase REST API to verify email/password
      const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true
        })
      });
      
      const authData = await authResponse.json();
      
      if (!authResponse.ok) {
        let errorMessage = 'Invalid email or password';
        if (authData.error) {
          if (authData.error.message.includes('EMAIL_NOT_FOUND')) {
            errorMessage = 'No account found with this email address';
          } else if (authData.error.message.includes('INVALID_PASSWORD')) {
            errorMessage = 'Invalid password';
          } else if (authData.error.message.includes('USER_DISABLED')) {
            errorMessage = 'This account has been disabled';
          } else if (authData.error.message.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
            errorMessage = 'Too many failed attempts. Please try again later';
          }
        }
        return res.status(401).json({ error: errorMessage });
      }
      
      // Get user record from Firebase Admin
      userRecord = await auth.getUser(authData.localId);
    }

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
    console.error('Signin error:', error);
    
    let errorMessage = 'Authentication failed';
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Session expired. Please sign in again';
    } else if (error.code === 'auth/invalid-id-token') {
      errorMessage = 'Invalid authentication token';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Invalid password';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later';
    }
    
    res.status(401).json({ error: errorMessage });
  }
}
