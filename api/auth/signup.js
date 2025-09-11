// /api/auth/signup.js
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

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password should be at least 6 characters' 
      });
    }

    // Create user with Firebase Admin SDK
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false,
    });

    // Create a custom token for immediate login
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    
    // Sign in with custom token to get ID token
    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_WEB_API_KEY}`;
    
    const signInResponse = await fetch(signInUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: customToken,
        returnSecureToken: true
      })
    });

    const signInData = await signInResponse.json();

    if (!signInResponse.ok) {
      // If sign-in fails, clean up the created user
      await admin.auth().deleteUser(userRecord.uid);
      return res.status(500).json({ error: 'Account creation failed' });
    }

    // Create session token
    const sessionToken = Buffer.from(JSON.stringify({
      uid: userRecord.uid,
      email: userRecord.email,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64');

    // Set secure HTTP-only cookie
    res.setHeader('Set-Cookie', [
      `auth-token=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`,
    ]);

    return res.status(201).json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle Firebase-specific errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ 
        error: 'An account with this email already exists' 
      });
    }
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ 
        error: 'Please enter a valid email address' 
      });
    }
    
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ 
        error: 'Password should be at least 6 characters' 
      });
    }

    return res.status(500).json({ 
      error: 'Account creation failed' 
    });
  }
}
