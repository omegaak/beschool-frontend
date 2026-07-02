import { useState, useEffect, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://beschool-production.up.railway.app";
// Реальный домен фронтенда — window.location.origin сам подстроится под prod/preview деплой,
// вместо захардкоженного плейсхолдера "be.school", который никогда не существовал.
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || (typeof window !== "undefined" ? window.location.origin : "");

// ─── Real BE School data from МойКласс API analysis ─────────────────────────
const COURSES = {
  92307: "Beginner", 92312: "ABC", 92313: "Elementary",
  92323: "Intermediate", 92324: "Pre-Int", 92442: "IELTS",
  95123: "Express", 128121: "Upper-Int", 101674: "Speaking",
};
const LEVEL_ORDER = ["ABC","Beginner","Elementary","Pre-Int","Intermediate","Upper-Int","IELTS"];

// Цвета навыков — фирменная палитра BE School (брендбук), не произвольные
const SKILL_COLORS = {
  Grammar:"#9D59A2", Reading:"#33BEF3", Speaking:"#F7528E",
  Vocabulary:"#4DB20D", Writing:"#D4A62A", Listening:"#33BEF3",
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
  gamification: {
    xp: 460,
    streakLessons: 6,
    badges: [
      { id: "streak",  label: "Уроков подряд", icon: "flame",    value: 6,  earned: true },
      { id: "perfect", label: "Без пропусков", icon: "checkbox", value: null, earned: false },
      { id: "top",     label: "Топ результат", icon: "star",     value: 92, earned: true },
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const C = {
  navy:"#173816", gold:"#4DB20D", goldLt:"#EAF7E1", green:"#2E7D32",
  greenLt:"#E6F4E8", red:"#C0392B", redLt:"#FDE8E8", gray:"#6B7280",
  border:"#E1E8DD", bg:"#F6FAF4", white:"#FFFFFF", sky:"#E3F3DB",
  // Фирменные цвета BE School (из брендбука) — используются в портфолио ученика
  brandBlue:"#33BEF3", brandPurple:"#9D59A2", brandPink:"#F7528E",
  brandYellow:"#FFE465", brandGreen:"#4DB20D", brandAmber:"#D4A62A",
  brandGradient:"linear-gradient(135deg, #33BEF3 0%, #9D59A2 100%)",
};

// Логотип BE School — на тёмном фоне показываем версию с белой подложкой,
// чтобы зелёный логотип не сливался с тёмно-зелёным хедером
function Logo({ height = 28, onDark = false }) {
  return (
    <img
      src="/logo.png"
      alt="BE School"
      style={{
        height,
        display: "block",
        ...(onDark ? {
          background: "#fff",
          padding: "4px 8px",
          borderRadius: 8,
        } : {}),
      }}
    />
  );
}
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

  // Делим прогресс внутри уровня на 3 деления (3 теста = переход на след. уровень)
  const segmentFill = (segIndex) => {
    const segStart = segIndex * (100 / 3);
    const segEnd   = (segIndex + 1) * (100 / 3);
    if (w >= segEnd) return 100;
    if (w <= segStart) return 0;
    return ((w - segStart) / (segEnd - segStart)) * 100;
  };

  return (
    <div style={{ background: "rgba(255,255,255,.1)", borderRadius: "12px 12px 0 0",
                  padding: "16px 16px 22px", margin: "0 -20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.6)", fontWeight: 500 }}>
          До {LEVEL_ORDER[idx + 1] || "Advanced"} · {Math.min(3, Math.ceil(w / (100/3)))}/3 тестов
        </span>
        <span style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>{pct}%</span>
      </div>

      {/* 3 деления вместо сплошной шкалы */}
      <div style={{ display: "flex", gap: 4 }}>
        {[0, 1, 2].map(seg => (
          <div key={seg} style={{ flex: 1, background: "rgba(255,255,255,.2)",
                                  borderRadius: 5, height: 10, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 5,
              background: "linear-gradient(90deg,#4DB20D,#FFE465)",
              width: `${segmentFill(seg)}%`,
              transition: "width 1.4s cubic-bezier(.4,0,.2,1)",
            }} />
          </div>
        ))}
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

// ─── PAYMENT MODAL (MKassa QR: абонемент/сумма → QR → поллинг статуса) ──────
function PaymentModal({ userId, studentName, onClose, authHeader = {} }) {
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState("form"); // form | creating | qr | success | error
  const [payment, setPayment] = useState(null); // { id, paymentToken, amountSom, status }
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  // Активные абонементы ученика — сумма и скидка уже посчитаны МойКласс,
  // ручной ввод остаётся только запасным вариантом
  const [subsLoading, setSubsLoading] = useState(true);
  const [subs, setSubs] = useState([]);
  const [subsError, setSubsError] = useState(""); // отличаем «ошибка запроса» от «абонементов правда нет»
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/mkassa/subscriptions/${userId}`, { headers: authHeader })
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        if (json.ok) {
          setSubs(Array.isArray(json.data) ? json.data : []);
        } else {
          setSubs([]);
          setSubsError(json.error || "Не удалось получить абонементы из МойКласс");
        }
      })
      .catch(() => { if (!cancelled) { setSubs([]); setSubsError("Сервер недоступен"); } })
      .finally(() => { if (!cancelled) setSubsLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const payableSubs = subs.filter(s => s.due > 0);
  const paidUpSubs = subs.filter(s => !(s.due > 0));

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  function startPolling(id) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/mkassa/status/${id}`, { headers: authHeader });
        const json = await res.json();
        const status = json.status || json.data?.status;
        if (status === "paid") {
          clearInterval(pollRef.current);
          setStage("success");
        } else if (status === "canceled" || status === "failed" || status === "expired") {
          clearInterval(pollRef.current);
          setError(`Платёж не завершён (${status})`);
          setStage("error");
        }
      } catch {
        // Сеть моргнула — не рвём поллинг, попробуем на следующем тике
      }
    }, 3000);
  }

  // Сумма для абонемента считается сервером живьём из МойКласс (remindSumm/
  // price с учётом скидки) — то, что передаём здесь, только для ручного режима.
  async function submitPayment({ userSubscriptionId, amountSom, label }) {
    setError("");
    setStage("creating");
    try {
      const res = await fetch(`${API_URL}/mkassa/create-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          userId,
          ...(userSubscriptionId ? { userSubscriptionId } : { amountSom }),
          comment: `Оплата — ${studentName || userId}${label ? " · " + label : ""}`,
        }),
      });
      const json = await res.json();
      const created = json.data;
      if (!res.ok || !json.ok || !created?.id) {
        setError(json.error || "Не удалось создать платёж");
        setStage("form");
        return;
      }
      setPayment(created);
      setStage("qr");
      startPolling(created.id);
    } catch {
      setError("Сервер недоступен");
      setStage("form");
    }
  }

  function handlePaySubscription(sub) {
    submitPayment({ userSubscriptionId: sub.userSubscriptionId, label: sub.level });
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    const sum = Number(amount);
    if (!sum || sum <= 0) { setError("Введите сумму в сомах"); return; }
    submitPayment({ amountSom: sum });
  }

  function handleCancel() {
    if (payment?.id) {
      fetch(`${API_URL}/mkassa/cancel/${payment.id}`, { method: "POST", headers: authHeader }).catch(() => {});
    }
    if (pollRef.current) clearInterval(pollRef.current);
    onClose();
  }

  const qrImg = payment?.paymentToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(payment.paymentToken)}`
    : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(23,56,22,.55)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 20, zIndex: 1000 }}>
      <style>{`@keyframes bePulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }`}</style>
      <div style={{ background: "#fff", borderRadius: 18, padding: 24, maxWidth: 340,
                    width: "100%", fontFamily: "system-ui,sans-serif", textAlign: "center" }}>

        {stage === "form" && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
              Оплата обучения
            </div>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 18 }}>
              {studentName || `Ученик #${userId}`}
            </div>

            {subsLoading && (
              <div style={{ fontSize: 13, color: C.gray, padding: "16px 0" }}>
                Загружаем абонемент из МойКласс...
              </div>
            )}

            {!subsLoading && !manualMode && subs.length > 0 && (
              <>
                {payableSubs.map(s => (
                  <div key={s.userSubscriptionId}
                    style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 14,
                             marginBottom: 10, textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                                  alignItems: "center", marginBottom: 6 }}>
                      <span style={{ background: C.sky, color: C.navy, fontSize: 10, fontWeight: 600,
                                     padding: "2px 8px", borderRadius: 10 }}>
                        {s.level || "Абонемент"}
                      </span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{s.due} сом</span>
                    </div>
                    {(s.discountPct > 0 || s.extraDiscount > 0) && (
                      <div style={{ fontSize: 11, color: C.green, marginBottom: 8 }}>
                        🏷 Скидка{s.discountPct > 0 ? ` ${s.discountPct}%` : ""}
                        {s.extraDiscount > 0 ? `${s.discountPct > 0 ? " + " : " "}компенсация ${s.extraDiscount} сом` : ""}
                        {" "}· {s.originalPrice} → {s.price} сом
                      </div>
                    )}
                    <button onClick={() => handlePaySubscription(s)}
                      style={{ width: "100%", background: C.gold, color: C.navy, border: "none",
                               borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700,
                               cursor: "pointer" }}>
                      Оплатить {s.due} сом
                    </button>
                  </div>
                ))}
                {paidUpSubs.map(s => (
                  <div key={s.userSubscriptionId}
                    style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 14,
                             marginBottom: 10, textAlign: "left", opacity: 0.7 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ background: C.sky, color: C.navy, fontSize: 10, fontWeight: 600,
                                     padding: "2px 8px", borderRadius: 10 }}>
                        {s.level || "Абонемент"}
                      </span>
                      <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>✓ Оплачено полностью</span>
                    </div>
                  </div>
                ))}
                {payableSubs.length === 0 && (
                  <Notice icon="✅" text="По найденным абонементам долгов нет — доплатить можно вручную ниже" />
                )}
                {error && (
                  <div style={{ background: C.redLt, color: C.red, borderRadius: 8,
                                padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>{error}</div>
                )}
                <button type="button" onClick={() => setManualMode(true)}
                  style={{ background: "none", border: "none", color: C.gray, fontSize: 12,
                           cursor: "pointer", textDecoration: "underline", marginBottom: 6 }}>
                  Ввести сумму вручную
                </button>
                <br />
                <button type="button" onClick={onClose}
                  style={{ background: "none", border: "none", color: C.gray, fontSize: 12,
                           cursor: "pointer", textDecoration: "underline" }}>
                  Отмена
                </button>
              </>
            )}

            {!subsLoading && (manualMode || subs.length === 0) && (
              <form onSubmit={handleManualSubmit}>
                {subs.length === 0 && subsError && (
                  <Notice icon="⚠️" text={`Не удалось проверить абонемент (${subsError}) — введите сумму вручную`} />
                )}
                {subs.length === 0 && !subsError && (
                  <Notice icon="ℹ️" text="Активный абонемент не найден в МойКласс — введите сумму вручную" />
                )}
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray,
                                marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em",
                                textAlign: "left" }}>
                  Сумма, сом
                </label>
                <input
                  type="number" inputMode="decimal" min="1" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="1000" autoFocus
                  style={{ width: "100%", padding: "12px 14px", border: `1px solid ${C.border}`,
                           borderRadius: 10, fontSize: 16, color: C.navy, background: "#fff",
                           outline: "none", boxSizing: "border-box", marginBottom: 14, textAlign: "center" }}
                />
                {error && (
                  <div style={{ background: C.redLt, color: C.red, borderRadius: 8,
                                padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>{error}</div>
                )}
                <button type="submit"
                  style={{ width: "100%", background: C.gold, color: C.navy, border: "none",
                           borderRadius: 12, padding: 14, fontSize: 14, fontWeight: 700,
                           cursor: "pointer", marginBottom: 10 }}>
                  Получить QR для оплаты
                </button>
                {subs.length > 0 && (
                  <button type="button" onClick={() => setManualMode(false)}
                    style={{ background: "none", border: "none", color: C.gray, fontSize: 12,
                             cursor: "pointer", textDecoration: "underline", display: "block",
                             margin: "0 auto 8px" }}>
                    ← Выбрать из абонементов
                  </button>
                )}
                <button type="button" onClick={onClose}
                  style={{ background: "none", border: "none", color: C.gray, fontSize: 12,
                           cursor: "pointer", textDecoration: "underline" }}>
                  Отмена
                </button>
              </form>
            )}
          </div>
        )}

        {stage === "creating" && (
          <div style={{ padding: "30px 0" }}>
            <div style={{ fontSize: 13, color: C.gray }}>Создаём платёж...</div>
          </div>
        )}

        {stage === "qr" && payment && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
              Отсканируйте QR
            </div>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 16 }}>
              MBank / Элсом / О!Деньги · {payment.amountSom} сом
            </div>
            {qrImg && (
              <img src={qrImg} alt="QR для оплаты" width={220} height={220}
                   style={{ borderRadius: 12, border: `1px solid ${C.border}`, marginBottom: 16 }} />
            )}
            <div style={{ fontSize: 11, color: C.gray, marginBottom: 16, display: "flex",
                          alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.gold,
                             display: "inline-block", animation: "bePulse 1.4s infinite" }} />
              Ожидаем оплату...
            </div>
            <a href={payment.paymentToken} target="_blank" rel="noreferrer"
               style={{ display: "block", fontSize: 12, color: C.green, marginBottom: 14 }}>
              Открыть в приложении банка →
            </a>
            <button type="button" onClick={handleCancel}
              style={{ background: "none", border: "none", color: C.gray, fontSize: 12,
                       cursor: "pointer", textDecoration: "underline" }}>
              Отменить оплату
            </button>
          </>
        )}

        {stage === "success" && (
          <div style={{ padding: "10px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 6 }}>
              Оплата прошла успешно
            </div>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 20 }}>
              {payment?.amountSom} сом зачислено
            </div>
            <button type="button" onClick={onClose}
              style={{ width: "100%", background: C.navy, color: "#fff", border: "none",
                       borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Готово
            </button>
          </div>
        )}

        {stage === "error" && (
          <div style={{ padding: "10px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.red, marginBottom: 6 }}>
              {error}
            </div>
            <button type="button"
              onClick={() => { setStage("form"); setPayment(null); setError(""); }}
              style={{ width: "100%", background: C.navy, color: "#fff", border: "none",
                       borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 600, cursor: "pointer",
                       marginBottom: 8 }}>
              Попробовать снова
            </button>
            <button type="button" onClick={onClose}
              style={{ background: "none", border: "none", color: C.gray, fontSize: 12,
                       cursor: "pointer", textDecoration: "underline" }}>
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PORTFOLIO LOADER (fetches real data from backend) ───────────────────────
function PortfolioLoader({ userId, studentName, onBack, authHeader = {}, onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/p/${userId}`, { headers: authHeader })
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
          <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}>
            <Logo height={32} />
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
      <Portfolio data={data} studentName={studentName} onBack={onBack}
                 authHeader={authHeader} onLogout={onLogout} />
    </>
  );
}

// ─── PORTFOLIO VIEW ───────────────────────────────────────────────────────────
// Оформление значков-достижений — привязано к id значка из backend (server.js)
const BADGE_STYLE = {
  streak:  { bg: "#F7528E", fg: "#fff",    icon: "🔥" },
  perfect: { bg: "#4DB20D", fg: "#fff",    icon: "✅" },
  top:     { bg: "#FFE465", fg: "#6b5300", icon: "🌟" },
};

function Portfolio({ data, studentName, onBack, authHeader = {}, onLogout }) {
  const d = data || DEMO;
  const [showPayment, setShowPayment] = useState(false);
  const gam = d.gamification || { xp: 0, streakLessons: 0, badges: [] };

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", background: C.bg,
                  minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: C.brandGradient, padding: "20px 20px 0",
                    position: "relative", overflow: "hidden", borderRadius: "0 0 22px 22px" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180,
                      borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />

        {onBack && (
          <button onClick={onBack}
            style={{ background: "rgba(255,255,255,.18)", border: "none", color: "#fff",
                     fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20,
                     cursor: "pointer", marginBottom: 14 }}>← Все ученики</button>
        )}
        {onLogout && (
          <button onClick={onLogout}
            style={{ background: "rgba(255,255,255,.18)", border: "none", color: "#fff",
                     fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20,
                     cursor: "pointer", marginBottom: 14, float: "right" }}>Выйти</button>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ marginBottom: 6 }}>
              <Logo height={18} onDark />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 3 }}>
              {studentName || d.name || `Ученик #${d.userId}`}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)" }}>
              Портфолио ученика
            </div>
          </div>
          <div style={{ background: C.brandYellow, color: "#6b5300", fontSize: 12, fontWeight: 700,
                        width: 46, height: 46, borderRadius: "50%", display: "flex",
                        alignItems: "center", justifyContent: "center", flexShrink: 0,
                        border: "2px solid #fff", transform: "rotate(-8deg)" }}>
            {d.level?.toUpperCase()}
          </div>
        </div>

        {gam.streakLessons > 0 && (
          <div style={{ background: "#fff", borderRadius: "14px 14px 14px 4px",
                        padding: "7px 13px", display: "inline-block", marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: C.navy }}>
              {gam.streakLessons >= 5
                ? `Отличная серия — ${gam.streakLessons} уроков подряд!`
                : "Продолжаем в том же духе!"}
            </span>
          </div>
        )}

        <LevelBar level={d.level} pct={d.levelProgress} />
      </div>

      <div style={{ padding: 16 }}>

        {/* Streak + XP */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={{ background: C.brandPink, borderRadius: 14, padding: "10px 12px",
                        display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🔥</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{gam.streakLessons}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.9)" }}>уроков подряд</div>
            </div>
          </div>
          <div style={{ background: `linear-gradient(135deg, ${C.brandPurple}, ${C.brandBlue})`,
                        borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>⭐</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{gam.xp}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.9)" }}>очков опыта</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            ["📅", `${d.attendance}%`, "Посещаемость"],
            ["📝", `${d.visitedLessons}/${d.totalLessons}`, "Уроков"],
            ["🎯", d.avgMark ? `${d.avgMark}` : "—", "Ср. балл"],
          ].map(([ic, v, lb]) => (
            <div key={lb} style={{ background: C.white, border: `1px solid ${C.border}`,
                                   borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 5 }}>{ic}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.navy, lineHeight: 1, marginBottom: 3 }}>{v}</div>
              <div style={{ fontSize: 10, color: C.gray }}>{lb}</div>
            </div>
          ))}
        </div>

        {/* Значки-достижения */}
        {gam.badges.length > 0 && (
          <>
            <SecTitle>Значки</SecTitle>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
              {gam.badges.map((b, i) => {
                const st = BADGE_STYLE[b.id] || { bg: C.border, fg: C.gray, icon: "🏅" };
                return (
                  <div key={b.id} style={{ textAlign: "center", flexShrink: 0, width: 68 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: "50%",
                      background: b.earned ? st.bg : C.border,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22, margin: "0 auto", border: "2px solid #fff",
                      boxShadow: `0 0 0 1px ${C.border}`,
                      transform: `rotate(${i % 2 === 0 ? -6 : 5}deg)`,
                      opacity: b.earned ? 1 : .5,
                    }}>
                      {b.earned ? st.icon : "🔒"}
                    </div>
                    <div style={{ fontSize: 9, color: C.gray, marginTop: 6, lineHeight: 1.3 }}>
                      {b.value != null ? `${b.value} · ` : ""}{b.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

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

        {/* Pay */}
        <button
          onClick={() => setShowPayment(true)}
          style={{ width: "100%", background: C.brandGradient, color: "#fff", border: "none",
                   borderRadius: 12, padding: 15, fontSize: 14, fontWeight: 700,
                   cursor: "pointer", marginBottom: 8 }}>
          💳 Оплатить обучение
        </button>

        {/* Share */}
        <button
          onClick={() => {
            const msg = `Прогресс ${studentName || "ученика"} в BE School 🎓\n` +
              `Уровень: ${d.level} (${d.levelProgress}%)\n` +
              `Посещаемость: ${d.attendance}%\n` +
              (d.avgMark ? `Средний балл: ${d.avgMark}/100\n` : "") +
              `\nПолный отчёт → ${FRONTEND_URL}/p/${d.userId}`;
            if (navigator.share) navigator.share({ text: msg });
            else navigator.clipboard?.writeText(msg).then(() => alert("Скопировано!"));
          }}
          style={{ width: "100%", background: C.brandYellow, color: "#6b5300", border: "none",
                   borderRadius: 12, padding: 15, fontSize: 14, fontWeight: 700,
                   cursor: "pointer", marginBottom: 8 }}>
          📤 Поделиться с родителем
        </button>

        <div style={{ textAlign: "center", fontSize: 10, color: C.gray, paddingBottom: 20 }}>
          <strong style={{ color: C.navy }}>BE School</strong> · Каракол · Кыргызстан
          <br />Обновлено: {new Date(d.lastSync).toLocaleString("ru-RU")}
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          userId={d.userId}
          studentName={studentName || d.name}
          onClose={() => setShowPayment(false)}
          authHeader={authHeader}
        />
      )}
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
            name: s.name || `Ученик #${s.userId}`,
            visits: s.visits,
            total: s.totalLessons || 0,
            attendancePct: s.attendance, // null если ещё нет данных по посещаемости
            level: classInfo.level,
            lastMark: s.avgMark, // средний балл из реальных оценок (null если оценок ещё нет)
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
          <Logo height={18} onDark />
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
            [students.length ? (() => {
              const withData = students.filter(s => s.attendancePct != null);
              if (!withData.length) return "—";
              return Math.round(withData.reduce((a,s)=>a+s.attendancePct,0)/withData.length)+"%";
            })() : "—","Посещ."],
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
        const attend = s.attendancePct; // null если ещё нет посещений
        const mark   = s.lastMark;      // средний балл, null если оценок ещё нет
        return (
          <div key={s.id} style={{ background: C.white, border: `1px solid ${C.border}`,
                                   borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 2 }}>{s.name}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ background: C.sky, color: C.navy, fontSize: 10, fontWeight: 600,
                                padding: "2px 8px", borderRadius: 10 }}>{s.level}</span>
                <span style={{ fontSize: 11, color: C.gray }}>{s.visits}/{s.total} уроков</span>
              </div>
            </div>

            {/* Посещаемость и средний балл — рядом, одинаковый стиль шкал */}
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 36px",
                          alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: C.gray }}>Посещ.</span>
              <AnimBar pct={attend ?? 0} color={attend == null ? C.border : attend >= 80 ? C.green : attend >= 60 ? C.gold : C.red} h={6} />
              <span style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>{attend != null ? `${attend}%` : "—"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 36px",
                          alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: C.gray }}>Ср. балл</span>
              <AnimBar pct={mark ?? 0} color={mark == null ? C.border : scoreColor(mark)} h={6} />
              <span style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>{mark != null ? mark : "—"}</span>
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
                  const link = `${FRONTEND_URL}/p/${s.id}`;
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

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <Logo height={48} />
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

// ─── PARENT LOGIN SCREEN (ID ученика из МойКласс + пароль, по умолчанию 12345678) ─
function ParentLoginScreen({ onLogin, onBackToRole, presetUserId }) {
  const [userId, setUserId] = useState(presetUserId ? String(presetUserId) : "");
  // Если пришли по персональной ссылке /p/:id — ID уже известен, заблокирован,
  // остаётся ввести только пароль (см. запрос заказчика: "ссылка будет
  // содержать только его ID"). Можно снять блокировку ссылкой "Это не я".
  const [idLocked, setIdLocked] = useState(!!presetUserId);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!userId || !password) {
      setError("Введите ID ученика и пароль");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/parent/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      const json = await res.json();
      if (json.ok) {
        localStorage.setItem("be_parent_token", json.token);
        localStorage.setItem("be_parent_userId", String(json.userId));
        onLogin(json.token, json.userId, json.mustChangePassword);
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

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <Logo height={48} />
        </div>

        <div style={{ fontSize: 13, color: C.gray, marginBottom: 26 }}>
          Вход для учеников и родителей
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray,
                            marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>
              ID ученика
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              readOnly={idLocked}
              placeholder="Например, 9602487"
              style={{ width: "100%", padding: "11px 13px", border: `1px solid ${C.border}`,
                       borderRadius: 10, fontSize: 14, color: C.navy,
                       background: idLocked ? C.bg : "#fff",
                       outline: "none", boxSizing: "border-box" }}
            />
            {idLocked && (
              <button type="button" onClick={() => setIdLocked(false)}
                style={{ background: "none", border: "none", color: C.gray, fontSize: 11,
                         marginTop: 4, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                Это не я — ввести другой ID
              </button>
            )}
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray,
                            marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="По умолчанию 12345678"
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
          ID ученика — тот же, что и в ссылке на портфолио.<br/>
          Пароль по умолчанию: 12345678 (при первом входе попросим сменить).<br/>
          Забыли новый пароль — обратитесь к администратору для сброса.
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

// ─── CHANGE PASSWORD SCREEN (обязателен при первом входе с паролем по умолчанию) ─
function ChangePasswordScreen({ authHeader, onDone, onLogout }) {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (pw1.length !== 8) {
      setError("Пароль должен содержать ровно 8 символов");
      return;
    }
    if (pw1 !== pw2) {
      setError("Пароли не совпадают");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/parent/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ newPassword: pw1 }),
      });
      const json = await res.json();
      if (json.ok) {
        onDone();
      } else {
        setError(json.error || "Не удалось сменить пароль");
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

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <Logo height={48} />
        </div>

        <div style={{ fontSize: 13, color: C.navy, fontWeight: 600, marginBottom: 6 }}>
          Смена пароля
        </div>
        <div style={{ fontSize: 12, color: C.gray, marginBottom: 22, lineHeight: 1.5 }}>
          Вы вошли с паролем по умолчанию. Придумайте новый пароль
          из 8 символов, чтобы продолжить.
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray,
                            marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>
              Новый пароль (8 символов)
            </label>
            <input
              type="password"
              value={pw1}
              onChange={e => setPw1(e.target.value)}
              maxLength={8}
              style={{ width: "100%", padding: "11px 13px", border: `1px solid ${C.border}`,
                       borderRadius: 10, fontSize: 14, color: C.navy, background: "#fff",
                       outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray,
                            marginBottom: 5, textTransform: "uppercase", letterSpacing: ".04em" }}>
              Повторите пароль
            </label>
            <input
              type="password"
              value={pw2}
              onChange={e => setPw2(e.target.value)}
              maxLength={8}
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
            {loading ? "Сохраняем..." : "Сохранить и войти"}
          </button>
        </form>

        {onLogout && (
          <button onClick={onLogout}
            style={{ background: "none", border: "none", color: C.gray, fontSize: 12,
                     marginTop: 16, cursor: "pointer", textDecoration: "underline" }}>
            ← Выйти
          </button>
        )}
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
          <Logo height={16} onDark />
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
// ─── ADMIN LOGIN GATE (доступ только у владельца) ───────────────────────────
function AdminGate({ onBack, children }) {
  const [token, setToken] = useState(() => localStorage.getItem("be_admin_token") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  // Проверяем сохранённый токен на валидность при загрузке
  useEffect(() => {
    if (!token) { setChecking(false); return; }
    fetch(`${API_URL}/admin/teachers`, { headers: { "x-admin-token": token } })
      .then(r => { setVerified(r.ok); setChecking(false); })
      .catch(() => setChecking(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (json.ok) {
        localStorage.setItem("be_admin_token", json.token);
        setToken(json.token);
        setVerified(true);
      } else {
        setError(json.error || "Неверный пароль");
      }
    } catch {
      setError("Сервер недоступен");
    }
    setLoading(false);
  }

  if (checking) return null;

  if (!verified) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                  minHeight: "100vh", background: C.bg, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ textAlign: "center", padding: 24, maxWidth: 320, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <Logo height={40} />
        </div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>Доступ администратора</div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Пароль администратора"
            autoFocus
            style={{ width: "100%", padding: "11px 13px", border: `1px solid ${C.border}`,
                     borderRadius: 10, fontSize: 14, color: C.navy, background: "#fff",
                     outline: "none", boxSizing: "border-box", marginBottom: 12 }}
          />
          {error && (
            <div style={{ background: C.redLt, color: C.red, borderRadius: 8,
                          padding: "8px 12px", fontSize: 12, marginBottom: 12 }}>{error}</div>
          )}
          <button type="submit" disabled={loading}
            style={{ width: "100%", background: loading ? C.border : C.navy,
                     color: loading ? C.gray : "#fff", border: "none", borderRadius: 12,
                     padding: 13, fontSize: 14, fontWeight: 600, cursor: loading ? "default" : "pointer" }}>
            {loading ? "Проверяем..." : "Войти"}
          </button>
        </form>
        <button onClick={onBack}
          style={{ background: "none", border: "none", color: C.gray, fontSize: 12,
                   marginTop: 16, cursor: "pointer", textDecoration: "underline" }}>
          ← Назад
        </button>
      </div>
    </div>
  );

  return children(token);
}

function AdminPanel({ onBack }) {
  return (
    <AdminGate onBack={onBack}>
      {(adminToken) => <AdminPanelInner onBack={onBack} adminToken={adminToken} />}
    </AdminGate>
  );
}

function AdminPanelInner({ onBack, adminToken }) {
  const authHeaders = { "x-admin-token": adminToken };
  const [managers, setManagers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ managerId: "", email: "", name: "", pin: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [resetId, setResetId] = useState("");
  const [resetSaving, setResetSaving] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  // Платежи MKassa — на случай если коллбэк от банка не пришёл, а деньги
  // уже списаны: список последних транзакций + кнопка "Сверить" на каждой
  // (дёргает /mkassa/recheck/:id, который перепроверяет статус у MKassa
  // напрямую и, если реально оплачено, зачисляет платёж в МойКласс).
  const [mkassaTx, setMkassaTx] = useState([]);
  const [mkassaLoading, setMkassaLoading] = useState(true);
  const [recheckingId, setRecheckingId] = useState(null);
  const [recheckMsg, setRecheckMsg] = useState("");

  function loadMkassaTx() {
    setMkassaLoading(true);
    fetch(`${API_URL}/admin/mkassa/transactions`, { headers: authHeaders })
      .then(r => r.json())
      .then(json => { if (json.ok) setMkassaTx(json.data); })
      .catch(() => {})
      .finally(() => setMkassaLoading(false));
  }

  useEffect(() => { loadMkassaTx(); }, []);

  async function handleRecheck(id) {
    setRecheckingId(id);
    setRecheckMsg("");
    try {
      const res = await fetch(`${API_URL}/mkassa/recheck/${encodeURIComponent(id)}`, {
        method: "POST", headers: authHeaders,
      });
      const json = await res.json();
      if (json.ok) {
        const status = json.data?.status;
        setRecheckMsg(
          status === "paid" ? `✅ ${id}: оплата найдена и зачислена в МойКласс`
          : `ℹ️ ${id}: статус в MKassa — ${status}`
        );
        loadMkassaTx();
      } else {
        setRecheckMsg(json.error || "Ошибка сверки");
      }
    } catch {
      setRecheckMsg("Сервер недоступен");
    }
    setRecheckingId(null);
  }

  function loadAll() {
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/admin/managers`, { headers: authHeaders }).then(r => r.json()),
      fetch(`${API_URL}/admin/teachers`, { headers: authHeaders }).then(r => r.json()),
      fetch(`${API_URL}/admin/students`, { headers: authHeaders }).then(r => r.json()),
    ]).then(([m, t, s]) => {
      if (m.ok) setManagers(m.data);
      if (t.ok) setTeachers(t.data);
      if (s.ok) setStudents(s.data);
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
        headers: { "Content-Type": "application/json", ...authHeaders },
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
    await fetch(`${API_URL}/admin/teachers/${encodeURIComponent(email)}`, {
      method: "DELETE", headers: authHeaders,
    });
    loadAll();
  }

  async function handleResetPassword(userId) {
    const uid = String(userId).trim();
    if (!uid) { setResetMsg("Введите ID ученика"); return; }
    setResetSaving(true);
    setResetMsg("");
    try {
      const res = await fetch(`${API_URL}/admin/students/${encodeURIComponent(uid)}/reset-password`, {
        method: "POST", headers: authHeaders,
      });
      const json = await res.json();
      if (json.ok) {
        setResetMsg(`✅ Пароль ученика #${uid} сброшен на 12345678`);
        setResetId("");
        loadAll();
      } else {
        setResetMsg(json.error || "Ошибка");
      }
    } catch {
      setResetMsg("Сервер недоступен");
    }
    setResetSaving(false);
  }

  function handleLogout() {
    localStorage.removeItem("be_admin_token");
    onBack();
  }

  // Справочники МойКласс — чтобы найти id типа оплаты и кассы под приложение
  // без curl/Postman: тот же пароль администратора, что и выше.
  const [paymentTypes, setPaymentTypes] = useState(null);
  const [cashboxes, setCashboxes] = useState(null);
  const [refsLoading, setRefsLoading] = useState({ types: false, cashboxes: false });
  const [refsError, setRefsError] = useState({ types: "", cashboxes: "" });

  async function loadPaymentTypes() {
    setRefsLoading(r => ({ ...r, types: true }));
    setRefsError(e => ({ ...e, types: "" }));
    try {
      const res = await fetch(`${API_URL}/admin/moyklass/payment-types`, { headers: authHeaders });
      const json = await res.json();
      if (json.ok) setPaymentTypes(json.data);
      else setRefsError(e => ({ ...e, types: json.error || "Ошибка" }));
    } catch {
      setRefsError(e => ({ ...e, types: "Сервер недоступен" }));
    }
    setRefsLoading(r => ({ ...r, types: false }));
  }

  async function loadCashboxes() {
    setRefsLoading(r => ({ ...r, cashboxes: true }));
    setRefsError(e => ({ ...e, cashboxes: "" }));
    try {
      const res = await fetch(`${API_URL}/admin/moyklass/cashboxes`, { headers: authHeaders });
      const json = await res.json();
      if (json.ok) setCashboxes(json.data);
      else setRefsError(e => ({ ...e, cashboxes: json.error || "Ошибка" }));
    } catch {
      setRefsError(e => ({ ...e, cashboxes: "Сервер недоступен" }));
    }
    setRefsLoading(r => ({ ...r, cashboxes: false }));
  }

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", background: C.bg,
                  minHeight: "100vh", padding: 16, maxWidth: 520, margin: "0 auto" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack}
            style={{ background: "none", border: "none", color: C.gray, fontSize: 20, cursor: "pointer" }}>←</button>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>Управление учителями</div>
        </div>
        <button onClick={handleLogout}
          style={{ background: C.redLt, color: C.red, border: "none", borderRadius: 8,
                   padding: "5px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          Выйти из админки
        </button>
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

      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
          🔎 Справочники МойКласс
        </div>
        <div style={{ fontSize: 11, color: C.gray, marginBottom: 12 }}>
          Найди id типа оплаты и кассы для приложения — они нужны в переменных
          MOYKLASS_PAYMENT_TYPE_ID / MOYKLASS_CASHBOX_ID на Railway.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <button type="button" onClick={loadPaymentTypes} disabled={refsLoading.types}
            style={{ background: C.sky, color: C.navy, border: "none", borderRadius: 8,
                     padding: "8px 0", fontSize: 12, fontWeight: 600,
                     cursor: refsLoading.types ? "default" : "pointer" }}>
            {refsLoading.types ? "Загрузка..." : "Показать типы оплат"}
          </button>
          <button type="button" onClick={loadCashboxes} disabled={refsLoading.cashboxes}
            style={{ background: C.sky, color: C.navy, border: "none", borderRadius: 8,
                     padding: "8px 0", fontSize: 12, fontWeight: 600,
                     cursor: refsLoading.cashboxes ? "default" : "pointer" }}>
            {refsLoading.cashboxes ? "Загрузка..." : "Показать кассы"}
          </button>
        </div>

        {refsError.types && (
          <div style={{ background: C.redLt, color: C.red, borderRadius: 8,
                        padding: "8px 12px", fontSize: 12, marginBottom: 10 }}>{refsError.types}</div>
        )}
        {paymentTypes && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.gray, textTransform: "uppercase",
                          marginBottom: 6 }}>Типы оплат</div>
            {paymentTypes.length === 0 && <div style={{ fontSize: 12, color: C.gray }}>Пусто</div>}
            {paymentTypes.map(t => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between",
                                       fontSize: 13, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                <span>{t.name}</span>
                <span style={{ fontFamily: "monospace", color: C.navy, fontWeight: 600 }}>id: {t.id}</span>
              </div>
            ))}
          </div>
        )}

        {refsError.cashboxes && (
          <div style={{ background: C.redLt, color: C.red, borderRadius: 8,
                        padding: "8px 12px", fontSize: 12, marginBottom: 10 }}>{refsError.cashboxes}</div>
        )}
        {cashboxes && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.gray, textTransform: "uppercase",
                          marginBottom: 6 }}>Кассы</div>
            {cashboxes.length === 0 && <div style={{ fontSize: 12, color: C.gray }}>Пусто</div>}
            {cashboxes.map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between",
                                       fontSize: 13, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                <span>{c.name}{c.paymentTypeId != null ? ` (тип ${c.paymentTypeId})` : ""}</span>
                <span style={{ fontFamily: "monospace", color: C.navy, fontWeight: 600 }}>id: {c.id}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
          🔑 Сброс пароля ученика
        </div>
        <div style={{ fontSize: 11, color: C.gray, marginBottom: 12, lineHeight: 1.5 }}>
          Ученики входят по своему ID из МойКласс (тот же, что и в ссылке на
          портфолио). Пароль по умолчанию — 12345678, при первом входе
          система просит сменить его на свой. Если ученик забыл новый пароль,
          сбрось его здесь — он снова сможет войти паролем по умолчанию.
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input value={resetId} onChange={e => setResetId(e.target.value)}
            placeholder="ID ученика"
            inputMode="numeric"
            style={{ flex: 1, padding: "9px 11px", border: `1px solid ${C.border}`,
                     borderRadius: 8, fontSize: 13, color: C.navy, background: C.bg,
                     boxSizing: "border-box" }} />
          <button type="button" onClick={() => handleResetPassword(resetId)} disabled={resetSaving}
            style={{ background: C.navy, color: "#fff", border: "none", borderRadius: 8,
                     padding: "0 16px", fontSize: 12, fontWeight: 600,
                     cursor: resetSaving ? "default" : "pointer" }}>
            {resetSaving ? "..." : "Сбросить"}
          </button>
        </div>

        {resetMsg && (
          <div style={{ fontSize: 12, color: resetMsg.startsWith("✅") ? C.green : C.red, marginBottom: 10 }}>
            {resetMsg}
          </div>
        )}

        <div style={{ fontSize: 10, fontWeight: 700, color: C.gray, textTransform: "uppercase",
                      marginBottom: 6 }}>
          Ученики со своим паролем ({students.length})
        </div>
        {students.length === 0 && <div style={{ fontSize: 12, color: C.gray }}>Никто ещё не менял пароль</div>}
        {students.map(s => (
          <div key={s.userId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                                       fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontFamily: "monospace", color: C.navy }}>ID {s.userId}</span>
            <button onClick={() => handleResetPassword(s.userId)}
              style={{ background: C.redLt, color: C.red, border: "none", borderRadius: 8,
                       padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              Сбросить пароль
            </button>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
          💳 Платежи MKassa
        </div>
        <div style={{ fontSize: 11, color: C.gray, marginBottom: 12, lineHeight: 1.5 }}>
          Зачисление в МойКласс происходит по коллбэку от банка. Если оплата
          прошла в банке, а тут всё ещё «pending» — коллбэк не дошёл. Жми
          «Сверить»: приложение само перепроверит статус у MKassa и, если
          деньги реально получены, зачислит платёж.
        </div>

        {recheckMsg && (
          <div style={{ fontSize: 12, color: recheckMsg.startsWith("✅") ? C.green : C.navy, marginBottom: 10 }}>
            {recheckMsg}
          </div>
        )}

        {mkassaLoading && <div style={{ color: C.gray, fontSize: 13 }}>Загрузка...</div>}
        {!mkassaLoading && mkassaTx.length === 0 && (
          <div style={{ fontSize: 12, color: C.gray }}>Транзакций пока нет</div>
        )}
        {mkassaTx.map(tx => {
          const statusLabel = {
            paid: "✅ Оплачено", pending: "⏳ Ожидание", canceled: "Отменено",
            amount_mismatch: "⚠️ Несовпадение суммы",
          }[tx.status] || tx.status;
          const statusColor = tx.status === "paid" ? C.green : tx.status === "pending" ? C.gray : C.red;
          return (
            <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                                       fontSize: 12, padding: "8px 0", borderBottom: `1px solid ${C.border}`, gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "monospace", color: C.navy }}>{tx.id}</div>
                <div style={{ color: C.gray, fontSize: 11 }}>
                  ID {tx.userId} · {tx.amountSom} сом · <span style={{ color: statusColor }}>{statusLabel}</span>
                </div>
              </div>
              {tx.status !== "paid" && (
                <button onClick={() => handleRecheck(tx.id)} disabled={recheckingId === tx.id}
                  style={{ background: C.sky, color: C.navy, border: "none", borderRadius: 8,
                           padding: "5px 10px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
                           cursor: recheckingId === tx.id ? "default" : "pointer", flexShrink: 0 }}>
                  {recheckingId === tx.id ? "..." : "Сверить"}
                </button>
              )}
            </div>
          );
        })}
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
// Персональная ссылка вида /p/12345 — открывается по клику из мессенджера.
// Читаем ID один раз при загрузке страницы (SPA-роутинга у нас нет и не
// нужно — маршрут ровно один). vercel.json отдаёт index.html на любой путь,
// иначе Vercel вернёт 404 ещё до того, как загрузится React.
function parseLinkedStudentId() {
  if (typeof window === "undefined") return null;
  const m = window.location.pathname.match(/^\/p\/(\d+)/);
  return m ? m[1] : null;
}

export default function App() {
  const linkedStudentId = parseLinkedStudentId();
  const [screen, setScreen]   = useState(linkedStudentId ? "parent-login" : "role"); // role | login | parent-login | change-password | classes | dashboard | portfolio
  const [selected, setSelected] = useState(null);
  const [session, setSession] = useState(null); // { token, teacher }
  const [parentSession, setParentSession] = useState(null); // { token, userId }
  const [viewerMode, setViewerMode] = useState(null); // 'teacher' | 'parent' — кто сейчас смотрит /p/:id
  const [activeClass, setActiveClass] = useState(null);

  // Автологин учителя: проверяем сохранённую сессию ЧЕРЕЗ backend (не доверяем
  // localStorage вслепую — backend хранит сессии в памяти и может их терять при передеплое)
  useEffect(() => {
    const token = localStorage.getItem("be_session_token");
    if (!token) return;

    fetch(`${API_URL}/auth/me`, { headers: { "x-session-token": token } })
      .then(r => r.json())
      .then(json => {
        if (json.ok) {
          setSession({ token, teacher: json.teacher });
          // Открыт по персональной ссылке /p/:id — учитель видит любого
          // своего ученика, сразу показываем портфолио (checkStudentAccess
          // на бэкенде всё равно проверит, что это его ученик).
          if (linkedStudentId) {
            setSelected({ id: Number(linkedStudentId) });
            setViewerMode("teacher");
            setScreen("portfolio");
          }
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

  // Автологин ученика/родителя — тот же паттерн, отдельная сессия. Если пароль
  // ещё не сменён (mustChangePassword) — сразу отправляем на экран смены,
  // даже при повторном открытии страницы.
  useEffect(() => {
    const token = localStorage.getItem("be_parent_token");
    if (!token) return;

    fetch(`${API_URL}/parent/me`, { headers: { "x-parent-token": token } })
      .then(r => r.json())
      .then(json => {
        if (json.ok) {
          setParentSession({ token, userId: json.userId });
          if (json.mustChangePassword) {
            setScreen("change-password");
          } else if (linkedStudentId && String(json.userId) === String(linkedStudentId)) {
            // Открыт по ссылке своего же ребёнка — сессия уже есть, сразу портфолио
            setSelected({ id: json.userId });
            setViewerMode("parent");
            setScreen("portfolio");
          }
          // Иначе (ссылка другого ребёнка) — остаёмся на экране входа с
          // ID из ссылки, залогиниваться нужно отдельно под него
        } else {
          localStorage.removeItem("be_parent_token");
          localStorage.removeItem("be_parent_userId");
        }
      })
      .catch(() => {});
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

  function handleParentLogin(token, userId, mustChangePassword) {
    setParentSession({ token, userId });
    if (mustChangePassword) {
      setScreen("change-password");
    } else {
      setSelected({ id: userId });
      setViewerMode("parent");
      setScreen("portfolio");
    }
  }

  function handlePasswordChanged() {
    setSelected({ id: parentSession?.userId });
    setViewerMode("parent");
    setScreen("portfolio");
  }

  function handleParentLogout() {
    const token = parentSession?.token;
    if (token) {
      fetch(`${API_URL}/parent/logout`, {
        method: "POST",
        headers: { "x-parent-token": token },
      }).catch(() => {});
    }
    localStorage.removeItem("be_parent_token");
    localStorage.removeItem("be_parent_userId");
    setParentSession(null);
    setScreen("role");
  }

  // Заголовок авторизации для запросов к /p/:id и /mkassa/* — зависит от того,
  // кто сейчас смотрит портфолио (учитель видит любого своего ученика,
  // родитель — только своего ребёнка, см. checkStudentAccess на бэкенде)
  const authHeader = viewerMode === "teacher" && session
    ? { "x-session-token": session.token }
    : viewerMode === "parent" && parentSession
    ? { "x-parent-token": parentSession.token }
    : {};

  // ── role picker ──
  if (screen === "role") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                  minHeight: "100vh", background: C.bg, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ textAlign: "center", padding: 24, maxWidth: 340, width: "100%" }}>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <Logo height={56} />
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
          <button
            onClick={() => {
              if (parentSession) {
                setSelected({ id: parentSession.userId });
                setViewerMode("parent");
                setScreen("portfolio");
              } else {
                setScreen("parent-login");
              }
            }}
            style={{ background: "#fff", color: C.navy, border: `2px solid ${C.navy}`,
                     borderRadius: 12, padding: 15, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            👨‍👩‍👧 Ученик / родитель{parentSession ? ` — ID ${parentSession.userId}` : ""}
          </button>
        </div>

        <div style={{ fontSize: 11, color: C.gray, marginTop: 20, lineHeight: 1.7 }}>
          Вход по ID ученика и паролю, который выдаёт школа.<br/>
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

  // ── parent/student login ──
  if (screen === "parent-login") return (
    <ParentLoginScreen onLogin={handleParentLogin} onBackToRole={() => setScreen("role")}
                       presetUserId={linkedStudentId} />
  );

  // ── mandatory password change (first login with default password) ──
  if (screen === "change-password") return (
    <ChangePasswordScreen
      authHeader={{ "x-parent-token": parentSession?.token }}
      onDone={handlePasswordChanged}
      onLogout={handleParentLogout}
    />
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
      authHeader={authHeader}
      onBack={viewerMode === "teacher" ? () => setScreen("dashboard") : null}
      onLogout={viewerMode === "parent" ? handleParentLogout : null}
    />
  );

  // ── dashboard (students within selected class, or demo fallback) ──
  return (
    <Dashboard
      classInfo={activeClass}
      onBackToClasses={session ? () => setScreen("classes") : null}
      onView={s => { setSelected(s); setViewerMode("teacher"); setScreen("portfolio"); }}
    />
  );
}
