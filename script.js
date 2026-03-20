const STORAGE_KEY = "coreplay_user";
let state = { nickname: null, points: 0, lastBonusDate: null, discordUser:null };

const matches = [
  { id:1, type:"football", league:"CORE 리그 · 축구", title:"RED FC vs BLUE FC", time:"오늘 21:00", desc:"득점 예측 미니 이벤트 (포인트 참여)", tag:["축구","라이브예정"], cost:100 },
  { id:2, type:"esports", league:"e-ARENA · FPS", title:"RIVALS CUP S2", time:"오늘 22:30", desc:"킬 수 맞추기 포인트 챌린지", tag:["FPS","e스포츠"], cost:150 },
  { id:3, type:"football", league:"CORE 리그 · 축구", title:"CITY SC vs UNITED SC", time:"내일 19:00", desc:"승부 예측 참여형 이벤트", tag:["축구","이벤트"], cost:80 },
  { id:4, type:"mini", league:"MINI GAME", title:"룰렛 스핀 이벤트", time:"상시 참여 가능", desc:"룰렛 돌려 랜덤 보상 받기", tag:["룰렛","랜덤"], cost:50 },
  { id:5, type:"esports", league:"e-ARENA · MOBA", title:"CORE 챔피언십", time:"이번 주말", desc:"승리팀 예측 참여형 포인트 이벤트", tag:["MOBA","e스포츠"], cost:120 },
};

const userInfoEl      = document.getElementById("user-info");
const logoutBtn       = document.getElementById("logout-btn");
const authBox         = document.getElementById("auth-box");
const walletBox       = document.getElementById("wallet-box");
const balanceText     = document.getElementById("balance-text");
const loginBtn        = document.getElementById("login-btn");
const nicknameInput   = document.getElementById("nickname-input");
const chargeBtn       = document.getElementById("charge-btn");
const bonusBtn        = document.getElementById("bonus-btn");
const matchListEl     = document.getElementById("match-list");
const filterBtns      = document.querySelectorAll(".filter-btn");
const toastEl         = document.getElementById("toast");
const gamePlayBtns    = document.querySelectorAll(".game-play-btn");

// 충전 모달 요소 (있으면 작동, 없으면 자동 무시)
const modalBackdrop      = document.getElementById("charge-modal-backdrop");
const modalCloseBtn      = document.getElementById("charge-modal-close");
const modalOkBtn         = document.getElementById("charge-modal-ok");
const modalDiscordBtn    = document.getElementById("charge-modal-discord-btn");
const modalDiscordUserEl = document.getElementById("modal-discord-user");
const modalNicknameEl    = document.getElementById("modal-nickname");
const modalPointsEl      = document.getElementById("modal-points");

// ===== 상태 로드/저장 =====
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(parsed.nickname) state.nickname = parsed.nickname;
      if(typeof parsed.points === "number") state.points = parsed.points;
      if(parsed.lastBonusDate) state.lastBonusDate = parsed.lastBonusDate;
      if(parsed.discordUser) state.discordUser = parsed.discordUser;
    }
  }catch(e){}
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ===== UI 렌더 =====
function renderUser(){
  if(state.nickname){
    userInfoEl.innerHTML = `안녕하세요, <span>${state.nickname}</span> 님`;
    authBox.style.display = "flex";
    authBox.style.visibility = "hidden";
    authBox.style.height = "0";
    walletBox.style.display = "flex";
    logoutBtn.style.display = "inline-flex";
  }else{
    userInfoEl.textContent = "비로그인 상태입니다";
    authBox.style.display = "flex";
    authBox.style.visibility = "visible";
    authBox.style.height = "auto";
    walletBox.style.display = "none";
    logoutBtn.style.display = "none";
  }
  balanceText.textContent = `${state.points}P`;
  if(modalPointsEl) modalPointsEl.textContent = `${state.points}P`;
  if(modalNicknameEl) modalNicknameEl.textContent = state.nickname || "-";
}

function showToast(msg){
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  setTimeout(()=>{toastEl.style.display = "none";}, 1800);
}

// ===== 쿨타임 관리 =====
const cooldowns = {
  bonus:   1000 * 5,
  guess:   1000 * 3,
  highlow: 1000 * 3,
  event:   1000 * 2
};
const lastUsed = {
  bonus:   0,
  guess:   0,
  highlow: 0,
  event:   0
};

function checkCooldown(key){
  const now = Date.now();
  const gap = now - (lastUsed[key] || 0);
  if(gap < cooldowns[key]){
    const left = Math.ceil((cooldowns[key] - gap)/1000);
    showToast(`잠시 후 다시 시도해 주세요. (${left}초)`);
    return false;
  }
  lastUsed[key] = now;
  return true;
}

// ===== 매치 리스트 =====
function renderMatches(filter="all"){
  if(!matchListEl) return; // 홈에서 안 쓰면 무시

  matchListEl.innerHTML = "";
  matches
    .filter(m => filter==="all" ? true : m.type===filter)
    .forEach(m => {
      const div = document.createElement("div");
      div.className = "match-card";
      div.innerHTML = `
        <div class="match-main">
          <div class="match-league">${m.league}</div>
          <div class="match-teams">${m.title}</div>
          <div class="match-time">${m.time}</div>
          <div class="match-meta">${m.desc}</div>
        </div>
        <div class="match-actions">
          <div class="tag-row">
            ${m.tag.map(t=>`<span class="tag">${t}</span>`).join("")}
            <span class="tag">${m.cost}P 필요</span>
          </div>
          <button class="btn-play" data-id="${m.id}">포인트로 참여</button>
        </div>
      `;
      matchListEl.appendChild(div);
    });

  document.querySelectorAll(".btn-play").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const id = Number(btn.dataset.id);
      handleEventJoin(id);
    });
  });
}

function handleEventJoin(id){
  if(!state.nickname){
    showToast("로그인 후 참여할 수 있습니다.");
    return;
  }
  if(!checkCooldown("event")) return;

  const match = matches.find(m=>m.id===id);
  if(!match) return;
  if(state.points < match.cost){
    showToast(`포인트가 부족합니다. (${match.cost}P 필요)`);
    return;
  }
  state.points -= match.cost;
  saveState();
  renderUser();
  showToast(`${match.title} 이벤트에 참여했습니다. (-${match.cost}P)`);
}

// ===== 로그인 / 로그아웃 =====
loginBtn.addEventListener("click",()=>{
  const nick = nicknameInput.value.trim();
  if(!nick){
    showToast("닉네임을 입력해 주세요.");
    return;
  }
  if(nick.length > 16){
    showToast("닉네임은 16자 이내로 입력해 주세요.");
    return;
  }
  state.nickname = nick;
  if(state.points === 0){
    state.points = 500;
    showToast("첫 로그인 보너스 500P가 지급되었습니다.");
  }
  saveState();
  renderUser();
});

logoutBtn.addEventListener("click",()=>{
  state.nickname = null;
  saveState();
  renderUser();
  showToast("로그아웃되었습니다.");
});

// ===== 포인트 충전 =====
chargeBtn.addEventListener("click",()=>{
  if(!state.nickname){
    showToast("로그인 후 이용해 주세요.");
    return;
  }

  // 모달 있으면 모달로, 없으면 prompt로
  if(modalBackdrop){
    if(modalDiscordUserEl) modalDiscordUserEl.textContent = state.discordUser || "연동되지 않음";
    if(modalNicknameEl)    modalNicknameEl.textContent    = state.nickname || "-";
    if(modalPointsEl)      modalPointsEl.textContent      = `${state.points}P`;
    modalBackdrop.classList.add("show");
    return;
  }

  const input = prompt("충전할 포인트를 입력해 주세요. (1 ~ 50000)");
  if(!input) return;
  const amount = Number(input);
  if(!Number.isFinite(amount) || amount<=0){
    showToast("올바른 숫자를 입력해 주세요.");
    return;
  }
  if(amount > 50000){
    showToast("한 번에 최대 50,000P까지만 충전할 수 있습니다.");
    return;
  }
  state.points += amount;
  saveState();
  renderUser();
  showToast(`${amount}P가 충전되었습니다.`);
});

// ===== 충전 모달 제어 =====
if(modalBackdrop){
  function closeChargeModal(){
    modalBackdrop.classList.remove("show");
  }
  if(modalCloseBtn) modalCloseBtn.addEventListener("click", closeChargeModal);
  if(modalOkBtn)    modalOkBtn.addEventListener("click", closeChargeModal);
  modalBackdrop.addEventListener("click",(e)=>{
    if(e.target === modalBackdrop) closeChargeModal();
  });
  if(modalDiscordBtn){
    modalDiscordBtn.addEventListener("click",()=>{
      alert("여기 디스코드 초대/봇 링크 연동 예정.");
    });
  }
}

// ===== 출석 보너스 =====
bonusBtn.addEventListener("click",()=>{
  if(!state.nickname){
    showToast("로그인 후 이용해 주세요.");
    return;
  }
  if(!checkCooldown("bonus")) return;

  const today = new Date().toISOString().slice(0,10);
  if(state.lastBonusDate === today){
    showToast("오늘은 이미 출석 보너스를 받았습니다.");
    return;
  }
  state.lastBonusDate = today;
  state.points += 200;
  saveState();
  renderUser();
  showToast("출석 보너스 200P가 지급되었습니다.");
});

// ===== 미니게임: 숫자 맞추기 =====
function playGuess(){
  if(!state.nickname){
    showToast("로그인 후 이용해 주세요.");
    return;
  }
  if(!checkCooldown("guess")) return;

  const cost = 50;
  if(state.points < cost){
    showToast("포인트가 부족합니다. (50P 필요)");
    return;
  }
  const answer = Math.floor(Math.random()*5)+1;
  const input = prompt("1~5 사이 숫자를 하나 입력하세요.");
  if(!input) return;
  const guess = Number(input);
  state.points -= cost;
  if(guess === answer){
    const reward = 100;
    state.points += reward;
    showToast(`정답! +${reward-cost}P (총 ${reward}P 획득)`);
  }else{
    showToast(`꽝! 정답은 ${answer}였습니다. (-${cost}P)`);
  }
  saveState();
  renderUser();
}

// ===== 미니게임: 하이로우 =====
function playHighLow(){
  if(!state.nickname){
    showToast("로그인 후 이용해 주세요.");
    return;
  }
  if(!checkCooldown("highlow")) return;

  const cost = 100;
  if(state.points < cost){
    showToast("포인트가 부족합니다. (100P 필요)");
    return;
  }
  const base = Math.floor(Math.random()*10)+1;
  const choice = prompt(`기준 숫자: ${base}\n'높음' 또는 '낮음'을 입력하세요.`);
  if(!choice) return;
  const c = choice.trim();
  const next = Math.floor(Math.random()*10)+1;
  state.points -= cost;
  let win = false;
  if(c === "높음" && next > base) win = true;
  if(c === "낮음" && next < base) win = true;

  if(win){
    const reward = 160;
    state.points += reward;
    showToast(`성공! 새 숫자: ${next} ( +${reward-cost}P )`);
  }else{
    showToast(`실패! 새 숫자: ${next} (-${cost}P)`);
  }
  saveState();
  renderUser();
}

// ===== 미니게임 버튼 바인딩 =====
gamePlayBtns.forEach(btn=>{
  btn.addEventListener("click",()=>{
    const game = btn.dataset.game;
    if(game==="guess")   playGuess();
    if(game==="highlow") playHighLow();
  });
});

// ===== 필터 탭 바인딩 =====
filterBtns.forEach(btn=>{
  btn.addEventListener("click",()=>{
    filterBtns.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;
    renderMatches(filter);
  });
});

// ===== 상태 뱃지 시간 =====
setInterval(()=>{
  const now = new Date();
  const t = now.toTimeString().slice(0,8);
  const badge = document.getElementById("status-badge");
  if(badge) badge.textContent = `● ONLINE | ${t}`;
},1000);

// 초기화
loadState();
renderUser();
renderMatches("all");
