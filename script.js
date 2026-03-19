// 더미: 온라인 인원/세션/충전 건수 조금씩 변동
(function () {
  const onlineEl = document.getElementById("online-players");
  const heroOnlineEl = document.getElementById("hero-online-count");
  const sessionEl = document.getElementById("session-count");
  const todayChargeEl = document.getElementById("today-charge-count");

  if (!onlineEl || !heroOnlineEl || !sessionEl || !todayChargeEl) return;

  let baseOnline = parseInt(onlineEl.textContent || "40", 10);
  let baseSession = parseInt(sessionEl.textContent || "5", 10);
  let baseTodayCharge = parseInt(todayChargeEl.textContent || "27", 10);

  function tick() {
    const onlineDiff = Math.floor(Math.random() * 5) - 2;
    const sessionDiff = Math.random() > 0.75 ? (Math.random() > 0.5 ? 1 : -1) : 0;
    const chargeDiff = Math.random() > 0.6 ? 1 : 0;

    baseOnline = Math.max(0, baseOnline + onlineDiff);
    baseSession = Math.max(1, baseSession + sessionDiff);
    baseTodayCharge = Math.max(0, baseTodayCharge + chargeDiff);

    onlineEl.textContent = baseOnline;
    heroOnlineEl.textContent = baseOnline;
    sessionEl.textContent = baseSession + "개";
    todayChargeEl.textContent = baseTodayCharge + "건";
  }

  tick();
  setInterval(tick, 5000);
})();

// 충전 버튼 클릭 느낌만 살짝
(function () {
  const chargeBtn = document.getElementById("charge-button");
  if (!chargeBtn) return;

  chargeBtn.addEventListener("mousedown", () => {
    chargeBtn.style.transform = "scale(0.96)";
  });
  window.addEventListener("mouseup", () => {
    chargeBtn.style.transform = "";
  });
})();
