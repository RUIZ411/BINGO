# BKG Bingo V1

방송용 빙고 사이트 V1입니다.

## 포함 기능

- 5×5 / 7×7 / 10×10 빙고판 생성
- 숫자 / 알파벳 / 미션 타입 생성
- 관리자 화면에서 칸 내용 수정
- 칸 지움/복구
- 빙고 수 자동 계산
- 🍗 치킨 카운트 수동 조절
- 빙고 완성 시 BINGO 효과 + 줄 긋기 효과
- 공개 화면, OBS 화면, 관리자 화면 분리
- Firebase Realtime Database 연동 가능
- Firebase 미설정 시 localStorage 데모 모드

## 화면 주소

- 공개 화면: `index.html?view=public`
- OBS 화면: `index.html?view=obs`
- 관리자 화면: `index.html?view=admin`

## Firebase 적용 방법

1. Firebase 콘솔에서 프로젝트를 만듭니다.
2. Web App을 추가합니다.
3. Realtime Database를 생성합니다.
4. Authentication > Email/Password 로그인을 활성화합니다.
5. 관리자 계정을 하나 생성합니다.
6. `app.js` 상단의 `firebaseConfig` 값을 Firebase 콘솔의 설정값으로 교체합니다.
7. Realtime Database Rules에 `firebase.rules.json` 내용을 적용합니다.

## 로컬 데모 모드

`app.js`의 `firebaseConfig`가 비어 있으면 브라우저 localStorage로만 동작합니다.
관리자 PIN 기본값은 `1234`입니다.

```js
const LOCAL_ADMIN_PIN = "1234";
```

실제 방송용으로 사용할 때는 Firebase Auth를 쓰는 것을 권장합니다.
