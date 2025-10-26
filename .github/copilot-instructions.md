# GitHub Copilot Instructions for Yachting Logistics Marketplace

## Project Overview

This is a Next.js-based marketplace platform for optimizing unused space in delivery vans within the yachting industry. It connects Carriers (suppliers with spare van space), Shippers (suppliers needing delivery space), and Yacht Clients (end users booking deliveries).

## Technology Stack

- **Frontend**: Next.js 16 with TypeScript, React 19, and Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with bcrypt password hashing
- **Payments**: Stripe Connect integration
- **Deployment**: Vercel

## Code Style and Conventions

### TypeScript

- **Always use TypeScript** for all new files (.ts, .tsx)
- Enable TypeScript strict mode (already configured in tsconfig.json)
- Use explicit types instead of `any` whenever possible
- Define interfaces for data structures and API responses
- Use the `@/*` path alias for imports (configured in tsconfig.json)

### React Components

- **Use functional components** with React hooks (no class components)
- Use the `'use client'` directive only when necessary for client-side interactivity
- Prefer Server Components by default (Next.js App Router)
- Follow the Next.js App Router conventions for pages, layouts, and route handlers

### Naming Conventions

- **Files**: Use kebab-case for file names (e.g., `user-profile.tsx`)
- **Components**: Use PascalCase for component names (e.g., `UserProfile`)
- **Variables/Functions**: Use camelCase (e.g., `getUserById`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Types/Interfaces**: Use PascalCase (e.g., `UserData`, `ApiResponse`)

### File Organization

```
app/
├── (pages)/           # Route pages
├── api/              # API route handlers
│   ├── auth/
│   ├── listings/
│   ├── bookings/
│   └── admin/
├── layout.tsx        # Root layout
└── globals.css       # Global styles

lib/
├── auth.ts           # Authentication utilities
├── prisma.ts         # Prisma client singleton
└── stripe.ts         # Stripe integration

prisma/
└── schema.prisma     # Database schema
```

## Build, Lint, and Test

### Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

### ESLint

- The project uses ESLint with Next.js recommended config
- Configuration is in `eslint.config.mjs`
- Always run `npm run lint` before committing code
- Fix linting errors automatically when possible with ESLint auto-fix

## Database and Prisma

### Schema Management

- Database schema is defined in `prisma/schema.prisma`
- Always update the schema file and then run migrations
- Use Prisma Client for all database operations (imported from `@/lib/prisma`)

### Common Prisma Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name <migration_name>

# Push schema changes without migrations (dev only)
npx prisma db push

# Open Prisma Studio to view/edit data
npx prisma studio
```

### Database Models

The schema includes these main models:

- **User**: Authentication, profiles, and role-based permissions (CARRIER, SHIPPER, YACHT_CLIENT, ADMIN)
- **VanListing**: Vehicle listings with routes, capacity (weight/volume), and pricing
- **Booking**: Links shippers to listings with capacity tracking and payment info

### Prisma Client Usage

```typescript
import { prisma } from '@/lib/prisma';

// Always use the singleton client from lib/prisma
// Example: const users = await prisma.user.findMany();
```

## Authentication and Security

### JWT Authentication

- JWT tokens are used for authentication (7-day expiration)
- Token utilities are in `lib/auth.ts`:
  - `hashPassword()` - Hash passwords with bcrypt
  - `verifyPassword()` - Verify password against hash
  - `generateToken()` - Create JWT tokens
  - `verifyToken()` - Verify and decode JWT tokens

### Authorization Pattern

```typescript
// Extract token from Authorization header
const token = request.headers.get('authorization')?.split(' ')[1];
if (!token) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Verify token
const decoded = verifyToken(token);
if (!decoded) {
  return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
}

// Check user role
if (decoded.role !== 'CARRIER') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Security Best Practices

- **Never commit secrets** to the repository
- Use environment variables for sensitive data (defined in `.env`, template in `.env.example`)
- Always hash passwords with bcrypt before storing
- Validate and sanitize all user inputs
- Use Prisma ORM to prevent SQL injection
- Implement role-based access control for all protected endpoints
- Use HTTPS in production (handled by Vercel)

## API Endpoints

### Conventions

- Use Next.js Route Handlers in `app/api/` directory
- Follow RESTful conventions:
  - `GET` - Retrieve resources
  - `POST` - Create resources
  - `PUT/PATCH` - Update resources
  - `DELETE` - Remove resources
- Return consistent JSON responses with appropriate HTTP status codes
- Include error handling for all endpoints

### Response Format

```typescript
// Success response
return NextResponse.json({ 
  data: result,
  message: 'Success message' 
}, { status: 200 });

// Error response
return NextResponse.json({ 
  error: 'Error message',
  details: errorDetails // optional
}, { status: 400 });
```

### Existing Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register` | No | - | Register new user |
| POST | `/api/auth/login` | No | - | Login and get JWT |
| GET | `/api/listings` | No | - | Get all active listings |
| POST | `/api/listings` | Yes | CARRIER | Create new listing |
| GET | `/api/bookings` | Yes | Any | Get user's bookings |
| POST | `/api/bookings` | Yes | SHIPPER/YACHT_CLIENT | Create booking |
| GET | `/api/admin/users` | Yes | ADMIN | Get all users |
| GET | `/api/admin/stats` | Yes | ADMIN | Get platform stats |

## Environment Variables

Required environment variables (see `.env.example`):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
NEXTAUTH_SECRET="your-secret-key-for-jwt"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## Common Patterns

### Creating New API Endpoints

1. Create a new folder in `app/api/` for the endpoint
2. Add a `route.ts` file with appropriate HTTP method handlers
3. Implement authentication/authorization if needed
4. Validate request data
5. Interact with database using Prisma
6. Return appropriate JSON response

### Adding New Pages

1. Create a new folder in `app/` for the route
2. Add a `page.tsx` file (Server Component by default)
3. Use `'use client'` directive if client-side features needed
4. Import and use Tailwind CSS for styling
5. Follow existing page structure and patterns

### Database Queries

- Use Prisma Client for all database operations
- Include error handling with try-catch blocks
- Use transactions for operations that modify multiple records
- Include appropriate indexes in schema for common queries
- Use `select` to limit returned fields when possible

### Error Handling

```typescript
try {
  // Database operation
  const result = await prisma.model.create({ data });
  return NextResponse.json({ data: result }, { status: 201 });
} catch (error) {
  console.error('Error creating resource:', error);
  return NextResponse.json(
    { error: 'Failed to create resource' },
    { status: 500 }
  );
}
```

## Tailwind CSS

- Use Tailwind CSS utility classes for styling
- Configuration is in Tailwind CSS 4 format (using `@import`)
- Follow mobile-first responsive design approach
- Use semantic color names when possible
- Avoid custom CSS unless necessary

## Stripe Integration

- Stripe utilities are in `lib/stripe.ts`
- Functions available:
  - `createPaymentIntent()` - Create payment intents
  - `createConnectAccount()` - Create Connect accounts for carriers
  - `createAccountLink()` - Create onboarding links
  - `transferToCarrier()` - Transfer funds to carriers

## Testing (Future Enhancement)

When adding tests:

- Use Jest for unit testing
- Use React Testing Library for component testing
- Place tests in `__tests__/` directory
- Name test files with `.test.ts` or `.test.tsx` extension
- Follow the Arrange-Act-Assert pattern

## Documentation

- Update API.md when adding/modifying API endpoints
- Update README.md for major feature changes
- Update STRUCTURE.md if project organization changes
- Add JSDoc comments for utility functions
- Keep comments concise and meaningful

## Common Tasks

### Adding a New User Role

1. Update `UserRole` enum in `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_new_role`
3. Update role checks in relevant API endpoints
4. Update TypeScript types if needed

### Adding a New Booking Status

1. Update `BookingStatus` enum in `prisma/schema.prisma`
2. Run migration
3. Update booking workflow logic in API routes

### Creating New Database Models

1. Define model in `prisma/schema.prisma`
2. Add relations to existing models if needed
3. Run `npx prisma migrate dev --name add_model_name`
4. Create API endpoints for CRUD operations
5. Add appropriate indexes for query optimization

## Performance Considerations

- Use Server Components for static content
- Implement pagination for list views (listings, bookings)
- Use database indexes for frequently queried fields
- Optimize images with Next.js Image component
- Use Prisma's select to fetch only required fields
- Consider caching strategies for frequently accessed data

## Deployment

- Platform: Vercel (recommended)
- Database: PostgreSQL (Railway, Supabase, or Neon)
- Environment variables must be configured in Vercel dashboard
- Run `npx prisma db push` after deployment to sync database schema
- See DEPLOYMENT.md for detailed instructions

## Getting Help

- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Stripe API: https://stripe.com/docs/api
- Tailwind CSS: https://tailwindcss.com/docs
- Project Documentation: README.md, API.md, STRUCTURE.md, DEPLOYMENT.md
