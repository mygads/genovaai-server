# Voucher UI Flow Comparison

## Balance Page vs Topup Page - Key Differences

### `/dashboard/balance` - Redeem Voucher (Direct)

**Button**: "Redeem Voucher" (Green)

**Purpose**: Instantly claim voucher bonuses without payment

**Modal Title**: "Redeem Voucher"

**Action**: When user submits
- ✅ Voucher is immediately consumed
- ✅ Credits/balance added to account right away
- ✅ Transaction created
- ✅ Cannot be undone

**Info Message**:
> 🎁 **Note:** Redeeming a voucher will immediately add the bonus balance or credits to your account. This voucher can only be used once.

**API Called**: `POST /api/customer/genovaai/vouchers/redeem`

**Success Message**:
```
✅ Voucher redeemed successfully!

"Welcome Bonus 50 Credits"

🎉 You received: 50 credits
```

**Best For**:
- Gift vouchers
- Welcome bonuses  
- Promotional rewards
- Loyalty points conversion
- Vouchers that provide direct credits/balance

**Example Vouchers**:
- `WELCOME50` - Get 50 free credits
- `BONUS10K` - Get Rp 10,000 balance
- `NEWUSER100` - New user bonus

---

### `/dashboard/balance/topup` - Check Voucher (Preview)

**Section Title**: "Check Voucher Code (Optional)"

**Button**: "Check" (Purple)

**Purpose**: Validate voucher before payment, apply on checkout

**Action**: When user submits
- ❌ Voucher is NOT consumed
- ✅ Shows discount/bonus preview
- ✅ Stores voucher for payment
- ✅ Can be changed before payment

**Info Message**:
> 💡 **Tip:** Check if your voucher is valid before proceeding with payment. The voucher will be applied and used when payment is completed.

**API Called**: 
1. `POST /api/customer/genovaai/vouchers/validate` (on check)
2. `POST /api/customer/genovaai/payment/create` (on checkout)
3. Voucher consumed in `POST /api/payment/callback` (on payment success)

**Success Message After Check**:
```
✓ Voucher valid: "20% OFF Credit Purchase"

Discount: Rp 20,000
Bonus: +10 credits
```

**Payment Flow**:
1. User checks voucher → Shows preview
2. User clicks "Proceed to Payment" → Payment created with voucher data
3. User completes payment → Voucher applied and consumed
4. Credits + bonus added to account

**Best For**:
- Discount codes
- Cashback vouchers
- Purchase bonuses
- Payment promotions
- Vouchers that modify payment amount

**Example Vouchers**:
- `SAVE20` - 20% discount on purchase
- `EXTRA10` - Buy credits get 10 bonus
- `FLASH50` - Rp 50,000 discount on top-up

---

## Visual Comparison

### Balance Page (Redeem)
```
┌─────────────────────────────────────┐
│  Balance & Credits                  │
│                                     │
│  [Redeem Voucher] [Exchange] [Top Up]  │
└─────────────────────────────────────┘

Click "Redeem Voucher"
        ↓
┌─────────────────────────────────────┐
│  Redeem Voucher               [×]   │
│─────────────────────────────────────│
│  Type: ○ Balance ⦿ Credit          │
│  Code: [WELCOME50________]          │
│                                     │
│  🎁 Note: Redeeming immediately     │
│     adds to your account           │
│                                     │
│  [Cancel]  [Redeem Voucher]        │
└─────────────────────────────────────┘

        ↓ (Click Redeem)
        
✅ Success! +50 credits added
Balance refreshes automatically
```

### Topup Page (Check)
```
┌─────────────────────────────────────┐
│  Buy Credits                        │
│                                     │
│  [Select Package: 100 credits]     │
│                                     │
│  Check Voucher Code (Optional)      │
│  ┌─────────────────────────────────┐│
│  │ [SAVE20________] [Check]       ││
│  │                                ││
│  │ 💡 Tip: Check before payment   ││
│  │    Voucher used when payment   ││
│  │    is completed                ││
│  └─────────────────────────────────┘│
│                                     │
│  [Proceed to Payment]              │
└─────────────────────────────────────┘

        ↓ (Click Check)
        
✓ Voucher valid: "20% Discount"
Discount: Rp 20,000
Voucher NOT used yet

        ↓ (Click Proceed)
        
Payment page with discount applied
        
        ↓ (Complete payment)
        
✅ Payment successful!
Received: 100 credits + 10 bonus
Voucher now marked as used
```

---

## Technical Flow Comparison

### Flow A: Direct Redemption (Balance Page)
```
User Action              API Call                 Database Change
───────────────────────────────────────────────────────────────
Enter code              
Click "Redeem"    →     POST /vouchers/redeem  → User.credits += 50
                                                 VoucherUsage created
                                                 Voucher.usedCount++
                                                 CreditTransaction created
Show success      ←     200 OK
Refresh balance   →     GET /profile          ← User data
```

**Timeline**: < 1 second (instant)

### Flow B: Payment with Voucher (Topup Page)
```
User Action              API Call                 Database Change
───────────────────────────────────────────────────────────────
Enter code
Click "Check"     →     POST /vouchers/validate  (No DB change)
Show preview      ←     200 OK

Click "Proceed"   →     POST /payment/create  → Payment created (pending)
                                                 Voucher data stored in
                                                 payment.gatewayResponse
Redirect to       ←     200 OK
payment page

Complete payment
(external gateway)

Webhook received  →     POST /payment/callback → Payment.status = completed
                                                 User.credits += 110
                                                 VoucherUsage created
                                                 Voucher.usedCount++
                                                 CreditTransaction created
```

**Timeline**: Minutes to hours (depends on user payment completion)

---

## When to Use Each Flow

### Use Direct Redemption (Balance Page) When:
- ✅ Voucher provides FREE credits/balance
- ✅ No payment required
- ✅ Instant gratification desired
- ✅ Gift cards or promotional bonuses
- ✅ User reward programs
- ✅ Referral bonuses

### Use Payment Voucher (Topup Page) When:
- ✅ Voucher provides DISCOUNT on purchase
- ✅ Voucher adds BONUS to purchase
- ✅ User needs to pay money
- ✅ Conditional benefits (min. purchase)
- ✅ Cashback scenarios
- ✅ Purchase incentives

---

## Admin Guidelines

### Creating Direct Redemption Vouchers
```typescript
{
  type: "credit",      // or "balance"
  discountType: "fixed",
  value: 0,            // No discount (not a payment voucher)
  creditBonus: 50,     // OR balanceBonus: 10000
  minAmount: 0,        // No minimum
  // User can redeem directly from balance page
}
```

### Creating Payment Vouchers
```typescript
{
  type: "credit",      // or "balance"
  discountType: "percentage",  // or "fixed"
  value: 20,           // 20% discount
  creditBonus: 10,     // PLUS 10 bonus credits
  minAmount: 50000,    // Min. Rp 50,000 purchase
  // User must make payment to use
}
```

---

## User Communication

### Email/Notification for Direct Voucher
```
Subject: You've received a voucher!

Your voucher code: WELCOME50

This voucher gives you 50 FREE credits!

How to redeem:
1. Go to Balance & Credits page
2. Click "Redeem Voucher"
3. Enter code: WELCOME50
4. Credits added instantly!

Redeem now: [Link to /dashboard/balance]
```

### Email/Notification for Payment Voucher
```
Subject: Special discount code for you!

Your voucher code: SAVE20

Get 20% OFF your next credit purchase!
Plus receive 10 bonus credits!

How to use:
1. Go to Top Up page
2. Select your credit package
3. Enter code: SAVE20 in voucher section
4. Complete payment
5. Discount and bonus applied!

Shop now: [Link to /dashboard/balance/topup]
```

---

## Summary

| Aspect | Balance Page (Redeem) | Topup Page (Check) |
|--------|----------------------|-------------------|
| **Action** | Immediate consumption | Preview only |
| **Payment** | Not required | Required |
| **Speed** | Instant | Depends on payment |
| **Use Case** | Free bonuses | Discounts & bonuses |
| **Undo** | Cannot undo | Can change before payment |
| **Best For** | Gifts, rewards | Purchases, promotions |
| **User Sees** | Credits/balance added | Discount preview |
| **Voucher Used** | Immediately | On payment success |
