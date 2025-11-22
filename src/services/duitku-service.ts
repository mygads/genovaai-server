import crypto from 'crypto';
import axios from 'axios';

const DUITKU_MERCHANT_CODE = process.env.DUITKU_MERCHANT_CODE || '';
const DUITKU_API_KEY = process.env.DUITKU_API_KEY || '';
const DUITKU_BASE_URL = process.env.DUITKU_BASE_URL || 'https://sandbox.duitku.com/webapi/api/merchant';
const CALLBACK_URL = process.env.DUITKU_CALLBACK_URL || 'http://localhost:8090/api/payment/callback';
const RETURN_URL = process.env.DUITKU_RETURN_URL || 'http://localhost:3000/payment/success';

export interface DuitkuPaymentRequest {
  merchantOrderId: string;
  paymentAmount: number;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productDetails: string;
  expiryPeriod?: number; // in minutes, default 60
}

export interface DuitkuPaymentResponse {
  merchantCode: string;
  reference: string;
  paymentUrl: string;
  vaNumber?: string;
  amount: number;
  statusCode: string;
  statusMessage: string;
}

export class DuitkuService {
  /**
   * Generate signature for Duitku API
   */
  private static generateSignature(
    merchantCode: string,
    merchantOrderId: string,
    paymentAmount: number,
    apiKey: string
  ): string {
    const signatureString = `${merchantCode}${merchantOrderId}${paymentAmount}${apiKey}`;
    return crypto.createHash('md5').update(signatureString).digest('hex');
  }

  /**
   * Verify callback signature
   */
  static verifyCallback(
    merchantCode: string,
    amount: string,
    merchantOrderId: string,
    signature: string
  ): boolean {
    const calculatedSignature = crypto
      .createHash('md5')
      .update(`${merchantCode}${amount}${merchantOrderId}${DUITKU_API_KEY}`)
      .digest('hex');
    
    return signature === calculatedSignature;
  }

  /**
   * Get available payment methods
   */
  static async getPaymentMethods(amount: number): Promise<any[]> {
    try {
      const datetime = Math.floor(Date.now() / 1000);
      const signature = crypto
        .createHash('md5')
        .update(`${DUITKU_MERCHANT_CODE}${amount}${datetime}${DUITKU_API_KEY}`)
        .digest('hex');

      const response = await axios.post(
        `${DUITKU_BASE_URL}/paymentmethod/getpaymentmethod`,
        {
          merchantcode: DUITKU_MERCHANT_CODE,
          amount,
          datetime,
          signature,
        }
      );

      if (response.data.statusCode === '00') {
        return response.data.paymentFee;
      }

      return [];
    } catch (error) {
      console.error('Failed to get payment methods:', error);
      return [];
    }
  }

  /**
   * Create payment transaction
   */
  static async createTransaction(
    params: DuitkuPaymentRequest
  ): Promise<DuitkuPaymentResponse | null> {
    try {
      const signature = this.generateSignature(
        DUITKU_MERCHANT_CODE,
        params.merchantOrderId,
        params.paymentAmount,
        DUITKU_API_KEY
      );

      const requestBody = {
        merchantCode: DUITKU_MERCHANT_CODE,
        paymentAmount: params.paymentAmount,
        paymentMethod: params.paymentMethod,
        merchantOrderId: params.merchantOrderId,
        productDetails: params.productDetails,
        merchantUserInfo: params.customerName,
        customerVaName: params.customerName,
        email: params.customerEmail,
        phoneNumber: params.customerPhone,
        callbackUrl: CALLBACK_URL,
        returnUrl: RETURN_URL,
        signature,
        expiryPeriod: params.expiryPeriod || 60,
      };

      const response = await axios.post(
        `${DUITKU_BASE_URL}/v2/inquiry`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.statusCode === '00') {
        return {
          merchantCode: response.data.merchantCode,
          reference: response.data.reference,
          paymentUrl: response.data.paymentUrl,
          vaNumber: response.data.vaNumber,
          amount: response.data.amount,
          statusCode: response.data.statusCode,
          statusMessage: response.data.statusMessage,
        };
      }

      console.error('Duitku transaction failed:', response.data);
      return null;
    } catch (error) {
      console.error('Failed to create Duitku transaction:', error);
      return null;
    }
  }

  /**
   * Check transaction status
   */
  static async checkTransactionStatus(
    merchantOrderId: string
  ): Promise<{ status: string; amount?: number }> {
    try {
      const signature = crypto
        .createHash('md5')
        .update(`${DUITKU_MERCHANT_CODE}${merchantOrderId}${DUITKU_API_KEY}`)
        .digest('hex');

      const response = await axios.post(
        `${DUITKU_BASE_URL}/transactionStatus`,
        {
          merchantCode: DUITKU_MERCHANT_CODE,
          merchantOrderId,
          signature,
        }
      );

      return {
        status: response.data.statusCode,
        amount: response.data.amount,
      };
    } catch (error) {
      console.error('Failed to check transaction status:', error);
      return { status: 'error' };
    }
  }
}
