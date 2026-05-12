import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NavItem, NavItemSchema } from './nav.schema';
import { NavService } from './nav.service';
import { NavController } from './nav.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: NavItem.name, schema: NavItemSchema }])],
  controllers: [NavController],
  providers: [NavService],
  exports: [NavService],
})
export class NavModule {}
