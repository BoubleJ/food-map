---
name: web
description: >
  apps/web(React Router v8 framework mode, SSR, Tailwind CSS v4) 의 라우트, 컴포넌트, loader, action 코드를 작성하거나 수정, 리뷰, 리팩토링할 때 적용하는 규칙.
  apps/web/app 아래의 .tsx, .ts 파일과 관련 테스트 코드를 다룰 때 사용한다.
---

# 프론트엔드 코딩 규칙

TypeScript/React 코드를 작성하거나 리뷰할 때 아래 규칙을 모두 적용한다.

## 1. 구조 분해 문법

객체에서 값을 추출할 때 항상 구조 분해 문법을 사용한다.

### 객체 구조 분해

```tsx
// ❌ BAD
const name = user.name;
const email = user.email;

// ✅ GOOD
const { name, email } = user;
```

### 함수 매개변수

컴포넌트 props든 일반 함수 인자든, 인자가 바로 사용되면 함수 경계에서 구조 분해한다.

```tsx
// ❌ BAD
function UserCard(props: UserCardProps) {
  return <div>{props.name} - {props.email}</div>;
}

// ✅ GOOD
function UserCard({ name, email }: UserCardProps) {
  return <div>{name} - {email}</div>;
}
```

### 콜백에서도 구조 분해 우선

```tsx
// ❌ BAD
data.map((s) => s.provider);

// ✅ GOOD
data.map(({ provider }) => provider);
```

## 2. 함수 선언 규칙

함수는 항상 `function` 키워드를 사용한 선언 형식으로 작성한다.

### 기본 함수

```tsx
// ❌ BAD - 화살표 함수
const fetchData = async () => {
  const response = await fetch("/api/data");
  return response.json();
};

// ✅ GOOD - 함수 선언식
async function fetchData() {
  const response = await fetch("/api/data");
  return response.json();
}
```

### React 컴포넌트

```tsx
// ❌ BAD
const Button = ({ children, onClick }: ButtonProps) => {
  return <button onClick={onClick}>{children}</button>;
};

// ✅ GOOD
function Button({ children, onClick }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}
```

### 예외 사항

- 콜백 함수 (`.map()`, `.filter()`, 이벤트 핸들러 등)는 화살표 함수 허용
- 즉시 인라인으로 사용되는 짧은 함수는 화살표 함수 허용
- 컴포넌트/훅 내부의 이벤트 핸들러(`handle*`, `on*`)는 `const` 선언 + 화살표 함수 사용

```tsx
// 콜백에서는 화살표 함수 허용
const items = data.map(({ name }) => name);

// 이벤트 핸들러 인라인도 허용
<button onClick={() => setOpen(true)}>열기</button>

// 컴포넌트/훅 내부 이벤트 핸들러는 const + 화살표 함수 사용
const handleClick = () => {
  doSomething();
};
```

## 3. 메모이제이션 금지

`memo`, `useMemo`, `useCallback`을 사용하지 않는다.

성능 최적화가 실제로 필요하다는 것이 측정으로 입증된 경우에만, 또는 명시적으로 요청받은 경우에만 사용한다.

```tsx
// ❌ BAD
const session = useMemo<Session>(() => {
  if (data) return convertToSession(data);
  return { isLogin: false, user: null };
}, [data]);

// ✅ GOOD
const session: Session = data
  ? convertToSession(data)
  : { isLogin: false, user: null };
```

## 4. 타입 규칙

### 접두사 금지

타입, 인터페이스, 타입 별칭에 `I`, `T` 접두사를 사용하지 않는다.
레거시 코드(`IUser`, `IAmount` 등)는 건드리지 않고, 신규 타입부터 적용한다.

```tsx
// ❌ BAD
interface IUsersMeParams {
  host: IHost;
}
type TOrderType = "like" | "recent";

// ✅ GOOD
interface UsersMeParams {
  host: IHost;
}
type OrderType = "like" | "recent";
```

### 타입 추론 우선

TypeScript가 타입을 추론할 수 있는 경우 명시적으로 작성하지 않는다.

```tsx
// ❌ BAD
const count: number = 0;
function isAdult(status: string | null | undefined): boolean {
  return status === "VERIFIED_ADULT";
}

// ✅ GOOD
const count = 0;
function isAdult(status: string | null | undefined) {
  return status === "VERIFIED_ADULT";
}
```

예외: 추론 결과가 의도와 다를 때, 공개 API의 복잡한 반환 타입, 재귀 함수.

### interface 우선

객체 형식이 필요할 때는 `type`보다 `interface`를 우선 사용한다.

### 타입 colocation

타입이 크지 않으면 별도 `types/` 폴더를 만들지 않고, 사용하는 파일 안에 함께 정의한다.

### 중첩 타입 분리

인라인 중첩 타입은 항상 별도 named type으로 추출한다.

```tsx
// ❌ BAD
interface AccountCard {
  sns: { provider: string; email: string; isLinked: boolean }[];
}

// ✅ GOOD
interface AccountCardSns {
  provider: string;
  email: string;
  isLinked: boolean;
}

interface AccountCard {
  sns: AccountCardSns[];
}
```

### PropsWithChildren

`children: ReactNode`를 직접 선언하지 않고 `PropsWithChildren<Props>`를 사용한다.

```tsx
// ❌ BAD
interface LayoutProps {
  title: string;
  children: ReactNode;
}

// ✅ GOOD
interface LayoutProps {
  title: string;
}

function Layout({ title, children }: PropsWithChildren<LayoutProps>) {
  return <div>{title}{children}</div>;
}
```

## 5. 네이밍 규칙

이름은 구현 방식보다 역할과 결과가 먼저 드러나야 한다.

- 값을 조립해서 반환하는 순수 함수는 `create*`를 우선 사용한다.
- 외부 입력을 검증하고 정규화하는 함수는 `parse*`를 사용한다.
- boolean 값, 상태, 폼 필드는 `is*`, `has*`, `can*` 접두사를 사용한다.
- 이벤트 핸들러는 `handle*`, 외부에서 받는 콜백 prop은 `on*` 네이밍을 사용한다.
- 스키마 이름은 `*FormSchema`, 추론된 값 타입은 `*FormValues`로 짓는다.
- API 함수는 `~API` suffix를 사용한다 (예: `postSignupSnsAPI`, `getLinkedAccountsAPI`).
- Query 훅은 `useGet~` 패턴을 사용한다 (예: `useGetLinkedAccounts`).
- 한 곳에서만 쓰이는 보조 함수는 공용 유틸로 올리지 않고 해당 모듈 내부에 둔다.
- 상수나 직접 분기만으로 충분히 읽히는 경우 의미 없는 중간 추상화는 추가하지 않는다.

```tsx
// ❌ BAD
function buildUrl(path: string, query?: string) {
  return query ? `${path}?${query}` : path;
}
const autoLogin = false;
const submit = () => {};

// ✅ GOOD
function createHref(pathname: string, search?: string) {
  return search ? `${pathname}?${search}` : pathname;
}
const isAutoLogin = false;
const handleSubmit = () => {};
```
