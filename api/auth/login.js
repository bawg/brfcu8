// /api/auth/login.js
const admin = require('firebase-admin');

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
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Note: Firebase Admin SDK doesn't have direct login with email/password
    // We need to create a custom token and let the frontend handle the actual auth
    // OR use Firebase Auth REST API
    
    // Option 1: Using Firebase Auth REST API
    const firebaseAuthUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_WEB_API_KEY}`;
    
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
        error: getErrorMessage(authData.error?.message || 'Login failed') 
      });
    }

    // Verify the ID token with Admin SDK for extra security
    const decodedToken = await admin.auth().verifyIdToken(authData.idToken);
    
    // Create a secure session token (you could use JWT here)
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
        emailVerified: decodedToken.email_verified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}

function getErrorMessage(errorCode) {
  switch (errorCode) {
    case 'EMAIL_NOT_FOUND':
    case 'INVALID_EMAIL':
      return 'No account found with this email address.';
    case 'INVALID_PASSWORD':
      return 'Incorrect password.';
    case 'USER_DISABLED':
      return 'This account has been disabled.';
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return 'Too many failed attempts. Please try again later.';
    default:
      return 'Login failed. Please check your credentials.';
  }
}
