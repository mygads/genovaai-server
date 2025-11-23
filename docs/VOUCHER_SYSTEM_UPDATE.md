# Voucher System Update - Complete Implementation

## Overview
This document outlines the complete voucher system implementation with two distinct workflows:
1. **Direct Voucher Redemption** - Instant balance/credit addition from balance page
2. **Payment Voucher** - Discount/bonus applied during payment checkout

## Key Changes

### 1. Database Schema
The `Voucher` model already includes:
- `allowMultipleUsePerUser`: Boolean field to control if a user can use the same voucher multiple times
- All necessary fields for voucher functionality are present

### 2. API Endpoints

#### New Endpoint: POST `/api/customer/genovaai/vouchers/redeem`
- **Purpose**: Directly redeem a voucher for instant balance/credit
- **Use Case**: Users can redeem vouchers that provide direct bonuses without making a payment
- **Flow**:
  1. Validates voucher code and type
  2. Checks eligibility (active, not expired, usage limits, user usage)
  3. Immediately adds credits/balance to user account
  4. Creates transaction record
  5. Marks voucher as used in `VoucherUsage` table
  6. Increments voucher `usedCount`

#### Updated: POST `/api/customer/genovaai/vouchers/validate`
- Now returns `voucherId` in response for proper tracking

#### Updated: POST `/api/customer/genovaai/payment/create`
- `paymentMethod` is now optional with default value "QRIS"
- Stores voucher data in `gatewayResponse` including:
  - `voucherId`, `voucherCode`
  - `creditBonus`, `balanceBonus`
  - `discount` amount
- Does NOT mark voucher as used during payment creation (only stores metadata)

#### Updated: POST `/api/payment/callback`
- Enhanced voucher handling in payment completion:
  - Applies credit/balance bonuses from voucher
  - Records voucher usage only when payment is successful
  - Prevents duplicate voucher usage records
  - Increments voucher usage count

### 3. Frontend Changes

#### `/dashboard/balance` Page
**BEFORE**: "Check Voucher" button (only validated)
**AFTER**: "Redeem Voucher" button (instantly applies)

Changes:
- Button renamed from "Check Voucher" to "Redeem Voucher"
- Calls `/api/customer/genovaai/vouchers/redeem` endpoint
- Shows success message with credits/balance received
- Refreshes user balance and transactions immediately
- Updated modal messaging to indicate voucher will be consumed

#### `/dashboard/balance/topup` Page
**BEFORE**: "Apply Voucher" (confusing terminology)
**AFTER**: "Check Voucher" (validate before payment)

Changes:
- Title changed from "Apply Voucher Code" to "Check Voucher Code (Optional)"
- Button text changed from "Apply" to "Check"
- Added clear explanation: "Check if your voucher is valid before proceeding with payment. The voucher will be applied and used when payment is completed."
- Voucher is validated but NOT used until payment completes

### 4. Admin Panel Updates

#### Voucher Creation Form
Added new field:
- **Allow Multiple Use Per User** checkbox
  - When checked: Users can use the voucher multiple times
  - When unchecked (default): Each user can only use once
  - Useful for promotional vouchers vs personal discount codes

#### Voucher List Table
Added column:
- **Multi-Use**: Shows "Yes" or "No" badge indicating if voucher allows multiple uses per user

### 5. Voucher Types & Usage Patterns

The system now supports three distinct voucher patterns:

#### Pattern 1: Single-Use Voucher (1 voucher = 1 use total)
```
maxUses: 1
allowMultipleUsePerUser: false
```
- Total voucher can only be used once globally
- First user to redeem/use it exhausts it

#### Pattern 2: Multi-User Single-Use Voucher (1 voucher = many users, 1x per user)
```
maxUses: 100 (or any number)
allowMultipleUsePerUser: false
```
- Many users can use the voucher
- Each user can only use it once
- Example: "WELCOME100" - 100 users can each get the bonus once

#### Pattern 3: Unlimited Use Voucher (1 voucher = many users, multiple times)
```
maxUses: null or high number
allowMultipleUsePerUser: true
```
- Many users can use the voucher
- Each user can use it multiple times
- Example: Loyalty program vouchers

### 6. Voucher Types

#### Balance Voucher (type: "balance")
- Used for top-up balance transactions
- Can provide:
  - Discount on payment amount
  - Balance bonus (added after payment)
- Example: Top-up Rp 100,000 with 10% discount + Rp 5,000 bonus

#### Credit Voucher (type: "credit")  
- Used for credit purchase transactions
- Can provide:
  - Discount on payment amount
  - Credit bonus (added after payment)
- Example: Buy 100 credits with 20% discount + 10 bonus credits

### 7. Complete User Flows

#### Flow A: Direct Redemption (Balance Page)
1. User goes to `/dashboard/balance`
2. Clicks "Redeem Voucher" button
3. Enters voucher code (e.g., "BONUS50")
4. System validates voucher
5. **Immediately adds** credits/balance to account
6. Creates transaction record
7. Marks voucher as used
8. Shows success message
9. User balance updated in real-time

**Use Case**: Gift vouchers, promotional bonuses, reward vouchers

#### Flow B: Payment with Voucher (Topup Page)
1. User goes to `/dashboard/balance/topup`
2. Selects credit package or enters custom amount
3. Enters voucher code in "Check Voucher" section
4. Clicks "Check" to validate (not consume)
5. System shows discount/bonus details
6. User clicks "Proceed to Payment"
7. Payment is created with voucher metadata
8. User completes payment via payment gateway
9. **On payment success**:
   - Main amount credited
   - Discount applied to payment
   - Bonus credits/balance added
   - Voucher marked as used
   - Transaction recorded

**Use Case**: Discount codes, cashback vouchers, purchase bonuses

### 8. Transaction Types

New transaction type added:
- `voucher_redeem`: For direct voucher redemptions from balance page

Existing types:
- `credit_purchase`: Credits bought via payment
- `balance_topup`: Balance added via payment
- `voucher_bonus`: Bonus from voucher (if tracked separately)

## Testing Scenarios

### Scenario 1: Direct Balance Voucher Redemption
```
1. Admin creates voucher:
   - Code: BONUS10K
   - Type: balance
   - Balance Bonus: 10000
   - Max Uses: 100
   - Allow Multiple Use Per User: false

2. User redeems:
   - Goes to /dashboard/balance
   - Clicks "Redeem Voucher"
   - Enters "BONUS10K"
   - Balance immediately increases by Rp 10,000
   - Transaction created with type "voucher_redeem"

3. User tries again:
   - Error: "You have already used this voucher"
```

### Scenario 2: Credit Voucher in Payment
```
1. Admin creates voucher:
   - Code: CREDIT20
   - Type: credit
   - Discount Type: percentage
   - Value: 20
   - Credit Bonus: 5
   - Max Uses: 50
   - Allow Multiple Use Per User: false

2. User purchases credits:
   - Goes to /dashboard/balance/topup
   - Selects 100 credits package (Rp 100,000)
   - Enters voucher "CREDIT20"
   - Clicks "Check" - shows 20% discount + 5 bonus credits
   - Final payment: Rp 80,000
   - Proceeds to payment
   
3. Payment completed:
   - User receives 100 credits (purchase)
   - User receives 5 credits (bonus)
   - Voucher marked as used
   - Total: 105 credits for Rp 80,000
```

### Scenario 3: Multi-Use Voucher
```
1. Admin creates voucher:
   - Code: LOYAL10
   - Type: credit
   - Credit Bonus: 10
   - Max Uses: null (unlimited)
   - Allow Multiple Use Per User: true

2. User redeems multiple times:
   - First time: +10 credits
   - Second time: +10 credits
   - Third time: +10 credits
   - Works every time until voucher is deactivated
```

## Error Handling

The system handles these error cases:
- Invalid voucher code
- Expired voucher
- Inactive voucher
- Wrong voucher type (balance vs credit)
- Minimum amount not met
- Maximum uses reached
- User already used (when not allowed multiple)
- Voucher not yet started

## API Response Examples

### Successful Redemption
```json
{
  "success": true,
  "data": {
    "message": "Voucher redeemed successfully",
    "voucherName": "Welcome Bonus",
    "creditsAdded": 50,
    "balanceAdded": 0
  }
}
```

### Validation Response
```json
{
  "success": true,
  "data": {
    "voucherId": "clxxx...",
    "code": "SAVE20",
    "name": "20% Discount",
    "type": "credit",
    "discountType": "percentage",
    "value": 20,
    "discountAmount": 20000,
    "creditBonus": 10,
    "balanceBonus": 0,
    "finalAmount": 80000
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "You have already used this voucher"
}
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Validation**: Strict validation of voucher rules before redemption/application
3. **Race Conditions**: Transaction-based voucher usage prevents duplicate redemptions
4. **Usage Tracking**: Complete audit trail in `VoucherUsage` and `CreditTransaction` tables
5. **Type Checking**: Voucher type must match transaction type

## Admin Capabilities

Admins can now:
1. Create vouchers with flexible usage patterns
2. Control per-user usage limits
3. Set global usage limits
4. Define voucher validity periods
5. Provide both discounts and bonuses
6. Track usage in real-time
7. View which users have used vouchers
8. Deactivate vouchers anytime

## Summary

The voucher system now provides:
- ✅ Two distinct redemption flows (direct vs payment)
- ✅ Flexible usage patterns (single-use, multi-user, multi-use)
- ✅ Complete validation and error handling
- ✅ Proper transaction tracking
- ✅ Clear user experience
- ✅ Admin control panel
- ✅ Prevention of duplicate usage
- ✅ Support for both discounts and bonuses
- ✅ Balance and credit voucher types

## Fixed Issues

1. ✅ Payment creation failure - fixed by making paymentMethod optional with default
2. ✅ Voucher used at wrong time - now only marked used on payment success
3. ✅ Confusing UI labels - clarified "Redeem" vs "Check" 
4. ✅ Missing multi-use control - added allowMultipleUsePerUser field
5. ✅ Unclear redemption flow - separated direct redemption from payment vouchers
