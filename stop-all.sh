#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Supply Chain AI Control Assistant   ║${NC}"
echo -e "${BLUE}║         Stopping Services...           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Stop backend
if pgrep -f "ts-node src/index.ts" > /dev/null; then
    echo -e "${BLUE}🛑 Stopping Backend...${NC}"
    pkill -f "ts-node src/index.ts"
    echo -e "${GREEN}✓ Backend stopped${NC}"
else
    echo -e "${BLUE}⚠ Backend not running${NC}"
fi

# Stop frontend
if pgrep -f "next dev" > /dev/null; then
    echo -e "${BLUE}🛑 Stopping Frontend...${NC}"
    pkill -f "next dev"
    echo -e "${GREEN}✓ Frontend stopped${NC}"
else
    echo -e "${BLUE}⚠ Frontend not running${NC}"
fi

echo -e "\n${GREEN}✨ All services stopped!${NC}\n"
