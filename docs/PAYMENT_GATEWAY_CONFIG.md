# Payment Gateway Configuration - GenovaAI

## Overview
GenovaAI menggunakan Duitku sebagai payment gateway untuk memproses pembayaran credit dan balance top-up.

## Environment Variables

Tambahkan ke file `.env`:

```env
# Duitku Configuration
DUITKU_BASE_URL="https://sandbox.duitku.com/webapi/api/merchant"
DUITKU_API_KEY="your-duitku-api-key"
DUITKU_MERCHANT_CODE="your-merchant-code"
DUITKU_CALLBACK_URL="https://your-domain.com/api/payment/callback"
```

### Sandbox vs Production

**Sandbox (Testing):**
```env
DUITKU_BASE_URL="https://sandbox.duitku.com/webapi/api/merchant"
```

**Production:**
```env
DUITKU_BASE_URL="https://passport.duitku.com/webapi/api/merchant"
```

## Supported Payment Methods

### Virtual Account (VA)
- **BC**: BCA Virtual Account
- **M2**: Mandiri Virtual Account  
- **I1**: BNI Virtual Account
- **B1**: CIMB Niaga Virtual Account
- **BT**: Permata Bank Virtual Account
- **BV**: BSI Virtual Account
- **A1**: ATM Bersama
- **VA**: Maybank Virtual Account

### E-Wallet
- **OV**: OVO
- **SA**: Shopee Pay Apps
- **DA**: DANA
- **LF**: LinkAja

### QRIS
- **SP**: Shopee Pay QRIS
- **NQ**: Nobu QRIS

### Retail
- **IR**: Indomaret
- **FT**: Alfamart Group

### Credit Card
- **VC**: Visa/Mastercard/JCB

### Paylater
- **DN**: Indodana Paylater
- **AT**: ATOME

## Payment Limits

| Payment Method | Min Amount | Max Amount | Notes |
|---------------|------------|------------|-------|
| Virtual Account | Rp 10,000 | Rp 50,000,000 | Best for large transactions |
| Credit Card | Rp 10,000 | Rp 500,000,000 | Highest limit |
| E-Wallet | Rp 1 | Rp 2,000,000 | Quick transactions |
| QRIS | Rp 1 | Rp 10,000,000 | Scan & pay |
| Retail | Rp 10,000 | Rp 2,500,000 - Rp 5,000,000 | Cash payments |

## API Endpoints

### Create Payment
```
POST /api/customer/genovaai/payment/create
```

**Request Body:**
```json
{
  "type": "balance",
  "amount": 50000,
  "paymentMethod": "duitku_BC",
  "voucherCode": "WELCOME2024"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "clxxx...",
    "paymentUrl": "https://...",
    "vaNumber": "88077...",
    "reference": "GENO-...",
    "amount": 54000,
    "originalAmount": 50000,
    "paymentFee": 4000,
    "expiresAt": "2024-..."
  }
}
```

### Check Payment Status
```
GET /api/customer/genovaai/payment/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "status": "pending",
    "amount": 54000,
    "method": "duitku_BC",
    "createdAt": "2024-...",
    "expiresAt": "2024-..."
  }
}
```

### Payment Callback (from Duitku)
```
POST /api/payment/callback
```

Duitku akan mengirim callback ke endpoint ini saat status payment berubah.

## Signature Verification

Duitku menggunakan MD5 signature untuk security:

### Create Transaction
```
MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
```

### Payment Callback
```
MD5(merchantCode + amount + merchantOrderId + apiKey)
```

### Check Status
```
MD5(merchantCode + merchantOrderId + apiKey)
```

## Testing

### Sandbox Test Cards
Untuk testing di sandbox environment:

**Credit Card:**
- Card Number: `4111111111111111`
- CVV: `123`
- Expiry: Any future date

**Virtual Account:**
- Akan generate nomor VA otomatis
- Untuk testing, payment akan auto-complete setelah beberapa menit

## Production Checklist

- [ ] Ganti `DUITKU_BASE_URL` ke production URL
- [ ] Update `DUITKU_API_KEY` dengan production key
- [ ] Update `DUITKU_MERCHANT_CODE` dengan production merchant code
- [ ] Set `DUITKU_CALLBACK_URL` ke production domain
- [ ] Test all payment methods
- [ ] Verify callback URL accessibility
- [ ] Configure SSL/HTTPS
- [ ] Monitor payment logs

## Troubleshooting

### Payment Creation Failed
1. Check API credentials
2. Verify amount is within limits
3. Check payment method is active
4. Review Duitku logs

### Callback Not Received
1. Verify callback URL is publicly accessible
2. Check firewall settings
3. Verify signature calculation
4. Check Duitku dashboard logs

### Invalid Signature
1. Verify API key matches
2. Check signature generation formula
3. Ensure no extra spaces in credentials
4. Verify merchantCode is correct

## Support

For Duitku support:
- Email: support@duitku.com
- Phone: +62 21 8063 5266
- Website: https://duitku.com
