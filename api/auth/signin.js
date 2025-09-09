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
      console.log('Using idToken-based authentication (production mode)');
      const decodedToken = await auth.verifyIdToken(idToken);
      userRecord = await auth.getUser(decodedToken.uid);
    } else {
      // Direct email/password authentication for demo mode
      console.log('Attempting email/password authentication for:', email);
      
      const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
      const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
      const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;
      
      // Try multiple possible environment variable names for the Firebase Web API key
      const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || 
                                   process.env.FIREBASE_API_KEY || 
                                   process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
                                   process.env.VITE_FIREBASE_API_KEY ||
                                   process.env.REACT_APP_FIREBASE_API_KEY ||
                                   process.env.FIREBASE_CLIENT_API_KEY;
      
      console.log('Firebase configuration detailed check:', {
        projectId: FIREBASE_PROJECT_ID ? 'Found' : 'Missing',
        clientEmail: FIREBASE_CLIENT_EMAIL ? 'Found' : 'Missing',
        privateKey: FIREBASE_PRIVATE_KEY ? 'Found (length: ' + (FIREBASE_PRIVATE_KEY?.length || 0) + ')' : 'Missing',
        webApiKey: FIREBASE_WEB_API_KEY ? 'Found (starts with: ' + FIREBASE_WEB_API_KEY.substring(0, 10) + '...)' : 'Missing'
      });

      if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
        console.error('Firebase Admin SDK configuration incomplete');
        return res.status(500).json({ 
          error: 'Authentication service configuration incomplete. Please contact administrator.',
          details: 'Missing Firebase Admin SDK credentials (Project ID, Client Email, or Private Key)'
        });
      }

      if (FIREBASE_WEB_API_KEY) {
        // Use Firebase REST API to verify email/password - this is the proper way
        console.log('Using Firebase REST API for password verification');
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
        console.log('Firebase REST API response status:', authResponse.status);
        
        if (!authResponse.ok) {
          let errorMessage = 'Invalid email or password';
          if (authData.error) {
            console.log('Firebase authentication error:', authData.error.message);
            if (authData.error.message.includes('EMAIL_NOT_FOUND')) {
              errorMessage = 'No account found with this email address';
            } else if (authData.error.message.includes('INVALID_PASSWORD')) {
              // This is a legitimate password failure - do not bypass it
              errorMessage = 'Invalid password';
            } else if (authData.error.message.includes('USER_DISABLED')) {
              errorMessage = 'This account has been disabled';
            } else if (authData.error.message.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
              errorMessage = 'Too many failed attempts. Please try again later';
            }
          }
          return res.status(401).json({ error: errorMessage });
        }
        
        // Authentication successful via REST API
        console.log('Password authentication successful via REST API');
        userRecord = await auth.getUser(authData.localId);
      } else {
        // No Web API key available - cannot perform secure password authentication
        console.error('Firebase Web API Key not found. Cannot perform password verification.');
        console.error('Available environment variables (debug):');
        console.error('- FIREBASE_WEB_API_KEY:', process.env.FIREBASE_WEB_API_KEY ? 'SET' : 'MISSING');
        console.error('- FIREBASE_API_KEY:', process.env.FIREBASE_API_KEY ? 'SET' : 'MISSING');
        console.error('- NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'MISSING');
        console.error('- VITE_FIREBASE_API_KEY:', process.env.VITE_FIREBASE_API_KEY ? 'SET' : 'MISSING');
        console.error('- REACT_APP_FIREBASE_API_KEY:', process.env.REACT_APP_FIREBASE_API_KEY ? 'SET' : 'MISSING');
        console.error('- FIREBASE_CLIENT_API_KEY:', process.env.FIREBASE_CLIENT_API_KEY ? 'SET' : 'MISSING');
        console.error('Total env vars:', Object.keys(process.env).length);
        console.error('Firebase-related env vars:', Object.keys(process.env).filter(key => key.includes('FIREBASE')));
        console.error('All env var names containing API or KEY:', Object.keys(process.env).filter(key => key.includes('API') || key.includes('KEY')));
        
        return res.status(500).json({ 
          error: 'Authentication service configuration incomplete. Password verification requires Firebase Web API key.',
          details: 'Missing Firebase Web API key - contact administrator to configure FIREBASE_WEB_API_KEY environment variable'
        });
      }
    }

    // Return successful authentication result
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
