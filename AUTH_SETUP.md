# Barnes Rugby Coaching Management Platform - Authentication Setup

## Overview
The authentication system uses Firebase Admin SDK with custom session management for secure user authentication.

## Required Environment Variables

To make authentication work, you need to configure these environment variables in your Vercel deployment:

### Firebase Configuration
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_PRIVATE_KEY` - Firebase service account private key
- `FIREBASE_CLIENT_EMAIL` - Firebase service account client email  
- `FIREBASE_WEB_API_KEY` - Firebase Web API key for client-side authentication

### How to Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key" to download the service account JSON
5. Extract the following values from the JSON:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` 
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
6. For Web API Key: Go to Project Settings > General > Web API Key

### Setting Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add each variable with its corresponding value

## API Endpoints

- `GET /api/auth/status` - Check API status and configuration
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify current session
- `GET /api/auth/user` - Get current user info

## Test Accounts

The system should work with any valid Firebase user accounts. To test:

1. First create an account using the signup form
2. Or use the Firebase Console to create test users manually

## Troubleshooting

1. **500 Internal Server Error**: Usually means environment variables are missing
   - Check `/api/auth/status` to verify configuration
   - Ensure all Firebase environment variables are set in Vercel

2. **401 Unauthorized**: Session/authentication issues
   - Clear browser cookies and try again
   - Check that Firebase project allows email/password authentication

3. **Login fails with "Email not found"**: 
   - User needs to create an account first using signup
   - Or manually create users in Firebase Console

## Security Notes

- Sessions are stored as HTTP-only cookies
- All API calls are server-side authenticated
- Private keys are never exposed to the client
- Session tokens expire after 24 hours