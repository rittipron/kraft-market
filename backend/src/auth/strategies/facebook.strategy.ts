import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  private readonly logger = new Logger(FacebookStrategy.name);

  constructor(private config: ConfigService, private authService: AuthService) {
    super({
      clientID: config.get('FACEBOOK_APP_ID') || 'FACEBOOK_APP_ID_NOT_SET',
      clientSecret: config.get('FACEBOOK_APP_SECRET') || 'FACEBOOK_APP_SECRET_NOT_SET',
      callbackURL: (config.get('OAUTH_CALLBACK_BASE') || 'http://localhost') + '/api/auth/facebook/callback',
      profileFields: ['id', 'emails', 'name', 'picture'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: any) {
    if (!this.config.get('FACEBOOK_APP_ID')) {
      this.logger.warn('FACEBOOK_APP_ID not configured');
    }
    const email = profile.emails?.[0]?.value ?? `fb_${profile.id}@placeholder.local`;
    const name = [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') || profile.id;
    return this.authService.findOrCreateOAuthUser({
      provider: 'facebook',
      providerId: profile.id,
      email,
      name,
      avatarUrl: profile.photos?.[0]?.value,
    });
  }
}
