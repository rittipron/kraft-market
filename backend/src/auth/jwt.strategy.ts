import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: { sub: string; email: string; role: string; jti: string; exp: number }) {
    const blacklisted = await this.authService.isBlacklisted(payload.jti);
    if (blacklisted) throw new UnauthorizedException('Token revoked');

    return { id: payload.sub, email: payload.email, role: payload.role, jti: payload.jti, exp: payload.exp };
  }
}
