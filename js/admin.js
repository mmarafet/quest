// js/admin.js (v3 dynamic task builder)
const Admin = (() => {
  let contentFields = [];
  let feedbackFields = [];
  let contentSeq = 1;
  let feedbackSeq = 1;

  function init(){
    document.getElementById("meLine").innerText = Guard.meLine();
    updateStarsPreview();

    // prefill builder with a sensible default
    contentFields = [
      { id: "c" + (contentSeq++), type: "desc", label: "Описание", text: "Заполни поля, прикрепи фото/видео, нажми кнопку выполнено." },
      { id: "c" + (contentSeq++), type: "checklist", label: "Чек-лист", items: ["Сделал ключевое действие", "Сделал фотофиксацию", "Написал комментарий"] },
      { id: "c" + (contentSeq++), type: "photoM", label: "Фото (несколько)" }
    ];

    feedbackFields = [
      { id: "f" + (feedbackSeq++), type: "done", label: "Выполнено ✅" },
      { id: "f" + (feedbackSeq++), type: "text", label: "Комментарий", placeholder: "Что сделано? Какие результаты?" },
      { id: "f" + (feedbackSeq++), type: "select10", label: "Оценка (1..10)" }
    ];

    renderUsers();
    renderTasks();
    renderBuilder();
  }

  function updateStarsPreview(){
    const stars = Number(document.getElementById("tStars").value || 3);
    document.getElementById("starsPreview").innerText = Store.starsText(stars);
  }

  function addContentField(){
    const t = document.getElementById("addContentType").value;
    const id = "c" + (contentSeq++);
    if (t === "desc") contentFields.push({ id, type:"desc", label:"Описание", text:"" });
    if (t === "checklist") contentFields.push({ id, type:"checklist", label:"Чек-лист", items:[""] });
    if (t === "photo1") contentFields.push({ id, type:"photo1", label:"Фото" });
    if (t === "photoM") contentFields.push({ id, type:"photoM", label:"Фото (несколько)" });
    if (t === "video1") contentFields.push({ id, type:"video1", label:"Видео" });
    if (t === "videoM") contentFields.push({ id, type:"videoM", label:"Видео (несколько)" });
    if (t === "videoLink") contentFields.push({ id, type:"videoLink", label:"Ссылка на видео", url:"" });
    renderBuilder();
  }

  function addFeedbackField(){
    const t = document.getElementById("addFeedbackType").value;
    const id = "f" + (feedbackSeq++);
    if (t === "done") feedbackFields.push({ id, type:"done", label:"Выполнено" });
    if (t === "text") feedbackFields.push({ id, type:"text", label:"Комментарий", placeholder:"" });
    if (t === "select10") feedbackFields.push({ id, type:"select10", label:"1..10" });
    if (t === "number") feedbackFields.push({ id, type:"number", label:"Число", placeholder:"" });
    if (t === "photoLimit") feedbackFields.push({ id, type:"photoLimit", label:"Фото", limit: 1 });
    if (t === "videoLimit") feedbackFields.push({ id, type:"videoLimit", label:"Видео", limit: 1 });
    if (t === "checklist") feedbackFields.push({ id, type:"checklist", label:"Чек-лист", items:[""] });
    renderBuilder();
  }

  function removeField(kind, id){
    if (kind === "content") contentFields = contentFields.filter(x => x.id !== id);
    if (kind === "feedback") feedbackFields = feedbackFields.filter(x => x.id !== id);
    renderBuilder();
  }

  function moveField(kind, id, dir){
    const arr = (kind === "content") ? contentFields : feedbackFields;
    const i = arr.findIndex(x => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    renderBuilder();
  }

  function renderBuilder(){
    const cBox = document.getElementById("contentFields");
    const fBox = document.getElementById("feedbackFields");
    cBox.innerHTML = "";
    fBox.innerHTML = "";

    contentFields.forEach((field, idx) => cBox.appendChild(renderFieldCard("content", field, idx)));
    feedbackFields.forEach((field, idx) => fBox.appendChild(renderFieldCard("feedback", field, idx)));
  }

  function renderFieldCard(kind, field, idx){
    const wrap = document.createElement("div");
    wrap.className = "item";
    wrap.style.cursor = "default";

    const head = document.createElement("div");
    head.className = "kv";
    head.innerHTML = `<b>${escapeHtml(field.label || "Поле")}</b><span class="tag">${escapeHtml(kind)} • ${escapeHtml(field.type)}</span>`;
    wrap.appendChild(head);

    const controls = document.createElement("div");
    controls.className = "fieldRow";
    controls.innerHTML = `
      <button class="btnTiny" title="Вверх">↑</button>
      <button class="btnTiny" title="Вниз">↓</button>
      <button class="btnTiny" title="Удалить">✕</button>
    `;
    const btns = controls.querySelectorAll("button");
    btns[0].onclick = () => moveField(kind, field.id, -1);
    btns[1].onclick = () => moveField(kind, field.id, +1);
    btns[2].onclick = () => removeField(kind, field.id);
    wrap.appendChild(controls);

    const body = document.createElement("div");
    body.className = "stack";
    body.style.marginTop = "10px";

    // label editor
    const label = document.createElement("input");
    label.placeholder = "Название поля (видит исполнитель)";
    label.value = field.label || "";
    label.oninput = () => { field.label = label.value; head.innerHTML = `<b>${escapeHtml(field.label || "Поле")}</b><span class="tag">${escapeHtml(kind)} • ${escapeHtml(field.type)}</span>`; };
    body.appendChild(label);

    // type-specific editors
    if (field.type === "desc"){
      const ta = document.createElement("textarea");
      ta.placeholder = "Текст описания";
      ta.value = field.text || "";
      ta.oninput = () => { field.text = ta.value; };
      body.appendChild(ta);
    }

    if (field.type === "videoLink"){
      const inp = document.createElement("input");
      inp.placeholder = "Ссылка на видео (YouTube/Vimeo/прямой файл)";
      inp.value = field.url || "";
      inp.oninput = () => { field.url = inp.value; };
      body.appendChild(inp);

      const hint = document.createElement("div");
      hint.className = "small";
      hint.innerText = "Если YouTube — превью покажем автоматически.";
      body.appendChild(hint);
    }

    if (field.type === "checklist"){
      const hint = document.createElement("div");
      hint.className = "small";
      hint.innerText = "Пункты чек-листа:";
      body.appendChild(hint);

      (field.items || []).forEach((it, i) => {
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `
          <input placeholder="Пункт" value="${escapeAttr(it)}" />
          <button class="btnTiny" title="Удалить пункт">✕</button>
        `;
        const inp = row.querySelector("input");
        const btn = row.querySelector("button");
        inp.oninput = () => { field.items[i] = inp.value; };
        btn.onclick = () => { field.items.splice(i,1); renderBuilder(); };
        body.appendChild(row);
      });

      const addBtn = document.createElement("button");
      addBtn.className = "btnTiny";
      addBtn.innerText = "+ пункт";
      addBtn.onclick = () => { field.items = field.items || []; field.items.push(""); renderBuilder(); };
      body.appendChild(addBtn);
    }

    if (field.type === "text" || field.type === "number"){
      const ph = document.createElement("input");
      ph.placeholder = "Подсказка (placeholder)";
      ph.value = field.placeholder || "";
      ph.oninput = () => { field.placeholder = ph.value; };
      body.appendChild(ph);
    }

    if (field.type === "photoLimit" || field.type === "videoLimit"){
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `
        <input type="number" min="1" max="20" value="${Number(field.limit||1)}" />
        <div class="small">Кол-во файлов, которое нужно приложить</div>
      `;
      const inp = row.querySelector("input");
      inp.oninput = () => { field.limit = Math.max(1, Math.min(20, Number(inp.value||1))); };
      body.appendChild(row);
    }

    wrap.appendChild(body);
    return wrap;
  }

  function createTaskV2(){
    const title = (document.getElementById("tTitle").value || "").trim();
    if (!title) { alert("Название обязательно"); return; }

    const stars = Number(document.getElementById("tStars").value || 3);
    const deadlineRaw = document.getElementById("tDeadline").value; // yyyy-mm-ddThh:mm
    const deadlineISO = deadlineRaw ? new Date(deadlineRaw).toISOString() : null;

    // cleanup empty checklist items
    contentFields.forEach(f => {
      if (f.type === "checklist") f.items = (f.items||[]).map(x => (x||"").trim()).filter(Boolean);
    });
    feedbackFields.forEach(f => {
      if (f.type === "checklist") f.items = (f.items||[]).map(x => (x||"").trim()).filter(Boolean);
    });

    const db = Store.getDB();
    db.tasks.push({
      id: db.seq.task++,
      title,
      stars: Math.max(1, Math.min(5, stars)),
      deadline: deadlineISO,
      contentFields: JSON.parse(JSON.stringify(contentFields)),
      feedbackFields: JSON.parse(JSON.stringify(feedbackFields)),
      createdAt: Store.nowISO()
    });
    Store.setDB(db);

    renderTasks();
    alert("Задача создана ✅");
  }

  function renderUsers(){
    const db = Store.getDB();
    const box = document.getElementById("usersList");
    box.innerHTML = "";

    db.users.forEach(u => {
      const el = document.createElement("div");
      el.className = "item";
      el.innerHTML = `
        <div class="kv">
          <b>${escapeHtml(u.name)}</b>
          <span class="pill">${escapeHtml(u.role)}</span>
        </div>
        <div class="small">${escapeHtml(u.login)}</div>
      `;
      box.appendChild(el);
    });
  }

  function renderTasks(){
    const db = Store.getDB();
    const box = document.getElementById("tasksList");
    box.innerHTML = "";

    db.tasks.slice().reverse().forEach(t => {
      const el = document.createElement("div");
      el.className = "item";
      const dl = t.deadline ? new Date(t.deadline).toLocaleString() : "—";
      el.innerHTML = `
        <div class="kv">
          <b>${escapeHtml(t.title)}</b>
          <span class="pill">${Store.starsText(t.stars)}</span>
        </div>
        <div class="small">Дедлайн: ${escapeHtml(dl)}</div>
        <div class="small">Поля: ${(t.contentFields||[]).length} • Обратная связь: ${(t.feedbackFields||[]).length}</div>
      `;
      box.appendChild(el);
    });
  }

  function escapeHtml(s){
    return String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  }
  function escapeAttr(s){
    return escapeHtml(s).replaceAll('"',"&quot;");
  }

  return {
    init,
    updateStarsPreview,
    addContentField,
    addFeedbackField,
    createTaskV2
  };
})();
