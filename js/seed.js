// js/seed.js (v3 schema)
const Seed = (() => {

  function seedIfEmpty(){
    const db = Store.getDB();
    if (db.users.length > 0) return;

    db.users.push(
      { id: db.seq.user++, login:"admin", name:"Админ", pass:"admin123", role:"admin" },
      { id: db.seq.user++, login:"boss",  name:"Начальник", pass:"boss123", role:"boss" },
      { id: db.seq.user++, login:"user",  name:"Сотрудник", pass:"user123", role:"employee" }
    );

    db.tasks.push({
      id: db.seq.task++,
      title: "Ежедневные цели",
      stars: 3,
      deadline: null,
      contentFields: [
        { id:"c1", type:"desc", label:"Описание", text:"Заполни поля, прикрепи фото/видео, нажми кнопку выполнено." },
        { id:"c2", type:"checklist", label:"Чек-лист", items:["Сделал ключевое действие","Сделал фотофиксацию","Написал комментарий"] },
        { id:"c3", type:"photoM", label:"Фото (несколько)" }
      ],
      feedbackFields: [
        { id:"f1", type:"done", label:"Выполнено ✅" },
        { id:"f2", type:"text", label:"Комментарий", placeholder:"Что сделано? Какие результаты?" },
        { id:"f3", type:"select10", label:"Оценка (1..10)" }
      ],
      createdAt: Store.nowISO()
    });

    Store.setDB(db);
  }

  function resetDemo(){
    localStorage.removeItem("TASK_SYSTEM_DB");
    localStorage.removeItem("TASK_SESSION");
    localStorage.removeItem("TASK_THEME");
    Store.ensureDB();
    seedIfEmpty();
    alert("Демо-данные сброшены ✅");
    location.reload();
  }

  seedIfEmpty();

  return { resetDemo };
})();
