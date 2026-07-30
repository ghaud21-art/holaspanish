# Hola. — 스페인어 공부 앱

나만의 속도로 시작하는 스페인어 학습 앱. Prep(발음) → A1/A2(회화) → B1/B2(문법)로 이어지는
통합 커리큘럼, 레벨테스트, 단어 플래시카드, 작문 첨삭(현재는 로컬 규칙 기반 모의 채점),
스터디 그룹/작문 게시판/랭킹, 학습 기록을 이미지로 저장·공유하는 기능이 들어있어요.

## 로컬에서 실행하기

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 열면 됩니다. Supabase를 아직 연동하지 않아도
`.local-db.json` 파일에 데이터가 저장되면서 정상적으로 동작해요 (내 컴퓨터에서 테스트할 때만 유효).

## Supabase 설정 (여러 사람과 함께 쓰려면 꼭 필요해요)

이 앱은 프로필/진도, 스터디 그룹, 작문 게시판, 생성된 단어장처럼 "여러 사람이 같이 보는 데이터"를
Supabase(Postgres) 데이터베이스에 저장하도록 만들어져 있어요.

1. **Supabase 프로젝트 만들기**: [supabase.com](https://supabase.com)에서 로그인 후 "New Project"로 프로젝트를
   하나 만듭니다 (이름, 데이터베이스 비밀번호, 리전을 정하고 생성 — 1~2분 정도 걸려요).
2. **스키마 만들기**: 프로젝트가 준비되면 왼쪽 메뉴의 **SQL Editor**로 들어가서, 이 저장소의
   `supabase/schema.sql` 파일 내용을 통째로 붙여넣고 실행(Run)하세요. `profiles`, `groups`,
   `memberships`, `posts`, `generated_vocab`, `vocab_progress` 테이블이 만들어져요.
   (이미 예전 버전의 스키마를 실행해둔 프로젝트라면, `vocab_progress` 테이블을 추가하고
   그룹 없이도 작문 게시판을 쓸 수 있게 하기 위해 `supabase/schema.sql` 전체를 다시 한 번
   붙여넣고 실행해도 안전해요 — 전부 `if not exists`/`if exists`라 기존 데이터는 그대로 유지돼요.)
3. **키 확인하기**: **Project Settings > API**로 들어가서 `Project URL`과 `service_role` 키(⚠️ `anon` 키가
   아니라 `service_role` 키예요 — 이 키는 서버에서만 쓰고 절대 브라우저로 노출되지 않으니 안전해요)를 복사합니다.
4. **환경 변수 설정**: `.env.local.example`을 `.env.local`로 복사한 뒤 채웁니다.
   ```
   SUPABASE_URL=프로젝트 URL
   SUPABASE_SERVICE_ROLE_KEY=service_role 키
   ```
5. 앱을 다시 실행하면(`npm run dev`) 바로 Supabase로 저장돼요. 마이페이지 화면 맨 아래에서
   "Supabase 연동됨" 문구가 보이면 정상 연동된 거예요.

## 구글 로그인(회원가입/로그인) 설정

이제 앱은 구글 계정으로 로그인해야 쓸 수 있어요. 로그인한 계정에 학습 기록이 연결되니, 브라우저를
지우거나 다른 기기에서 접속해도 같은 구글 계정으로 로그인하면 기록이 그대로 보여요.

1. [Google Cloud Console > 사용자 인증 정보](https://console.cloud.google.com/apis/credentials)로 이동합니다
   (아무 프로젝트나 써도 되고, 새 프로젝트를 만들어도 돼요 — Supabase와는 무관해요).
2. "OAuth 동의 화면"을 먼저 설정해야 해요 (User Type은 "외부"로, 앱 이름/이메일 등 기본 정보만 입력하면 충분해요).
   테스트 단계에서는 "테스트 사용자"에 로그인할 구글 계정들(본인+친구들 이메일)을 추가해두세요.
3. "사용자 인증 정보 만들기 > OAuth 클라이언트 ID"를 선택하고, 애플리케이션 유형은 **웹 애플리케이션**으로 만듭니다.
   - 승인된 자바스크립트 원본: `http://localhost:3000` (배포 후에는 실제 배포 주소도 추가)
   - 승인된 리디렉션 URI: `http://localhost:3000/api/auth/callback/google` (배포 후에는 `https://내도메인/api/auth/callback/google`도 추가)
4. 발급된 **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 `.env.local`에 넣습니다.
   ```
   GOOGLE_OAUTH_CLIENT_ID=발급받은 클라이언트 ID
   GOOGLE_OAUTH_CLIENT_SECRET=발급받은 클라이언트 보안 비밀번호
   ```
5. **관리자 계정 지정**: 관리자로 쓸 구글 이메일 주소를 `ADMIN_EMAILS`에 등록하세요 (여러 명이면 쉼표로 구분).
   ```
   ADMIN_EMAILS=본인@gmail.com
   ```
   해당 이메일로 로그인하면 상단 메뉴에 "관리자" 항목이 나타나고, 전체 사용자/그룹 현황을 보거나
   부적절한 게시물·댓글을 지울 수 있어요.
6. `NEXTAUTH_SECRET`, `NEXTAUTH_URL`은 `.env.local.example`에 이미 기본값이 채워져 있어요. 배포할 때는
   `NEXTAUTH_URL`을 실제 배포 주소(`https://내도메인`)로 바꿔주세요.

## Gemini API 설정 (작문 첨삭 + 단어장 확장)

[Google AI Studio](https://aistudio.google.com/apikey)에서 API 키를 발급받아 `.env.local`의
`GEMINI_API_KEY`에 넣으면 두 가지가 실제 Gemini로 동작해요.

- **작문 첨삭**: 챕터 학습에서 작문을 제출하면 Gemini가 문법/표현을 보고 점수와 피드백을 줘요.
  (`GEMINI_API_KEY`가 없거나 호출이 실패하면 자동으로 `lib/grading.js`의 규칙 기반 채점으로 대체돼요.)
- **단어장 확장**: 관리자 화면에서 레벨/주제/개수를 입력하면 Gemini가 그 자리에서 단어+예문을 만들어
  Supabase(`generated_vocab` 테이블)에 저장하고, 모든 사용자의 "내 단어장" 화면에 바로 합쳐져서 보여요.
- **작문 도우미**: 챕터 학습의 작문 제출란에서 "💬 작문 도우미"를 열면 Gemini에게 힌트를 물어볼 수 있어요.
  정답 문장이나 번역은 알려주지 않고, 단어·표현 힌트와 이 레벨에 맞는 한글 문장 아이디어만 제안해요.

## 작문 게시판 (챕터학습 / 작문 연습 / 그룹)

작문 게시판은 항상 "내 게시판"(개인, `solo:{userId}`)을 가지고 있어서 스터디 그룹에 가입하지 않아도
쓸 수 있어요. 그룹에 가입하면 그룹 게시판 탭이 추가로 생기고, 챕터 작문을 제출하면 두 게시판에
모두 기록돼요 — 그룹에 가입해도 개인 게시판 기록은 사라지지 않아요. 게시판은 세 탭으로 나뉘어요.

- **챕터학습**: Prep/A1/A2/B1/B2 레벨 카드를 고르면 그 레벨에서 내가 제출한 챕터 작문을 3열 그리드로 모아볼 수 있어요.
- **작문 연습**: "연습 문장 추천받기"를 누르면 Gemini가 지금까지 완료한 챕터의 어휘 범위 안에서
  두 문장짜리 한국어 문장을 추천해요. 스페인어로 두 문장 이상 번역해서 제출하면 (한국어 뜻을 잘
  담았는지 + 문법이 맞는지 기준으로) 채점되고, 통과 여부와 상관없이 게시판에 기록돼요.
- **{그룹 이름}**: 그룹에 가입한 경우에만 보이는, 그룹원들과 함께 보는 게시판이에요.

## AI 사용량 제한 (무료 10회 + 관리자 무제한 허용)

작문 첨삭과 작문 도우미(둘을 합쳐서)는 기본적으로 계정당 10회까지 무료로 쓸 수 있어요
(`profiles.ai_usage_count`로 서버에서 집계). 10회를 다 쓰면 작문 첨삭은 규칙 기반 채점으로
자동 전환되고, 작문 도우미는 더 이상 답하지 않고 안내 메시지를 보여줘요.

관리자 화면의 "전체 사용자" 표에서 사용자별로 "무제한 허용" 버튼을 눌러 특정 사용자의
`ai_unlimited`를 켜면, 그 사용자는 횟수 제한 없이 계속 Gemini 기능을 쓸 수 있어요.

## 복습 퀴즈 & 오답노트

상단 메뉴 "단어장" 안의 "복습 퀴즈" 탭에서 라이트너(Leitner) 방식의 간격 반복 복습을 할 수 있어요
(메뉴를 너무 늘리지 않으려고 단어장 화면 안의 탭으로 통합했어요).

- 챕터 단어카드에서 "알아요"를 누르거나 단어장에서 카드를 뒤집으면, 그 단어가 `vocab_progress` 테이블에
  기록되고 다음날부터 복습 대상이 돼요.
- "복습 퀴즈"에서 정답을 맞히면 복습 간격이 1일 → 3일 → 7일 → 16일 → 35일로 점점 늘어나고,
  틀리면 다시 1일 뒤로 돌아가면서 "오답노트"에 들어가요.
- 오답노트에 있는 단어는 퀴즈에서 다시 맞혀야 사라져요.

## GitHub에 올리기

이 폴더 자체를 git 저장소로 초기화해서 관리해요 (상위 폴더와는 무관).

```bash
git init
git add .
git commit -m "Initial commit"
```

그다음 [github.com](https://github.com/new)에서 새 저장소를 만들고, 안내되는 명령어로 origin을 추가해 푸시하면 됩니다.
```bash
git remote add origin <새로 만든 저장소 URL>
git branch -M main
git push -u origin main
```

## Vercel에 배포하기

Vercel CLI가 이미 로그인되어 있다면 이 폴더에서 바로 배포할 수 있어요.
```bash
vercel        # 미리보기 배포
vercel --prod # 실제 서비스용 배포
```
또는 GitHub에 올린 뒤 [vercel.com/new](https://vercel.com/new)에서 저장소를 가져와 배포할 수도 있어요.

**배포 후 꼭 해야 할 일**: Vercel 프로젝트 설정의 "Environment Variables"에 `.env.local`에 있는 값들을
전부 등록해야 해요.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase 연동용 (없으면 로컬 저장 모드로 동작하다가 새로고침할 때마다 데이터가 초기화될 수 있어요)
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` — 구글 로그인용
- `NEXTAUTH_SECRET` — `.env.local`에 있는 값 그대로 등록
- `NEXTAUTH_URL` — 반드시 실제 배포 주소로! (예: `https://holaspanish.vercel.app`)
- `ADMIN_EMAILS` — 관리자로 쓸 구글 이메일
- `GEMINI_API_KEY` — 없으면 작문 첨삭은 규칙 기반 모의 채점으로 자동 대체되고, 단어장 확장은 비활성화돼요.

그리고 위 "구글 로그인 설정"의 3번 단계로 돌아가서, Google Cloud Console의 OAuth 클라이언트에
배포된 주소(`https://내도메인`과 `https://내도메인/api/auth/callback/google`)를 승인된 원본/리디렉션 URI로
추가해줘야 배포된 사이트에서도 로그인이 동작해요.

## 참고

- 커리큘럼 데이터: `data/curriculum.js` (Prep 10개, 회화 I/II 각 30개, 문법 Unidad 01~60)
- 보너스 단어장: `data/bonusVocab.js` (개인 단어장 PDF에서 고른 약 330개 — 원본은 1,000여 개라 오탈자 위험 때문에 우선 이 정도로 추렸어요. 더 채우고 싶으면 말씀해주세요.)
- 작문 첨삭은 `GEMINI_API_KEY`가 설정되어 있으면 Gemini가 채점하고, 없거나 호출이 실패하면
  `lib/grading.js`의 규칙 기반 모의 채점으로 자동 대체돼요.
- 프로필/그룹/게시판/생성된 단어장 데이터는 Supabase(Postgres)에 저장돼요 (`lib/supabaseDb.js`).
  Supabase 미설정 시 `.local-db.json` 파일로 자동 대체됩니다 (`lib/localFallback.js`).
