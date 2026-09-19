// ============================================================================
// FILE: src/app.service.ts
// ============================================================================
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  health() {
    return {
      ok: true,
      service: 'small-web-api',
      time: new Date().toISOString(),
    };
  }
}