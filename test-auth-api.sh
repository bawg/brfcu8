#!/bin/bash

# Barnes Rugby Authentication API Test Script
# Replace YOUR_VERCEL_URL with your actual Vercel deployment URL

BASE_URL="${1:-https://your-vercel-deployment.vercel.app}"
echo "Testing Barnes Rugby Authentication API at: $BASE_URL"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    
    echo -e "\n${YELLOW}Testing: $name${NC}"
    echo "Endpoint: $method $endpoint"
    echo "Data: $data"
    echo "Response:"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    if [ "$http_status" -ge 200 ] && [ "$http_status" -lt 300 ]; then
        echo -e "${GREEN}✓ Success (HTTP $http_status)${NC}"
    elif [ "$http_status" -ge 400 ] && [ "$http_status" -lt 500 ]; then
        echo -e "${YELLOW}⚠ Client Error (HTTP $http_status)${NC}"
    else
        echo -e "${RED}✗ Server Error (HTTP $http_status)${NC}"
    fi
    
    echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
    echo "----------------------------------------"
}

echo -e "\n${YELLOW}1. Testing Signup${NC}"
test_endpoint "Signup New User" "POST" "/api/auth/signup" '{
  "email": "test@example.com",
  "password": "test123456",
  "displayName": "Test User"
}'

echo -e "\n${YELLOW}2. Testing Signin with Correct Password${NC}"
test_endpoint "Signin with Correct Credentials" "POST" "/api/auth/signin" '{
  "email": "test@example.com",
  "password": "test123456"
}'

echo -e "\n${YELLOW}3. Testing Signin with Wrong Password${NC}"
test_endpoint "Signin with Wrong Password" "POST" "/api/auth/signin" '{
  "email": "test@example.com",
  "password": "wrongpassword"
}'

echo -e "\n${YELLOW}4. Testing Signin with Non-existent User${NC}"
test_endpoint "Signin with Non-existent User" "POST" "/api/auth/signin" '{
  "email": "nonexistent@example.com",
  "password": "somepassword"
}'

echo -e "\n${YELLOW}5. Testing Password Reset${NC}"
test_endpoint "Password Reset" "POST" "/api/auth/reset-password" '{
  "email": "test@example.com"
}'

echo -e "\n${YELLOW}6. Testing Signin with ID Token (will likely fail without real token)${NC}"
test_endpoint "Signin with ID Token" "POST" "/api/auth/signin" '{
  "idToken": "fake-id-token-for-testing"
}'

echo -e "\n${YELLOW}7. Testing Environment Variables Debug${NC}"
test_endpoint "Environment Debug" "POST" "/api/auth/signin" '{
  "email": "debug@test.com",
  "password": "debug123"
}'

echo -e "\n${GREEN}Test completed!${NC}"
echo -e "\n${YELLOW}Expected Results:${NC}"
echo "- Signup should return 201 with success message"
echo "- Signin with correct password should return 200 with user data"
echo "- Signin with wrong password should return 401 with error message"
echo "- Non-existent user should return 401 with error message"
echo "- Password reset should return 200 with success message"
echo "- ID Token signin will fail with fake token but show the endpoint works"
echo "- Environment debug should show detailed Firebase configuration info"

echo -e "\n${YELLOW}Usage:${NC}"
echo "  ./test-auth-api.sh https://your-vercel-deployment.vercel.app"
echo ""
echo -e "${YELLOW}Note:${NC}"
echo "Replace 'your-vercel-deployment.vercel.app' with your actual Vercel URL"
echo "Make sure jq is installed for JSON formatting (optional)"