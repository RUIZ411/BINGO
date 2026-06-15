# BKG Bingo V1 - Pastel Readable Layout

방송용 빙고 사이트 V1 파스텔 디자인 수정본입니다.

## 이번 수정 사항

- 빙고 제목을 상단 탭 영역이 아니라 빙고판 바로 위에 표시
- 빙고 수와 치킨 수를 빙고판 아래에 표시
- MAX 배지 숨김 처리
- 긴 미션 문구가 덜 잘리도록 글자 수에 따라 폰트 크기 자동 조절
- 100px × 100px 칸 크기 유지
- 파스텔 박스형 디자인 유지
- 관리자 패널 접기/펼치기 유지
- OBS 화면은 투명 배경 기반으로 제목 → 빙고판 → 카운터 순서 유지
- Firebase Realtime Database URL 적용 완료
- @suweet.com 자동 추가 로그인 유지
- 세션 로그인 유지

## 화면 주소

- 공개 화면: `index.html?view=public`
- OBS 화면: `index.html?view=obs`
- 관리자 화면: `index.html?view=admin`

## GitHub 적용 방법

ZIP 파일을 그대로 올리지 말고 압축을 푼 뒤 아래 파일들을 기존 파일 위치에 덮어씌우세요.

```txt
index.html
style.css
app.js
README.md
firebase.rules.json
```

업로드 후 GitHub Pages 반영이 늦으면 `Ctrl + F5`로 강력 새로고침하세요.
