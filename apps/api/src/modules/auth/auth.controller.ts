
import { Controller, Post, Get, Body, HttpCode, HttpStatus, Query, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * GOOGLE OAUTH CALLBACK
   * This endpoint is called by Google after a user authorizes an inbox.
   */
  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    // state contains workspaceId:userId
    const [workspaceId, userId] = state.split(':');
    await this.authService.handleGoogleExchange(code, workspaceId, userId);

    // Redirect back to the UI inboxes page
    // Fix: Access redirect with type assertion to resolve Property 'redirect' does not exist error on Response in this environment.
    return (res as any).redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/inboxes?status=success`);
  }

  /**
   * OUTLOOK OAUTH CALLBACK
   */
  @Get('outlook/callback')
  async outlookCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const [workspaceId, userId] = state.split(':');
    await this.authService.handleOutlookExchange(code, workspaceId, userId);

    // Fix: Access redirect with type assertion to resolve Property 'redirect' does not exist error on Response in this environment.
    return (res as any).redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/#/inboxes?status=success`);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    return this.authService.initiatePasswordReset(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Query('token') token: string, @Body() body: any) {
    return this.authService.resetPassword(token, body);
  }
}
