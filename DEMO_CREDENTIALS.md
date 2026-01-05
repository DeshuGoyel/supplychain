# Demo Credentials & Getting Started

## 🚀 Quick Start

### Backend Server
- **URL:** http://localhost:3001
- **Status:** ✅ Running
- **Health Check:** http://localhost:3001/api/health

### Frontend Application
- **URL:** http://localhost:3000
- **Status:** ✅ Running

---

## 🔑 Demo Login Credentials

### Acme Manufacturing
**Manager Account:**
- **Email:** `manager@acme.com`
- **Password:** `demo123`
- **Role:** Manager
- **Company:** Acme Manufacturing (Manufacturing)

**Planner Account:**
- **Email:** `planner@acme.com`
- **Password:** `demo123`
- **Role:** Planner
- **Company:** Acme Manufacturing (Manufacturing)

### TechRetail Inc
**Manager Account:**
- **Email:** `manager@techretail.com`
- **Password:** `demo123`
- **Role:** Manager
- **Company:** TechRetail Inc (Retail)

**Coordinator Account:**
- **Email:** `coordinator@techretail.com`
- **Password:** `demo123`
- **Role:** Coordinator
- **Company:** TechRetail Inc (Retail)

### HealthCare Logistics
**Manager Account:**
- **Email:** `manager@healthcare.com`
- **Password:** `demo123`
- **Role:** Manager
- **Company:** HealthCare Logistics (Healthcare)

---

## 📋 Testing Guide

### 1. Login Test
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@acme.com","password":"demo123"}'
```

### 2. Signup Test (New User)
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"newuser@example.com",
    "password":"SecurePass123!",
    "name":"New User",
    "companyName":"Test Company",
    "industry":"Technology"
  }'
```

### 3. Get Current User (Protected Route)
```bash
# Replace YOUR_TOKEN with the token from login response
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🛠️ Development Commands

### Backend
```bash
# Start backend server
npm run dev

# Build backend
npm run build

# Seed database with demo data
npm run seed

# Reset and seed database
npm run seed reset

# Run migrations
npm run prisma:migrate

# Open Prisma Studio (Database GUI)
npm run prisma:studio
```

### Frontend
```bash
cd frontend

# Start frontend dev server
npm run dev

# Build frontend
npm run build

# Lint frontend
npm run lint
```

---

## 🔐 Authentication Flow

### Login Flow
1. User enters email and password on `/auth/login`
2. Frontend sends POST to `/api/auth/login`
3. Backend validates credentials
4. Backend returns JWT token + user info
5. Frontend stores token in localStorage
6. Frontend redirects to `/dashboard`

### Signup Flow
1. User enters details on `/auth/signup`
2. Frontend sends POST to `/api/auth/signup`
3. Backend validates data
4. Backend creates company and user
5. Backend returns JWT token + user info
6. Frontend stores token and redirects to `/dashboard`

### Protected Routes
All dashboard routes require authentication. The frontend checks for a valid token in localStorage.

---

## 🎯 Phase 5 Features Testing

### White-Label Configuration
1. Login as manager
2. Navigate to `/dashboard/settings/white-label`
3. Configure theme (logo, colors, fonts)
4. Setup custom domain (enterprise only)

### Two-Factor Authentication (2FA)
1. Login as any user
2. Navigate to `/dashboard/settings/security`
3. Click "Enable 2FA"
4. Scan QR code with authenticator app
5. Enter verification code
6. Save backup codes

### Legal Documents
- Terms of Service: http://localhost:3000/legal/terms
- Privacy Policy: http://localhost:3000/legal/privacy
- Data Processing Agreement: http://localhost:3000/legal/dpa
- Service Level Agreement: http://localhost:3000/legal/sla
- Acceptable Use Policy: http://localhost:3000/legal/aup

### Audit Logs
1. Login as manager
2. Make some changes (update settings, etc.)
3. Check audit logs at `/api/security/audit-logs`

---

## 🐛 Troubleshooting

### "Cannot connect to backend"
- Check if backend is running: `curl http://localhost:3001/api/health`
- Check backend logs: `tail -f backend.log`
- Restart backend: `npm run dev`

### "Login failed"
- Verify credentials are correct
- Check if database is seeded: `npm run seed`
- Check backend logs for errors

### "Database connection error"
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Run migrations: `npm run prisma:migrate`

### "Token expired"
- Logout and login again
- Token expires after 7 days by default

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/change-password` - Change password

### White-Label
- `GET /api/white-label/theme` - Get theme config
- `PUT /api/white-label/theme` - Update theme
- `POST /api/white-label/domain` - Setup custom domain
- `GET /api/white-label/domain` - Get domain config
- `POST /api/white-label/verify-domain` - Verify domain
- `DELETE /api/white-label/domain` - Delete domain

### Security
- `POST /api/security/2fa/setup` - Setup 2FA
- `POST /api/security/2fa/enable` - Enable 2FA
- `POST /api/security/2fa/verify` - Verify 2FA code
- `POST /api/security/2fa/disable` - Disable 2FA
- `GET /api/security/2fa/status` - Check 2FA status
- `GET /api/security/audit-logs` - Get audit logs

### Legal
- `GET /api/legal/terms` - Terms of Service
- `GET /api/legal/privacy` - Privacy Policy
- `GET /api/legal/dpa` - Data Processing Agreement
- `GET /api/legal/sla` - Service Level Agreement
- `GET /api/legal/aup` - Acceptable Use Policy

---

## 🎨 Default Theme Values

```javascript
{
  primaryColor: "#3B82F6",      // Blue
  secondaryColor: "#10B981",     // Green
  fontFamily: "Inter, sans-serif",
  headerText: "Supply Chain Control",
  footerText: "Powered by Supply Chain AI"
}
```

---

## 📝 Notes

- All passwords are hashed with bcrypt
- JWT tokens expire after 7 days
- 2FA uses TOTP (Time-based One-Time Password)
- White-label features require enterprise tier
- SAML SSO requires enterprise tier
- Audit logs are retained for 1 year by default

---

## 🚀 Quick Access Links

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health
- **API Root:** http://localhost:3001/

---

**Last Updated:** January 5, 2025
**Phase:** 5 - White-Label, Enterprise Features & Compliance
