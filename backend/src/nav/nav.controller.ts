import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { NavService } from './nav.service';
import { Public, Roles } from '../common/decorators';

@Controller('nav')
export class NavController {
  constructor(private readonly navService: NavService) {}

  // Public — storefront reads nav without auth
  @Public()
  @Get('public')
  getPublic() {
    return this.navService.findPublic();
  }

  // Admin routes
  @Roles('admin')
  @Get()
  findAll() {
    return this.navService.findAll();
  }

  @Roles('admin')
  @Post()
  create(@Body() body: any) {
    return this.navService.create(body);
  }

  @Roles('admin')
  @Patch('reorder')
  reorder(@Body() body: { items: { id: string; order: number }[] }) {
    return this.navService.reorder(body.items);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.navService.update(id, body);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.navService.remove(id);
  }
}
