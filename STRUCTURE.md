# Project Structure

This document provides an overview of the project's organization and architecture.

## Directory Structure

```
delivery/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin dashboard page
│   │   └── page.tsx
│   ├── api/                      # API routes
│   │   ├── admin/
│   │   │   ├── stats/           # Platform statistics endpoint
│   │   │   └── users/           # User management endpoint
│   │   ├── auth/
│   │   │   ├── login/           # Login endpoint
│   │   │   └── register/        # Registration endpoint
│   │   ├── bookings/            # Booking management endpoint
│   │   └── listings/            # Van listing management endpoint
│   ├── dashboard/               # User dashboard page
│   │   └── page.tsx
│   ├── login/                   # Login page
│   │   └── page.tsx
│   ├── marketplace/             # Marketplace listing page
│   │   └── page.tsx
│   ├── register/                # Registration page
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── lib/                         # Utility libraries
│   ├── auth.ts                  # Authentication utilities (JWT, bcrypt)
│   ├── prisma.ts                # Prisma client singleton
│   └── stripe.ts                # Stripe integration utilities
├── prisma/
│   └── schema.prisma            # Database schema
├── public/                      # Static assets
├── .env                         # Environment variables (not committed)
├── .env.example                 # Environment variables template
├── .gitignore
├── API.md                       # API documentation
├── DEPLOYMENT.md                # Deployment guide
├── next.config.ts               # Next.js configuration
├── package.json
├── postcss.config.mjs
├── README.md                    # Project overview
├── STRUCTURE.md                 # This file
└── tsconfig.json                # TypeScript configuration
```

## Architecture Overview

### Frontend (Next.js App Router)

The application uses Next.js 16 with the App Router pattern:

- **Pages**: Server-rendered React components in the `app/` directory
- **Client Components**: Marked with `'use client'` directive for interactive features
- **Styling**: Tailwind CSS for utility-first styling

### Backend (Next.js API Routes)

API routes are defined in the `app/api/` directory:

- **RESTful design**: Each endpoint follows REST principles
- **Middleware**: Authentication via JWT tokens
- **Validation**: Input validation on all endpoints

### Database (PostgreSQL + Prisma)

Database access is managed through Prisma ORM:

- **Schema**: Defined in `prisma/schema.prisma`
- **Client**: Singleton pattern in `lib/prisma.ts`
- **Models**: User, VanListing, Booking

### Authentication

JWT-based authentication system:

- **Hashing**: bcrypt for password security
- **Tokens**: JWT with 7-day expiration
- **Roles**: CARRIER, SHIPPER, YACHT_CLIENT, ADMIN

## Data Flow

### User Registration Flow

1. User submits registration form
2. Frontend sends POST to `/api/auth/register`
3. Backend validates input and checks for existing email
4. Password is hashed with bcrypt
5. User record created in database
6. Success response returned

### Login Flow

1. User submits login credentials
2. Frontend sends POST to `/api/auth/login`
3. Backend verifies email and password
4. JWT token generated with user info
5. Token and user data returned
6. Frontend stores token in localStorage

### Booking Flow

1. User browses marketplace listings
2. User selects a listing and fills booking form
3. Frontend sends POST to `/api/bookings` with JWT token
4. Backend validates user role (SHIPPER or YACHT_CLIENT)
5. Backend checks listing capacity
6. Booking created and listing capacity updated in transaction
7. Success response with booking details

## Key Components

### Authentication (lib/auth.ts)

```typescript
- hashPassword(password: string): Promise<string>
- verifyPassword(password: string, hashedPassword: string): Promise<boolean>
- generateToken(payload: object, expiresIn?: string): string
- verifyToken(token: string): DecodedToken | null
```

### Stripe Integration (lib/stripe.ts)

```typescript
- createPaymentIntent(amount: number, metadata: object)
- createConnectAccount(email: string, country?: string)
- createAccountLink(accountId: string, refreshUrl: string, returnUrl: string)
- transferToCarrier(amount: number, connectedAccountId: string, metadata: object)
```

## State Management

Currently using React's built-in state management:

- **useState**: Component-level state
- **useEffect**: Side effects and data fetching
- **localStorage**: Client-side persistence for auth tokens

For future scaling, consider:
- React Context for global state
- Zustand or Jotai for lightweight state management
- React Query for server state caching

## Security Considerations

### Implemented

- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation on API endpoints
- SQL injection prevention (Prisma ORM)

### TODO

- Rate limiting on API endpoints
- CSRF protection
- Content Security Policy headers
- Request sanitization
- API versioning
- Session management

## Performance Optimizations

### Current

- Static page generation where possible
- Prisma connection pooling
- Next.js automatic code splitting

### Future Improvements

- Implement pagination for listings/bookings
- Add database indexes for common queries
- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Add service worker for offline support
- Use Next.js Image component for optimized images

## Testing Strategy

### Recommended Test Structure

```
__tests__/
├── api/
│   ├── auth.test.ts
│   ├── listings.test.ts
│   └── bookings.test.ts
├── pages/
│   ├── login.test.tsx
│   ├── register.test.tsx
│   └── marketplace.test.tsx
└── lib/
    ├── auth.test.ts
    └── stripe.test.ts
```

### Testing Tools to Add

- Jest for unit testing
- React Testing Library for component testing
- Supertest for API testing
- Cypress or Playwright for E2E testing

## Database Schema Summary

### User
- Authentication and profile information
- Role-based permissions
- Company details

### VanListing
- Vehicle and route information
- Capacity tracking (weight/volume)
- Pricing configuration
- Active status

### Booking
- Links shipper to listing
- Tracks booked capacity
- Payment information
- Status tracking

## API Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Register new user |
| POST | /api/auth/login | No | Login user |
| GET | /api/listings | No | Get all listings |
| POST | /api/listings | Yes (CARRIER) | Create listing |
| GET | /api/bookings | Yes | Get user bookings |
| POST | /api/bookings | Yes (SHIPPER/CLIENT) | Create booking |
| GET | /api/admin/users | Yes (ADMIN) | Get all users |
| GET | /api/admin/stats | Yes (ADMIN) | Get statistics |

## Environment Variables

See `.env.example` for all required environment variables.

Critical variables:
- `DATABASE_URL`: PostgreSQL connection
- `NEXTAUTH_SECRET`: Secret key for JWT token signing (can be any secure random string)
- `STRIPE_SECRET_KEY`: Payment processing

## Deployment Checklist

- [ ] Configure environment variables in Vercel
- [ ] Set up PostgreSQL database
- [ ] Run database migrations (`npx prisma db push`)
- [ ] Configure Stripe webhooks
- [ ] Create initial admin user
- [ ] Test all user flows
- [ ] Set up monitoring and logging
- [ ] Configure custom domain (optional)

## Future Enhancements

### High Priority
- Implement booking status updates
- Add email notifications
- Real-time updates with WebSockets
- Payment processing with Stripe

### Medium Priority
- Route optimization with Google Maps
- Chat system between users
- Mobile responsive improvements
- Advanced search and filtering

### Low Priority
- Mobile app (React Native)
- AI-powered space optimization
- Multi-language support
- Analytics dashboard

## Contributing Guidelines

1. Follow TypeScript strict mode
2. Use ESLint configuration
3. Write meaningful commit messages
4. Update documentation for new features
5. Test thoroughly before committing
6. Follow the existing code style

## Maintenance Notes

### Regular Tasks
- Update dependencies monthly
- Review and rotate secrets quarterly
- Monitor database performance
- Check for security vulnerabilities
- Review and optimize slow queries

### Monitoring
- Application logs (Vercel Dashboard)
- Database metrics (hosting provider)
- Error tracking (Sentry recommended)
- Payment monitoring (Stripe Dashboard)

## Support and Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
