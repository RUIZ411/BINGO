# BKG Bingo V1 - number draw update

- 메인 화면 좌측 빙고판 / 우측 관리자 패널 구조
- 빙고판 위 제목, 빙고판 아래 BINGO/🍗 카운터
- 숫자 타입 빙고판에서 `1~100 숫자 추첨` 기능 추가
- 숫자 타입 빙고 생성 시 1~100 중 칸 수만큼 랜덤 배치
  - 5×5: 25개 랜덤 숫자
  - 7×7: 49개 랜덤 숫자
  - 10×10: 100개 랜덤 숫자
- 추첨된 숫자가 빙고판에 있으면 해당 칸 자동 지움
- 추첨 기록 초기화 버튼 추가
- Firebase DB URL 적용: https://bingo-d4a00-default-rtdb.firebaseio.com/
- `@suweet.com` 자동 로그인, 세션 로그인 유지

GitHub에는 ZIP이 아니라 압축을 푼 뒤 안의 파일들을 기존 위치에 덮어씌우세요.
