// 상태 뱃지에 시간 + 온라인 표시
function updateLandingStatus(){
  const el = document.getElementById("landing-status");
  if(!el) return;
  const now = new Date();
  const t = now.toTimeString().slice(0,8);
  el.textContent = `● ONLINE | ${t}`;
}

setInterval(updateLandingStatus, 1000);
updateLandingStatus();

// 버튼 이동
document.getElementById("go-home-btn").addEventListener("click", ()=>{
  // 네가 만든 홈 페이지 경로
  location.href = "home.html";
});

document.getElementById("go-discord-btn").addEventListener("click", ()=>{
  // 여기에 실제 디스코드 초대 링크 넣으면 됨
  // 예: location.href = "https://discord.gg/xxxxx";
  alert("여기에 디스코드 초대 링크 연결 예정.");
});
