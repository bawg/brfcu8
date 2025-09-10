import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test Firebase connection
    const auth = getAuth();
    
    // Try to list users (just first 1 to test connection)
    const listUsersResult = await auth.listUsers(1);
    
    res.status(200).json({ 
      success: true,
      message: 'Firebase connection successful',
      firebaseProject: process.env.FIREBASE_PROJECT_ID,
      userCount: listUsersResult.users.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Firebase connection test failed:', error);
    
    res.status(500).json({ 
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
}
