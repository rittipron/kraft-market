import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type Redis from 'ioredis';
import { User, UserDocument } from './user.schema';
import { LoginDto, RegisterDto } from './auth.dto';
import { REDIS_CLIENT } from '../common/redis.module';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userModel.findOne({ email: dto.email }).lean();
    if (exists) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email: dto.email,
      password: hashed,
      name: dto.name,
    });

    return this.signToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email }).lean();
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account disabled');

    return this.signToken(user);
  }

  async logout(jti: string, exp: number): Promise<void> {
    const ttl = exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.redis.setex(`blacklist:${jti}`, ttl, '1');
    }
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const val = await this.redis.get(`blacklist:${jti}`);
    return val === '1';
  }

  private signToken(user: any) {
    const jti = uuidv4();
    const payload = { sub: user._id.toString(), email: user.email, role: user.role, jti };
    const token = this.jwtService.sign(payload);
    return {
      accessToken: token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    };
  }
}
