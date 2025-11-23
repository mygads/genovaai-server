// Payment Gateway Types and Interfaces

export interface PaymentGatewayProvider {
  name: string
  code: string
  isActive: boolean
}

export interface PaymentMethodConfig {
  code: string
  name: string
  type: string
  currency?: string
  gatewayCode?: string
  image?: string | null
  isActive: boolean
}

export interface PaymentRequest {
  userId: string
  transactionType: 'balance' | 'credit'
  transactionId?: string
  amount: number
  credits?: number
  currency: 'IDR' | 'idr'
  paymentMethodCode: string
  customerInfo: {
    id: string
    name: string
    email: string
    phone?: string
  }
  voucherCode?: string
  callbackUrl?: string
  returnUrl?: string
}

export interface PaymentResponse {
  success: boolean
  paymentId: string
  paymentUrl?: string
  externalId?: string
  vaNumber?: string
  qrString?: string
  status: 'pending' | 'paid' | 'failed' | 'expired'
  expiresAt?: Date
  gatewayResponse?: Record<string, unknown>
  error?: string
}

export interface PaymentCallback {
  gatewayProvider: string
  externalId: string
  paymentId: string
  status: 'pending' | 'paid' | 'failed' | 'expired'
  amount: number
  paymentDate?: Date
  rawData: Record<string, unknown>
}

export interface PaymentGateway {
  provider: string
  isActive: boolean
  
  // Core methods
  createPayment(request: PaymentRequest): Promise<PaymentResponse>
  checkPaymentStatus(externalId: string): Promise<PaymentResponse>
  processCallback(data: Record<string, unknown>): Promise<PaymentCallback>
  
  // Configuration
  getAvailablePaymentMethods(): Promise<PaymentMethodConfig[]>
  validateConfiguration(): Promise<boolean>
  validateCallback(callbackData: Record<string, unknown>): Promise<boolean>
}
