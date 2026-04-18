# Keyp.

## 한국어 (KO)

### Keyp. MVP 정의 (현재 코드베이스 기준)

#### 1. MVP 한 줄

한국어·영어 UI로 긴 글을 읽고, 피드에서 탐색하고, 글쓰기·프로필·검색·시즌 아카이브까지 한 흐름으로 체험할 수 있는 프론트엔드 제품.

#### 2. 목표

- **독자:** 시즌·카테고리·정렬로 글 목록을 보고, 글 상세와 댓글 구조를 경험한다.
- **작성자:** 에디터에서 글을 쓰는 흐름(제목·메타·본문·AI 패널 UI)을 검증한다.
- **운영/브랜드:** 랜딩으로 가치 제안과 2026 트렌드 특집을 보여준다.

#### 3. 타깃 사용자 (MVP 가정)

- 한·영을 오가며 글을 읽고 쓰는 지식 커뮤니티 사용자
- 시즌제 콘텐츠에 익숙한 에디토리얼 독자

#### 4. MVP 범위 — 포함 (In scope)

| 영역 | 내용 |
|------|------|
| 정보 구조 | 랜딩(`/`), 피드(`/feed`), 글(`/post/:id`), 글쓰기(`/write`), 프로필(`/profile/:username`), 검색(`/search`), 시즌(`/season/:id`, `/seasons`), 오류 안내(`/guide4-stuck-man`), 404 |
| 글로벌 UX | KO/EN 전역 언어, 라이트/다크 테마, 메인 레이아웃(사이드 네비·헤더) |
| 피드 | 카테고리·시즌 필터, 정렬(latest / trending / top), 목 데이터 기반 목록 |
| 콘텐츠 | 글 상세·댓글 스레드·AI 패널 UI(에디터 포함) |
| 랜딩 | 히어로, 통계, 2026 트렌드 키워드·정의 인터랙션, 시즌·CTA 등 마케팅 블록 |
| 배포 형태 | Vite 빌드 + Express로 정적 파일 제공 및 클라이언트 라우팅 |

#### 5. 핵심 사용자 시나리오 (MVP 성공 기준)

1. 랜딩 → 입장하기 → 피드에서 글 선택 → 상세 읽기.
2. 피드에서 카테고리·시즌·정렬 변경 → 목록이 기대대로 바뀜(목 데이터 기준).
3. 글쓰기 페이지에서 제목·카테고리·본문·(옵션) AI 패널까지 UI 흐름 완주.
4. 검색·프로필·시즌 아카이브 화면 진입 및 기본 탐색.
5. 언어·테마 전환 시 레이아웃이 깨지지 않음.

#### 6. MVP에서 의도적으로 제외하거나 “프로토타입”인 부분 (Out of scope / 한계)

- 실제 계정·로그인·권한 (Clerk 등 미연동 시)
- 실시간 백엔드 API·DB 연동 — 현재는 `mockData` 등 클라이언트 목 데이터에 가깝다고 가정하는 것이 안전합니다.
- 실제 발행·저장·댓글 작성 반영 — UI·토스트 수준일 가능성이 큼.
- AI 추론 — Ollama 등 문구는 있을 수 있으나, MVP 검증 단계에서는 로컬/목 응답으로 두는 것이 일반적입니다.

#### 7. 기술 스택 (MVP 고정)

React, TypeScript, Vite, Wouter, Tailwind v4, Radix, Sonner 등.

#### 8. “진짜 서비스”로 가기 위한 다음 스프린트 제안 (MVP+)

1. 인증 + 사용자별 프로필
2. Supabase(또는 선택 DB)로 글·댓글·시즌 CRUD
3. 에디터 저장/발행 API 연동
4. 검색 서버 사이드 또는 DB 쿼리
5. AI는 로컬(Ollama) 우선, 엔드포인트만 명확히 분리

### 빠른 시작

```bash
pnpm install
pnpm dev
```

```bash
pnpm check   # 타입 검사
pnpm build   # 빌드
```

### 프로젝트 구조

- `client/`: 프론트엔드 앱
- `server/`: 프로덕션 정적 서빙 엔트리포인트
- `shared/`: 공유 상수/타입
- `supabase/`: Supabase 로컬 메타데이터/설정

### 라이선스

MIT — 자세한 내용은 `LICENSE`를 참고하세요.

---

## English (EN)

### Keyp. MVP definition (current codebase)

#### 1. One-line MVP

A frontend product that lets you read long-form posts, browse the feed, and walk through writing, profile, search, and season archive in one continuous flow—with Korean and English UI.

#### 2. Goals

- **Readers:** Browse posts by season, category, and sort order; experience post detail and threaded comments.
- **Writers:** Validate the editor flow—title, metadata, body, and optional AI assistant panel UI.
- **Ops / brand:** Present the value proposition and 2026 trend feature on the landing page.

#### 3. Target users (MVP assumptions)

- Knowledge-community users who read and write across Korean and English.
- Editorial readers comfortable with season-based content.

#### 4. MVP scope — in scope

| Area | Scope |
|------|--------|
| IA | Landing (`/`), feed (`/feed`), post (`/post/:id`), editor (`/write`), profile (`/profile/:username`), search (`/search`), seasons (`/season/:id`, `/seasons`), troubleshooting (`/guide4-stuck-man`), 404 |
| Global UX | KO/EN app language, light/dark theme, main layout (sidebar nav + header) |
| Feed | Category & season filters, sort (latest / trending / top), mock-data-driven list |
| Content | Post detail, threaded comments, AI panel UI (including editor) |
| Landing | Hero, stats, 2026 trend keywords & definitions, season & CTA blocks |
| Deploy | Vite build + Express static hosting with client-side routing |

#### 5. Core user scenarios (MVP success criteria)

1. Landing → enter platform → pick a post on the feed → read detail.
2. Change category, season, or sort on the feed → list updates as expected (mock data).
3. Complete the write flow: title, category, body, optional AI panel.
4. Open search, profile, and season archive and browse basics.
5. Switching language or theme does not break layout.

#### 6. Out of scope / prototype limitations

- Real accounts, login, and authorization (unless integrated e.g. Clerk).
- Live backend API / database—assume client-side `mockData` for now.
- Real publish, save, and comment persistence—likely UI and toasts only.
- AI inference—copy may reference Ollama; for MVP, treat as local/mock responses.

#### 7. Tech stack (MVP)

React, TypeScript, Vite, Wouter, Tailwind v4, Radix, Sonner, etc.

#### 8. Next sprint toward production (MVP+)

1. Authentication + per-user profiles.
2. Supabase (or chosen DB) for posts, comments, and seasons CRUD.
3. Wire editor save/publish to APIs.
4. Server-side search or DB-backed queries.
5. Prefer local AI (Ollama) with a clear API boundary.

### Quick start

```bash
pnpm install
pnpm dev
```

```bash
pnpm check   # Typecheck
pnpm build   # Production build
```

### Project layout

- `client/`: Frontend app
- `server/`: Production static server entrypoint
- `shared/`: Shared constants and types
- `supabase/`: Supabase local metadata/config

### License

MIT — see `LICENSE` for details.
