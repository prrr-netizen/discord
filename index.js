const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// JSON 파싱 (필요하면 사용)
app.use(express.json());

// 정적 파일 서빙 (index.html, style.css, script.js, bulma.min.css, 이미지 등)
app.use(express.static(__dirname));

// 메인 페이지: rlnl GAME HUB
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`rlnl GAME HUB server on port ${PORT}`);
});
