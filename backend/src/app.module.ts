import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PosModule } from './pos/pos.module';
import { PagesModule } from './pages/pages.module';
import { NavModule } from './nav/nav.module';
import { MediaModule } from './media/media.module';
import { SettingsModule } from './settings/settings.module';
import { StaffModule } from './staff/staff.module';
import { CustomersModule } from './customers/customers.module';
import { RedisModule } from './common/redis.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'long', ttl: 60_000, limit: 100 },
    ]),

    RedisModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    PosModule,
    PagesModule,
    NavModule,
    MediaModule,
    SettingsModule,
    StaffModule,
    CustomersModule,
    HealthModule,
  ],
  providers: [
    // Global guards — all routes protected by default; use @Public() to opt-out
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
