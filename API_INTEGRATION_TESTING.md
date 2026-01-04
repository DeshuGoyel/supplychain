# Dashboard API Integration - Testing Guide

## Overview
The Control Tower Dashboard has been successfully integrated with the backend API. All 5 widgets now fetch real data from authenticated endpoints.

## Backend API Endpoints

### Base URL
```
http://localhost:3001/api/dashboard
```

### Available Endpoints

1. **GET /api/dashboard/inventory**
   - Returns: SKU count, stock value, low stock count, stock health, fast/slow movers
   - Authentication: Required (JWT token)

2. **GET /api/dashboard/orders**
   - Returns: Pending/delayed/on-time counts, recent orders with supplier details
   - Authentication: Required (JWT token)

3. **GET /api/dashboard/suppliers**
   - Returns: Average metrics, top suppliers, underperforming suppliers
   - Authentication: Required (JWT token)

4. **GET /api/dashboard/demand**
   - Returns: 4-week demand vs supply forecast
   - Authentication: Required (JWT token)

5. **GET /api/dashboard/kpis**
   - Returns: OTIF, DIO, Fill Rate, Turnover metrics
   - Authentication: Required (JWT token)

## Testing Instructions

### 1. Start Backend Server

```bash
# From project root
npm run dev
```

Backend runs on: `http://localhost:3001`

### 2. Start Frontend Server

```bash
# From frontend directory
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`

### 3. Login to Get Token

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@acme.com",
    "password": "demo123"
  }'
```

Save the token from the response.

### 4. Test API Endpoints

Replace `<TOKEN>` with your actual JWT token:

```bash
# Test inventory endpoint
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/dashboard/inventory

# Test orders endpoint
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/dashboard/orders

# Test suppliers endpoint
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/dashboard/suppliers

# Test demand endpoint
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/dashboard/demand

# Test KPIs endpoint
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/dashboard/kpis
```

## Demo Credentials

After running seed scripts:

| Email | Password | Role | Company |
|-------|----------|-------|---------|
| manager@acme.com | demo123 | MANAGER | Acme Manufacturing |
| planner@acme.com | demo123 | PLANNER | Acme Manufacturing |
| manager@techretail.com | demo123 | MANAGER | TechRetail Inc |
| coordinator@techretail.com | demo123 | COORDINATOR | TechRetail Inc |
| manager@healthcare.com | demo123 | MANAGER | HealthCare Logistics |

## Frontend Integration

### API Client Configuration

The frontend uses an Axios instance located at `frontend/utils/api.ts`:

- **Base URL:** `http://localhost:3001` (configurable via `NEXT_PUBLIC_API_URL`)
- **Timeout:** 10 seconds
- **Authentication:** Automatic JWT token injection from localStorage
- **Error Handling:** 401 auto-redirect, network errors, timeout handling

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

// Similar functions for orders, suppliers, demand, and KPIs
```

### Type Definitions

All interfaces are defined in `frontend/types/index.ts`:

- `InventoryData`
- `OpenOrdersData`
- `SupplierData`
- `DemandData`
- `KPIData`

## Database Schema

### New Models Added

1. **Inventory** - Track SKU inventory with stock levels
2. **Order** - Track purchase orders and their status
3. **Supplier** - Track supplier performance metrics
4. **DemandForecast** - Track weekly demand vs supply
5. **KPI** - Track key performance indicators over time

All models are scoped to `companyId` for multi-tenancy.

## Seeding Data

### Seed Users and Companies
```bash
npm run seed
```

### Seed Dashboard Data
```bash
npm run seed:dashboard
```

This creates:
- 3 companies
- 5 users
- 18 suppliers per company
- 68 inventory items per company
- 113 orders per company
- 4 demand forecasts per company
- 4 KPIs per company

## Error Handling

### Frontend API Client

The API client handles:
- **401 Unauthorized:** Clears token and redirects to `/auth/login`
- **Network Errors:** Shows "Network error. Please check your connection."
- **Timeout:** Shows timeout message after 10 seconds
- **5xx Errors:** Logs server errors for debugging

### Backend Errors

All endpoints return JSON with format:

```json
{
  "success": true/false,
  "data": { ... },
  "message": "Error message (if error)"
}
```

## API Response Examples

### Inventory Response
```json
{
  "success": true,
  "data": {
    "totalSKUs": 68,
    "stockValue": 864129,
    "lowStockCount": 13,
    "stockHealth": 76,
    "fastMovers": [
      { "sku": "SKU-001", "qty": 439 }
    ],
    "slowMovers": [
      { "sku": "SKU-999", "qty": 8 }
    ]
  }
}
```

### Orders Response
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

## Performance

### Backend
- Average response time: < 200ms
- Database queries use indexed fields
- Orders endpoint limited to 50 most recent records

### Frontend
- Auto-refresh: Every 30 seconds
- Manual refresh: Available via refresh button
- Loading states: Skeletons shown during data fetch
- Error states: Retry functionality on failure

## Troubleshooting

### Backend Issues

**Problem:** Server won't start
- Check if port 3001 is available
- Verify `.env` file exists with `DATABASE_URL`
- Run `npx prisma generate` to regenerate client

**Problem:** API returns 401 Unauthorized
- Check JWT token is valid and not expired
- Verify token format: `Authorization: Bearer <token>`
- Ensure user belongs to correct company

**Problem:** No data returned
- Run `npm run seed:dashboard` to populate database
- Check database connection in `.env`

### Frontend Issues

**Problem:** Network errors
- Verify backend is running on `http://localhost:3001`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure no CORS issues (configured in backend)

**Problem:** Data not loading
- Open browser DevTools Console for errors
- Check Network tab for failed requests
- Verify user is logged in and has valid token

**Problem:** 404 on API calls
- Confirm backend routes are registered in `src/index.ts`
- Check endpoint URLs match route definitions

## Future Enhancements

- [ ] Add pagination for large datasets
- [ ] Implement server-side caching (Redis)
- [ ] Add WebSocket support for real-time updates
- [ ] Add data filtering and sorting parameters
- [ ] Implement data export (CSV, PDF)
- [ ] Add historical data views
- [ ] Implement API response caching on frontend
- [ ] Add request deduplication for concurrent requests

## Summary

✅ All 5 dashboard widgets integrated with backend API
✅ JWT authentication working correctly
✅ Proper error handling for all scenarios
✅ Type-safe TypeScript interfaces
✅ Database migrations applied
✅ Seed data populated
✅ API responses tested and verified
✅ Frontend API client configured
✅ Auto-refresh functionality maintained
