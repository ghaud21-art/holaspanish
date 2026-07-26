# Hola. — 스페인어 공부 앱

나만의 속도로 시작하는 스페인어 학습 앱. Prep(발음) → A1/A2(회화) → B1/B2(문법)로 이어지는
통합 커리큘럼, 레벨테스트, 단어 플래시카드, 작문 첨삭(현재는 로컬 규칙 기반 모의 채점),
스터디 그룹/작문 게시판/랭킹, 학습 기록을 이미지로 저장·공유하는 기능이 들어있어요.

## 로컬에서 실행하기

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 열면 됩니다. 구글 시트를 아직 연동하지 않아도
`.local-db.json` 파일에 데이터가 저장되면서 정상적으로 동작해요 (내 컴퓨터에서 테스트할 때만 유효).

## 구글 시트 연동 설정 (여러 사람과 함께 쓰려면 꼭 필요해요)

이 앱은 프로필/진도, 스터디 그룹, 작문 게시판처럼 "여러 사람이 같이 보는 데이터"를
구글 시트에 저장하도록 만들어져 있어요. 아래 순서대로 설정하면 됩니다.

1. **구글 시트 새로 만들기**: [sheets.google.com](https://sheets.google.com) 에서 빈 스프레드시트를 하나 만들고,
   주소창의 URL에서 시트 ID를 복사해두세요. (`https://docs.google.com/spreadsheets/d/이 부분이 시트 ID/edit`)
2. **구글 클라우드 서비스 계정 만들기**:
   - [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트를 만듭니다 (또는 기존 프로젝트 사용).
   - "API 및 서비스 > 라이브러리"에서 **Google Sheets API**를 검색해서 사용 설정합니다.
   - "API 및 서비스 > 사용자 인증 정보 > 사용자 인증 정보 만들기 > 서비스 계정"으로 서비스 계정을 만듭니다.
   - 만든 서비스 계정으로 들어가서 "키 > 키 추가 > 새 키 만들기 > JSON"을 선택해 키 파일을 다운로드합니다.
3. **시트에 서비스 계정 공유하기**: 다운로드한 JSON 파일 안의 `client_email` 값(예: `xxx@xxx.iam.gserviceaccount.com`)을
   복사해서, 1번에서 만든 구글 시트의 "공유" 버튼으로 **편집자(Editor)** 권한으로 초대합니다. (이 단계를 빼먹으면 연동이 안 돼요!)
4. **환경 변수 설정**: `.env.local.example`을 `.env.local`로 복사한 뒤, JSON 키 파일의 값으로 채웁니다.
   ```
   GOOGLE_SHEET_ID=1번에서 복사한 시트 ID
   GOOGLE_SERVICE_ACCOUNT_EMAIL=JSON 파일의 client_email
   GOOGLE_PRIVATE_KEY=JSON 파일의 private_key ("-----BEGIN PRIVATE KEY-----...")
   ```
   `GOOGLE_PRIVATE_KEY`는 줄바꿈이 포함된 긴 문자열이에요. `.env.local`에 그대로 붙여넣으면 되고,
   Vercel에 등록할 때는 값 안의 줄바꿈이 `\n` 텍스트로 바뀌어도 앱이 알아서 처리하니 걱정하지 않아도 됩니다.
5. 앱을 다시 실행하면(`npm run dev`), 필요한 탭(Profiles/Groups/Memberships/Posts)이 시트에 자동으로 생성돼요.
   마이페이지 화면 맨 아래에서 "구글 시트 연동됨" 문구가 보이면 정상 연동된 거예요.

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

**배포 후 꼭 해야 할 일**: Vercel 프로젝트 설정의 "Environment Variables"에 `.env.local`과 같은 세 값
(`GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`)을 등록해야 배포된 사이트에서도
구글 시트 연동이 동작해요. 등록하지 않으면 배포된 사이트는 서버리스 환경 특성상 "로컬 저장 모드"로 동작하다가
새로고침할 때마다 데이터가 초기화될 수 있어요.

## 참고

- 커리큘럼 데이터: `data/curriculum.js` (Prep 10개, 회화 I/II 각 30개, 문법 Unidad 01~60)
- 보너스 단어장: `data/bonusVocab.js` (개인 단어장 PDF에서 고른 약 330개 — 원본은 1,000여 개라 오탈자 위험 때문에 우선 이 정도로 추렸어요. 더 채우고 싶으면 말씀해주세요.)
- 작문 첨삭은 현재 실제 Gemini API가 아니라 `lib/grading.js`의 규칙 기반 모의 채점이에요. 나중에 Gemini API 키가
  생기면 이 파일 안의 `mockGrade` 호출부만 실제 API 호출로 바꾸면 됩니다.
