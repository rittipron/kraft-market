import { Controller, Get, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators';

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost';

@Public()
@Controller('auth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(private authService: AuthService) {}

  // ── Google ──
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() { /* redirect handled by passport */ }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    this.redirectWithToken(req.user, res);
  }

  // ── Facebook ──
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookLogin() {}

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: any, @Res() res: Response) {
    this.redirectWithToken(req.user, res);
  }

  private redirectWithToken(user: any, res: Response) {
    if (!user?.accessToken) {
      return res.redirect(`${FRONTEND}/auth/callback?error=oauth_failed`);
    }
    res.redirect(`${FRONTEND}/auth/callback?token=${user.accessToken}`);
  }
}
