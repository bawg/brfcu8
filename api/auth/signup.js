import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin
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

  const { email, password, displayName } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const auth = getAuth();
    
    // Try to use Firebase REST API for user creation if Web API key is available
    // This ensures better compatibility with the signin process
    const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || 
                                 process.env.FIREBASE_API_KEY || 
                                 process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
                                 process.env.VITE_FIREBASE_API_KEY;
    
    let userRecord;
    
    if (FIREBASE_WEB_API_KEY) {
      // Use Firebase REST API for consistent password handling with signin
      console.log('Creating user via Firebase REST API for compatibility with signin');
      const signupResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_WEB_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          displayName: displayName || null,
          returnSecureToken: true
        })
      });
      
      const signupData = await signupResponse.json();
      
      if (!signupResponse.ok) {
        let errorMessage = 'Failed to create account';
        if (signupData.error) {
          if (signupData.error.message.includes('EMAIL_EXISTS')) {
            errorMessage = 'An account with this email already exists';
          } else if (signupData.error.message.includes('INVALID_EMAIL')) {
            errorMessage = 'Invalid email address';
          } else if (signupData.error.message.includes('WEAK_PASSWORD')) {
            errorMessage = 'Password is too weak (minimum 6 characters)';
          }
        }
        return res.status(400).json({ error: errorMessage });
      }
      
      // Get the user record from Firebase Admin for consistent response format
      userRecord = await auth.getUser(signupData.localId);
      
      // If displayName was provided, update it (REST API doesn't always set it correctly)
      if (displayName && !userRecord.displayName) {
        userRecord = await auth.updateUser(signupData.localId, {
          displayName: displayName
        });
      }
    } else {
      // Fallback to Firebase Admin SDK (demo mode)
      console.log('Creating user via Firebase Admin SDK (demo mode)');
      userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: displayName || null,
        emailVerified: false,
      });
    }

    res.status(201).json({ 
      success: true, 
      uid: userRecord.uid,
      message: 'Account created successfully' 
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    let errorMessage = 'Failed to create account';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'An account with this email already exists';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    }
    
    res.status(400).json({ error: errorMessage });
  }
}
