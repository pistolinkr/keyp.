# Keyp. 플랫폼 디자인 아이디어

## 접근법 1

**Design Movement**: Editorial Brutalism — 날카로운 그리드와 강한 타이포그래피 대비 **Core Principles**: - 비대칭 레이아웃: 좌측 사이드바 고정, 콘텐츠 영역 비대칭 분할 - 타이포그래피 우위: 폰트 자체가 시각적 요소로 기능 - 날카로운 경계: 라운드 없는 직각 컨테이너, 1px 정밀 보더 - 정보 밀도: 적절한 정보 압축, 스캔 가능한 구조

**Color Philosophy**: Paper-like 화이트(#f1f0ec)를 베이스로, 거의 블랙에 가까운 잉크(#1a1a1a)로 강한 대비. 포인트 컬러는 단 하나 — 강렬한 코발트 블루(#1a56db). 다크 모드는 rgb(33,33,33) 배경에 소프트 화이트(#e5e5e5).

**Layout Paradigm**: 좌측 고정 네비게이션(240px) + 메인 콘텐츠 + 우측 컨텍스트 패널. 피드는 카드가 아닌 리스트 기반 — 각 아이템은 수평 구분선으로만 분리.

**Signature Elements**:

- 굵은 대문자 섹션 레이블 (TRENDING / SEASON 2025)
- 인라인 태그 시스템 — 배지 없이 #해시태그 스타일
- 진행 바 없는 읽기 시간 표시 (예: "8 min")

**Interaction Philosophy**: 호버 시 배경색 변화 없이 텍스트 언더라인만 등장. 클릭 피드백은 즉각적이고 무거움 없이.

**Animation**: 페이지 전환 시 슬라이드 없이 페이드만. 리스트 아이템 등장은 stagger 0.05s.

**Typography System**: 

- 헤드라인: Bebas Neue 또는 Space Grotesk Bold
- 본문: Noto Serif KR (한국어) / Merriweather (영어), 18px, line-height 1.75
- UI 레이블: Space Mono, 11px uppercase

0.08


## 접근법 2

**Design Movement**: Structured Minimalism with Sharp Edges — 일본 디자인 미학 + 서구 에디토리얼

**Core Principles**:

- 수직 리듬: 8px 그리드 기반 엄격한 간격 시스템
- 날카로운 기하학: 0px radius, 정밀한 1px 선
- 기능적 색상: 색상은 상태 전달 목적으로만 사용
- 타이포그래피 계층: 크기 차이로만 위계 표현

**Color Philosophy**: 거의 순수한 #f1f0ec 페이퍼 화이트 배경. 텍스트는 #111111 (잉크 블랙). 액센트는 절제된 #e63946 (레드) — 중요 알림, CTA에만. 다크는 #212121 배경, #e5e5e5 텍스트.

**Layout Paradigm**: 상단 고정 헤더(64px) + 3단 그리드 (사이드바 200px | 메인 콘텐츠 | 우측 패널 280px). 모바일에서는 단일 컬럼으로 축소.

**Signature Elements**:

- 헤더 하단 1px 블랙 보더 — 공간 분리의 핵심
- 카테고리 탭은 언더라인 스타일 (active: 2px solid black)
- 코드 블록 스타일 태그 — monospace 폰트, 배경 없음

**Interaction Philosophy**: 모든 인터랙션은 0.15s ease-out. 버튼 호버는 배경 반전(블랙↔화이트). 링크는 언더라인 애니메이션.

**Animation**: transform: translateY(-2px) 호버 효과. 모달은 scale(0.95)→scale(1) 등장.

**Typography System**:

- 헤드라인: Pretendard ExtraBold / Inter 800
- 본문: Noto Serif KR 400, 17px, line-height 1.8
- UI: Pretendard 500, 13px
- 코드/태그: JetBrains Mono

0.09


## 접근법 3 ← **선택됨**

**Design Movement**: Sharp Editorial Intelligence — 날카로운 에디토리얼 + 지식 플랫폼 권위

**Core Principles**:

- 날카로운 직각 기하학: border-radius 0 또는 최대 2px. 모든 컨테이너는 각진 형태.
- 강한 타이포그래피 위계: 크기와 무게의 극적 대비로 스캔 가능한 구조
- 정보 밀도와 여백의 공존: 콘텐츠 영역은 밀도 있게, 여백은 의도적으로
- 이중 언어 우선 설계: 한국어/영어 전환이 레이아웃을 깨지 않는 구조

**Color Philosophy**: 

- 라이트: #f1f0ec (페이퍼 화이트) 배경, #111111 텍스트, #1a56db 포인트
- 다크: rgb(33,33,33) 배경, #e5e5e5 텍스트, #4d8ef0 포인트 (밝게 조정)
- 경계선: 라이트 #d4d0c8, 다크 rgba(255,255,255,0.1)
- 상태 색상: 성공 #16a34a, 경고 #d97706, 에러 #dc2626

**Layout Paradigm**: 

- 좌측 고정 사이드바(256px) + 메인 피드 + 우측 컨텍스트 패널(320px)
- 피드는 카드 없는 리스트 — 구분선으로만 분리
- 게시글 상세는 중앙 집중 단일 컬럼(680px) + 우측 플로팅 AI 패널

**Signature Elements**:

- 시즌 배지: 연도 + 시즌 넘버 (S2025 · EP.42)
- 언어 토글: 헤더 우측 [KO | EN] 슬라이더
- 댓글 깊이 표시: 좌측 컬러 바 (깊이별 색상 변화)

**Interaction Philosophy**: 

- 호버: 배경 변화 없이 텍스트 색상 + 좌측 2px 블루 보더
- 버튼: 즉각적인 색상 반전, 0.1s transition
- AI 패널: 슬라이드인 애니메이션, 독립적 스크롤

**Animation**: 

- 페이지 전환: opacity 0→1, 0.2s
- 리스트 아이템: staggered fadeInUp, 0.04s delay
- 언어 전환: crossfade, layout shift 없음

**Typography System**:

- 헤드라인: Pretendard 700-800 (한국어), 강한 무게감
- 본문: Noto Serif KR 400 (한국어) / Georgia (영어), 17-18px, line-height 1.75-1.8
- UI 레이블: Pretendard 500-600, 12-13px
- 코드/모노: JetBrains Mono
- 숫자/통계: Tabular figures, Pretendard 600

0.09
