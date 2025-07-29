import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('success/:name')
  getSuccess(@Param('name') name: string) {
    return this.appService.getSuccess(name);
  }

  @Get('error')
  getError() {
    return this.appService.getError();
  }
}
