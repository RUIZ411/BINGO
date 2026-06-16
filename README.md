# BKG Bingo V1 - OBS Dark Scale Version

## 포함 기능

- 메인 화면: 좌측 빙고판 / 우측 관리자 패널
- OBS 화면: 어두운 배경 + 중앙 흰색 송출 박스
- OBS 화면에서 타이틀, 빙고판, BINGO 수, 🍗 수를 하나의 큰 박스로 묶어서 표시
- OBS 화면 우측 확대/축소 버튼: 100%, 80%, 67%, 50%
- 숫자 타입 빙고: 1~100 숫자 랜덤 배치
- 숫자 랜덤 추첨: 1~100 중복 없이 추첨 후 빙고판에 있으면 자동 지움
- 5×5 / 7×7 / 10×10 빙고판 생성
- Firebase Realtime Database 연결 적용
- @suweet.com 자동 추가 로그인
- 세션 로그인 방식

## 화면 주소

- 메인 화면: `index.html?view=public`
- OBS 화면: `index.html?view=obs`

## OBS 화면 비율

OBS 화면 우측의 버튼을 클릭하면 전체 송출 박스가 확대/축소됩니다.

- 5×5: 100% 추천
- 7×7: 80% 추천
- 10×10: 67% 또는 50% 추천

주소에 직접 비율을 넣고 싶으면 아래처럼 사용할 수도 있습니다.

- `index.html?view=obs&scale=1`
- `index.html?view=obs&scale=0.8`
- `index.html?view=obs&scale=0.67`
- `index.html?view=obs&scale=0.5`

## GitHub 적용

압축을 풀고 아래 파일들을 기존 저장소의 같은 위치에 덮어씌우세요.

- `index.html`
- `style.css`
- `app.js`
- `README.md`
- `firebase.rules.json`

업로드 후에는 `Ctrl + F5`로 강력 새로고침하세요.

## 2026-06-16 추가 수정

- 알파벳 빙고도 A~Z 26개 중 25개가 중복 없이 랜덤 배치되도록 수정했습니다.
- 리셋 빙고와 동일하게 5×5 고정이며, 빙고판 생성/내용 랜덤 섞기 시 새 랜덤 알파벳 배치를 생성합니다.
