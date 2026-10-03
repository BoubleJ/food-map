# admin 인증

2026-10-02 기준 admin API 에 인증이 없다. 나중에 추가한다.

## 현재 상태

- admin 은 관리자 한 명만 쓴다. 여러 관리자가 동시에 작업하는 경우는 고려하지 않는다
- api 에 Guard 가 없다
- `infra/caddy/Caddyfile` 이 `admin.{$DOMAIN}` 외에 `{$DOMAIN}/api/*` 와 `api.{$DOMAIN}` 도 api 로 연결해서, 사용자용 도메인에서도 `/api/admin/*` 를 호출할 수 있다
