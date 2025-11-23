import { PaymentGateway } from './types'
import { DuitkuPaymentGateway } from './duitku-gateway'

export class PaymentGatewayFactory {
  static createGateway(provider: string): PaymentGateway | null {
    switch (provider.toLowerCase()) {
      case 'duitku':
        return new DuitkuPaymentGateway()
      default:
        return null
    }
  }
  
  static getAvailableGateways(): string[] {
    return ['duitku']
  }
}
