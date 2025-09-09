# Authentication Troubleshooting Guide

## Issues Fixed

### 1. Firebase JavaScript SDK Import Errors

**Problem**: 
- "Unexpected token 'export'" 
- "Cannot use import statement outside a module"

**Solution**: 
Updated HTML files to use ES6 modules with proper imports:
```html
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
  import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
</script>
```

### 2. API Endpoint Issues

**Problem**: 
- 404/500 errors on `/api/auth/signin`
- "Authentication service configuration incomplete"

**Solution**: 
- Enhanced environment variable detection in `signin.js` and `signup.js`
- Added support for additional Firebase Web API key variable names:
  - `FIREBASE_WEB_API_KEY`
  - `FIREBASE_API_KEY` 
  - `REACT_APP_FIREBASE_API_KEY`
  - `FIREBASE_CLIENT_API_KEY`
  - `VERCEL_FIREBASE_WEB_API_KEY`
  - `VERCEL_FIREBASE_API_KEY`

### 3. Password Authentication Issues

**Problem**: Any password was accepted for valid emails

**Solution**: Removed password bypass logic and enforced proper Firebase REST API authentication

## Testing the API

### Using Postman
1. Import `postman-collection.json`
2. Set the `BASE_URL` variable to your Vercel deployment URL
3. Run the test collection

### Using curl Script
```bash
./test-auth-api.sh https://your-vercel-deployment.vercel.app
```

### Manual Testing
```bash
# Test signup
curl -X POST https://your-vercel-deployment.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234","displayName":"Test User"}'

# Test signin
curl -X POST https://your-vercel-deployment.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234"}'
```

## Environment Variables Required

### For Vercel Deployment
Set these in your Vercel dashboard under Project Settings > Environment Variables:

1. **Firebase Admin SDK** (required):
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL` 
   - `FIREBASE_PRIVATE_KEY`

2. **Firebase Web API Key** (choose one):
   - `FIREBASE_WEB_API_KEY` (recommended)
   - `FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_API_KEY`
   - `FIREBASE_CLIENT_API_KEY`
   - `VERCEL_FIREBASE_WEB_API_KEY`

### Finding Your Firebase Web API Key
1. Go to Firebase Console > Project Settings
2. Under "General" tab, scroll down to "Your apps"
3. Look for "Web API Key" - this is the value you need

## Expected Behavior

### Signup
- Creates user in Firebase
- Returns 201 with success message
- User can then signin with same credentials

### Signin
- Validates password using Firebase REST API
- Returns 200 with user data for correct credentials
- Returns 401 for wrong password or non-existent user
- **No longer accepts any password for valid emails**

## Debugging

Check the Vercel Function logs to see detailed environment variable detection:
```
Vercel deployment environment variables check:
- FIREBASE_WEB_API_KEY: SET/MISSING
- FIREBASE_API_KEY: SET/MISSING
...
```

The API will show exactly which environment variables are detected and which are missing.