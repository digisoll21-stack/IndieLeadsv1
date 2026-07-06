import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getWorkspacePlan(workspaceId: string) {
    const workspace = await (this.prisma as any).workspace.findUnique({
      where: { id: workspaceId },
      select: { plan: true }
    });
    return workspace?.plan || 'launch';
  }

  async createCheckoutSession(workspaceId: string, plan: string) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!stripeSecretKey) {
      // Fallback url for dev environment (auto-upgrade for mock)
      await (this.prisma as any).workspace.update({
        where: { id: workspaceId },
        data: {
          plan,
          subscriptionStatus: 'active',
        },
      });
      return { url: `${frontendUrl}/#/settings?billing_status=success` };
    }

    try {
      const planPriceMap = {
        launch: 4900, // $49.00
        grow: 9900,   // $99.00
        pro: 19900,   // $199.00
      };

      const amount = planPriceMap[plan] || 4900;

      const response = await axios.post(
        'https://api.stripe.com/v1/checkout/sessions',
        new URLSearchParams({
          success_url: `${frontendUrl}/#/settings?billing_status=success`,
          cancel_url: `${frontendUrl}/#/settings?billing_status=cancelled`,
          mode: 'subscription',
          client_reference_id: workspaceId,
          'line_items[0][price_data][currency]': 'usd',
          'line_items[0][price_data][product_data][name]': `IndieLeads ${plan.toUpperCase()} Plan`,
          'line_items[0][price_data][recurring][interval]': 'month',
          'line_items[0][price_data][unit_amount]': amount.toString(),
          'line_items[0][quantity]': '1',
        }).toString(),
        {
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return { url: response.data.url };
    } catch (err) {
      this.logger.error(`Stripe Session Creation Failed: ${err.response?.data?.error?.message || err.message}`);
      throw new Error('Failed to initiate payment checkout.');
    }
  }

  async handleWebhook(sig: string, rawBody: string) {
    try {
      const event = JSON.parse(rawBody);
      this.logger.log(`Received Stripe Webhook Event: ${event.type}`);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const workspaceId = session.client_reference_id;
        
        const productName = session.line_items?.data?.[0]?.price?.product?.name || '';
        let plan = 'launch';
        if (productName.toLowerCase().includes('grow')) plan = 'grow';
        if (productName.toLowerCase().includes('pro')) plan = 'pro';

        if (workspaceId) {
          await (this.prisma as any).workspace.update({
            where: { id: workspaceId },
            data: {
              plan,
              subscriptionStatus: 'active',
            },
          });
          this.logger.log(`Workspace ${workspaceId} upgraded to ${plan} plan.`);
        }
      }

      return { received: true };
    } catch (err) {
      this.logger.error(`Stripe Webhook Processing Error: ${err.message}`);
      throw err;
    }
  }
}
