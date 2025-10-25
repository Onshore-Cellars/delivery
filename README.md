# Yachting Logistics Marketplace

A web-based marketplace platform to optimize unused space in delivery vans within the yachting industry.

## Overview

This platform connects three types of users:

1. **Carriers** - Suppliers with spare van space who want to list available capacity
2. **Shippers** - Suppliers needing space to book deliveries
3. **Yacht Clients** - End users who book deliveries directly for their supplies

## Features

- **User Authentication**: Role-based authentication for Carriers, Shippers, Yacht Clients, and Admins
- **Listing Management**: Carriers can create and manage van space listings with routes, capacity, and pricing
- **Booking System**: Shippers and Yacht Clients can search and book available van space
- **Marketplace**: Browse and filter available routes by origin, destination, date, and capacity
- **Admin Dashboard**: Monitor users, listings, bookings, and platform statistics
- **Stripe Integration**: Ready for payment processing with Stripe Connect

## Tech Stack

- **Frontend**: Next.js 16 with TypeScript and Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication with bcrypt
- **Payments**: Stripe Connect (integration ready)
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd delivery
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - A secure random string for JWT signing
- `STRIPE_SECRET_KEY` - Your Stripe secret key (for payments)
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key

4. Set up the database:
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

The application uses the following main models:

- **User**: Stores user accounts with roles (CARRIER, SHIPPER, YACHT_CLIENT, ADMIN)
- **VanListing**: Stores van space listings with routes, capacity, and pricing
- **Booking**: Stores booking information linking shippers to listings

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Listings
- `GET /api/listings` - Get all listings (with filters)
- `POST /api/listings` - Create a new listing (Carriers only)

### Bookings
- `GET /api/bookings` - Get user's bookings
- `POST /api/bookings` - Create a new booking (Shippers/Yacht Clients)

### Admin
- `GET /api/admin/users` - Get all users (Admin only)
- `GET /api/admin/stats` - Get platform statistics (Admin only)

## Project Structure

```
delivery/
├── app/
│   ├── api/              # API routes
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── dashboard/        # User dashboard
│   ├── marketplace/      # Marketplace listing view
│   ├── admin/            # Admin dashboard
│   └── page.tsx          # Landing page
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # Authentication utilities
│   └── stripe.ts         # Stripe integration
├── prisma/
│   └── schema.prisma     # Database schema
└── components/           # Reusable React components
```

## User Roles

### Carrier
- Create and manage van listings
- View received bookings
- Set pricing (per kg, per m³, or fixed price)

### Shipper / Yacht Client
- Browse available van space
- Create bookings
- Track booking status

### Admin
- View platform statistics
- Manage users and listings
- Monitor transactions

## Deployment

This application is designed to be deployed on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy

The database should be hosted separately (e.g., Railway, Supabase, or Neon).

## Future Enhancements

- [ ] Real-time notifications
- [ ] Chat between carriers and shippers
- [ ] Route optimization with Google Maps/Mapbox
- [ ] AI-powered space calculation
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

## License

MIT

## Support

For issues and questions, please open an issue in the repository.
