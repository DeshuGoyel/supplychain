# Authentication Guide

## ✅ Sign In & Sign Up - Working!

Both authentication features are **fully functional**. If you're experiencing issues, please follow the troubleshooting steps below.

---

## 🔑 Demo Accounts

### Quick Login
- **Email:** `manager@acme.com`
- **Password:** `demo123`

### All Available Accounts

| Email | Password | Role | Company |
|-------|----------|------|---------|
| manager@acme.com | demo123 | Manager | Acme Manufacturing |
| planner@acme.com | demo123 | Planner | Acme Manufacturing |
| manager@techretail.com | demo123 | Manager | TechRetail Inc |
| coordinator@techretail.com | demo123 | Coordinator | TechRetail Inc |
| manager@healthcare.com | demo123 | Manager | HealthCare Logistics |

---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd /home/engine/project
npm run dev
```
**Backend URL:** http://localhost:3001

### 2. Start Frontend (New Terminal)
```bash
cd /home/engine/project/frontend
npm run dev
```
**Frontend URL:** http://localhost:3000

### 3. Access Application
Open your browser and go to:
- **Login:** http://localhost:3000/auth/login
- **Signup:** http://localhost:3000/auth/signup

---

## 🧪 Test Authentication

Run the automated test script:
```bash
cd /home/engine/project
./TEST_AUTH.sh
```

This will verify:
- ✅ Backend is running
- ✅ Login works
- ✅ Protected routes work
- ✅ Frontend is accessible

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to server"

**Solution 1: Check if backend is running**
```bash
curl http://localhost:3001/api/health
```
If this fails, start the backend:
```bash
cd /home/engine/project
npm run dev
```

**Solution 2: Check backend logs**
```bash
tail -f /home/engine/project/backend.log
```

---

### Issue: "Login failed" or "Invalid credentials"

**Verify credentials:**
- Email: `manager@acme.com`
- Password: `demo123`

**Check if database is seeded:**
```bash
cd /home/engine/project
npm run seed
```

**Test login via curl:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@acme.com","password":"demo123"}'
```

---

### Issue: "Signup failed" or "Company already exists"

**Try different company name:**
The following company names are already taken:
- Acme Manufacturing
- TechRetail Inc
- HealthCare Logistics
- Test Company Inc

**Valid signup example:**
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"newuser@mycompany.com",
    "password":"SecurePass123!",
    "name":"John Doe",
    "companyName":"My Company Ltd",
    "industry":"Technology"
  }'
```

**Password requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

---

### Issue: Frontend shows "Network error"

**Check frontend environment:**
```bash
cat /home/engine/project/frontend/.env
```
Should show:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Restart frontend:**
```bash
cd /home/engine/project/frontend
# Kill existing process
pkill -f "next dev"
# Start again
npm run dev
```

---

### Issue: "Token expired" or redirected to login

**This is normal behavior:**
- JWT tokens expire after 7 days
- Simply login again to get a new token

**Logout and login again:**
1. Click your profile in the dashboard
2. Click "Logout"
3. Login again with credentials

---

### Issue: Database connection error

**Check PostgreSQL:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql
```

**Verify DATABASE_URL:**
```bash
grep DATABASE_URL /home/engine/project/.env
```

**Run migrations:**
```bash
cd /home/engine/project
npm run prisma:migrate
```

---

## 📋 Password Validation Rules

When creating a new account, passwords must meet these requirements:

- ✅ At least 8 characters long
- ✅ Contains at least one uppercase letter (A-Z)
- ✅ Contains at least one lowercase letter (a-z)
- ✅ Contains at least one number (0-9)

**Valid examples:**
- `SecurePass123`
- `MyPassword1`
- `Test1234!`

**Invalid examples:**
- `password` (no uppercase, no number)
- `PASSWORD` (no lowercase, no number)
- `Pass12` (too short)

---

## 🔐 How Authentication Works

### Login Flow
1. User enters email and password
2. Frontend sends POST to `/api/auth/login`
3. Backend verifies credentials against database
4. Backend generates JWT token (expires in 7 days)
5. Frontend stores token in localStorage
6. Frontend redirects to `/dashboard`

### Signup Flow
1. User enters registration details
2. Frontend sends POST to `/api/auth/signup`
3. Backend validates input
4. Backend creates company and user in transaction
5. Backend generates JWT token
6. Frontend stores token and redirects to `/dashboard`

### Protected Routes
- All `/dashboard/*` routes require authentication
- Token is sent in `Authorization: Bearer <token>` header
- Invalid/expired tokens redirect to `/auth/login`

---

## 📊 API Endpoints

### Public Endpoints
- `POST /api/auth/login` - Login user
- `POST /api/auth/signup` - Register new user

### Protected Endpoints (require token)
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/change-password` - Change password

---

## 🎯 Testing Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000/auth/login
- [ ] Can login with `manager@acme.com` / `demo123`
- [ ] Redirected to dashboard after login
- [ ] Can see user info in dashboard
- [ ] Can logout successfully
- [ ] Can signup with new account
- [ ] New account can login

---

## 🔍 Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Email and password are required" | Missing fields | Fill in both fields |
| "Invalid email or password" | Wrong credentials | Use demo account or check password |
| "User with this email already exists" | Email taken | Use different email |
| "Company with this name already exists" | Company name taken | Use different company name |
| "Password does not meet requirements" | Weak password | Follow password rules |
| "Network error" | Backend not running | Start backend server |
| "Token expired" | Token > 7 days old | Login again |

---

## 💡 Pro Tips

1. **Use demo accounts for testing:**
   - No need to create new accounts
   - Already have sample data

2. **Open browser DevTools:**
   - Network tab: See API calls
   - Console tab: See error messages
   - Application tab: Check localStorage for token

3. **Check backend logs:**
   ```bash
   tail -f /home/engine/project/backend.log
   ```

4. **Test API directly:**
   ```bash
   # Login
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"manager@acme.com","password":"demo123"}'
   ```

5. **Reset database (if needed):**
   ```bash
   cd /home/engine/project
   npm run seed reset
   ```

---

## 📚 Additional Resources

- **Full Documentation:** See `DEMO_CREDENTIALS.md`
- **API Documentation:** http://localhost:3001/
- **Phase 5 Features:** See `PHASE5_WHITE_LABEL_ENTERPRISE.md`
- **Database Schema:** Run `npm run prisma:studio`

---

## ✨ Everything is Working!

The authentication system is fully functional. Both login and signup work correctly. If you encounter any issues:

1. Run the test script: `./TEST_AUTH.sh`
2. Check backend is running: `curl http://localhost:3001/api/health`
3. Use demo credentials: `manager@acme.com` / `demo123`
4. Check browser console for errors
5. Review backend logs: `tail -f backend.log`

**Need help?** All features have been implemented and tested. The system is ready to use!

---

**Last Updated:** January 5, 2025
