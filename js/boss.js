// js/boss.js (v3 report)
const Boss = (() => {

  function init(){
    document.getElementById("meLine").innerText = Guard.meLine();
    fillSelectors();
    renderAssignments();
  }

  function fillSelectors(){
    const db = Store.getDB();

    const selTask = document.getElementById("selTask");
    selTask.innerHTML = db.tasks
      .map(t => `<option value="${t.id}">${escapeHtml(t.title)} • ${Store.starsText(t.stars)}</option>`)
      .join("");

    const employees = db.users.filter(u => u.role === "employee");
    const selEmp = document.getElementById("selEmployee");
    selEmp.innerHTML = employees
      .map(u => `<option value="${u.id}">${escapeHtml(u.name)} (${escapeHtml(u.login)})</option>`)
      .join("");
  }

  function assign(){
    const db = Store.getDB();
    const taskId = Number(document.getElementById("selTask").value);
    const userId = Number(document.getElementById("selEmployee").value);

    const exists = db.assignments.some(a => a.taskId === taskId && a.userId === userId && a.status !== "done");
    if (exists) { alert("Уже назначено (и ещё не закрыто)."); return; }

    db.assignments.push({
      id: db.seq.assign++,
      taskId,
      userId,
      status: "assigned",
      answers: {},
      checklist: {},
      files: {},
      doneFlags: {},
      updatedAt: Store.nowISO()
    });

    Store.setDB(db);
    renderAssignments();
  }

  function renderAssignments(){
    const db = Store.getDB();
    const box = document.getElementById("assignmentsList");
    box.innerHTML = "";

    db.assignments.slice().reverse().forEach(a => {
      const t = db.tasks.find(x => x.id === a.taskId);
      const u = db.users.find(x => x.id === a.userId);

      const el = document.createElement("div");
      el.className = "item";
      el.innerHTML = `
        <div class="kv">
          <b>${escapeHtml(t?.title || "?" )}</b>
          <span class="pill">${escapeHtml(a.status)}</span>
        </div>
        <div class="small">${escapeHtml(u?.name || "?" )} • #${a.id}</div>
      `;
      el.onclick = () => showReport(a.id);
      box.appendChild(el);
    });
  }

  function showReport(assignId){
    const db = Store.getDB();
    const a = db.assignments.find(x => x.id === assignId);
    if (!a) return;

    const t = db.tasks.find(x => x.id === a.taskId);
    const u = db.users.find(x => x.id === a.userId);

    const dl = t.deadline ? new Date(t.deadline).toLocaleString() : "—";

    let html = `
      <div class="kv"><b>${escapeHtml(t.title)}</b><span class="pill">${Store.starsText(t.stars)}</span></div>
      <div class="small">Сотрудник: ${escapeHtml(u.name)} (${escapeHtml(u.login)})</div>
      <div class="small">Дедлайн: ${escapeHtml(dl)}</div>
      <div class="small">Статус: <b>${escapeHtml(a.status)}</b></div>
      <div class="small">Обновлено: ${escapeHtml(a.updatedAt || "")}</div>
      <hr class="sep" />
      <div class="small"><b>Ответы</b></div>
    `;

    const ans = a.answers || {};
    const keys = Object.keys(ans);
    if (!keys.length) html += `<div class="small">Пока пусто.</div>`;
    keys.forEach(k => {
      html += `<div class="item" style="cursor:default;">
        <div class="kv"><b>${escapeHtml(k)}</b><span class="small">${escapeHtml(String(ans[k])).slice(0,180)}</span></div>
      </div>`;
    });

    const done = a.doneFlags || {};
    const doneKeys = Object.keys(done).filter(k => done[k]);
    if (doneKeys.length){
      html += `<hr class="sep" /><div class="small"><b>Кнопки выполнено:</b> ${escapeHtml(doneKeys.join(", "))}</div>`;
    }

    const checklist = a.checklist || {};
    const ckKeys = Object.keys(checklist).filter(k => (checklist[k]||[]).length);
    if (ckKeys.length){
      html += `<hr class="sep" /><div class="small"><b>Чек-листы</b></div>`;
      ckKeys.forEach(k => {
        html += `<div class="item" style="cursor:default;">
          <div class="small"><b>${escapeHtml(k)}</b></div>
          <div class="small">${escapeHtml((checklist[k]||[]).join(", "))}</div>
        </div>`;
      });
    }

    const files = a.files || {};
    const fKeys = Object.keys(files).filter(k => (files[k]||[]).length);
    if (fKeys.length){
      html += `<hr class="sep" /><div class="small"><b>Медиа</b></div>`;
      fKeys.forEach(k => {
        html += `<div class="small" style="margin-top:10px;"><b>${escapeHtml(k)}</b></div>`;
        (files[k]||[]).forEach(src => {
          const isVideo = (src || "").startsWith("data:video");
          html += isVideo
            ? `<div class="thumb" style="margin-top:8px;"><video controls src="${src}"></video></div>`
            : `<div class="thumb" style="margin-top:8px;"><img src="${src}" alt="photo" /></div>`;
        });
      });
    }

    document.getElementById("reportBox").innerHTML = html;
  }

  function escapeHtml(s){
    return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  }

  return { init, assign };
})();
