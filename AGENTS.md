# food-map

## 작업 환경

이 프로젝트는 macOS(Apple Silicon)와 Ubuntu 두 환경에서 작업한다. 스크립트, 설정, 명령은 두 환경에서 똑같이 동작해야 한다.

- 스크립트는 zsh 로 작성한다. 두 환경 모두 zsh 가 설치되어 있다. package.json 스크립트와 lefthook 에서는 `zsh scripts/...` 로 실행해 기본 셸(Ubuntu 는 bash)에 기대지 않는다
- `sed -i ''` 처럼 macOS 와 Linux 에서 옵션이 다른 명령을 package.json 스크립트나 hook 에 넣지 않는다
- `pbcopy`, `open` 처럼 한쪽 OS 에만 있는 명령에 기대지 않는다
- Docker 는 macOS 에서 Docker Desktop, Ubuntu 에서 Docker Engine 을 쓴다. `docker compose` 명령으로 동작하는 설정만 쓴다

## 코딩 규칙을 정하는 순서

새 규칙은 기계적으로 적용 가능한 방법 먼저 확인한다.

1. oxlint 기본 규칙 (`.oxlintrc.json`)
2. 커스텀 oxlint 규칙 (`packages/oxlint-plugin`). 규칙마다 `RuleTester` 테스트를 함께 둔다
3. Node 스크립트 + lefthook
4. 위 방법으로 막을 수 없는 규칙만 앱별 skill 문서(`.claude/skills/*/SKILL.md`)에 적는다

규칙을 추가하기 전에 임시 파일로 실제로 잡히는지 확인한다. lint 나 스크립트로 옮긴 규칙은 skill 문서에서 지운다.

## 카카오 API 응답 저장 범위

카카오 API 응답은 DB 에 저장하지 않는다. 저장할 수 있는 값은 장소 id, 장소명, place_url 세 가지뿐이다.
