import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private config: ConfigService, private authService: AuthService) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID') || 'GOOGLE_CLIENT_ID_NOT_SET',
      clientSecret: config.get('GOOGLE_CLIENT_SECRET') || 'GOOGLE_CLIENT_SECRET_NOT_SET',
      callbackURL: (config.get('OAUTH_CALLBACK_BASE') || 'http://localhost') + '/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: any) {
    if (!this.config.get('GOOGLE_CLIENT_ID')) {
      this.logger.warn('GOOGLE_CLIENT_ID not configured');
    }
    return this.authService.findOrCreateOAuthUser({
      provider: 'google',
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    });
  }
}
