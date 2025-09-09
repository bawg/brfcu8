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

  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const auth = getAuth();
    
    // Create user
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      emailVerified: false,
    });

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
