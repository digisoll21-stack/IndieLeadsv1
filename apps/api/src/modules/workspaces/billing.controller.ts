import { Controller, Post, Body, Headers, Req } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Request } from 'express';

@Controller('billing')
export class BillingController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') sig: string,
    @Req() req: Request,
    @Body() body: any,
  ) {
    const rawBody = JSON.stringify(body);
    return this.subscriptionService.handleWebhook(sig, rawBody);
  }
}
