import { PaymentGateway, PaymentRequest, PaymentResponse, PaymentCallback, PaymentMethodConfig } from './types'
import crypto from 'crypto'

export class DuitkuPaymentGateway implements PaymentGateway {
  provider = 'duitku'
  isActive = true

  private merchantCode: string
  private apiKey: string
  private baseUrl: string
  private isProduction: boolean

  constructor() {
    this.merchantCode = process.env.DUITKU_MERCHANT_CODE || ''
    this.apiKey = process.env.DUITKU_API_KEY || ''
    this.baseUrl = process.env.DUITKU_BASE_URL || 'https://sandbox.duitku.com/webapi/api/merchant'
    this.isProduction = !this.baseUrl.includes('sandbox')
    
    console.log('[DUITKU] Gateway initialized:', {
      merchantCode: this.merchantCode ? 'SET' : 'MISSING',
      apiKey: this.apiKey ? 'SET' : 'MISSING',
      baseUrl: this.baseUrl,
      isProduction: this.isProduction
    });
  }

  /**
   * Generate MD5 signature for transaction request
   * Formula: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
   */
  private generateTransactionSignature(merchantOrderId: string, paymentAmount: number): string {
    const data = `${this.merchantCode}${merchantOrderId}${paymentAmount}${this.apiKey}`
    return crypto.createHash('md5').update(data).digest('hex')
  }

  /**
   * Generate MD5 signature for callback validation
   * Formula: MD5(merchantcode + amount + merchantOrderId + apiKey)
   */
  private generateCallbackSignature(amount: string, merchantOrderId: string): string {
    const data = `${this.merchantCode}${amount}${merchantOrderId}${this.apiKey}`
    return crypto.createHash('md5').update(data).digest('hex')
  }

  /**
   * Get appropriate expiry period in minutes based on payment method
   */
  private getExpiryPeriod(paymentMethod: string): number {
    const expiryMapping: { [key: string]: number } = {
      'VC': 30,      // Credit Card
      'BC': 1440,    // BCA VA
      'M2': 1440,    // Mandiri VA
      'VA': 1440,    // Maybank VA
      'I1': 1440,    // BNI VA
      'B1': 1440,    // CIMB Niaga VA
      'BT': 1440,    // Permata Bank VA
      'BV': 1440,    // BSI VA
      'A1': 1440,    // ATM Bersama
      'FT': 1440,    // Retail Alfamart
      'IR': 1440,    // Retail Indomaret
      'OV': 1440,    // OVO
      'SA': 60,      // Shopee Pay Apps
      'DA': 1440,    // DANA
      'SP': 60,      // Shopee Pay QRIS
      'NQ': 1440,    // Nobu QRIS
      'GQ': 1440,    // Gudang Voucher QRIS
      'SQ': 1440,    // Nusapay QRIS
    }
    
    return expiryMapping[paymentMethod] || 1440
  }

  /**
   * Calculate expiry time based on payment method
   */
  private calculateExpiryTime(paymentMethod: string): Date {
    const expiryMinutes = this.getExpiryPeriod(paymentMethod)
    return new Date(Date.now() + expiryMinutes * 60 * 1000)
  }

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.isActive || !this.merchantCode || !this.apiKey) {
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        error: 'Duitku gateway is not configured'
      }
    }

    try {
      // Extract Duitku payment method code (remove 'duitku_' prefix if exists)
      const duitkuPaymentMethod = request.paymentMethodCode.replace(/^duitku_/, '')
      
      // Generate unique merchant order ID
      const timestamp = Date.now()
      const merchantOrderId = `GENO-${request.transactionType.toUpperCase()}-${timestamp}`
      const paymentAmount = Math.round(request.amount)
      const productDetails = `GenovaAI ${request.transactionType === 'credit' ? 'Credits' : 'Balance'} Top-up`
      
      // Generate signature
      const signature = this.generateTransactionSignature(merchantOrderId, paymentAmount)

      // Split customer name
      const nameParts = request.customerInfo.name.trim().split(' ')
      const firstName = nameParts[0] || 'Customer'
      const lastName = nameParts.slice(1).join(' ') || 'GenovaAI'

      // Get expiry period
      const expiryPeriod = this.getExpiryPeriod(duitkuPaymentMethod)

      // Prepare request data
      const requestData: any = {
        merchantCode: this.merchantCode,
        paymentAmount: paymentAmount,
        paymentMethod: duitkuPaymentMethod,
        merchantOrderId: merchantOrderId,
        productDetails: productDetails,
        customerVaName: request.customerInfo.name.substring(0, 20),
        email: request.customerInfo.email,
        phoneNumber: request.customerInfo.phone || '',
        callbackUrl: request.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`,
        returnUrl: request.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payment/success`,
        signature: signature,
        expiryPeriod: expiryPeriod,
        customerDetail: {
          firstName: firstName,
          lastName: lastName,
          email: request.customerInfo.email,
          phoneNumber: request.customerInfo.phone || '',
          billingAddress: {
            firstName: firstName,
            lastName: lastName,
            address: "Default Address",
            city: "Jakarta",
            postalCode: "12345",
            phone: request.customerInfo.phone || '',
            countryCode: "ID"
          },
          shippingAddress: {
            firstName: firstName,
            lastName: lastName,
            address: "Default Address",
            city: "Jakarta",
            postalCode: "12345",
            phone: request.customerInfo.phone || '',
            countryCode: "ID"
          }
        },
        itemDetails: [
          {
            name: productDetails,
            price: paymentAmount,
            quantity: 1
          }
        ]
      }

      console.log('[DUITKU] Creating payment:', {
        merchantOrderId,
        paymentAmount,
        paymentMethod: duitkuPaymentMethod,
        email: request.customerInfo.email,
        signature: signature.substring(0, 10) + '...',
        expiryPeriod
      });

      // Call Duitku API
      const endpoint = `${this.baseUrl}/v2/inquiry`
      
      console.log('[DUITKU] Request data:', {
        endpoint,
        merchantCode: this.merchantCode,
        paymentAmount,
        paymentMethod: duitkuPaymentMethod,
        merchantOrderId,
        email: request.customerInfo.email
      });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      const responseData = await response.json()
      
      console.log('[DUITKU] Full Response:', {
        status: response.status,
        ok: response.ok,
        data: responseData
      });

      // Duitku success response structure varies by payment method
      // Check for both statusCode === '00' or response.ok with reference
      const isSuccess = (
        (responseData.statusCode === '00') || 
        (response.ok && responseData.reference)
      );

      if (isSuccess) {
        const expiresAt = this.calculateExpiryTime(duitkuPaymentMethod)
        
        return {
          success: true,
          paymentId: merchantOrderId,
          status: 'pending',
          externalId: responseData.reference,
          paymentUrl: responseData.paymentUrl,
          vaNumber: responseData.vaNumber,
          qrString: responseData.qrString,
          expiresAt: expiresAt,
          gatewayResponse: {
            merchantCode: responseData.merchantCode,
            reference: responseData.reference,
            paymentUrl: responseData.paymentUrl,
            vaNumber: responseData.vaNumber,
            qrString: responseData.qrString,
            amount: responseData.amount,
            statusCode: responseData.statusCode,
            statusMessage: responseData.statusMessage
          }
        }
      } else {
        // Log full error response for debugging
        console.error('[DUITKU] Payment creation failed - Full response:', {
          status: response.status,
          statusText: response.statusText,
          responseData: responseData
        });
        
        const errorMessage = 
          responseData.statusMessage || 
          responseData.responseMessage || 
          responseData.message ||
          responseData.Message ||
          (response.status >= 400 ? `HTTP ${response.status}: ${response.statusText}` : null) ||
          'Payment creation failed'
        
        return {
          success: false,
          paymentId: merchantOrderId,
          status: 'failed',
          error: `Duitku Error: ${errorMessage}`,
          gatewayResponse: responseData
        }
      }

    } catch (error) {
      console.error('[DUITKU] Payment error:', error)
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Payment creation failed'
      }
    }
  }

  async validateCallback(callbackData: any): Promise<boolean> {
    try {
      const { merchantCode, amount, merchantOrderId, signature } = callbackData
      
      if (!merchantCode || !amount || !merchantOrderId || !signature) {
        console.error('[DUITKU] Missing callback data for signature validation')
        return false
      }

      const expectedSignature = this.generateCallbackSignature(amount.toString(), merchantOrderId)
      
      console.log('[DUITKU] Signature validation:', {
        expected: expectedSignature,
        received: signature,
        valid: expectedSignature === signature
      })

      return expectedSignature === signature
    } catch (error) {
      console.error('[DUITKU] Callback validation error:', error)
      return false
    }
  }

  async checkPaymentStatus(externalId: string): Promise<PaymentResponse> {
    try {
      const signature = crypto.createHash('md5')
        .update(`${this.merchantCode}${externalId}${this.apiKey}`)
        .digest('hex')

      const requestData = {
        merchantCode: this.merchantCode,
        merchantOrderId: externalId,
        signature: signature
      }

      const endpoint = `${this.baseUrl}/transactionStatus`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      const responseData = await response.json()

      if (response.ok) {
        const status = this.mapDuitkuStatus(responseData.statusCode)
        
        return {
          success: true,
          paymentId: responseData.merchantOrderId,
          status: status as 'pending' | 'paid' | 'failed' | 'expired',
          externalId: responseData.reference,
          gatewayResponse: responseData
        }
      } else {
        return {
          success: false,
          paymentId: '',
          status: 'failed',
          error: responseData.statusMessage || 'Status check failed'
        }
      }

    } catch (error) {
      console.error('[DUITKU] Status check error:', error)
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Status check failed'
      }
    }
  }

  async processCallback(data: any): Promise<PaymentCallback> {
    try {
      const { merchantCode, amount, merchantOrderId, signature, resultCode } = data
      
      // Validate signature
      const expectedSignature = this.generateCallbackSignature(amount.toString(), merchantOrderId)

      if (signature !== expectedSignature) {
        console.error('[DUITKU] Invalid callback signature')
        throw new Error('Invalid signature')
      }

      const status = this.mapDuitkuStatus(resultCode)

      return {
        gatewayProvider: 'duitku',
        externalId: data.reference,
        paymentId: merchantOrderId,
        status: status as 'pending' | 'paid' | 'failed' | 'expired',
        amount: parseFloat(amount),
        paymentDate: new Date(),
        rawData: data
      }

    } catch (error) {
      console.error('[DUITKU] Callback error:', error)
      throw error
    }
  }

  async getAvailablePaymentMethods(): Promise<PaymentMethodConfig[]> {
    // Return default methods
    const defaultMethods = this.getDefaultPaymentMethods()
    
    return Object.entries(defaultMethods).map(([code, method]) => ({
      code: `duitku_${code}`,
      name: method.name,
      type: method.type,
      gatewayCode: code,
      image: method.image,
      isActive: true
    }))
  }

  async validateConfiguration(): Promise<boolean> {
    return !!(this.merchantCode && this.apiKey && this.baseUrl)
  }

  private mapDuitkuStatus(statusCode: string): string {
    const statusMapping: { [key: string]: string } = {
      '00': 'paid',
      '01': 'pending',
      '02': 'failed'
    }
    
    return statusMapping[statusCode] || 'failed'
  }

  private getDefaultPaymentMethods() {
    return {
      'BC': { name: 'BCA Virtual Account', type: 'virtual_account', image: 'https://images.duitku.com/hotlink-ok/BCA.SVG' },
      'M2': { name: 'Mandiri Virtual Account', type: 'virtual_account', image: 'https://images.duitku.com/hotlink-ok/MV.PNG' },
      'I1': { name: 'BNI Virtual Account', type: 'virtual_account', image: 'https://images.duitku.com/hotlink-ok/I1.PNG' },
      'BT': { name: 'Permata Virtual Account', type: 'virtual_account', image: 'https://images.duitku.com/hotlink-ok/PERMATA.PNG' },
      'BV': { name: 'BSI Virtual Account', type: 'virtual_account', image: 'https://images.duitku.com/hotlink-ok/BSI.PNG' },
      'QRIS': { name: 'QRIS (All E-Wallet)', type: 'qris', image: 'https://images.duitku.com/hotlink-ok/NQ.PNG' },
      'SA': { name: 'ShopeePay', type: 'e_wallet', image: 'https://images.duitku.com/hotlink-ok/SHOPEEPAY.PNG' },
      'OV': { name: 'OVO', type: 'e_wallet', image: 'https://images.duitku.com/hotlink-ok/OV.PNG' },
      'DA': { name: 'DANA', type: 'e_wallet', image: 'https://images.duitku.com/hotlink-ok/DA.PNG' },
      'IR': { name: 'Indomaret', type: 'retail', image: 'https://images.duitku.com/hotlink-ok/IR.PNG' },
      'FT': { name: 'Alfamart', type: 'retail', image: 'https://images.duitku.com/hotlink-ok/FT.PNG' }
    }
  }
}
