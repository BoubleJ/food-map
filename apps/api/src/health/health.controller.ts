import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  /** Caddy 와 docker compose 헬스체크가 두드리는 엔드포인트. */
  @Get()
  check(): { status: "ok"; uptime: number } {
    return { status: "ok", uptime: process.uptime() };
  }
}
