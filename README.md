# Supply Chain AI Control Assistant - Backend Infrastructure

A robust Express.js backend with PostgreSQL database, JWT authentication, and comprehensive user management for the Supply Chain AI Control Assistant MVP.

---

## ⚡ Quick Start (TL;DR)

**Start everything in one command:**
```bash
./start-all.sh
```

**Login with demo account:**
- URL: http://localhost:3000/auth/login
- Email: `manager@acme.com`
- Password: `demo123`

**📚 Read this first:** [`QUICK_START.md`](QUICK_START.md)

**✅ System Status:** Sign In & Sign Up are **working perfectly!**  
See [`STATUS_REPORT.md`](STATUS_REPORT.md) for full system status.

---

## 🚀 Features

### Core Features
- **Express.js API Server** with TypeScript support
- **PostgreSQL Database** with Prisma ORM
- **JWT Authentication** with role-based access control
- **User Management** with company associations
- **Password Security** with bcrypt hashing
- **Seed Data** for development and testing
- **API Documentation** with Postman collection
- **Environment Configuration** with secure defaults

### Phase 5: Enterprise & White-Label ✨ NEW!
- **White-Label Branding** - Custom logos, colors, fonts, domains
- **Two-Factor Authentication (2FA)** - TOTP with backup codes
- **SAML 2.0 SSO** - Enterprise single sign-on
- **Audit Logging** - Track all admin actions
- **Legal Documents** - Terms, Privacy Policy, DPA, SLA, AUP
- **Security Headers** - CSP, HSTS, and more
- **Custom Domains** - With SSL certificate support
- **Enterprise Agreements** - MSA and DPA management

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (local or cloud-based like Neon.tech)
- npm or yarn package manager

## 🛠️ Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the environment template and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/supplychain_db?schema=public"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-32-characters-minimum"

# Server Configuration
PORT=3001
NODE_ENV="development"
```

### 3. Database Setup

Initialize Prisma and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Seed Database

Load development data:

```bash
npm run seed
```

### 5. Start Development Server

```bash
npm run dev
```

The server will be available at `http://localhost:3001`

## 📚 API Documentation

### Base URL
```
http://localhost:3001
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user with company | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| GET | `/api/auth/me` | Get current user info | Yes |
| GET | `/api/auth/verify` | Verify token validity | Yes |
| POST | `/api/auth/change-password` | Change user password | Yes |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health status |

### Request Examples

#### Signup
```bash
curl -X POST http://localhost:3001/api/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "john@company.com",
    "password": "SecurePass123!",
    "name": "John Smith",
    "companyName": "Acme Corp",
    "industry": "Manufacturing"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "john@company.com",
    "password": "SecurePass123!"
  }'
```

#### Get Current User
```bash
curl -X GET http://localhost:3001/api/auth/me \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response Format

#### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "john@company.com",
    "name": "John Smith",
    "role": "MANAGER",
    "companyId": "company_123"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## 🗄️ Database Schema

### User Table
- `id` (String, Primary Key)
- `email` (String, Unique)
- `password` (String, Hashed)
- `name` (String)
- `role` (Enum: MANAGER, PLANNER, COORDINATOR, FINANCE)
- `companyId` (String, Foreign Key)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Company Table
- `id` (String, Primary Key)
- `name` (String)
- `industry` (String: Manufacturing, Retail, Healthcare)
- `employees` (Integer)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## 🔐 Authentication

### JWT Token Structure
```json
{
  "userId": "user_id",
  "companyId": "company_id",
  "email": "user@email.com",
  "role": "MANAGER",
  "iat": 1234567890,
  "exp": 1234567890,
  "iss": "supplychain-ai",
  "aud": "supplychain-users"
}
```

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Role-Based Access Control
- **MANAGER**: Full access to company data
- **PLANNER**: Access to planning and scheduling
- **COORDINATOR**: Access to coordination tasks
- **FINANCE**: Access to financial data

## 🧪 Testing

### Using Postman

1. Import the provided Postman collection:
   ```bash
   # Import postman_collection.json into Postman
   ```

2. Configure environment variables:
   - `BASE_URL`: `http://localhost:3001`
   - `TOKEN`: Will be set automatically after login

3. Test the authentication flow:
   - Health Check: Verify server is running
   - Login: Use demo credentials
   - Protected Routes: Test with valid token

### Demo Credentials

After running the seed script, you can use these accounts:

| Email | Password | Role | Company |
|-------|----------|------|---------|
| `manager@acme.com` | `demo123` | MANAGER | Acme Manufacturing |
| `planner@acme.com` | `demo123` | PLANNER | Acme Manufacturing |
| `manager@techretail.com` | `demo123` | MANAGER | TechRetail Inc |
| `coordinator@techretail.com` | `demo123` | COORDINATOR | TechRetail Inc |
| `manager@healthcare.com` | `demo123` | MANAGER | HealthCare Logistics |

## 🛠️ Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run seed` | Seed database with demo data |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:reset` | Reset database and reseed |
| `npm test` | Run test suite |

## 🏗️ Project Structure

```
src/
├── index.ts              # Express server entry point
├── middleware/
│   └── auth.ts          # Authentication middleware
├── controllers/
│   └── authController.ts # Authentication logic
├── routes/
│   └── auth.ts          # API route definitions
├── utils/
│   ├── auth.ts          # Password utilities
│   └── jwt.ts           # JWT token utilities
├── seeds/
│   └── seed.ts          # Database seeding script
└── models/              # Database models (via Prisma)

prisma/
├── schema.prisma        # Database schema
└── migrations/          # Database migrations

public/                  # Static files
postman_collection.json  # API testing collection
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds (12)
- **JWT Security**: Strong secret keys, expiration, issuer/audience validation
- **Input Validation**: Comprehensive request validation
- **CORS Configuration**: Configurable cross-origin policies
- **Error Handling**: Secure error messages (dev vs production)
- **Environment Variables**: Sensitive data stored securely

## 🚀 Deployment

### Environment Variables (Production)

```env
NODE_ENV=production
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-super-secure-jwt-secret-32-chars-min"
CORS_ORIGINS="https://yourdomain.com"
PORT=3001
```

### Build and Deploy

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Database Migrations (Production)

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env
   - Ensure database exists

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper Authorization header format

3. **Port Already in Use**
   - Change PORT in .env
   - Kill existing process: `lsof -ti:3001 | xargs kill`

4. **Migration Errors**
   - Reset database: `npm run prisma:reset`
   - Re-run migrations: `npm run prisma:migrate`

### Logs and Debugging

- Check server logs in terminal
- Use Prisma Studio for database inspection: `npm run prisma:studio`
- Enable debug logging in development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 📞 Support

For technical support or questions:
- Check the troubleshooting section
- Review API documentation
- Create an issue in the repository

---

**Supply Chain AI Control Assistant** - Backend Infrastructure v1.0.0