import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PagesService } from './pages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Public, Roles } from '../common/decorators';

@Controller('pages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PagesController {
  constructor(private pagesService: PagesService) {}

  @Public()
  @Get()
  findAll(@Query('status') status?: string) {
    return this.pagesService.findAll(status);
  }

  @Public()
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.pagesService.findBySlug(slug);
  }

  @Roles('admin', 'staff')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagesService.findOne(id);
  }

  @Roles('admin', 'staff')
  @Post()
  create(@Body() data: any, @Req() req: any) {
    return this.pagesService.create(data, req.user.id);
  }

  @Roles('admin', 'staff')
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.pagesService.update(id, data);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pagesService.remove(id);
  }
}
