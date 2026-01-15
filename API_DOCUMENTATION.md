# API Documentation for External Customers
# Supply Chain AI Control Assistant - Public API v1.0

## Overview

The Supply Chain AI Control Assistant API provides comprehensive supply chain management capabilities for enterprise customers. This API enables integration with existing systems and custom application development.

**Base URL**: `https://api.supplychainai.com/v1`  
**Authentication**: Bearer JWT Token or API Key  
**Rate Limits**: 1000 requests/hour (Standard), 10000 requests/hour (Enterprise)  
**Supported Formats**: JSON  

## Authentication

### JWT Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@company.com",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@company.com",
    "name": "John Smith",
    "role": "MANAGER",
    "companyId": "company_456"
  }
}
```

### API Key Authentication

```http
GET /api/dashboard/summary
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

## Core API Endpoints

### Dashboard

#### Get Dashboard Summary
```http
GET /api/dashboard/summary
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalOrders": 1247,
      "onTimeDelivery": 94.2,
      "inventoryTurnover": 8.5,
      "supplierPerformance": 91.8
    },
    "recentOrders": [
      {
        "id": "PO-2024-001",
        "supplier": "ABC Manufacturing",
        "status": "in_transit",
        "expectedDelivery": "2024-01-15",
        "totalValue": 50000
      }
    ],
    "alerts": [
      {
        "type": "low_inventory",
        "message": "Product XYZ is below reorder point",
        "priority": "high",
        "timestamp": "2024-01-10T14:30:00Z"
      }
    ]
  }
}
```

### Inventory Management

#### Get Inventory Items
```http
GET /api/inventory/items?page=1&limit=50&search=widget
Authorization: Bearer {token}
```

#### Create Inventory Item
```http
POST /api/inventory/items
Authorization: Bearer {token}
Content-Type: application/json

{
  "sku": "WIDGET-001",
  "name": "Premium Widget",
  "description": "High-quality widget for industrial use",
  "category": "components",
  "unitCost": 25.50,
  "reorderPoint": 100,
  "maxStock": 1000,
  "supplierId": "sup_123"
}
```

#### Update Inventory Item
```http
PUT /api/inventory/items/{itemId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 150,
  "unitCost": 24.99,
  "location": "Warehouse A, Bin 12"
}
```

### Supplier Management

#### Get Suppliers
```http
GET /api/suppliers?status=active&rating=4
Authorization: Bearer {token}
```

#### Create Supplier
```http
POST /api/suppliers
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Global Components Ltd",
  "contactEmail": "contact@globalcomponents.com",
  "phone": "+1-555-0123",
  "address": {
    "street": "123 Business Ave",
    "city": "Manufacturing City",
    "state": "CA",
    "zipCode": "90210",
    "country": "USA"
  },
  "paymentTerms": "NET30",
  "rating": 4.5,
  "categories": ["components", "electronics"]
}
```

#### Update Supplier Performance
```http
PUT /api/suppliers/{supplierId}/performance
Authorization: Bearer {token}
Content-Type: application/json

{
  "onTimeDelivery": 92.5,
  "qualityScore": 94.0,
  "costCompetitiveness": 88.0,
  "responsiveness": 91.5,
  "overallScore": 91.5
}
```

### Purchase Orders

#### Get Purchase Orders
```http
GET /api/purchase-orders?status=pending&supplier=sup_123&dateFrom=2024-01-01&dateTo=2024-01-31
Authorization: Bearer {token}
```

#### Create Purchase Order
```http
POST /api/purchase-orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "supplierId": "sup_123",
  "items": [
    {
      "sku": "WIDGET-001",
      "quantity": 500,
      "unitPrice": 24.99,
      "deliveryDate": "2024-02-15"
    }
  ],
  "shippingAddress": {
    "street": "456 Distribution Blvd",
    "city": "Logistics City",
    "state": "TX",
    "zipCode": "77001",
    "country": "USA"
  },
  "notes": "Urgent delivery required"
}
```

#### Update Purchase Order Status
```http
PATCH /api/purchase-orders/{poId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "approved",
  "approvedBy": "user_123",
  "comments": "Budget approved for Q1 procurement"
}
```

### Shipments

#### Track Shipment
```http
GET /api/shipments/{shipmentId}/track
Authorization: Bearer {token}
```

#### Update Shipment Status
```http
PUT /api/shipments/{shipmentId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in_transit",
  "currentLocation": "Distribution Center, Chicago, IL",
  "estimatedDelivery": "2024-01-18T10:00:00Z",
  "carrier": "FedEx",
  "trackingNumber": "FDX123456789"
}
```

### Analytics & Reports

#### Get Supply Chain Analytics
```http
GET /api/analytics/supply-chain?period=month&metric=costs&dateFrom=2024-01-01&dateTo=2024-01-31
Authorization: Bearer {token}
```

#### Generate Report
```http
POST /api/reports/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "supplier_performance",
  "format": "pdf",
  "parameters": {
    "dateRange": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    },
    "suppliers": ["sup_123", "sup_456"],
    "metrics": ["on_time_delivery", "quality_score", "cost_variance"]
  }
}
```

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2024-01-10T14:30:00Z",
  "requestId": "req_abc123"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | Missing or invalid authentication |
| `AUTHORIZATION_FAILED` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

### Standard Tier
- **Limit**: 1,000 requests per hour
- **Burst**: 100 requests per minute
- **Headers**: Rate limit info included in response headers

### Enterprise Tier
- **Limit**: 10,000 requests per hour
- **Burst**: 1,000 requests per minute
- **Headers**: Rate limit info included in response headers

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1642096800
```

## Webhooks

### Setting Up Webhooks
```http
POST /api/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://yourapp.com/webhooks/supplychain",
  "events": ["order.created", "shipment.updated", "inventory.low"],
  "secret": "webhook_secret_key"
}
```

### Webhook Events

#### Order Created
```json
{
  "event": "order.created",
  "timestamp": "2024-01-10T14:30:00Z",
  "data": {
    "orderId": "PO-2024-001",
    "supplierId": "sup_123",
    "totalValue": 50000,
    "status": "pending"
  }
}
```

#### Inventory Alert
```json
{
  "event": "inventory.low",
  "timestamp": "2024-01-10T14:30:00Z",
  "data": {
    "sku": "WIDGET-001",
    "currentQuantity": 15,
    "reorderPoint": 50,
    "warehouse": "Warehouse A"
  }
}
```

## SDKs and Libraries

### JavaScript/Node.js
```bash
npm install @supplychain-ai/sdk
```

```javascript
const { SupplyChainAI } = require('@supplychain-ai/sdk');

const client = new SupplyChainAI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.supplychainai.com/v1'
});

// Get dashboard summary
const summary = await client.dashboard.getSummary();
```

### Python
```bash
pip install supplychain-ai-sdk
```

```python
from supplychain_ai import Client

client = Client(api_key='your-api-key')

# Create purchase order
order = client.purchase_orders.create(
    supplier_id='sup_123',
    items=[
        {
            'sku': 'WIDGET-001',
            'quantity': 500,
            'unit_price': 24.99
        }
    ]
)
```

### Java
```xml
<dependency>
  <groupId>com.supplychainai</groupId>
  <artifactId>supplychain-ai-java-sdk</artifactId>
  <version>1.0.0</version>
</dependency>
```

```java
import com.supplychainai.sdk.SupplyChainAIClient;

SupplyChainAIClient client = new SupplyChainAIClient("your-api-key");

// Get inventory items
List<InventoryItem> items = client.inventory().list();
```

## API Versioning

- **Current Version**: v1.0
- **Deprecated Versions**: None
- **Breaking Changes**: 90-day deprecation notice
- **Header**: Include `API-Version: 1.0` in requests

## Support and SLA

### Support Tiers

| Tier | Response Time | Availability | Support Channel |
|------|---------------|--------------|-----------------|
| Standard | 24 hours | 99.5% | Email |
| Premium | 4 hours | 99.9% | Email + Chat |
| Enterprise | 1 hour | 99.99% | Phone + Chat + Email |

### SLA Commitments
- **Uptime**: 99.9% monthly uptime
- **Response Time**: < 200ms for 95% of requests
- **Data Retention**: 7 years for audit logs
- **Data Security**: SOC 2 Type II compliant

### Getting Help
- **Documentation**: https://docs.supplychainai.com
- **API Status**: https://status.supplychainai.com
- **Support Email**: api-support@supplychainai.com
- **Developer Portal**: https://developers.supplychainai.com

---

**Last Updated**: January 10, 2024  
**API Version**: 1.0.0  
**Contact**: api-team@supplychainai.com