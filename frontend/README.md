# SCACA Frontend - Supply Chain AI Control Assistant

This is the Next.js 14 frontend for the Supply Chain AI Control Assistant (SCACA).

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Data Fetching**: Axios, SWR
- **State Management**: React Context (Auth)

## Getting Started

### Prerequisites
- Node.js 18+
- Backend server running on port 3001

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables
Create a `.env.local` file in the frontend root:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Development
Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure
- `app/`: Next.js App Router routes and layouts
- `components/`: Reusable UI components
  - `Auth/`: Authentication related components
  - `Dashboard/`: Dashboard layout components
  - `Common/`: Base UI components (Button, Input, Card, etc.)
- `context/`: React Context providers (AuthContext)
- `hooks/`: Custom React hooks (useAuth, useApi)
- `utils/`: Utility functions and API client
- `types/`: TypeScript type definitions

## Component Usage Guide

### Button
```tsx
import Button from '@/components/Common/Button';

<Button variant="primary" size="md" isLoading={false}>
  Click Me
</Button>
```

### Input
```tsx
import Input from '@/components/Common/Input';

<Input label="Email" error="Invalid email" required />
```

### Card
```tsx
import Card from '@/components/Common/Card';

<Card title="Title" description="Description">
  Content
</Card>
```

## Authentication Flow
The application uses JWT authentication.
- Tokens are stored in `localStorage`.
- `AuthContext` provides authentication state and methods (`login`, `signup`, `logout`).
- `ProtectedRoute` component wraps protected routes in the dashboard.
- API client automatically injects the Bearer token into requests.
