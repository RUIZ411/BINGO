# SUWEET BINGO - 대결방 시작 오류 핫픽스

## 포함 내용
- 숫자빙고 대결방 추가 버전의 앱 시작 오류 수정
- 방 선택 화면이 비어 보이거나 기존 빙고방 화면이 멈추는 문제 수정
- 원인: 대결방 기본 상태 상수가 초기화되기 전에 `makeInitialBattleState()`가 먼저 실행되어 앱 전체가 중단될 수 있던 문제
- 앱 시작 순서를 모든 함수/상수 선언 이후로 지연 처리
- 오류 발생 시에도 방 선택 화면으로 복구하는 안전장치 추가

## 유지 기능
- 기존 빙고방 4개
- 대결방 4개
- 숫자빙고 10×10 순서 배치
- 리셋빙고 줄/전체 체크 해제
- 송출용 화면 핫픽스

## 적용 방법
압축을 풀고 GitHub 저장소 루트에 아래 파일을 덮어씌워 주세요.

- index.html
- style.css
- app.js
- firebase.rules.json
- README.md

업로드 후 `Ctrl + F5`로 강력 새로고침하세요.

Firebase Rules에는 `battleRooms`가 포함되어야 합니다.

```json
{
  "rules": {
    "bingoRooms": {
      ".read": true,
      ".write": true
    },
    "battleRooms": {
      ".read": true,
      ".write": true
    }
  }
}
```
