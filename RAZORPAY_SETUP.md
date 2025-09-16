# Razorpay Payment Integration Setup

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Razorpay Configuration (Live Credentials)
RAZORPAY_KEY_ID=your_live_key_id_here
RAZORPAY_KEY_SECRET=your_live_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_live_key_id_here
```

**Important**: Make sure to use the same key ID for both `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`

## How to Get Razorpay Credentials

1. **Sign up for Razorpay**: Go to [https://razorpay.com](https://razorpay.com)
2. **Get Live API Keys**: 
   - Go to Settings → API Keys
   - Copy your Live Key ID and Live Key Secret
   - Replace the values in `.env.local`

## Payment Flow

1. **User selects subscription plan** in registration or subscription page
2. **Payment page loads** with plan details
3. **Razorpay order created** via `/api/payments/subscription-order`
4. **Razorpay checkout opens** with payment options
5. **Payment completed** and verified via `/api/payments/subscription-verify`
6. **User redirected** to student dashboard
7. **Subscription activated** in database

## Live Payment Testing

- Use real payment methods for testing
- Test with small amounts first
- Monitor Razorpay dashboard for transactions

## Webhook Setup (Optional)

- Set up webhooks in Razorpay dashboard
- Use `RAZORPAY_WEBHOOK_SECRET` for webhook verification
- Webhook URL: `https://yourdomain.com/api/payments/webhook`
