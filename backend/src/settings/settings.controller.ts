import { Body, Controller, Get, Patch } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Public, Roles } from '../common/decorators';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get()
  get() {
    return this.settingsService.get();
  }

  @Roles('admin')
  @Patch()
  update(@Body() body: any) {
    return this.settingsService.update(body);
  }
}
