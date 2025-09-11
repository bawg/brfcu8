// /api/auth/logout.js
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
  // Allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session token from cookie
    const cookies = req.headers.cookie || '';
    const authToken = cookies
      .split(';')
      .find(cookie => cookie.trim().startsWith('auth-token='))
      ?.split('=')[1];

    if (authToken) {
      // Parse the session token to get user info
      try {
        const sessionData = JSON.parse(Buffer.from(authToken, 'base64').toString());
        
        // Optionally revoke all refresh tokens for the user in Firebase
        // This ensures they're logged out from all devices
        if (sessionData.uid) {
          try {
            await admin.auth().revokeRefreshTokens(sessionData.uid);
          } catch (revokeError) {
            console.error('Error revoking refresh tokens:', revokeError);
            // Don't fail logout if token revocation fails
          }
        }
      } catch (parseError) {
        console.error('Error parsing session token during logout:', parseError);
        // Continue with logout even if token parsing fails
      }
    }

    // Clear the auth cookie
    res.setHeader('Set-Cookie', [
      `auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear the cookie even if there's an error
    res.setHeader('Set-Cookie', [
      `auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`,
    ]);
    
    return res.status(500).json({ 
      error: 'Logout encountered an error, but session was cleared' 
    });
  }
}