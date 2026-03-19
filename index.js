require("dotenv").config?.(); // .env 쓰면 자동 로드

const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// === 디스코드 OAuth 설정 ===
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "YOUR_CLIENT_ID";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "YOUR_CLIENT_SECRET";
const BASE_URL = process.env.BASE_URL || "https://example.com"; // 배포 도메인
const REDIRECT_URI = `${BASE_URL}/account/callback`;            // 디스코드 개발자 포털에도 동일하게 등록

// 공통 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일
app.use(express.static(path.join(__dirname, "public")));

// ===== 1) 랜딩 페이지 (/link/main) =====

app.get("/link/main", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "link-main.html"));
});

// ===== 2) 디스코드 OAuth2 시작 =====

// 랜딩에서 "디스코드로 계속하기"가 이 URL로 이동해도 됨
app.get("/auth/discord", (req, res) => {
  const state = Buffer.from(
    JSON.stringify({
      ts: Date.now()
    })
  ).toString("base64url");

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "identify", // 필요하면 guilds, guilds.join, email 등 추가
    state
  });

  const url = `https://discord.com/oauth2/authorize?${params.toString()}`;
  return res.redirect(url);
});

// ===== 3) 디스코드 콜백 (/account/callback) =====

app.get("/account/callback", async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;

  if (!code) {
    return res.status(400).send("code 파라미터가 없습니다.");
  }

  try {
    // state 복호화 (여기선 그냥 유효성만 대충 체크)
    if (state) {
      try {
        const decoded = JSON.parse(
          Buffer.from(state, "base64url").toString("utf8")
        );
        // TODO: ts 범위 체크 등
      } catch (e) {
        console.warn("state 디코드 실패:", e);
      }
    }

    // 1) code -> access_token 교환
    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const { access_token, token_type } = tokenRes.data;

    // 2) 유저 정보 조회
    const meRes = await axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `${token_type} ${access_token}`
      }
    });

    const user = meRes.data; // { id, username, global_name, avatar, ... }

    // TODO: 여기서 DB에 user.id / username 등 저장하고
    //       디스코드 봇과 연동(역할 지급 등) 처리하면 guildsrestore 같은 구조 완성

    // 3) 인증 완료 페이지로 리다이렉트
    const redirectUrl = `/account/complete?username=${encodeURIComponent(
      user.global_name || user.username
    )}`;

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("Discord OAuth 에러:", err.response?.data || err.message);
    return res.status(500).send("디스코드 인증 처리 중 오류가 발생했습니다.");
  }
});

// ===== 4) 인증 완료 페이지 =====

app.get("/account/complete", (req, res) => {
  const username = req.query.username || "알 수 없음";

  // 여기서는 HTML을 직접 쏴서 간단히 처리 (원하면 public/complete.html 로 빼도 됨)
  res.send(`
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>인증 완료 - rlnl GAME HUB</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      min-height: 100vh;
      margin: 0;
      background: radial-gradient(circle at top left, #0f172a, #020617 55%, #000);
      color: #f9fafb;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }
    .card {
      max-width: 420px;
      width: 100%;
      background: #020617;
      border-radius: 20px;
      border: 1px solid rgba(148,163,184,.4);
      box-shadow: 0 20px 50px rgba(0,0,0,.9);
      padding: 22px 20px 20px;
      text-align: center;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 1.3rem;
      font-weight: 800;
    }
    p {
      margin: 4px 0;
      font-size: .9rem;
      color: #d1d5db;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 14px;
      padding: 8px 18px;
      border-radius: 999px;
      border: none;
      background: linear-gradient(135deg,#3b82f6,#22c55e);
      color: #0b1120;
      font-weight: 700;
      font-size: .9rem;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>인증 완료</h1>
    <p><strong>${username}</strong> 님, 디스코드 계정 연동이 완료되었습니다.</p>
    <p>이제 rlnl GAME HUB의 기능을 정상적으로 이용하실 수 있습니다.</p>
    <a class="btn" href="/">메인으로 돌아가기</a>
  </div>
</body>
</html>
  `);
});

// ===== 5) 루트 (원하면 기존 허브로 교체 가능) =====
app.get("/", (req, res) => {
  // 일단은 /link/main 으로 보내서, 링크 랜딩이 메인처럼 보이게
  return res.redirect("/link/main");
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`rlnl GAME HUB OAuth server on port ${PORT}`);
});
