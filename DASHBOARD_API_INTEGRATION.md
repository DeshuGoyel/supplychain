# Dashboard Backend API Integration

This document describes the complete integration between the Control Tower Dashboard frontend and the backend API.

## Overview

The Control Tower Dashboard now connects to real backend API endpoints for all five widgets:
1. **Inventory Snapshot** - SKU counts, stock values, fast/slow movers
2. **Open Orders** - Order status tracking by supplier
3. **Supplier Performance** - Supplier metrics and rankings
4. **Demand vs Supply** - 4-week forecast analysis
5. **KPI Cards** - Key performance indicators (OTIF, DIO, Fill Rate, Turnover)

## Backend API Endpoints

All endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

### Base URL
```
http://localhost:3001/api/dashboard
```

### 1. Get Inventory Data
**Endpoint:** `GET /api/dashboard/inventory`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSKUs": 245,
    "stockValue": 1200000,
    "lowStockCount": 12,
    "stockHealth": 94,
    "fastMovers": [
      { "sku": "SKU-001", "qty": 450 }
    ],
    "slowMovers": [
      { "sku": "SKU-987", "qty": 12 }
    ]
  }
}
```

### 2. Get Open Orders
**Endpoint:** `GET /api/dashboard/orders`

**Response:**
```json
{
  "success": true,
  "data": {
    "pending": 23,
    "delayed": 3,
    "onTime": 87,
    "orders": [
      {
        "id": "ORD-001",
        "supplierId": "SUP-001",
        "supplierName": "Acme Corp",
        "status": "DELAYED",
        "eta": "2025-01-08",
        "daysOverdue": 3,
        "priority": "HIGH"
      }
    ]
  }
}
```

### 3. Get Supplier Data
**Endpoint:** `GET /api/dashboard/suppliers`

**Response:**
```json
{
  "success": true,
  "data": {
    "avgOnTime": 92,
    "avgQuality": 96,
    "avgLeadTime": 8.5,
    "topSuppliers": [
      {
        "id": "SUP-001",
        "name": "Acme Corp",
        "onTime": 98,
        "quality": 99,
        "leadTime": 7
      }
    ],
    "underperforming": [
      {
        "id": "SUP-004",
        "name": "Slow Shipper Inc",
        "onTime": 78,
        "quality": 85,
        "leadTime": 14,
        "issues": ["Low on-time rate", "High lead time"]
      }
    ]
  }
}
```

### 4. Get Demand Forecast
**Endpoint:** `GET /api/dashboard/demand`

**Response:**
```json
{
  "success": true,
  "data": {
    "forecast": [
      {
        "week": 1,
        "demand": 520,
        "supply": 500,
        "gap": -20,
        "riskLevel": "RISK"
      }
    ]
  }
}
```

### 5. Get KPI Data
**Endpoint:** `GET /api/dashboard/kpis`

**Response:**
```json
{
  "success": true,
  "data": {
    "otif": {
      "value": 96,
      "trend": 2,
      "status": "EXCELLENT",
      "target": 95
    },
    "dio": {
      "value": 45,
      "trend": -3,
      "status": "ON_TRACK",
      "target": 50
    },
    "fillRate": {
      "value": 98,
      "trend": 1,
      "status": "EXCELLENT",
      "target": 98
    },
    "turnover": {
      "value": 6.2,
      "trend": 0.3,
      "status": "ON_TRACK",
      "target": 5
    }
  }
}
```

## Frontend Integration

### API Client Configuration

The frontend uses an Axios instance with:
- Automatic JWT token injection
- 10-second timeout
- 401 error handling with automatic token clearing and redirect
- Comprehensive error logging

**Location:** `frontend/utils/api.ts`

### Dashboard Service

All data fetching is centralized in `frontend/services/dashboardService.ts`:

```typescript
import apiClient from '@/utils/api';

export async function getInventoryData(): Promise<InventoryData> {
  const response = await apiClient.get<{ success: boolean; data: InventoryData }>('/api/dashboard/inventory');

  if (!response.data.success) {
    throw new Error('Failed to fetch inventory data');
  }

  return response.data.data;
}
```

### Error Handling

The API client intercepts responses and handles:
- **401 Unauthorized:** Clears token and redirects to login
- **Network Errors:** Shows user-friendly error messages
- **Timeout Errors:** Handles requests that exceed 10 seconds
- **5xx Errors:** Logs server errors for debugging

## Database Schema

### New Models Added

#### Inventory
```prisma
model Inventory {
  id           String   @id @default(cuid())
  companyId    String
  company      Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  sku          String
  name         String
  quantity     Int
  unitCost     Float
  stockLevel   String   @default("HEALTHY") // HEALTHY, LOW, OUT_OF_STOCK
  turnoverRate Float?
  lastUpdated  DateTime @updatedAt
  createdAt    DateTime @default(now())

  @@unique([companyId, sku])
  @@index([companyId])
  @@index([stockLevel])
  @@map("inventory")
}
```

#### Order
```prisma
model Order {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  supplierId  String
  supplier    Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  orderNumber String
  status      String   @default("PENDING") // PENDING, ON_TIME, DELAYED, COMPLETED
  priority    String   @default("MEDIUM")  // LOW, MEDIUM, HIGH
  eta         DateTime
  daysOverdue Int      @default(0)
  totalAmount Float?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([companyId])
  @@index([supplierId])
  @@index([status])
  @@map("orders")
}
```

#### Supplier
```prisma
model Supplier {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  orders      Order[]
  name        String
  onTimeRate  Float    @default(0)  // percentage
  qualityRate Float    @default(0)  // percentage
  leadTime    Float    @default(0)  // days
  status      String   @default("ACTIVE") // ACTIVE, INACTIVE
  issues      String?  // JSON array of issues
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([companyId])
  @@index([status])
  @@map("suppliers")
}
```

#### DemandForecast
```prisma
model DemandForecast {
  id         String   @id @default(cuid())
  companyId  String
  company    Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  week       Int
  year       Int
  demand     Int
  supply     Int
  gap        Int
  riskLevel  String   @default("CAUTION") // SAFE, CAUTION, RISK
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([companyId, week, year])
  @@index([companyId])
  @@index([week, year])
  @@map("demand_forecasts")
}
```

#### KPI
```prisma
model KPI {
  id         String   @id @default(cuid())
  companyId  String
  company    Company  @relation(fields: [companyId], references: [id], @relation...)
  name       String   // OTIF, DIO, FILL_RATE, TURNOVER
  value      Float
  trend      Float    // percentage change from previous period
  target     Float
  status     String   @default("ON_TRACK") // EXCELLENT, ON_TRACK, AT_RISK
  period     String   // e.g., "2025-01"
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([companyId, name, period])
  @@index([companyId])
  @@index([name])
  @@index([period])
  @@map("kpis")
}
```

## Setup Instructions

### 1. Backend Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed user data
npm run seed

# Seed dashboard data
npm run seed:dashboard

# Start backend server
npm run dev
```

Backend will run on `http://localhost:3001`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start frontend server
npm run dev
```

Frontend will run on `http://localhost:3000`

## Authentication Flow

1. User logs in via `/api/auth/login`
2. Backend returns JWT token
3. Frontend stores token in localStorage
4. All dashboard API requests include `Authorization: Bearer <token>`
5. Token is automatically validated by `authMiddleware`
6. On 401 error, token is cleared and user redirected to login

## Testing the Integration

### Using Demo Credentials

After running seed scripts:

```
Email: manager@acme.com
Password: demo123
```

### Manual API Testing

```bash
# Login to get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@acme.com","password":"demo123"}'

# Use token to fetch dashboard data
curl http://localhost:3001/api/dashboard/inventory \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

## Error Scenarios

### 401 Unauthorized
- **Cause:** Invalid or expired JWT token
- **Action:** Token cleared, redirect to login

### 403 Forbidden
- **Cause:** Insufficient permissions
- **Action:** Show permission denied message

### Network Error
- **Cause:** Backend not running or connectivity issue
- **Action:** Show "Network error. Please check your connection."

### Timeout
- **Cause:** Request exceeds 10 seconds
- **Action:** Show timeout error message

## Performance Considerations

### Backend
- Database queries use indexed fields for efficiency
- Response time typically < 200ms
- Pagination implemented for orders endpoint (max 50 records)

### Frontend
- Auto-refresh every 30 seconds
- Loading skeletons during data fetch
- Error states with retry functionality
- Debounced refresh to prevent rapid successive requests

## Future Enhancements

- Add pagination support for all endpoints
- Implement server-side caching (Redis)
- Add WebSocket support for real-time updates
- Implement data filtering and sorting parameters
- Add export functionality (CSV, PDF)
- Implement data aggregation for historical views
