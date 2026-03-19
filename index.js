const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// JSON 파싱 (필요 시)
app.use(express.json());

// 정적 파일 서빙 (index.html, style.css, script.js, 이미지 등)
app.use(express.static(path.join(__dirname, "public")));

// 메인 페이지
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// (필요하면 추후 API 라우트 여기 추가)

// 서버 시작
app.listen(PORT, () => {
  console.log(`rlnl GAME HUB server on port ${PORT}`);
});
