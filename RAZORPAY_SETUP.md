# Razorpay Integration Setup Guide

## Overview
Your investment request page has been integrated with Razorpay payment gateway. This guide will help you complete the setup.

## What's Been Done
1. ✅ Installed Razorpay package
2. ✅ Added server-side routes for Razorpay integration
3. ✅ Updated client-side payment handling
4. ✅ Added environment variables template

## Steps to Complete Setup

### 1. Get Razorpay Credentials
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up or log in with your account
3. Navigate to Settings > API Keys
4. Copy your Key ID and Key Secret

### 2. Update Environment Variables
Replace the placeholder values in your `.env` file:

```env
# Replace with your actual Razorpay credentials
RAZORPAY_KEY_ID="your_actual_key_id"
RAZORPAY_KEY_SECRET="your_actual_key_secret"
```

### 3. Test Mode vs Live Mode
- **Test Mode**: Use test credentials (key starts with `rzp_test_`)
- **Live Mode**: Use live credentials (key starts with `rzp_live_`)

### 4. Webhook Setup (Optional but Recommended)
1. In Razorpay Dashboard, go to Settings > Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payment/razorpay/webhook`
3. Select events: `payment.captured`, `payment.failed`

## How It Works

### Payment Flow
1. User enters investment amount and details
2. Clicks "Pay with Razorpay" button
3. Razorpay checkout opens with payment options:
   - UPI
   - Net Banking
   - Credit/Debit Cards
   - Wallets
4. After successful payment, investment request is created automatically

### Security Features
- Payment signature verification
- Server-side order creation
- Secure API endpoints with authentication

## Testing

### Test Cards (Razorpay Test Mode)
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Test UPI IDs
- **Success**: success@razorpay
- **Failure**: failure@razorpay

## Features Included

### Payment Methods
- Credit/Debit Cards (Visa, Mastercard, Rupay)
- UPI (Google Pay, PhonePe, Paytm, etc.)
- Net Banking (All major banks)
- Wallets (Paytm, Mobikwik, etc.)

### Security
- PCI DSS compliant
- 256-bit SSL encryption
- Two-factor authentication
- Fraud detection

## Customization Options

### Theme Customization
You can customize the Razorpay checkout appearance by modifying the `theme` object in `InvestmentRequestPage.tsx`:

```javascript
theme: {
  color: '#3399cc', // Your brand color
  backdrop_color: '#000000'
}
```

### Prefill Customer Data
Update the `prefill` object to auto-fill customer information:

```javascript
prefill: {
  name: userSession.userName,
  email: userSession.email,
  contact: userSession.mobile
}
```

## Troubleshooting

### Common Issues
1. **Payment fails immediately**: Check if Key ID and Key Secret are correct
2. **Signature verification fails**: Ensure Key Secret matches in both order creation and verification
3. **CORS errors**: Make sure your domain is added to Razorpay dashboard

### Debug Mode
Enable debug mode by adding to Razorpay options:
```javascript
config: {
  display: {
    blocks: {
      banks: {
        name: 'Pay using Netbanking',
        instruments: [
          // Specify banks you want to show
        ]
      }
    }
  }
}
```

## Support
- Razorpay Documentation: https://razorpay.com/docs/
- Integration Guide: https://razorpay.com/docs/payments/payment-gateway/web-integration/
- Support: https://razorpay.com/support/

## Next Steps
1. Replace test credentials with your actual Razorpay credentials
2. Test the payment flow thoroughly
3. Set up webhooks for better reliability
4. Configure settlement and payout settings in Razorpay dashboard