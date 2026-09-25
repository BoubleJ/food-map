# 맛집 지도

pnpm + Turborepo 모노레포. 아키텍처 문서(`맛집지도앱-아키텍처.md`)의 구성을 그대로 따른다.

## 구조

```
apps/
  web/      Next.js 16 (사용자 웹, 앱 웹뷰에서 로드) :3000
  admin/    Next.js 16 (CMS, 관리자 전용)           :3001
  api/      NestJS 12 (인증, 맛집 데이터 API)        :4000
  mobile/   Expo 57 (웹뷰 쉘 앱)
packages/
  shared/   타입, DTO, 앱 브릿지 메시지 타입
infra/
  caddy/    리버스 프록시 설정
  postgres/ 초기 SQL (PostGIS 확장)
```

## 처음 시작하기

```bash
pnpm install
pnpm db:up                       # postgres(PostGIS) + redis 컨테이너
pnpm --filter @food-map/api db:push   # 스키마를 개발 DB에 반영
pnpm dev                         # web · admin · api · mobile 동시 실행
```

개별 실행은 `pnpm --filter @food-map/web dev` 처럼 쓴다.

| 서비스 | 주소 |
|---|---|
| web | http://localhost:3000 |
| admin | http://localhost:3001 |
| api | http://localhost:4000/api/health |
| postgres | localhost:5432 |
| redis | localhost:6380 (호스트 redis 와 겹치지 않게 뺐다) |

## 환경 변수

- `.env.development` — 로컬 기본값. 커밋된다.
- `.env.production` — 배포 서버에서 `.env.production.example` 를 복사해 채운다. 커밋하지 않는다.

소셜 로그인 키(`KAKAO_*`, `NAVER_*`, `GOOGLE_*`, `APPLE_*`)와 `NEXT_PUBLIC_KAKAO_MAP_JS_KEY` 는 비어 있으니 발급 후 채운다.

## DB

Drizzle + PostGIS. 스키마는 `apps/api/src/database/schema.ts` 한 곳에 있다.

```bash
pnpm --filter @food-map/api db:generate   # 마이그레이션 생성
pnpm --filter @food-map/api db:migrate    # 마이그레이션 적용
pnpm --filter @food-map/api db:studio
```

좌표는 `geometry(point, 4326)` 이고 GiST 인덱스가 걸려 있다. 지도 영역 조회는 이 인덱스를 타야 한다.

## 앱 브릿지

웹과 네이티브의 통신은 양쪽 모두 추상화 레이어를 거친다. 메시지 타입은 `packages/shared/src/bridge/messages.ts` 한 곳에서만 정의한다.

- 웹: `apps/web/src/lib/appBridge.ts`
- 네이티브: `apps/mobile/src/appBridge.ts`

일반 브라우저에서 열렸을 때도 깨지지 않도록, 웹 쪽은 `isInAppWebView()` 로 갈라서 쓴다.

## 배포

GitHub Actions 가 앱별 이미지를 빌드해 GHCR 에 올리고, VPS 에서 받아 재시작한다.

```bash
# VPS
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

`--env-file` 없이 띄우면 이미지 태그와 도메인 치환이 비어서 뜬다.

필요한 GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_APP_DIR`.

## 아직 안 한 것

- 인증(Passport OAuth 전략, JWT 쿠키 발급)과 관리자 Guard
- 맛집 CRUD API, 지도 화면, Kakao Maps SDK 연동
- admin 의 Refine 도입 여부
- 푸시·공유·네이티브 소셜 로그인 브릿지 핸들러 (위치만 연결돼 있다)
