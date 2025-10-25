# Deployment Guide

This guide will help you deploy the Yachting Logistics Marketplace to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A PostgreSQL database (you can use services like:
   - Vercel Postgres
   - Neon (https://neon.tech)
   - Railway (https://railway.app)
   - Supabase (https://supabase.com)
3. A Stripe account for payments (https://stripe.com)
4. (Optional) Google Maps API key for route visualization

## Step 1: Set Up PostgreSQL Database

### Option A: Using Vercel Postgres
1. Go to your Vercel project
2. Navigate to Storage → Create Database → Postgres
3. Copy the connection string

### Option B: Using Neon
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string

### Option C: Using Railway
1. Sign up at https://railway.app
2. Create a new PostgreSQL database
3. Copy the connection string

## Step 2: Deploy to Vercel

1. Push your code to GitHub

2. Go to Vercel and import your repository

3. Configure environment variables:
   ```
   DATABASE_URL=your_postgresql_connection_string
   NEXTAUTH_SECRET=your_secret_key_here (generate with: openssl rand -base64 32)
   NEXTAUTH_URL=https://your-domain.vercel.app
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key (optional)
   ```

4. Deploy the project

## Step 3: Run Database Migrations

After deployment, you need to set up the database schema:

1. Install Vercel CLI locally:
   ```bash
   npm install -g vercel
   ```

2. Link your project:
   ```bash
   vercel link
   ```

3. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```

4. Run Prisma migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

5. Or if using production database:
   ```bash
   npx prisma db push
   ```

## Step 4: Configure Stripe

1. Go to your Stripe Dashboard
2. Get your API keys (test or live mode)
3. Set up webhooks:
   - Webhook URL: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `account.updated`

## Step 5: Create Admin User

After deployment, you'll need to create an admin user. You can do this by:

1. Using Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. Or by registering through the app and manually updating the role in the database:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```

## Step 6: Test the Application

1. Visit your deployed application
2. Register as a Carrier, Shipper, or Yacht Client
3. Test the following flows:
   - Carrier: Create a van listing
   - Shipper: Browse marketplace and create a booking
   - Admin: View dashboard statistics

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for JWT signing | Yes |
| `NEXTAUTH_URL` | Your application URL | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes for payments |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes for payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes for payments |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key | Optional |

## Troubleshooting

### Database Connection Issues
- Ensure DATABASE_URL is correctly formatted
- Check database service is running
- Verify firewall/network settings allow connections

### Build Failures
- Check all environment variables are set
- Run `npm run build` locally to catch errors
- Review Vercel build logs

### Stripe Integration
- Verify API keys are correct
- Test in Stripe test mode first
- Check webhook endpoint is accessible

## Monitoring and Maintenance

1. Monitor application logs in Vercel dashboard
2. Set up error tracking (e.g., Sentry)
3. Regular database backups
4. Monitor Stripe dashboard for payments
5. Keep dependencies updated

## Scaling Considerations

- Use connection pooling for database (PgBouncer)
- Consider Prisma Accelerate for query caching
- Implement rate limiting on API endpoints
- Use Vercel Edge Functions for global performance
- Monitor and optimize slow queries

## Security Best Practices

1. Rotate secrets regularly
2. Use environment variables for all sensitive data
3. Enable HTTPS only (Vercel does this by default)
4. Implement rate limiting
5. Keep dependencies updated
6. Regular security audits
7. Use Content Security Policy headers

## Support

For issues or questions:
- Check the README.md for documentation
- Review API endpoint documentation
- Open an issue in the repository
