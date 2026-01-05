#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Supply Chain AI Control Assistant   ║${NC}"
echo -e "${BLUE}║         Starting Services...           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Check if services are already running
if pgrep -f "ts-node src/index.ts" > /dev/null; then
    echo -e "${YELLOW}⚠ Backend already running${NC}"
else
    echo -e "${BLUE}🚀 Starting Backend Server...${NC}"
    cd /home/engine/project
    npm run dev > backend.log 2>&1 &
    BACKEND_PID=$!
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
    sleep 2
fi

if pgrep -f "next dev" > /dev/null; then
    echo -e "${YELLOW}⚠ Frontend already running${NC}"
else
    echo -e "${BLUE}🎨 Starting Frontend Server...${NC}"
    cd /home/engine/project/frontend
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
    sleep 3
fi

echo -e "\n${BLUE}═══ Service Status ═══${NC}"

# Check backend
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✓ Backend API:${NC} http://localhost:3001"
else
    echo -e "${YELLOW}⏳ Backend starting...${NC} http://localhost:3001"
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Frontend:${NC}    http://localhost:3000"
else
    echo -e "${YELLOW}⏳ Frontend starting...${NC} http://localhost:3000"
fi

echo -e "\n${BLUE}═══ Demo Login ═══${NC}"
echo -e "${GREEN}Email:${NC}    manager@acme.com"
echo -e "${GREEN}Password:${NC} demo123"

echo -e "\n${BLUE}═══ Useful Commands ═══${NC}"
echo -e "View backend logs:  ${GREEN}tail -f backend.log${NC}"
echo -e "View frontend logs: ${GREEN}tail -f frontend.log${NC}"
echo -e "Stop all services:  ${GREEN}./stop-all.sh${NC}"
echo -e "Test auth system:   ${GREEN}./TEST_AUTH.sh${NC}"

echo -e "\n${GREEN}✨ All services started! Open http://localhost:3000 in your browser.${NC}\n"
