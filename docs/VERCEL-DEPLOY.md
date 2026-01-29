# Vercel 배포 가이드 (오목 앱)

이 앱은 **프론트엔드(React)** 와 **백엔드(Express + Socket.io + SQLite)** 가 분리되어 있습니다.

- **Vercel**: 프론트엔드(정적 사이트)만 배포합니다.
- **백엔드**: Vercel에서는 **실행할 수 없습니다**. Socket.io·상시 연결·SQLite가 필요하므로 **별도 서비스**에 배포해야 합니다.

---

## 1. 백엔드를 먼저 배포하기

Socket.io와 Express 서버는 **상시 실행 서버**가 필요합니다. 아래 중 하나에 배포하세요.

| 서비스 | 특징 | 무료 티어 |
|--------|------|-----------|
| [Railway](https://railway.app) | Node 서버·DB 쉽게 배포 | 제한적 |
| [Render](https://render.com) | Web Service로 Node 배포 | 제한적 |
| [Fly.io](https://fly.io) | VM 기반, 유연함 | 제한적 |

### Railway 예시 (권장)

1. [railway.app](https://railway.app) 가입 후 **New Project** → **Deploy from GitHub** (이 레포 연결).
2. **Root Directory**는 비워둡니다.
3. **빌드/시작 설정** (중요):
   - **Build Command**: `npm run build:server`  
     (또는 `npm install`만 실행되게 설정. `npm run build`는 프론트 빌드라 Railway에서 실패합니다.)
   - **Start Command**: `npm start` 또는 `npm run server`  
     (`npm start`이 서버를 실행하도록 설정되어 있습니다.)
4. **Settings** → **Variables**에 `PORT`는 Railway가 자동 주입할 수 있어 생략해도 됩니다.
5. **Deploy** 후 **Settings** → **Domains**에서 URL 확인 (예: `https://omok-server.up.railway.app`).

배포된 백엔드 URL을 메모해 두세요.  
예: `https://omok-server.up.railway.app` (끝에 `/api/auth` 붙이지 않음)

---

## 2. Vercel에 프론트엔드 배포하기

### 2-1. Vercel 연결

1. [vercel.com](https://vercel.com) 로그인 후 **Add New** → **Project**.
2. GitHub에서 이 저장소를 선택하고 **Import**.
3. **Framework Preset**이 **Vite**로 잡혀 있는지 확인.

### 2-2. 빌드 설정 (기본값으로 동작)

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

`vercel.json`에 이미 설정되어 있으므로 그대로 두면 됩니다.

### 2-3. 환경 변수 설정 (필수)

Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**에서 추가:

| 이름 | 값 | 설명 |
|------|-----|------|
| `VITE_API_URL` | `https://YOUR-BACKEND-URL/api/auth` | 백엔드 인증 API 주소 (예: Railway 도메인) |
| `VITE_SOCKET_URL` | `https://YOUR-BACKEND-URL` | Socket.io 서버 주소 (전체 URL, 예: https://omok-server.up.railway.app) |

**예시** (백엔드가 `https://omok-server.up.railway.app` 인 경우):

- `VITE_API_URL` = `https://omok-server.up.railway.app/api/auth`
- `VITE_SOCKET_URL` = `https://omok-server.up.railway.app`

> HTTPS를 쓰면 Socket.io가 같은 URL에서 WebSocket으로 연결합니다. 백엔드에서 CORS와 Socket.io `transports`가 HTTPS를 허용하는지 확인하세요.

### 2-4. 배포

**Deploy** 버튼을 누르거나, 이후에는 `main` 브랜치에 push하면 자동으로 배포됩니다.

---

## 3. 로컬에서 배포 환경 테스트

백엔드 URL만 바꿔서 프론트를 빌드해 볼 수 있습니다.

```bash
# .env.local (프로젝트 루트, Git 제외 권장)
VITE_API_URL=https://YOUR-BACKEND-URL/api/auth
VITE_SOCKET_URL=https://YOUR-BACKEND-URL
```

```bash
npm run build
npm run preview
```

브라우저에서 `http://localhost:4173` 등으로 접속해 동작을 확인하세요.

---

## 4. CORS / Socket.io (백엔드 쪽)

백엔드를 Railway 등에 배포할 때, **프론트 도메인**이 바뀌므로 서버의 CORS 설정을 반드시 확인하세요.

- **Express**: `cors({ origin: 'https://YOUR-VERCEL-APP.vercel.app' })` 또는 필요한 도메인 목록.
- **Socket.io**: `cors.origin`에 Vercel 앱 URL을 넣어두세요.

현재 `server/index.ts`는 `origin: '*'`로 되어 있어, 보안이 중요하면 배포 후 특정 도메인만 허용하도록 수정하는 것을 권장합니다.

---

## 요약

1. **백엔드** → Railway / Render / Fly.io 등에 배포하고 URL 확보.
2. **Vercel** → 이 레포 연결, `VITE_API_URL`, `VITE_SOCKET_URL` 환경 변수 설정 후 배포.
3. 배포된 Vercel URL로 접속해 로그인·방 만들기·소켓 연결이 되는지 확인.

프론트엔드만 Vercel에 올리면, 빌드 결과물(정적 파일)만 배포되므로 **Socket.io·Express·SQLite는 반드시 별도 서버**에서 실행해야 합니다.
