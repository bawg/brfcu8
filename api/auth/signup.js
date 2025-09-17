// /api/auth/signup.js
const admin = require('firebase-admin');

// For Node.js environments that don't have fetch built-in
const fetch = globalThis.fetch || require('node-fetch');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if required environment variables are set
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_WEB_API_KEY) {
      console.error('Missing Firebase environment variables');
      return res.status(500).json({ 
        error: 'Authentication service not properly configured. Please check environment variables.' 
      });
    }

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Use Firebase Auth REST API to create account
    const firebaseAuthUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${process.env.FIREBASE_WEB_API_KEY}`;
    
    const response = await fetch(firebaseAuthUrl, {
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

    const authData = await response.json();

    if (!response.ok) {
      return res.status(400).json({ 
        error: getErrorMessage(authData.error?.message || 'Signup failed') 
      });
    }

    // Verify the ID token with Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(authData.idToken);
    
    // Create a secure session token
    const sessionToken = Buffer.from(JSON.stringify({
      uid: decodedToken.uid,
      email: decodedToken.email,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64');

    // Set secure HTTP-only cookie
    res.setHeader('Set-Cookie', [
      `auth-token=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`,
    ]);

    return res.status(200).json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified || false
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

function getErrorMessage(errorCode) {
  switch (errorCode) {
    case 'EMAIL_EXISTS':
      return 'An account with this email already exists.';
    case 'INVALID_EMAIL':
      return 'Invalid email address.';
    case 'WEAK_PASSWORD':
      return 'Password is too weak. Please choose a stronger password.';
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return 'Too many attempts. Please try again later.';
    default:
      return 'Account creation failed. Please try again.';
  }
}