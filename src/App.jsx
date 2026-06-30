import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://beschool-production.up.railway.app";

// ─── Real BE School data from МойКласс API analysis ─────────────────────────
const COURSES = {
  92307: "Beginner", 92312: "ABC", 92313: "Elementary",
  92323: "Intermediate", 92324: "Pre-Int", 92442: "IELTS",
  95123: "Express", 128121: "Upper-Int", 101674: "Speaking",
};
const LEVEL_ORDER = ["ABC","Beginner","Elementary","Pre-Int","Intermediate","Upper-Int","IELTS"];

const SKILL_COLORS = {
  Grammar:"#4F86C6", Reading:"#2D7D46", Speaking:"#C9A84C",
  Vocabulary:"#8B5CF6", Writing:"#E56B6F", Listening:"#0891B2",
};
const SKILL_ICONS = {
  Grammar:"📝", Reading:"📖", Speaking:"🎤",
  Vocabulary:"💬", Writing:"✍️", Listening:"🎧",
};

// ─── Demo data modelled after real BE School МойКласс structure ───────────────
const DEMO = {
  userId: 9602487,
  name: "Айдана Бекова",
  level: "Pre-Int",
  levelProgress: 72,
  attendance: 88,
  totalLessons: 48,
  visitedLessons: 42,
  avgMark: 84,
  hwAvg: 78,
  skills: { Grammar: 82, Reading: 91, Speaking: 76, Vocabulary: 88 },
  recentLessons: [
    { date:"2026-06-29", topic:"Prepositions of place", skill:"Grammar",  mark:85, hw:null },
    { date:"2026-06-26", topic:"New words Unit 12",     skill:"Vocabulary",mark:90, hw:80 },
    { date:"2026-06-25", topic:"Reading — Daily Life",  skill:"Reading",  mark:88, hw:null },
    { date:"2026-06-24", topic:"Speaking Practice",     skill:"Speaking", mark:75, hw:null },
    { date:"2026-06-23", topic:"tag-questions",         skill:"Grammar",  mark:80, hw:75 },
    { date:"2026-06-20", topic:"Урок",                  skill:null,       mark:null,hw:null},
  ],
  hasMarks: true,
  hasSkills: true,
  hasTopics: true,
  lastSync: "2026-06-29T09:31:46Z",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const C = {
  navy:"#1B2A4A", gold:"#C9A84C", goldLt:"#FFF8E1", green:"#2D7D46",
  greenLt:"#E6F4EB", red:"#C0392B", redLt:"#FDE8E8", gray:"#6B7280",
  border:"#E5E7EB", bg:"#F7F8FC", white:"#FFFFFF", sky:"#E8F0FB",
};
const scoreColor = s => s >= 80 ? C.green : s >= 65 ? C.gold : C.red;
const scoreBg    = s => s >= 80 ? C.greenLt : s >= 65 ? C.goldLt : C.redLt;
const formatDate = d => {
  if (!d || d === "—") return "—";
  const dt = new Date(d);
  return `${dt.getDate()} ${["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"][dt.getMonth()]}`;
};

// ─── AnimBar ─────────────────────────────────────────────────────────────────
function AnimBar({ pct, color, delay = 0, h = 8 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct || 0), delay + 300);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div style={{ background: C.border, borderRadius: 6, height: h, overflow: "hidden", flex: 1 }}>
      <div style={{
        height: "100%", borderRadius: 6, background: color,
        width: `${w}%`, transition: "width 1.3s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}

// ─── Level Bar ───────────────────────────────────────────────────────────────
function LevelBar({ level, pct }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct || 0), 400); return () => clearTimeout(t); }, [pct]);
  const idx = LEVEL_ORDER.indexOf(level);

  return (
    <div style={{ background: "rgba(255,255,255,.1)", borderRadius: "12px 12px 0 0",
                  padding: "16px 16px 22px", margin: "0 -20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.6)", fontWeight: 500 }}>
          До {LEVEL_ORDER[idx + 1] || "Advanced"}
        </span>
        <span style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ background: "rgba(255,255,255,.2)", borderRadius: 6, height: 10, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 6,
          background: "linear-gradient(90deg,#C9A84C,#E8C96A)",
          width: `${w}%`, transition: "width 1.4s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {LEVEL_ORDER.map((l, i) => (
          <span key={l} style={{
            fontSize: 9, fontWeight: 600,
            color: l === level ? "#fff"
                 : i < idx    ? C.gold
                 : "rgba(255,255,255,.3)",
          }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Section Title ────────────────────────────────────────────────────────────
const SecTitle = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: C.navy, textTransform: "uppercase",
                letterSpacing: ".08em", marginBottom: 12,
                display: "flex", alignItems: "center", gap: 8 }}>
    {children}
    <div style={{ flex: 1, height: 1, background: C.border }} />
  </div>
);

// ─── No Data Notice ───────────────────────────────────────────────────────────
const Notice = ({ icon, text }) => (
  <div style={{ background: C.goldLt, border: `1px solid ${C.gold}`, borderRadius: 10,
                padding: "10px 14px", fontSize: 12, color: "#7A5C00",
                display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    <span>{text}</span>
  </div>
);

// ─── PORTFOLIO LOADER (fetches real data from backend) ───────────────────────
function PortfolioLoader({ userId, studentName, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/p/${userId}`)
      .then(res => res.json())
      .then(json => {
        if (cancelled) return;
        if (json.ok) {
          setData(json.data);
          setIsDemo(false);
        } else {
          // Backend reachable but returned an error (e.g. МойКласс 401) — fall back to demo
          setData(DEMO);
          setIsDemo(true);
          setError(json.error || "Не удалось загрузить данные из МойКласс");
        }
      })
      .catch(err => {
        if (cancelled) return;
        // Backend unreachable — fall back to demo so the UI still works
        setData(DEMO);
        setIsDemo(true);
        setError("Сервер недоступен");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                    minHeight: "100vh", background: C.bg, fontFamily: "system-ui,sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 22, color: C.navy, marginBottom: 10 }}>
            BE<span style={{ color: C.gold }}>School</span>
          </div>
          <div style={{ fontSize: 13, color: C.gray }}>Загружаем данные из МойКласс...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {isDemo && (
        <div style={{ background: "#FDE8E8", borderBottom: "1px solid #C0392B",
                      padding: "8px 16px", fontSize: 11, color: "#8B1A1A",
                      textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
          ⚠️ Демо-данные (МойКласс недоступен: {error})
        </div>
      )}
      <Portfolio data={data} studentName={studentName} onBack={onBack} />
    </>
  );
}

// ─── PORTFOLIO VIEW ───────────────────────────────────────────────────────────
function Portfolio({ data, studentName, onBack }) {
  const d = data || DEMO;

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", background: C.bg,
                  minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: C.navy, padding: "20px 20px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180,
                      borderRadius: "50%", background: "rgba(201,168,76,.1)" }} />

        {onBack && (
          <button onClick={onBack}
            style={{ background: "rgba(255,255,255,.12)", border: "none", color: "#fff",
                     fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20,
                     cursor: "pointer", marginBottom: 14 }}>← Все ученики</button>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 16, color: C.gold, marginBottom: 6 }}>
              BE<span style={{ color: "#fff" }}>School</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 3 }}>
              {studentName || d.name || `Ученик #${d.userId}`}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>
              Портфолио ученика
            </div>
          </div>
          <div style={{ background: C.gold, color: C.navy, fontSize: 11, fontWeight: 700,
                        padding: "5px 12px", borderRadius: 20, letterSpacing: ".05em" }}>
            {d.level?.toUpperCase()}
          </div>
        </div>

        <LevelBar level={d.level} pct={d.levelProgress} />
      </div>

      <div style={{ padding: 16 }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            ["📅", `${d.attendance}%`, "Посещаемость"],
            ["📝", `${d.visitedLessons}/${d.totalLessons}`, "Уроков"],
            ["⭐", d.avgMark ? `${d.avgMark}` : "—", "Ср. балл"],
          ].map(([ic, v, lb]) => (
            <div key={lb} style={{ background: C.white, border: `1px solid ${C.border}`,
                                   borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 5 }}>{ic}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, lineHeight: 1, marginBottom: 3 }}>{v}</div>
              <div style={{ fontSize: 10, color: C.gray }}>{lb}</div>
            </div>
          ))}
        </div>

        {/* Skills */}
        <SecTitle>Навыки</SecTitle>
        {!d.hasSkills && (
          <Notice icon="⏳" text="Оценки по навыкам появятся когда учителя начнут отмечать темы уроков" />
        )}
        {d.hasSkills && (
          <div style={{ marginBottom: 20 }}>
            {Object.entries(d.skills).map(([sk, val], i) => (
              <div key={sk} style={{ display: "grid", gridTemplateColumns: "24px 90px 1fr 34px",
                                     alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 14, textAlign: "center" }}>{SKILL_ICONS[sk]}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{sk}</span>
                <AnimBar pct={val} color={SKILL_COLORS[sk]} delay={i * 80} />
                <span style={{ fontSize: 12, fontWeight: 700, color: SKILL_COLORS[sk], textAlign: "right" }}>{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent lessons */}
        <SecTitle>Последние уроки</SecTitle>
        {!d.hasMarks && (
          <Notice icon="💡" text="Баллы появятся как только учитель начнёт выставлять оценки в МойКласс" />
        )}
        <div style={{ marginBottom: 20 }}>
          {d.recentLessons.map((l, i) => (
            <div key={i} style={{ background: C.white, border: `1px solid ${C.border}`,
                                  borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    {l.skill && (
                      <span style={{ background: C.sky, color: C.navy, fontSize: 10, fontWeight: 600,
                                     padding: "2px 7px", borderRadius: 10 }}>
                        {SKILL_ICONS[l.skill]} {l.skill}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: C.gray }}>{formatDate(l.date)}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.navy }}>
                    {l.topic || "Урок"}
                  </div>
                  {l.hw != null && (
                    <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>
                      ДЗ: <span style={{ fontWeight: 600, color: scoreColor(l.hw) }}>{l.hw}</span>
                    </div>
                  )}
                </div>
                {l.mark != null ? (
                  <div style={{ fontSize: 20, fontWeight: 700, color: scoreColor(l.mark),
                                background: scoreBg(l.mark), borderRadius: 10, padding: "4px 10px",
                                minWidth: 48, textAlign: "center" }}>
                    {l.mark}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: C.gray, fontStyle: "italic" }}>нет оц.</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Share */}
        <button
          onClick={() => {
            const msg = `Прогресс ${studentName || "ученика"} в BE School 🎓\n` +
              `Уровень: ${d.level} (${d.levelProgress}%)\n` +
              `Посещаемость: ${d.attendance}%\n` +
              (d.avgMark ? `Средний балл: ${d.avgMark}/100\n` : "") +
              `\nПолный отчёт → be.school/p/${d.userId}`;
            if (navigator.share) navigator.share({ text: msg });
            else navigator.clipboard?.writeText(msg).then(() => alert("Скопировано!"));
          }}
          style={{ width: "100%", background: C.gold, color: C.navy, border: "none",
                   borderRadius: 12, padding: 15, fontSize: 14, fontWeight: 700,
                   cursor: "pointer", marginBottom: 8 }}>
          📤 Поделиться с родителем
        </button>

        <div style={{ textAlign: "center", fontSize: 10, color: C.gray, paddingBottom: 20 }}>
          <strong style={{ color: C.navy }}>BE School</strong> · Каракол · Кыргызстан
          <br />Обновлено: {new Date(d.lastSync).toLocaleString("ru-RU")}
        </div>
      </div>
    </div>
  );
}

// ─── TEACHER DASHBOARD ────────────────────────────────────────────────────────
function Dashboard({ classInfo, onBackToClasses, onView }) {
  const DEMO_STUDENTS = [
    { id: 9602487,  name: "Айдана Бекова",      visits: 42, total: 48, level: "Pre-Int",      lastMark: 85 },
    { id: 8155276,  name: "Бекзод Эралиев",      visits: 38, total: 48, level: "Pre-Int",      lastMark: 76 },
    { id: 9252964,  name: "Салтанат Омурова",    visits: 45, total: 48, level: "Pre-Int",      lastMark: 92 },
    { id: 10518689, name: "Нурлан Токтогулов",   visits: 40, total: 48, level: "Pre-Int",      lastMark: 88 },
    { id: 9324902,  name: "Айзат Кыдыкбаева",   visits: 35, total: 48, level: "Pre-Int",      lastMark: null },
    { id: 10378331, name: "Марат Асанов",        visits: 44, total: 48, level: "Pre-Int",      lastMark: 79 },
    { id: 10373169, name: "Гулзат Токоева",      visits: 41, total: 48, level: "Pre-Int",      lastMark: 83 },
    { id: 7424296,  name: "Элиза Джумакеева",    visits: 46, total: 48, level: "Pre-Int",      lastMark: 95 },
  ];

  const [students, setStudents] = useState(classInfo ? [] : DEMO_STUDENTS);
  const [loading, setLoading]   = useState(!!classInfo);

  useEffect(() => {
    if (!classInfo) return;
    setLoading(true);
    fetch(`${API_URL}/class/${classInfo.classId}/students`)
      .then(r => r.json())
      .then(json => {
        if (json.ok) {
          setStudents(json.data.map(s => ({
            id: s.userId,
            name: `Ученик #${s.userId}`, // МойКласс /joins не отдаёт имя — подтянется на странице портфолио
            visits: s.visits,
            total: s.visits || 1,
            level: classInfo.level,
            lastMark: null,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [classInfo]);

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", background: C.bg,
                  minHeight: "100vh", padding: 16, maxWidth: 600, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: C.navy, borderRadius: 14, padding: "18px 18px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 18, color: C.gold }}>
            BE<span style={{ color: "#fff" }}>School</span>
          </div>
          {onBackToClasses ? (
            <button onClick={onBackToClasses}
              style={{ background: "rgba(255,255,255,.12)", border: "none", color: "#fff",
                       fontSize: 11, fontWeight: 600, padding: "5px 11px", borderRadius: 16,
                       cursor: "pointer" }}>
              ← Группы
            </button>
          ) : (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>Панель учителя</span>
          )}
        </div>
        {classInfo && (
          <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 10 }}>
            {classInfo.name}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {[
            [students.length, "Учеников"],
            [students.length ? Math.round(students.reduce((a,s)=>a+s.visits/s.total*100,0)/students.length)+"%" : "—","Посещ."],
            [students.filter(s=>s.lastMark).length, "С оценками"],
          ].map(([v, l]) => (
            <div key={l} style={{ background: "rgba(255,255,255,.08)", borderRadius: 10,
                                   padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.gold }}>{v}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: C.gray, fontSize: 13 }}>
          Загружаем учеников из МойКласс...
        </div>
      )}

      {/* Sync notice */}
      {!loading && (
      <div style={{ background: C.greenLt, border: `1px solid ${C.green}`, borderRadius: 10,
                    padding: "10px 14px", fontSize: 12, color: "#1A5C2A",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 16 }}>
        <span>🔄 Данные из МойКласс</span>
        <button style={{ background: C.green, color: "#fff", border: "none", borderRadius: 8,
                         padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          Обновить
        </button>
      </div>
      )}

      {/* Students list */}
      {students.map(s => {
        const attend = Math.round(s.visits / s.total * 100);
        return (
          <div key={s.id} style={{ background: C.white, border: `1px solid ${C.border}`,
                                   borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between",
                          alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 2 }}>{s.name}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: C.sky, color: C.navy, fontSize: 10, fontWeight: 600,
                                  padding: "2px 8px", borderRadius: 10 }}>{s.level}</span>
                  <span style={{ fontSize: 11, color: C.gray }}>{s.visits}/{s.total} уроков</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {s.lastMark ? (
                  <div style={{ fontSize: 20, fontWeight: 700, color: scoreColor(s.lastMark),
                                background: scoreBg(s.lastMark), borderRadius: 8, padding: "3px 10px" }}>
                    {s.lastMark}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: C.gray, fontStyle: "italic" }}>нет оценки</div>
                )}
              </div>
            </div>

            {/* Mini attendance bar */}
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 36px",
                          alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: C.gray }}>Посещ.</span>
              <AnimBar pct={attend} color={attend >= 80 ? C.green : attend >= 60 ? C.gold : C.red} h={6} />
              <span style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>{attend}%</span>
            </div>

            {/* Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <button onClick={() => onView(s)}
                style={{ background: C.sky, color: C.navy, border: "none", borderRadius: 9,
                         padding: "8px 0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                👁 Портфолио
              </button>
              <button
                onClick={() => alert(`В МойКласс → Журнал → найти ${s.name} → поставить оценку`)}
                style={{ background: C.goldLt, color: C.navy, border: "none", borderRadius: 9,
                         padding: "8px 0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                ✏️ Оценить
              </button>
              <button
                onClick={() => {
                  const link = `be.school/p/${s.id}`;
                  navigator.clipboard?.writeText(link);
                  alert(`Ссылка скопирована:\n${link}`);
                }}
                style={{ background: C.greenLt, color: C.green, border: "none", borderRadius: 9,
                         padding: "8px 0", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                📤 Ссылка
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── LOGIN SCREEN ──────────────────────────────────────────────────────────
function LoginScreen({ onLogin, onBackToRole }) {
  const [email, setEmail] = useState("");
  const [pin, setPin]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !pin) {
      setError("Введите email и PIN");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });
      const json = await res.json();
      if (json.ok) {
        localStorage.setItem("be_session_token", json.token);
        localStorage.setItem("be_teacher", JSON.stringify(json.teacher));
        onLogin(json.token, json.teacher);
      } else {
        setError(json.error || "Не удалось войти");
      }
    } catch {
      setError("Сервер недоступен. Попробуйте позже");
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                  minHeight: "100vh", background: C.bg, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ textAlign: "center", padding: 24, maxWidth: 340, width: "100%" }}>

        <div style={{ background: C.navy, width: 68, height: 68, borderRadius: 20,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 30, margin: "0 auto 18px" }}>🔐</div>

        <div style={{ fontFamily: "Georgia,serif", fontSize: 24, color: C.navy, marginBottom: 6 }}>
          BE<span style={{ color: C.gold }}>School</span>
        </div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 26 }}>
          Вход для учителей
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray,
                            marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>
              Email (как в МойКласс)
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nurgul@beschool.kg"
              style={{ width: "100%", padding: "11px 13px", border: `1px solid ${C.border}`,
                       borderRadius: 10, fontSize: 14, color: C.navy, background: "#fff",
                       outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray,
                            marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>
              PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••"
              style={{ width: "100%", padding: "11px 13px", border: `1px solid ${C.border}`,
                       borderRadius: 10, fontSize: 14, color: C.navy, background: "#fff",
                       outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ background: C.redLt, color: C.red, borderRadius: 8,
                          padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: "100%", background: loading ? C.border : C.navy,
                     color: loading ? C.gray : "#fff", border: "none", borderRadius: 12,
                     padding: 14, fontSize: 14, fontWeight: 600,
                     cursor: loading ? "default" : "pointer" }}>
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>

        <div style={{ fontSize: 11, color: C.gray, marginTop: 18, lineHeight: 1.6 }}>
          PIN выдаёт администратор школы.<br/>
          Не помните PIN — обратитесь к директору.
        </div>

        <button onClick={onBackToRole}
          style={{ background: "none", border: "none", color: C.gray, fontSize: 12,
                   marginTop: 16, cursor: "pointer", textDecoration: "underline" }}>
          ← Назад
        </button>
      </div>
    </div>
  );
}

// ─── TEACHER CLASSES VIEW (группы конкретного учителя) ──────────────────────
function TeacherClasses({ teacher, token, onOpenClass, onLogout }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/teacher/classes`, {
      headers: { "x-session-token": token },
    })
      .then(r => r.json())
      .then(json => {
        if (json.ok) { setClasses(json.data); setDebug(json._debug || null); }
        else setError(json.error || "Не удалось загрузить группы");
      })
      .catch(() => setError("Сервер недоступен"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", background: C.bg,
                  minHeight: "100vh", padding: 16, maxWidth: 480, margin: "0 auto" }}>

      <div style={{ background: C.navy, borderRadius: 14, padding: "18px 18px 16px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 16, color: C.gold }}>
            BE<span style={{ color: "#fff" }}>School</span>
          </div>
          <button onClick={onLogout}
            style={{ background: "rgba(255,255,255,.12)", border: "none", color: "#fff",
                     fontSize: 11, fontWeight: 600, padding: "5px 11px", borderRadius: 16,
                     cursor: "pointer" }}>
            Выйти
          </button>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginTop: 8 }}>
          {teacher?.name || teacher?.email}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>
          Ваши группы
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: C.gray, fontSize: 13 }}>
          Загружаем группы из МойКласс...
        </div>
      )}

      {error && (
        <div style={{ background: C.redLt, color: C.red, borderRadius: 10,
                      padding: "12px 14px", fontSize: 13 }}>
          {error}
        </div>
      )}

      {!loading && !error && classes.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: C.gray, fontSize: 13 }}>
          У вас пока нет назначенных групп.<br/>Обратитесь к администратору.
          {debug && (
            <div style={{ marginTop: 16, fontSize: 11, color: "#aaa", textAlign: "left",
                         background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: 10,
                         maxHeight: 300, overflow: "auto", wordBreak: "break-all" }}>
              managerId: {debug.managerId}<br/>
              Найдено фильтром API: {debug.filteredCount}<br/>
              Проверено всего групп: {debug.totalClassesChecked}<br/>
              Найдено по teacherIds: {debug.byTeacherIdsCount}<br/>
              {debug._rawSample && (
                <pre style={{ fontSize: 10, whiteSpace: "pre-wrap", marginTop: 8 }}>
                  {JSON.stringify(debug._rawSample, null, 1)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {classes.map(c => (
        <div key={c.classId}
          onClick={() => onOpenClass(c)}
          style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12,
                   padding: 14, marginBottom: 10, cursor: "pointer",
                   display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 3 }}>
              {c.name}
            </div>
            <span style={{ background: C.sky, color: C.navy, fontSize: 10, fontWeight: 600,
                          padding: "2px 8px", borderRadius: 10 }}>
              {c.level}
            </span>
          </div>
          <div style={{ color: C.gray, fontSize: 18 }}>→</div>
        </div>
      ))}
    </div>
  );
}

// ─── ADMIN PANEL (управление учителями) ──────────────────────────────────────
function AdminPanel({ onBack }) {
  const [managers, setManagers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ managerId: "", email: "", name: "", pin: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function loadAll() {
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/admin/managers`).then(r => r.json()),
      fetch(`${API_URL}/admin/teachers`).then(r => r.json()),
    ]).then(([m, t]) => {
      if (m.ok) setManagers(m.data);
      if (t.ok) setTeachers(t.data);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  function selectManager(managerId) {
    const m = managers.find(x => String(x.managerId) === String(managerId));
    setForm(f => ({
      ...f,
      managerId,
      name: m?.name || f.name,
      email: m?.email || f.email,
    }));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setMsg("");
    if (!form.managerId || !form.email || !form.pin) {
      setMsg("Заполните сотрудника, email и PIN");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/admin/teachers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.ok) {
        setMsg(`✅ ${json.data.name} добавлен(а)`);
        setForm({ managerId: "", email: "", name: "", pin: "" });
        loadAll();
      } else {
        setMsg(json.error || "Ошибка");
      }
    } catch {
      setMsg("Сервер недоступен");
    }
    setSaving(false);
  }

  async function handleDelete(email) {
    if (!confirm(`Удалить доступ для ${email}?`)) return;
    await fetch(`${API_URL}/admin/teachers/${encodeURIComponent(email)}`, { method: "DELETE" });
    loadAll();
  }

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", background: C.bg,
                  minHeight: "100vh", padding: 16, maxWidth: 520, margin: "0 auto" }}>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button onClick={onBack}
          style={{ background: "none", border: "none", color: C.gray, fontSize: 20, cursor: "pointer" }}>←</button>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Управление учителями</div>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 12 }}>
          ➕ Добавить доступ учителю
        </div>
        <form onSubmit={handleAdd}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: C.gray,
                          marginBottom: 5, textTransform: "uppercase" }}>Сотрудник (из МойКласс)</label>
          <select value={form.managerId} onChange={e => selectManager(e.target.value)}
            style={{ width: "100%", padding: "9px 11px", border: `1px solid ${C.border}`,
                     borderRadius: 8, fontSize: 13, color: C.navy, background: C.bg,
                     marginBottom: 10, boxSizing: "border-box" }}>
            <option value="">— выбрать —</option>
            {managers.map(m => (
              <option key={m.managerId} value={m.managerId}>
                {m.name} {m.email ? `(${m.email})` : ""}
              </option>
            ))}
          </select>

          <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: C.gray,
                          marginBottom: 5, textTransform: "uppercase" }}>Email для входа</label>
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="nurgul@beschool.kg"
            style={{ width: "100%", padding: "9px 11px", border: `1px solid ${C.border}`,
                     borderRadius: 8, fontSize: 13, color: C.navy, background: C.bg,
                     marginBottom: 10, boxSizing: "border-box" }} />

          <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: C.gray,
                          marginBottom: 5, textTransform: "uppercase" }}>PIN (придумайте)</label>
          <input value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value })}
            placeholder="1234"
            style={{ width: "100%", padding: "9px 11px", border: `1px solid ${C.border}`,
                     borderRadius: 8, fontSize: 13, color: C.navy, background: C.bg,
                     marginBottom: 14, boxSizing: "border-box" }} />

          {msg && <div style={{ fontSize: 12, color: msg.startsWith("✅") ? C.green : C.red, marginBottom: 10 }}>{msg}</div>}

          <button type="submit" disabled={saving}
            style={{ width: "100%", background: C.navy, color: "#fff", border: "none",
                     borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600,
                     cursor: saving ? "default" : "pointer" }}>
            {saving ? "Сохраняем..." : "Добавить"}
          </button>
        </form>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, textTransform: "uppercase",
                    letterSpacing: ".06em", marginBottom: 10 }}>
        Учителя с доступом ({teachers.length})
      </div>

      {loading && <div style={{ color: C.gray, fontSize: 13 }}>Загрузка...</div>}

      {teachers.map(t => (
        <div key={t.email} style={{ background: "#fff", border: `1px solid ${C.border}`,
                                    borderRadius: 10, padding: 12, marginBottom: 8,
                                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{t.name}</div>
            <div style={{ fontSize: 11, color: C.gray }}>{t.email} · managerId {t.managerId}</div>
          </div>
          <button onClick={() => handleDelete(t.email)}
            style={{ background: C.redLt, color: C.red, border: "none", borderRadius: 8,
                     padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            Удалить
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]   = useState("role"); // role | login | classes | dashboard | portfolio
  const [selected, setSelected] = useState(null);
  const [session, setSession] = useState(null); // { token, teacher }
  const [activeClass, setActiveClass] = useState(null);

  // Автологин: проверяем сохранённую сессию ЧЕРЕЗ backend (не доверяем localStorage вслепую —
  // backend хранит сессии в памяти и может их терять при передеплое)
  useEffect(() => {
    const token = localStorage.getItem("be_session_token");
    if (!token) return;

    fetch(`${API_URL}/auth/me`, { headers: { "x-session-token": token } })
      .then(r => r.json())
      .then(json => {
        if (json.ok) {
          setSession({ token, teacher: json.teacher });
        } else {
          // Сессия недействительна — очищаем
          localStorage.removeItem("be_session_token");
          localStorage.removeItem("be_teacher");
        }
      })
      .catch(() => {
        // Backend недоступен — не считаем авторизованным, но не стираем токен
        // (попробуем снова при следующей загрузке)
      });
  }, []);

  function handleLogin(token, teacher) {
    setSession({ token, teacher });
    setScreen("classes");
  }

  function handleLogout() {
    const token = session?.token;
    if (token) {
      fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { "x-session-token": token },
      }).catch(() => {});
    }
    localStorage.removeItem("be_session_token");
    localStorage.removeItem("be_teacher");
    setSession(null);
    setScreen("role");
  }

  // ── role picker ──
  if (screen === "role") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                  minHeight: "100vh", background: C.bg, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ textAlign: "center", padding: 24, maxWidth: 340, width: "100%" }}>

        <div style={{ background: C.navy, width: 68, height: 68, borderRadius: 20,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 30, margin: "0 auto 18px" }}>🎓</div>

        <div style={{ fontFamily: "Georgia,serif", fontSize: 28, color: C.navy, marginBottom: 6 }}>
          BE<span style={{ color: C.gold }}>School</span>
        </div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 28, lineHeight: 1.5 }}>
          Система прогресса учеников<br/>
          <span style={{ fontSize: 11 }}>Данные из МойКласс · Каракол</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => {
              // Уже есть сохранённая сессия — сразу к группам
              if (session) setScreen("classes");
              else setScreen("login");
            }}
            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 12,
                     padding: 15, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            ✏️ Я учитель{session ? ` — ${session.teacher.name || session.teacher.email}` : ""}
          </button>
          <button onClick={() => { setSelected({ id: 9602487, name: "Айдана Бекова" }); setScreen("portfolio"); }}
            style={{ background: "#fff", color: C.navy, border: `2px solid ${C.navy}`,
                     borderRadius: 12, padding: 15, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            👨‍👩‍👧 Я родитель (открыть по ссылке)
          </button>
        </div>

        <div style={{ fontSize: 11, color: C.gray, marginTop: 20, lineHeight: 1.7 }}>
          Родители открывают персональную ссылку из WhatsApp.<br/>
          Данные обновляются автоматически из МойКласс.
        </div>

        <button onClick={() => setScreen("admin")}
          style={{ background: "none", border: "none", color: C.gray, fontSize: 11,
                   marginTop: 18, cursor: "pointer", opacity: .6 }}>
          ⚙️ Администратор
        </button>
      </div>
    </div>
  );

  // ── admin panel ──
  if (screen === "admin") return (
    <AdminPanel onBack={() => setScreen("role")} />
  );

  // ── teacher login ──
  if (screen === "login") return (
    <LoginScreen onLogin={handleLogin} onBackToRole={() => setScreen("role")} />
  );

  // ── teacher's classes list ──
  if (screen === "classes") return (
    <TeacherClasses
      teacher={session?.teacher}
      token={session?.token}
      onOpenClass={cls => { setActiveClass(cls); setScreen("dashboard"); }}
      onLogout={handleLogout}
    />
  );

  // ── student portfolio ──
  if (screen === "portfolio") return (
    <PortfolioLoader
      userId={selected?.id}
      studentName={selected?.name}
      onBack={() => setScreen(session ? "dashboard" : "role")}
    />
  );

  // ── dashboard (students within selected class, or demo fallback) ──
  return (
    <Dashboard
      classInfo={activeClass}
      onBackToClasses={session ? () => setScreen("classes") : null}
      onView={s => { setSelected(s); setScreen("portfolio"); }}
    />
  );
}
