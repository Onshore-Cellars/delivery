#!/bin/bash
# Railway Setup Script for YachtHop Delivery
# Run this after authenticating with Railway CLI:
#   railway login
#   railway link
#   bash setup-railway.sh

set -e

echo "=== YachtHop Railway Setup ==="
echo ""

# Check Railway CLI auth
if ! railway whoami &>/dev/null; then
  echo "ERROR: Not logged in to Railway. Run: railway login"
  exit 1
fi

echo "✓ Railway CLI authenticated"

# Check if linked to a project
if ! railway status &>/dev/null; then
  echo "Not linked to a project. Running 'railway link'..."
  railway link
fi

echo "✓ Linked to Railway project"
echo ""

# Add PostgreSQL if not already present
echo "--- Setting Environment Variables ---"
echo ""

# Generate a secure secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Get the Railway-provided domain (if available)
RAILWAY_DOMAIN=$(railway vars get RAILWAY_PUBLIC_DOMAIN 2>/dev/null || echo "")

if [ -n "$RAILWAY_DOMAIN" ]; then
  APP_URL="https://$RAILWAY_DOMAIN"
else
  APP_URL="https://your-app.railway.app"
fi

# Set all required env vars
railway vars set \
  NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  NEXTAUTH_URL="$APP_URL" \
  NODE_ENV="production" \
  2>&1

echo ""
echo "✓ Environment variables set"
echo ""
echo "=== IMPORTANT ==="
echo "1. If you haven't already, add a PostgreSQL database:"
echo "   Railway Dashboard → New → Database → PostgreSQL"
echo "   This auto-injects DATABASE_URL"
echo ""
echo "2. For Stripe payments, add these manually in Railway Dashboard → Variables:"
echo "   STRIPE_SECRET_KEY=sk_live_..."
echo "   STRIPE_PUBLISHABLE_KEY=pk_live_..."
echo "   STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""
echo "3. NEXTAUTH_SECRET has been set to: $NEXTAUTH_SECRET"
echo "   NEXTAUTH_URL has been set to: $APP_URL"
echo ""
echo "=== Done! Railway will auto-redeploy with these changes. ==="
