# Dashboard Backend API Integration

This document describes the complete integration between the Control Tower Dashboard frontend and the backend API.

## Overview

The Control Tower Dashboard now connects to real backend API endpoints for all five widgets:
1. **Inventory Snapshot** - SKU counts, stock values, fast/slow movers
2. **Open Orders** - Order status tracking by supplier
3. **Supplier Performance** - Supplier metrics and rankings
4. **Demand vs Supply** - 4-week forecast analysis
5. **KPI Cards** - Key performance indicators (OTIF, DIO, Fill Rate, Turnover)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Control Tower Dashboard                      │
├─────────────────────────────────────────────────────────────────┤
│  frontend/app/dashboard/page.tsx                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    DashboardPage Component                   ││
│  │  - State management for all widgets                          ││
│  │  - Auto-refresh every 30 seconds                             ││
│  │  - Error handling and retry logic                            ││
│  │  - Online/offline detection                                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                        │                                          │
│                        ▼                                          │
│  frontend/services/dashboardService.ts                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Dashboard Service Layer                      ││
│  │  - Re-exports API functions                                  ││
│  │  - Query parameter types                                     ││
│  │  - Clear cache function                                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                        │                                          │
│                        ▼                                          │
│  frontend/services/api/dashboardApi.ts                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 API Integration Layer                        ││
│  │  - HTTP calls to backend endpoints                           ││
│  │  - Caching (30-second TTL)                                   ││
│  │  - Error handling                                            ││
│  │  - Query parameter building                                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                        │                                          │
│                        ▼                                          │
│  frontend/utils/api.ts                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Axios Client with                            ││
│  │  - JWT token injection                                       ││
│  │  - 15-second timeout                                         ││
│  │  - Retry logic (2 attempts for network/5xx errors)           ││
│  │  - 401/403/429 handling                                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP + JWT
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Port 3001)                         │
├─────────────────────────────────────────────────────────────────┤
│  src/routes/dashboard.ts                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Dashboard Routes                             ││
│  │  - GET /api/dashboard/inventory                              ││
│  │  - GET /api/dashboard/orders                                 ││
│  │  - GET /api/dashboard/suppliers                              ││
│  │  - GET /api/dashboard/demand                                 ││
│  │  - GET /api/dashboard/kpis                                   ││
│  │  All routes require JWT authentication                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                        │                                          │
│                        ▼                                          │
│  src/controllers/dashboard.ts                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 Dashboard Controllers                        ││
│  │  - Database queries via Prisma                               ││
│  │  - Data aggregation and formatting                           ││
│  │  - Query parameter filtering                                 ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ Prisma ORM
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database (SQLite/PostgreSQL)                │
├─────────────────────────────────────────────────────────────────┤
│  Tables: users, companies, inventory, orders, suppliers,         │
│          demand_forecasts, kpis                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Backend API Endpoints

All endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

### Base URL
```
http://localhost:3001/api/dashboard
```

### Query Parameters

All endpoints support optional query parameters for filtering:

#### Inventory Endpoint
**Endpoint:** `GET /api/dashboard/inventory`

| Parameter | Type | Description |
|-----------|------|-------------|
| `stockLevel` | string | Filter by stock level (HEALTHY, LOW, OUT_OF_STOCK) |
| `minStockValue` | number | Filter items with stock value >= this amount |
| `maxStockValue` | number | Filter items with stock value <= this amount |

#### Orders Endpoint
**Endpoint:** `GET /api/dashboard/orders`

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (PENDING, ON_TIME, DELAYED) |
| `priority` | string | Filter by priority (LOW, MEDIUM, HIGH) |
| `supplierId` | string | Filter by supplier ID |
| `limit` | number | Limit results (max 100, default 50) |

#### Suppliers Endpoint
**Endpoint:** `GET /api/dashboard/suppliers`

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (ACTIVE, INACTIVE) |
| `minOnTimeRate` | number | Filter suppliers with on-time rate >= this value |
| `minQualityRate` | number | Filter suppliers with quality rate >= this value |
| `maxLeadTime` | number | Filter suppliers with lead time <= this value |

#### Demand Endpoint
**Endpoint:** `GET /api/dashboard/demand`

| Parameter | Type | Description |
|-----------|------|-------------|
| `weeks` | number | Number of weeks to fetch (max 12, default 4) |
| `year` | number | Filter by specific year |
| `startWeek` | number | Start from specific week |
| `riskLevel` | string | Filter by risk level (SAFE, CAUTION, RISK) |

#### KPIs Endpoint
**Endpoint:** `GET /api/dashboard/kpis`

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Filter by KPI name (OTIF, DIO, FILL_RATE, TURNOVER) |
| `period` | string | Filter by period (e.g., "2025-01") |

### API Responses

#### 1. Get Inventory Data
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

#### 2. Get Open Orders
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

#### 3. Get Supplier Data
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

#### 4. Get Demand Forecast
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

#### 5. Get KPI Data
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
- **Automatic JWT token injection** via request interceptor
- **15-second timeout** for all requests
- **Retry logic** (2 attempts for network errors or 5xx responses)
- **401/403/429 handling** with automatic token clearing and redirect
- **Comprehensive error logging** for debugging

**Location:** `frontend/utils/api.ts`

### API Integration Layer

All data fetching is centralized with proper separation of concerns:

**Location:** `frontend/services/api/dashboardApi.ts`

```typescript
import dashboardApi from './api/dashboardApi';

// Fetch inventory data with optional query parameters
export async function getInventoryData(params?: InventoryQueryParams): Promise<InventoryData> {
  return dashboardApi.fetchInventoryData(params);
}

// Fetch all dashboard data in parallel
export async function getAllDashboardData(params?: DashboardQueryParams) {
  return dashboardApi.fetchAllDashboardData(params);
}

// Clear dashboard cache on logout
export function clearDashboardCache(): void {
  dashboardApi.clearDashboardCache();
}
```

### Caching Strategy

- **30-second cache TTL** for all dashboard endpoints
- Cache is invalidated on logout via `clearDashboardCache()`
- Parallel requests for all widgets for optimal performance

### Error Handling

The API client intercepts responses and handles:

- **401 Unauthorized:** Clears token, redirects to login with message "Your session has expired"
- **403 Forbidden:** Shows permission denied message
- **429 Too Many Requests:** Shows rate limit message with wait time
- **Network Errors:** Shows connection error message
- **Timeout Errors:** Shows timeout message after 15 seconds
- **5xx Server Errors:** Shows server error message with retry option
- **Retry Logic:** Automatically retries network/5xx errors up to 2 times

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

# Seed dashboard data (inventory, orders, suppliers, forecasts, KPIs)
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

# Create environment file (if not exists)
cp .env.example .env.local

# Start frontend server
npm run dev
```

Frontend will run on `http://localhost:3000`

### 3. Verify Integration

After starting both servers:

1. Navigate to `http://localhost:3000`
2. Login with demo credentials:
   - Email: `manager@acme.com`
   - Password: `demo123`
3. You should see the Control Tower Dashboard with real data
4. The dashboard will auto-refresh every 30 seconds
5. Check browser console for API request/response logs

## Frontend Dashboard Features

### Data Fetching
- **Parallel Loading:** All 5 widgets fetch data simultaneously using `Promise.all`
- **Caching:** 30-second client-side cache to reduce unnecessary requests
- **Error Handling:** Graceful error display with retry options
- **Online/Offline Detection:** Browser event listeners for connectivity status

### UI States
- **Loading State:** Skeleton loaders while fetching initial data
- **Error State:** Detailed error messages with retry/reload options
- **Refresh State:** Spinning refresh icon during manual refresh
- **Data Freshness:** Color-coded indicator (green=fresh, yellow=current, orange=stale)

### User Interactions
- **Manual Refresh:** Button to trigger immediate data refresh
- **Auto-refresh:** Automatic refresh every 30 seconds
- **Connection Status:** Real-time online/offline indicator

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
