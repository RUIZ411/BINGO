# SUWEET BINGO V1

GitHub Pages + Firebase Realtime Database 기반 빙고 사이트입니다.

## 이번 버전 변경사항

- 내용 타입에 `리셋` 추가
- 리셋 빙고는 A~Z 26개 알파벳 중 25개가 랜덤으로 배치되는 5×5 빙고입니다.
- 빙고 타입별 칸 수 제한 적용
  - 숫자 빙고: 5×5, 7×7, 10×10
  - 미션 빙고: 5×5 고정
  - 알파벳 빙고: 5×5 고정
  - 리셋 빙고: 5×5 고정
- 숫자 빙고의 1~100 랜덤 추첨 기능 유지
- OBS 어두운 배경 + 송출 박스 + 비율 조절 기능 유지
- Firebase DB URL 적용 유지
- `@suweet.com` 자동 로그인 방식 유지
- 세션 로그인 방식 유지

## 화면 주소

- 메인/관리 화면: `index.html?view=public`
- OBS 화면: `index.html?view=obs`

## GitHub 적용 방법

ZIP 파일을 그대로 올리지 말고 압축을 푼 뒤 아래 파일들을 기존 위치에 덮어씌우세요.

- `index.html`
- `style.css`
- `app.js`
- `firebase.rules.json`
- `README.md`

업로드 후 화면이 바로 바뀌지 않으면 `Ctrl + F5`로 강력 새로고침하세요.
