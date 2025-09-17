// /api/auth/status.js
// Simple API status endpoint to help debug authentication issues

export default async function handler(req, res) {
  // Allow only GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables (without exposing them)
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_WEB_API_KEY: !!process.env.FIREBASE_WEB_API_KEY
    };

    // Check if all required env vars are present
    const allEnvPresent = Object.values(envCheck).every(Boolean);

    return res.status(200).json({
      status: 'Authentication API is running',
      timestamp: new Date().toISOString(),
      environment: {
        variables: envCheck,
        allConfigured: allEnvPresent
      },
      endpoints: {
        login: '/api/auth/login (POST)',
        signup: '/api/auth/signup (POST)', 
        logout: '/api/auth/logout (POST)',
        verify: '/api/auth/verify (GET)',
        user: '/api/auth/user (GET)'
      },
      troubleshooting: allEnvPresent ? 
        'All environment variables are configured.' :
        'Missing Firebase environment variables. Please configure them in your Vercel dashboard.'
    });

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ 
      error: 'Failed to check API status',
      details: error.message 
    });
  }
}