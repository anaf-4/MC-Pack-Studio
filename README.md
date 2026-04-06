# 🎮 MC-Pack Studio

**브라우저에서 바로 쓰는 마인크래프트 리소스팩 편집기**

서버 없이 완전히 클라이언트 사이드로 동작하는 웹 기반 리소스팩 제작 도구입니다.
텍스처 교체부터 픽셀 수준 편집, 실시간 프리뷰, ZIP 자동 생성까지 한 곳에서 처리합니다.

🔗 **[바로 사용하기 → anaf-4.github.io/MC-Pack-Studio](https://anaf-4.github.io/MC-Pack-Studio/)**

---

## ✨ 주요 기능

### 📦 리소스팩 관리
- 팩 이름 · 설명 · 아이콘 설정
- 마인크래프트 버전 선택 (1.6.1 ~ 26.1, format 1 ~ 84.0)
- **기존 리소스팩 ZIP 불러오기** — pack.mcmeta 자동 파싱, 전체 텍스처 일괄 로드
- **ZIP 자동 생성 & 다운로드** — 표준 폴더 구조 포함 (item/, block/, gui/, hud/ 등)

### 🖼️ 텍스처 관리
- **아이템 150개+** · **블록 80개+** 기본 지원
- 커스텀 아이템 / 블록 직접 추가 (이름 + 경로 지정, localStorage 저장)
- 개별 텍스처 PNG 저장 버튼
- 바닐라 텍스처 배경 미리보기 지원 (`public/vanilla/` 폴더에 원본 배치)

### ✏️ 픽셀 에디터
- **그리기 도구**: 연필 · 지우개 · 채우기(BFS) · 색 추출 · 선 · 사각형
- **키보드 단축키**: B / E / F / I / L / R · Ctrl+Z (실행취소) · Ctrl+Y (재실행)
- **색상 입력**: 색상 피커 · 헥스 코드 직접 입력 (`#rrggbb`, `#rgb`)
- **색상 팔레트 6종**: MC 기본 · 최근 사용 · 회색 · 스킨 · 자연 · 네온
- 투명도(Alpha) 슬라이더
- 픽셀 격자 · 줌 조절 (2× ~ 32×)
- 바닐라 원본 텍스처 오버레이 (불투명도 조절 가능)
- 실시간 미리보기 패널

### 👁️ 실시간 프리뷰 (5가지 탭)

| 탭 | 내용 |
|----|------|
| **게임** | HUD 시뮬레이터 — 체력 · 배고픔 · 핫바 · XP바 (2× GUI 스케일) |
| **GUI** | 인벤토리 · 작업대 · 상자 · 용광로 UI |
| **블록** | CSS 3D 아이소메트릭 큐브 · 윗면 / 옆면 / 아랫면 개별 편집 |
| **아이템** | 인벤토리 스타일 그리드 · CSS 3D 아이템 렌더링 |
| **폰트** | 색상 코드 (§0~§f) · 크기 조절 미리보기 |

---

## 🚀 시작하기

### 요구 사항
- **Node.js 18+**
- npm

### 로컬 실행

```bash
# 저장소 클론
git clone https://github.com/anaf-4/MC-Pack-Studio.git
cd MC-Pack-Studio

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 빌드

```bash
npm run build
```

`dist/` 폴더에 정적 파일이 생성됩니다.

---

## 📁 프로젝트 구조

```
MC-Pack Studio/
├── public/
│   └── vanilla/                  ← 바닐라 텍스처 (직접 추가, 선택사항)
│       └── assets/minecraft/textures/
│           ├── item/
│           └── block/
├── src/
│   ├── components/
│   │   ├── canvas/               ← 픽셀 에디터, 게임 시뮬레이터
│   │   ├── export/               ← ZIP 내보내기, 미리보기
│   │   ├── layout/               ← TopBar, Sidebar, AppLayout
│   │   ├── preview/              ← 5가지 프리뷰 탭
│   │   ├── setup/                ← 팩 초기 설정 모달
│   │   └── texture/              ← 텍스처 카드, 드롭존
│   ├── constants/
│   │   ├── packFormats.ts        ← 버전별 pack_format 매핑
│   │   └── texturePaths.ts       ← 전체 텍스처 경로 목록
│   ├── hooks/
│   │   ├── usePackImport.ts      ← ZIP 불러오기
│   │   ├── useTextureUpload.ts   ← 텍스처 업로드 검증
│   │   └── useVanillaTexture.ts  ← 바닐라 텍스처 로더
│   ├── store/
│   │   ├── packStore.ts          ← 팩 메타데이터
│   │   ├── textureStore.ts       ← 텍스처 데이터
│   │   ├── editorStore.ts        ← UI 상태
│   │   └── animationStore.ts     ← 애니메이션 정의
│   └── utils/
│       ├── zipBuilder.ts         ← JSZip 기반 ZIP 생성
│       ├── mcmetaBuilder.ts      ← pack.mcmeta 생성
│       ├── imageUtils.ts         ← PNG 검증, DataURL 변환
│       └── downloadTexture.ts    ← 단일 PNG 저장
└── .github/workflows/
    └── deploy.yml                ← GitHub Pages 자동 배포
```

---

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 18 + TypeScript |
| 빌드 | Vite |
| 스타일 | Tailwind CSS (커스텀 MC 테마) |
| 상태 관리 | Zustand |
| ZIP 생성 | JSZip |
| 캔버스 | HTML5 Canvas API |
| 3D 렌더링 | CSS 3D Transforms |
| 배포 | GitHub Pages (GitHub Actions) |
| 저장소 | 100% 브라우저 (서버 없음) |

---

## 🍃 바닐라 텍스처 설정 (선택)

바닐라 텍스처를 넣으면 텍스처 카드와 픽셀 에디터에서 원본 이미지를 미리 볼 수 있습니다.

**추출 방법:**
1. 마인크래프트 설치 폴더 → `versions/<버전>/` 폴더
2. `<버전>.jar` 파일을 ZIP으로 열기
3. `assets/minecraft/textures/` 폴더를 복사
4. `public/vanilla/assets/minecraft/textures/` 에 붙여넣기

---

## 📝 지원 버전

| 마인크래프트 버전 | pack_format |
|-----------------|------------|
| 1.6.1 ~ 1.8.9 | 1 |
| 1.9 ~ 1.10.2 | 2 |
| 1.11 ~ 1.12.2 | 3 |
| 1.13 ~ 1.14.4 | 4 |
| 1.15 ~ 1.16.1 | 5 |
| 1.16.2 ~ 1.16.5 | 6 |
| 1.17 ~ 1.17.1 | 7 |
| 1.18 ~ 1.18.2 | 8 |
| 1.19 ~ 1.19.2 | 9 |
| 1.19.3 ~ 1.19.4 | 12~13 |
| 1.20 ~ 1.20.1 | 15 |
| 1.20.2 | 18 |
| 1.20.3 ~ 1.20.4 | 22 |
| 1.20.5 ~ 1.20.6 | 32 |
| 1.21 ~ 1.21.1 | 34 |
| 1.21.2 ~ 1.21.3 | 42 |
| 1.21.4 | 46 |
| 1.21.5 | 55 |
| 1.21.6 | 63 |
| 1.21.7 ~ 1.21.8 | 64 |
| 1.21.9 ~ 1.21.10 | 69.0 |
| 1.21.11 | 75.0 |
| **26.1** | **84.0** |

---

## 🤝 기여

버그 제보, 기능 제안은 [Issues](https://github.com/anaf-4/MC-Pack-Studio/issues)에 남겨주세요.

---

*This project is not affiliated with Mojang Studios or Microsoft.*
