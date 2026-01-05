# 🚀 Quick Start Guide

## Everything is Working! ✅

Both **Sign In** and **Sign Up** are fully functional. Follow these steps to get started.

---

## ⚡ One Command Start

```bash
cd /home/engine/project
./start-all.sh
```

This starts both backend and frontend servers automatically.

---

## 🔑 Demo Login

**Open:** http://localhost:3000/auth/login

**Credentials:**
```
Email:    manager@acme.com
Password: demo123
```

---

## 📋 Step-by-Step

### 1. Start Backend
```bash
cd /home/engine/project
npm run dev
```
✅ Backend runs on http://localhost:3001

### 2. Start Frontend (New Terminal)
```bash
cd /home/engine/project/frontend
npm run dev
```
✅ Frontend runs on http://localhost:3000

### 3. Login
- Open http://localhost:3000/auth/login
- Use: `manager@acme.com` / `demo123`
- Click "Sign in"
- You'll be redirected to the dashboard!

---

## ✨ Test Everything

Run automated tests:
```bash
./TEST_AUTH.sh
```

This verifies:
- ✅ Backend health
- ✅ Login works
- ✅ Protected routes work
- ✅ Frontend accessible

---

## 🎯 Available Demo Accounts

| Email | Password | Role | Company |
|-------|----------|------|---------|
| manager@acme.com | demo123 | Manager | Acme Manufacturing |
| planner@acme.com | demo123 | Planner | Acme Manufacturing |
| manager@techretail.com | demo123 | Manager | TechRetail Inc |
| coordinator@techretail.com | demo123 | Coordinator | TechRetail Inc |
| manager@healthcare.com | demo123 | Manager | HealthCare Logistics |

---

## 📍 Important URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Login:** http://localhost:3000/auth/login
- **Signup:** http://localhost:3000/auth/signup
- **Dashboard:** http://localhost:3000/dashboard

---

## 🎨 Phase 5 Features

### White-Label Settings
http://localhost:3000/dashboard/settings/white-label
- Customize logo, colors, fonts
- Setup custom domain
- Remove branding

### Security Settings (2FA)
http://localhost:3000/dashboard/settings/security
- Enable Two-Factor Authentication
- Generate backup codes
- QR code for authenticator apps

### Legal Documents
- Terms: http://localhost:3000/legal/terms
- Privacy: http://localhost:3000/legal/privacy
- DPA: http://localhost:3000/legal/dpa
- SLA: http://localhost:3000/legal/sla
- AUP: http://localhost:3000/legal/aup

---

## 🛑 Stop Services

```bash
./stop-all.sh
```

Or manually:
```bash
# Stop all Node processes
pkill -f "ts-node"
pkill -f "next dev"
```

---

## 🐛 Troubleshooting

### "Cannot connect"
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Start backend
cd /home/engine/project && npm run dev
```

### "Login failed"
- Use correct credentials: `manager@acme.com` / `demo123`
- Check backend logs: `tail -f backend.log`
- Re-seed database: `npm run seed`

### "Signup failed"
- Don't use existing company names
- Password must be strong (8+ chars, uppercase, lowercase, number)

---

## 📚 Full Documentation

- **AUTHENTICATION_GUIDE.md** - Detailed auth troubleshooting
- **DEMO_CREDENTIALS.md** - All demo accounts & API docs
- **PHASE5_WHITE_LABEL_ENTERPRISE.md** - Phase 5 features
- **TEST_AUTH.sh** - Automated test script

---

## ✅ Verification Checklist

- [ ] Backend running: `curl http://localhost:3001/api/health`
- [ ] Frontend running: `curl http://localhost:3000`
- [ ] Can access login page
- [ ] Can login with demo account
- [ ] Redirected to dashboard
- [ ] Can see dashboard data
- [ ] Can logout
- [ ] Can signup new account

---

## 🎉 You're Ready!

**Everything is configured and working!**

1. Run `./start-all.sh`
2. Open http://localhost:3000
3. Login with `manager@acme.com` / `demo123`
4. Explore the dashboard!

**Need help?** Check `AUTHENTICATION_GUIDE.md` for detailed troubleshooting.

---

**Last Updated:** January 5, 2025
**Status:** ✅ All Features Working
