---
name: api
description: >
  apps/api(NestJS, Drizzle ORM, PostgreSQL + PostGIS) 의 모듈, 컨트롤러, 서비스, DB 스키마, 마이그레이션 코드를 작성하거나 수정, 리뷰, 리팩토링할 때 적용하는 규칙.
  apps/api/src 아래의 .ts 파일, drizzle.config.ts, 관련 테스트 코드를 다룰 때 사용한다.
---

# api 코드 배치 규칙

폴더 구조, 파일 이름, 폴더별 export 종류, import 범위는 oxlint(`.oxlintrc.json` 의 `apps/api/**` override)와 `scripts/check-api-structure.sh` 가 검사한다. 아래는 도구로 검사할 수 없는 규칙이다.

## 쓰는 범위만큼만 위로 올린다

- 한 파일에서만 쓰는 함수, 상수, 타입은 그 파일 안에 두고 export 하지 않는다. 쓰는 곳이 하나인데 `utils/`, `constants/`, `types/` 로 빼지 않는다.
- 한 기능 안의 여러 파일이 쓰면 그 기능 폴더의 `utils/`, `constants/`, `types/` 로 옮긴다.
- 여러 기능이 쓰면 `src/_common/` 아래 같은 이름의 폴더로 옮긴다. 두 기능에 같은 코드를 복사해 두지 않는다.
- api 와 web, admin 이 함께 쓰면 `packages/shared` 로 옮긴다.
