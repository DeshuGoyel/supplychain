#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Authentication System Test ===${NC}\n"

# Test 1: Health Check
echo -e "${BLUE}1. Testing Backend Health...${NC}"
HEALTH=$(curl -s http://localhost:3001/api/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    exit 1
fi

# Test 2: Login with Demo Account
echo -e "\n${BLUE}2. Testing Login (Demo Account)...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@acme.com","password":"demo123"}')

LOGIN_SUCCESS=$(echo $LOGIN_RESPONSE | jq -r '.success')
if [ "$LOGIN_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
    USER_NAME=$(echo $LOGIN_RESPONSE | jq -r '.user.name')
    COMPANY_NAME=$(echo $LOGIN_RESPONSE | jq -r '.user.company.name')
    echo -e "  User: ${USER_NAME}"
    echo -e "  Company: ${COMPANY_NAME}"
else
    echo -e "${RED}✗ Login failed${NC}"
    echo $LOGIN_RESPONSE | jq '.'
fi

# Test 3: Get Current User (Protected Route)
if [ ! -z "$TOKEN" ]; then
    echo -e "\n${BLUE}3. Testing Protected Route (/api/auth/me)...${NC}"
    ME_RESPONSE=$(curl -s -X GET http://localhost:3001/api/auth/me \
      -H "Authorization: Bearer $TOKEN")
    
    ME_SUCCESS=$(echo $ME_RESPONSE | jq -r '.success')
    if [ "$ME_SUCCESS" = "true" ]; then
        echo -e "${GREEN}✓ Protected route accessible${NC}"
        echo -e "  Email: $(echo $ME_RESPONSE | jq -r '.user.email')"
        echo -e "  Role: $(echo $ME_RESPONSE | jq -r '.user.role')"
    else
        echo -e "${RED}✗ Protected route failed${NC}"
    fi
fi

# Test 4: Frontend Health Check
echo -e "\n${BLUE}4. Testing Frontend...${NC}"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
    echo -e "  URL: http://localhost:3000"
else
    echo -e "${RED}✗ Frontend is not responding${NC}"
fi

# Summary
echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo -e "Backend API: ${GREEN}http://localhost:3001${NC}"
echo -e "Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "\n${BLUE}Demo Credentials:${NC}"
echo -e "Email: ${GREEN}manager@acme.com${NC}"
echo -e "Password: ${GREEN}demo123${NC}"
echo -e "\nSee DEMO_CREDENTIALS.md for more accounts and details."
