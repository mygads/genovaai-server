UPDATE "SystemConfig"
SET
  "key" = 'paid_balance_enabled',
  "label" = 'Paid Balance Availability',
  "description" = 'Enable or disable paid balance mode for all users.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'premium_mode_enabled';
