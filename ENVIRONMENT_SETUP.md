# Environment Variables Setup

## Issue: "No key passed" Error

This error occurs because the Razorpay key is not configured in your environment variables.

## Solution: Create .env.local File

Create a file named `.env.local` in your project root with the following content:

```env
# Razorpay Configuration (Live Credentials)
RAZORPAY_KEY_ID=your_actual_live_key_id
RAZORPAY_KEY_SECRET=your_actual_live_key_secret
RAZORPAY_WEBHOOK_SECRET=your_actual_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_actual_live_key_id

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/examintelligence

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Admin Configuration
ADMIN_EMAIL=examadmin@gmail.com
ADMIN_PASSWORD=Admin@123
```

## Important Notes:

1. **Replace the placeholder values** with your actual Razorpay credentials
2. **Both `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID` should have the same value**
3. **Restart your server** after creating/updating `.env.local`

## Steps to Fix:

1. Create `.env.local` file in project root
2. Add your Razorpay credentials
3. Restart server: `npm run dev`
4. Test payment flow

## Alternative: Run Setup Script

You can also run the setup script:
```bash
node scripts/setup-env.js
```

This will create the `.env.local` file with placeholder values that you can then update with your actual credentials.
