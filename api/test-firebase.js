// Create this file as: /api/test-firebase-key.js
// Then deploy to Vercel and visit: https://yoursite.vercel.app/api/test-firebase-key

const admin = require('firebase-admin');

export default async function handler(req, res) {
  try {
    // Get environment variables
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    
    // Check if variables exist
    if (!privateKey) {
      return res.status(500).json({ 
        error: 'FIREBASE_PRIVATE_KEY environment variable missing',
        status: 'FAILED'
      });
    }
    
    if (!clientEmail) {
      return res.status(500).json({ 
        error: 'FIREBASE_CLIENT_EMAIL environment variable missing',
        status: 'FAILED'
      });
    }
    
    if (!projectId) {
      return res.status(500).json({ 
        error: 'FIREBASE_PROJECT_ID environment variable missing', 
        status: 'FAILED'
      });
    }

    // Initialize Firebase (only if not already initialized)
    if (!admin.apps.length) {
      const serviceAccount = {
        type: "service_account",
        project_id: projectId,
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: clientEmail,
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    
    // Test the key by creating a custom token
    const testToken = await admin.auth().createCustomToken('test-user-123');
    
    // If we get here, the key works!
    res.status(200).json({
      status: 'SUCCESS',
      message: '🎉 Firebase private key is VALID!',
      details: {
        projectId: projectId,
        clientEmail: clientEmail,
        privateKeyLength: privateKey.length,
        tokenGenerated: true,
        tokenLength: testToken.length
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'FAILED',
      error: error.message,
      tip: error.message.includes('private_key') 
        ? 'Check your FIREBASE_PRIVATE_KEY format' 
        : 'Check your Firebase service account credentials'
    });
  }
}
