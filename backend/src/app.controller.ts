import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: 'Ekşi Sözlük Benzeri Platform API',
      version: '1.0.0',
      endpoints: {
        auth: '/auth',
        topics: '/topics',
        entries: '/entries',
        votes: '/votes',
        users: '/users',
      },
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
