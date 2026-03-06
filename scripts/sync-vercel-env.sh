#!/bin/bash

# Vercel Secret Sync Script
# Run this locally to sync your .env to Vercel

echo "Syncing Secrets to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "Vercel CLI not found. Please install: npm i -g vercel"
    exit 1
fi

# List of critical keys
KEYS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "GEMINI_API_KEY"
  "RESEND_API_KEY"
  "TWILIO_ACCOUNT_SID"
  "TWILIO_AUTH_TOKEN"
  "TWILIO_PHONE_NUMBER"
  "PLAID_CLIENT_ID"
  "PLAID_SECRET"
  "XERO_CLIENT_ID"
  "XERO_CLIENT_SECRET"
)

# Loop and add (User must have .env locally or variables set)
# This is a template for the user to run.
for key in "${KEYS[@]}"; do
  echo "Add $key? (Enter value or press enter to skip)"
  read -r value
  if [ ! -z "$value" ]; then
    echo "$value" | vercel env add $key production
  fi
done

echo "Done."
