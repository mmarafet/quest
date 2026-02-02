// js/tasks.js (v3 dynamic fields)
const Tasks = (() => {
  let activeId = null;

  function init(){
    document.getElementById("meLine").innerText = Guard.meLine();
    renderMyAssignments();
  }

  function myAssignments(){
    const db = Store.getDB();
    const sess = Store.getSession();
    return db.assignments.filter(a => a.userId === sess.userId).slice().reverse();
  }

  function renderMyAssignments(){
    const db = Store.getDB();
    const list = myAssignments();
    const box = document.getElementById("myAssignments");
    box.innerHTML = "";

    if (!list.length){
      box.innerHTML = `<div class="small">Нет назначенных задач. Попроси начальника назначить задачу.</div>`;
      clearRight();
      return;
    }

    list.forEach(a => {
      const t = db.tasks.find(x => x.id === a.taskId);
      const el = document.createElement("div");
      el.className = "item";
      el.innerHTML = `
        <div class="kv">
          <b>${escapeHtml(t?.title || "?" )}</b>
          <span class="pill">${escapeHtml(a.status)}</span>
        </div>
        <div class="small">${Store.starsText(t?.stars || 1)} • #${a.id}</div>
      `;
      el.onclick = () => open(a.id);
      box.appendChild(el);
    });

    open(list[0].id);
  }

  function clearRight(){
    document.getElementById("taskTitle").innerText = "Открой назначение";
    document.getElementById("taskDesc").innerText = "";
    document.getElementById("taskStars").innerText = "";
    document.getElementById("taskForm").innerHTML = "";
  }

  function ensureAssignShape(a){
    a.answers = a.answers || {};
    a.checklist = a.checklist || {};
    a.files = a.files || {};     // key -> array of dataurls
    a.doneFlags = a.doneFlags || {};
  }

  function open(assignId){
    activeId = assignId;
    const db = Store.getDB();
    const a = db.assignments.find(x => x.id === assignId);
    const t = db.tasks.find(x => x.id === a.taskId);
    ensureAssignShape(a);

    document.getElementById("taskTitle").innerText = t.title;
    const dl = t.deadline ? ("Дедлайн: " + new Date(t.deadline).toLocaleString()) : "";
    document.getElementById("taskDesc").innerText = dl;
    document.getElementById("taskStars").innerText = Store.starsText(t.stars);

    if (a.status === "assigned"){
      a.status = "in_progress";
      a.updatedAt = Store.nowISO();
      Store.setDB(db);
    }

    const form = document.getElementById("taskForm");
    form.innerHTML = "";

    const h1 = document.createElement("div");
    h1.className = "cardTitle";
    h1.style.marginTop = "2px";
    h1.innerText = "Задание";
    form.appendChild(h1);

    (t.contentFields || []).forEach(field => {
      form.appendChild(renderFieldUI(db, a, field, "content"));
    });

    const sep = document.createElement("hr");
    sep.className = "sep";
    form.appendChild(sep);

    const h2 = document.createElement("div");
    h2.className = "cardTitle";
    h2.innerText = "Обратная связь";
    form.appendChild(h2);

    (t.feedbackFields || []).forEach(field => {
      form.appendChild(renderFieldUI(db, a, field, "feedback"));
    });
  }

  function renderFieldUI(db, a, field, scope){
    const wrap = document.createElement("div");
    wrap.className = "stack";
    wrap.style.marginTop = "10px";

    const lbl = document.createElement("div");
    lbl.className = "small";
    lbl.innerText = field.label || field.type;
    wrap.appendChild(lbl);

    const key = `${scope}:${field.id}`;

    if (field.type === "desc"){
      const box = document.createElement("div");
      box.className = "report";
      box.innerHTML = `<div class="small" style="color:rgba(229,231,235,.85)">${escapeHtml(field.text || "")}</div>`;
      wrap.appendChild(box);
      return wrap;
    }

    if (field.type === "videoLink"){
      const url = (field.url || "").trim();
      if (!url){
        const em = document.createElement("div");
        em.className = "small";
        em.innerText = "Ссылка не задана.";
        wrap.appendChild(em);
        return wrap;
      }
      const preview = youtubeThumb(url);
      if (preview){
        const img = document.createElement("img");
        img.src = preview;
        img.style.width = "100%";
        img.style.borderRadius = "12px";
        img.style.border = "1px solid rgba(56,189,248,.14)";
        wrap.appendChild(img);
      }
      const aTag = document.createElement("a");
      aTag.href = url;
      aTag.target = "_blank";
      aTag.className = "btn btnGhost";
      aTag.style.display = "inline-flex";
      aTag.style.justifyContent = "center";
      aTag.innerText = "Открыть видео";
      wrap.appendChild(aTag);
      return wrap;
    }

    if (field.type === "checklist"){
      const items = field.items || [];
      a.checklist[key] = a.checklist[key] || [];
      items.forEach(item => {
        const row = document.createElement("div");
        row.className = "item";
        row.style.cursor = "default";
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";

        const left = document.createElement("div");
        left.innerText = item;

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = a.checklist[key].includes(item);
        cb.onchange = () => {
          if (cb.checked) {
            if (!a.checklist[key].includes(item)) a.checklist[key].push(item);
          } else {
            a.checklist[key] = a.checklist[key].filter(x => x !== item);
          }
          touchAndSave(db, a);
        };

        row.appendChild(left);
        row.appendChild(cb);
        wrap.appendChild(row);
      });
      return wrap;
    }

    if (field.type === "text"){
      const ta = document.createElement("textarea");
      ta.placeholder = field.placeholder || "";
      ta.value = a.answers[key] || "";
      ta.oninput = () => { a.answers[key] = ta.value; touchAndSave(db,a); };
      wrap.appendChild(ta);
      return wrap;
    }

    if (field.type === "select10"){
      const sel = document.createElement("select");
      sel.innerHTML = Array.from({length:10}, (_,i)=>`<option value="${i+1}">${i+1}</option>`).join("");
      sel.value = a.answers[key] || "1";
      sel.onchange = () => { a.answers[key] = sel.value; touchAndSave(db,a); };
      wrap.appendChild(sel);
      return wrap;
    }

    if (field.type === "number"){
      const inp = document.createElement("input");
      inp.type = "number";
      inp.placeholder = field.placeholder || "";
      inp.value = a.answers[key] || "";
      inp.oninput = () => { a.answers[key] = inp.value; touchAndSave(db,a); };
      wrap.appendChild(inp);
      return wrap;
    }

    if (field.type === "done"){
      const btn = document.createElement("button");
      btn.className = "btn btnPrimary";
      btn.innerText = (a.doneFlags[key] ? "✅ " : "") + (field.label || "Выполнено");
      btn.onclick = () => {
        a.doneFlags[key] = !a.doneFlags[key];
        touchAndSave(db, a);
        btn.innerText = (a.doneFlags[key] ? "✅ " : "") + (field.label || "Выполнено");
      };
      wrap.appendChild(btn);
      return wrap;
    }

    // Media uploads
    const isPhoto = (field.type === "photo1" || field.type === "photoM" || field.type === "photoLimit");
    const isVideo = (field.type === "video1" || field.type === "videoM" || field.type === "videoLimit");
    if (isPhoto || isVideo){
      a.files[key] = a.files[key] || [];

      let limit = 999;
      if (field.type === "photoLimit" || field.type === "videoLimit") limit = Number(field.limit || 1);
      if (field.type === "photo1" || field.type === "video1") limit = 1;

      const hint = document.createElement("div");
      hint.className = "small";
      hint.style.display = "flex";
      hint.style.gap = "10px";
      hint.style.alignItems = "center";

      const icon = document.createElement("img");
      icon.src = isPhoto ? "assets/ui/icon-photo.png" : "assets/ui/icon-video.png";
      icon.style.width = "22px";
      icon.style.height = "22px";
      icon.style.opacity = "0.9";
      hint.appendChild(icon);

      const txt = document.createElement("div");
      txt.innerText = limit === 999 ? "Можно добавить несколько файлов" : `Нужно/можно добавить до ${limit}`;
      hint.appendChild(txt);
      wrap.appendChild(hint);

      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = isPhoto ? "image/*" : "video/*";
      inp.multiple = (field.type === "photoM" || field.type === "videoM");
      inp.onchange = async () => {
        const files = Array.from(inp.files || []);
        for (const f of files){
          if (a.files[key].length >= limit) break;
          const dataUrl = await fileToDataURL(f);
          a.files[key].push(dataUrl);
        }
        touchAndSave(db,a);
        renderMediaPreview(wrap, a.files[key], isPhoto);
        updateStat();
      };
      wrap.appendChild(inp);

      const stat = document.createElement("div");
      stat.className = "small";
      function updateStat(){
        stat.innerText = `Добавлено: ${a.files[key].length}` + (limit !== 999 ? ` / ${limit}` : "");
      }
      updateStat();
      wrap.appendChild(stat);

      renderMediaPreview(wrap, a.files[key], isPhoto);

      return wrap;
    }

    const em = document.createElement("div");
    em.className = "small";
    em.innerText = "Тип поля не поддержан: " + field.type;
    wrap.appendChild(em);
    return wrap;
  }

  function renderMediaPreview(wrap, arr, isPhoto){
    wrap.querySelectorAll(".slider, .thumb").forEach(x => x.remove());
    if (!arr.length) return;

    if (arr.length === 1){
      const t = document.createElement("div");
      t.className = "thumb";
      t.style.marginTop = "8px";
      t.innerHTML = isPhoto ? `<img src="${arr[0]}" alt="photo"/>` : `<video controls src="${arr[0]}"></video>`;
      wrap.appendChild(t);
      return;
    }

    const slider = document.createElement("div");
    slider.className = "slider";
    arr.forEach(src => {
      const slide = document.createElement("div");
      slide.className = "slide";
      slide.innerHTML = isPhoto ? `<img src="${src}" alt="photo"/>` : `<video controls src="${src}"></video>`;
      slider.appendChild(slide);
    });
    wrap.appendChild(slider);
  }

  function touchAndSave(db,a){
    a.updatedAt = Store.nowISO();
    Store.setDB(db);
  }

  function save(){
    if (!activeId) return;
    msg("Сохранено ✅");
  }

  function done(){
    if (!activeId) return;
    const db = Store.getDB();
    const a = db.assignments.find(x => x.id === activeId);
    a.status = "done";
    a.updatedAt = Store.nowISO();
    Store.setDB(db);
    msg("Готово ✅");
    renderMyAssignments();
  }

  function msg(t){
    const el = document.getElementById("msg");
    el.innerText = t;
    setTimeout(() => { el.innerText = ""; }, 2200);
  }

  function fileToDataURL(file){
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function youtubeThumb(url){
    const m1 = url.match(/v=([a-zA-Z0-9_-]{6,})/);
    const m2 = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
    const m3 = url.match(/embed\/([a-zA-Z0-9_-]{6,})/);
    const id = (m1 && m1[1]) || (m2 && m2[1]) || (m3 && m3[1]);
    if (!id) return null;
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }

  function escapeHtml(s){
    return String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  }

  return { init, save, done };
})();
