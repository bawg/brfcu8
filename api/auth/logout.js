// /api/auth/logout.js

export default async function handler(req, res) {
  // Allow GET and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear the authentication cookie
    res.setHeader('Set-Cookie', [
      `auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ 
      error: 'Logout failed' 
    });
  }
}
