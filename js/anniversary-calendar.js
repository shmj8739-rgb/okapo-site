(() => {
  const weekEl = document.getElementById("anniversary-week");
  const rangeEl = document.getElementById("anniversary-week-range");
  const dialog = document.getElementById("anniversary-dialog");
  if (!weekEl || !rangeEl || !dialog) return;

  const anniversaries = window.OKAPO_ANNIVERSARIES || {};
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() - ((todayDate.getDay() + 6) % 7));

  const pad = (value) => String(value).padStart(2, "0");
  const keyFor = (date) => `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const shortDate = (date) => `${date.getMonth() + 1}/${date.getDate()}`;
  const fullDate = (date) => `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`;
  const fallback = {
    title: "記念日を準備中",
    icon: "🗓️",
    description: "この日の記念日は、ただいま選定中です。",
    origin: "月日をキーにしたデータへ追加すると、毎年同じ日に自動で表示されます。"
  };

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  rangeEl.textContent = `${monday.getFullYear()}.${shortDate(monday)} — ${sunday.getFullYear()}.${shortDate(sunday)}`;

  const openDetails = (date, anniversary) => {
    document.getElementById("anniversary-dialog-date").textContent = fullDate(date);
    document.getElementById("anniversary-dialog-icon").textContent = anniversary.icon;
    document.getElementById("anniversary-dialog-title").textContent = anniversary.title;
    document.getElementById("anniversary-dialog-description").textContent = anniversary.description;
    document.getElementById("anniversary-dialog-origin").textContent = anniversary.origin;
    dialog.showModal();
  };

  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const anniversary = anniversaries[keyFor(date)] || fallback;
    const isToday = date.getTime() === todayDate.getTime();
    const card = document.createElement("button");
    card.type = "button";
    card.className = `anniversary-card reveal${isToday ? " is-today" : ""}`;
    card.setAttribute("aria-label", `${fullDate(date)} ${anniversary.title}の詳細を見る`);
    card.setAttribute("aria-haspopup", "dialog");
    if (isToday) card.setAttribute("aria-current", "date");

    const dateRow = document.createElement("span");
    dateRow.className = "anniversary-card-date-row";
    dateRow.innerHTML = `<strong>${shortDate(date)}</strong><span>${weekdays[date.getDay()]}</span>`;

    const icon = document.createElement("span");
    icon.className = "anniversary-card-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = anniversary.icon;

    const title = document.createElement("span");
    title.className = "anniversary-card-title";
    title.textContent = anniversary.title;

    card.append(dateRow, icon, title);
    if (isToday) {
      const badge = document.createElement("span");
      badge.className = "anniversary-card-today";
      badge.textContent = "TODAY";
      card.appendChild(badge);
    }
    card.addEventListener("click", () => openDetails(date, anniversary));
    fragment.appendChild(card);
  }
  weekEl.appendChild(fragment);

  dialog.querySelector("[data-anniversary-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });
})();
