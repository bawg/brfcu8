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
                                 process.env.VITE_FIREBASE_API_KEY ||
                                 process.env.REACT_APP_FIREBASE_API_KEY ||
                                 process.env.FIREBASE_CLIENT_API_KEY ||
                                 process.env.VERCEL_FIREBASE_WEB_API_KEY ||
                                 process.env.VERCEL_FIREBASE_API_KEY;
    
    console.log('Signup process - Firebase Web API Key:', FIREBASE_WEB_API_KEY ? 'Available' : 'Not available');
    console.log('Signup process - Environment debug:');
    console.log('- FIREBASE_WEB_API_KEY:', process.env.FIREBASE_WEB_API_KEY ? 'SET' : 'MISSING');
    console.log('- FIREBASE_API_KEY:', process.env.FIREBASE_API_KEY ? 'SET' : 'MISSING');
    console.log('- NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'MISSING');
    console.log('- VITE_FIREBASE_API_KEY:', process.env.VITE_FIREBASE_API_KEY ? 'SET' : 'MISSING');
    console.log('- REACT_APP_FIREBASE_API_KEY:', process.env.REACT_APP_FIREBASE_API_KEY ? 'SET' : 'MISSING');
    console.log('- FIREBASE_CLIENT_API_KEY:', process.env.FIREBASE_CLIENT_API_KEY ? 'SET' : 'MISSING');
    console.log('- VERCEL_FIREBASE_WEB_API_KEY:', process.env.VERCEL_FIREBASE_WEB_API_KEY ? 'SET' : 'MISSING');
    console.log('- VERCEL_FIREBASE_API_KEY:', process.env.VERCEL_FIREBASE_API_KEY ? 'SET' : 'MISSING');
    console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING');
    console.log('- FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? 'SET' : 'MISSING');
    console.log('- FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? 'SET' : 'MISSING');
    
    let userRecord;
    
    if (FIREBASE_WEB_API_KEY) {
      // Use Firebase REST API for consistent password handling with signin
      console.log('Creating user via Firebase REST API for password compatibility with signin');
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
      console.log('Firebase REST API signup response status:', signupResponse.status);
      
      if (!signupResponse.ok) {
        let errorMessage = 'Failed to create account';
        if (signupData.error) {
          console.log('Signup error details:', signupData.error);
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
      
      console.log('User created successfully via REST API:', signupData.localId);
      
      // Get the user record from Firebase Admin for consistent response format
      userRecord = await auth.getUser(signupData.localId);
      
      // If displayName was provided, update it (REST API doesn't always set it correctly)
      if (displayName && !userRecord.displayName) {
        console.log('Updating display name via Admin SDK');
        userRecord = await auth.updateUser(signupData.localId, {
          displayName: displayName
        });
      }
    } else {
      // Fallback to Firebase Admin SDK (demo mode)
      console.warn('Firebase Web API Key not found. Creating user via Firebase Admin SDK (demo mode)');
      console.warn('WARNING: Users created via Admin SDK may have password compatibility issues with REST API signin');
      console.warn('For production use, ensure Firebase Web API Key is properly configured');
      
      userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: displayName || null,
        emailVerified: false,
      });
      
      console.log('User created via Admin SDK:', userRecord.uid);
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
