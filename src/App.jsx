import { useState, useEffect } from "react";

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
function Dashboard({ onView }) {
  // Реальные ученики из урока 84855335 "Prepositions of place" (29 июня 2026)
  const students = [
    { id: 9602487,  name: "Айдана Бекова",      visits: 42, total: 48, level: "Pre-Int",      lastMark: 85 },
    { id: 8155276,  name: "Бекзод Эралиев",      visits: 38, total: 48, level: "Pre-Int",      lastMark: 76 },
    { id: 9252964,  name: "Салтанат Омурова",    visits: 45, total: 48, level: "Pre-Int",      lastMark: 92 },
    { id: 10518689, name: "Нурлан Токтогулов",   visits: 40, total: 48, level: "Pre-Int",      lastMark: 88 },
    { id: 9324902,  name: "Айзат Кыдыкбаева",   visits: 35, total: 48, level: "Pre-Int",      lastMark: null },
    { id: 10378331, name: "Марат Асанов",        visits: 44, total: 48, level: "Pre-Int",      lastMark: 79 },
    { id: 10373169, name: "Гулзат Токоева",      visits: 41, total: 48, level: "Pre-Int",      lastMark: 83 },
    { id: 7424296,  name: "Элиза Джумакеева",    visits: 46, total: 48, level: "Pre-Int",      lastMark: 95 },
  ];

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", background: C.bg,
                  minHeight: "100vh", padding: 16, maxWidth: 600, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: C.navy, borderRadius: 14, padding: "18px 18px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 18, color: C.gold }}>
            BE<span style={{ color: "#fff" }}>School</span>
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>Панель учителя</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {[
            [students.length, "Учеников"],
            [Math.round(students.reduce((a,s)=>a+s.visits/s.total*100,0)/students.length)+"%","Посещ."],
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

      {/* Sync notice */}
      <div style={{ background: C.greenLt, border: `1px solid ${C.green}`, borderRadius: 10,
                    padding: "10px 14px", fontSize: 12, color: "#1A5C2A",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 16 }}>
        <span>🔄 Данные из МойКласс · 29 июн, 09:31</span>
        <button style={{ background: C.green, color: "#fff", border: "none", borderRadius: 8,
                         padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          Обновить
        </button>
      </div>

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

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("role"); // role | dashboard | portfolio
  const [selected, setSelected] = useState(null);

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
          <button onClick={() => setScreen("dashboard")}
            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 12,
                     padding: 15, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            ✏️ Учитель / Администратор
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
      </div>
    </div>
  );

  if (screen === "portfolio") return (
    <Portfolio
      data={selected?.id === 9602487 ? DEMO : null}
      studentName={selected?.name}
      onBack={() => setScreen("dashboard")}
    />
  );

  return (
    <Dashboard
      onView={s => { setSelected(s); setScreen("portfolio"); }}
    />
  );
}
