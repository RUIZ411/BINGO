# SUWEET BINGO V1 - 1:1 대결 화면 버전

## 적용된 주요 기능

- 방 4개 구조 유지
  - 1번 방
  - 2번 방
  - 3번 방
  - 수힛방
- 기본 방 생성 관리자 코드: `0305`
- 방 생성 시 5자리 랜덤 입장 코드 발급
- 각 방별 빙고판/치킨/현상금/메모/추첨 기록 독립 저장
- 1:1 대결 화면 추가
- 대결 화면에서 왼쪽 방 / 오른쪽 방 선택 가능
- 대결 화면에 표시될 양쪽 이름 직접 수정 가능
- 대결 구도 저장 시 관리자 코드 `0305` 필요
- 대결 화면에서 각 방의 빙고판, 빙고 수, 치킨 수를 실시간 비교 표시
- 기존 기능 유지
  - 현상금 모든 빙고 타입 지원
  - 현상금 개수 표시
  - 칸 수정 모드
  - 메모장 팝업
  - 숫자/알파벳/리셋 글자 확대
  - 송출용 화면/비율 조절

## 주소

방 선택 화면:

```txt
index.html
```

각 방 메인 화면:

```txt
index.html?room=room1&view=public
index.html?room=room2&view=public
index.html?room=room3&view=public
index.html?room=special&view=public
```

각 방 송출용:

```txt
index.html?room=room1&view=obs
index.html?room=room2&view=obs
index.html?room=room3&view=obs
index.html?room=special&view=obs
```

1:1 대결 화면:

```txt
index.html?view=battle
```

## Firebase Rules

Firebase Console > Realtime Database > Rules에 아래처럼 적용하세요.

```json
{
  "rules": {
    "bingoRooms": {
      ".read": true,
      ".write": true
    },
    "bingoBattle": {
      ".read": true,
      ".write": true
    }
  }
}
```

## GitHub 적용

압축을 푼 뒤 아래 파일들을 기존 위치에 덮어씌우세요.

```txt
index.html
style.css
app.js
firebase.rules.json
README.md
```

업로드 후 브라우저에서 `Ctrl + F5`로 강력 새로고침하세요.
