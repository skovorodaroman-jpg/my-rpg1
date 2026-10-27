import { useState, useEffect, useReducer, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
/* ================= НАЛАШТУВАННЯ ================= */
const USE_MOCK = true; // true — тест без сервера; false — використовує /api/colosseum
const API = "/api/colosseum";
const BATTLE_SECONDS = 300;
const ATTACK_CD = 5;
const POTION_CD = 60;
const DODGE_CD = 30;
const BUFF_SECONDS = 60;
const TOURNAMENT_PRIZES = [[25, 5000], [125, 7500], [250, 10000]];
const ASSETS = { arena: null, hero: null, enemy: null };

const rnd = (a, b) => a + Math.random() * (b - a);
const fmtInt = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
const fmtBig = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e4 ? (n / 1e3).toFixed(1) + "K" : fmtInt(n));
const mmss = (s) => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0")}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
const plural = (n, [a, b, c]) => {
  const m = n % 100, d = n % 10;
  return m > 10 && m < 20 ? c : d === 1 ? a : d >= 2 && d <= 4 ? b : c;
};
const starText = (h) => {
  const w = Math.floor(Math.abs(h) / 2), half = Math.abs(h) % 2;
  if (!w && !half) return "0";
  return `${w || ""}${half ? "½" : ""}`;
};

/* ================= API ================= */
async function http(path, opts = {}) {
  const r = await fetch(API + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!r.ok) throw new Error(`Помилка ${r.status}`);
  return r.json();
}
const realApi = {
  state: () => http("/state"),
  join: () => http("/queue/join", { method: "POST" }),
  status: () => http("/queue/status"),
  leave: () => http("/queue/leave", { method: "POST" }),
  finish: (b) => http("/battle/finish", { method: "POST", body: JSON.stringify(b) }),
};

const mock = {
  name: "Мандрівник", level: 75, gold: 13706, silver: 2400000, exp: 0, power: 34424,
  rank_no: 15, stars_half: 8, rating: 1523, win_streak: 0, place: 48,
  first_win_available: true, skulls: 0, ends_at: new Date(Date.now() + 864e5).toISOString(),
};
let mockPolls = 0;
const mockApi = {
  state: async () => ({ ...mock }),
  join: async () => { mockPolls = 0; return {}; },
  leave: async () => ({}),
  status: async () => {
    mockPolls++;
    if (mockPolls < 3) return { queued: true, matched: false, count: mockPolls, max: 5 };
    // Зазвичай 4 суперники; 3 — іноді, 2 — рідко.
    const roll = Math.random();
    const count = roll < 0.05 ? 2 : roll < 0.25 ? 3 : 4;
    const names = ["Санягрот", "Амбаш", "Бормансс", "Темний Вершник"].slice(0, count);
    return {
      queued: false, matched: true,
      opponents: names.map((name) => ({
        name, power: Math.round(mock.power * rnd(0.75, 1.2)),
      })),
    };
  },
  finish: async ({ place, kills }) => {
    const base = 1 + (26 - mock.rank_no) * 0.12;
    const pm = [1, 0.6, 0.3, 0.1, 0.05][Math.min(place - 1, 4)] || 0.05;
    const lm = 1 + mock.level / 150;
    const first = place === 1 && mock.first_win_available;
    const multiplier = first ? 20 : 1;
    let gain = [2, 1, 0, -1, -1][Math.min(place - 1, 4)];
    const streak = place === 1 ? mock.win_streak + 1 : 0;
    if (place === 1 && streak >= 3) gain += 2;
    let half = mock.stars_half + gain, rank = mock.rank_no, gold = Math.max(gain, 0) >> 1;
    while (half >= 10 && rank > 1) { half -= 10; rank--; gold += Math.round(2 + (26 - rank) * 0.67); }
    half = Math.min(Math.max(half, 0), 10);
    const res = {
      old_rank: mock.rank_no, new_rank: rank, rank_up: rank < mock.rank_no, stars_half: half,
      stars_gain_half: gain, rating_delta: [14, 5, -5, -12, -15][Math.min(place - 1, 4)],
      gold, first_win: first, silver: Math.round(50 * base * pm * lm) * multiplier,
      exp: Math.round(56 * base * pm * lm) * multiplier, win_streak: streak,
      skulls_gained: mock.rank_no <= 23 ? kills : 0,
    };
    Object.assign(mock, {
      rank_no: rank, stars_half: half, win_streak: streak,
      rating: mock.rating + res.rating_delta, gold: mock.gold + gold,
      silver: mock.silver + res.silver, exp: mock.exp + res.exp,
      first_win_available: first ? false : mock.first_win_available,
      skulls: mock.skulls + res.skulls_gained,
    });
    return { ...res, rating: mock.rating };
  },
};

/* ================= БОЙ: ЛОГІКА ================= */
let logId = 0;
const addLog = (log, events) =>
  [...events.slice().reverse().map((e) => ({ ...e, id: ++logId })), ...log].slice(0, 50);
const firstAlive = (enemies, from = 0, exclude = -1) => {
  if (!enemies.length) return -1;
  for (let i = 0; i < enemies.length; i++) {
    const j = (from + i + enemies.length) % enemies.length;
    if (j !== exclude && enemies[j].hp > 0) return j;
  }
  return -1;
};
const initBattle = (opponents, power) => {
  const enemies = (Array.isArray(opponents) ? opponents : []).slice(0, 4).map((o, i) => ({
    id: o.id || `${o.name || "Противник"}-${i}`,
    name: o.name || `Противник ${i + 1}`,
    power: Math.max(1, Number(o.power) || Math.round(power * rnd(0.75, 1.1))),
    hp: Math.max(1, Number(o.power) || Math.round(power * rnd(0.75, 1.1))),
    maxHp: Math.max(1, Number(o.power) || Math.round(power * rnd(0.75, 1.1))),
  })).map((e) => ({ ...e, hp: e.maxHp }));
  return {
    hp: Math.max(1, Number(power) || 100), maxHp: Math.max(1, Number(power) || 100), power: Math.max(1, Number(power) || 100),
    enemies, target: firstAlive(enemies), time: BATTLE_SECONDS,
    attackCd: 0, potionCd: 0, dodgeCd: 0, dodgeReady: false,
    rockUntil: 0, grassUntil: 0, clock: 0, lastAttacker: null,
    kills: 0, over: enemies.length === 0, fxMe: null, fxEnemy: null,
    log: [{ id: 0, k: "start" }],
  };
};
const damageToEnemy = (b, targetIndex, extra = {}) => {
  if (targetIndex < 0 || !b.enemies[targetIndex] || b.enemies[targetIndex].hp <= 0) return b;
  const target = b.enemies[targetIndex];
  const rockActive = b.rockUntil > b.clock;
  const crit = Math.random() < 0.1;
  const damage = Math.max(1, Math.round(b.power * rnd(0.07, 0.1) * (rockActive ? 1.35 : 1) * (crit ? 2 : 1)));
  const hp = Math.max(0, target.hp - damage);
  const enemies = b.enemies.map((e, i) => i === targetIndex ? { ...e, hp } : e);
  const events = [{ k: "hit", tgt: target.name, n: damage, crit, ...extra }];
  if (hp === 0) events.push({ k: "kill", tgt: target.name });
  const kills = b.kills + (hp === 0 ? 1 : 0);
  const nextTarget = hp === 0 ? firstAlive(enemies, targetIndex + 1) : targetIndex;
  return {
    ...b, enemies, kills, target: nextTarget,
    over: b.hp <= 0 || enemies.every((e) => e.hp <= 0) || b.time <= 0,
    log: addLog(b.log, events), fxEnemy: { id: ++logId, val: damage, crit },
  };
};
function reducer(b, action) {
  if (b.over) return b;
  switch (action.type) {
    case "TICK": {
      const clock = b.clock + 1;
      let hp = b.hp, events = [], fxMe = b.fxMe, lastAttacker = b.lastAttacker;
      const dodgeReady = b.dodgeReady;
      // Противники час від часу атакують гравця. Уворот блокує одну наступну атаку.
      for (const enemy of b.enemies) {
        if (enemy.hp <= 0 || hp <= 0 || Math.random() > 0.32) continue;
        if (dodgeReady) {
          events.push({ k: "dodge", who: enemy.name });
          break;
        }
        let damage = Math.round(enemy.power * rnd(0.025, 0.045));
        if (b.grassUntil > b.clock) damage = Math.round(damage * 0.65);
        hp = Math.max(0, hp - damage);
        lastAttacker = enemy.id;
        events.push({ k: "taken", who: enemy.name, n: damage });
        fxMe = { id: ++logId, val: damage };
      }
      const time = b.time - 1;
      const next = {
        ...b, hp, time, clock, fxMe, lastAttacker,
        attackCd: Math.max(0, b.attackCd - 1),
        potionCd: Math.max(0, b.potionCd - 1),
        dodgeCd: Math.max(0, b.dodgeCd - 1),
        rockUntil: b.rockUntil > clock ? b.rockUntil : 0,
        grassUntil: b.grassUntil > clock ? b.grassUntil : 0,
        dodgeReady: dodgeReady && !events.some((e) => e.k === "dodge") ? dodgeReady : false,
        log: addLog(b.log, events),
        over: hp <= 0 || time <= 0 || b.enemies.every((e) => e.hp <= 0),
      };
      return next;
    }
    case "ATTACK": {
      if (b.attackCd > 0) return b;
      const ti = b.enemies[b.target]?.hp > 0 ? b.target : firstAlive(b.enemies, b.target);
      if (ti < 0) return { ...b, over: true };
      const next = damageToEnemy({ ...b, attackCd: ATTACK_CD }, ti);
      return { ...next, attackCd: ATTACK_CD };
    }
    case "DODGE": {
      if (b.dodgeCd > 0) return b;
      const attacker = b.lastAttacker;
      const idx = attacker ? b.enemies.findIndex((e) => e.id === attacker && e.hp > 0) : -1;
      const targetIndex = idx >= 0 ? idx : firstAlive(b.enemies, b.target + 1);
      let next = { ...b, dodgeCd: DODGE_CD, dodgeReady: true };
      next = { ...next, log: addLog(next.log, [{ k: "skill", name: "Уворот" }]) };
      // Уворот теж атакує: б'є останнього нападника, якщо він живий, і перемикає ціль на нього.
      if (targetIndex >= 0) next = damageToEnemy(next, targetIndex, { action: "dodge" });
      return { ...next, target: targetIndex >= 0 && next.enemies[targetIndex]?.hp > 0 ? targetIndex : firstAlive(next.enemies, targetIndex + 1) };
    }
    case "POTION": {
      if (b.potionCd > 0) return b;
      const healed = { ...b, hp: b.maxHp, potionCd: POTION_CD, log: addLog(b.log, [{ k: "potion" }]) };
      const ti = healed.enemies[healed.target]?.hp > 0 ? healed.target : firstAlive(healed.enemies, healed.target);
      return ti < 0 ? healed : damageToEnemy(healed, ti, { action: "potion" });
    }
    case "STANCE": {
      const ti = b.enemies[b.target]?.hp > 0 ? b.target : firstAlive(b.enemies, b.target);
      if (ti < 0) return b;
      const now = b.clock;
      const untilKey = action.v === "rock" ? "rockUntil" : "grassUntil";
      const active = b[untilKey] > now;
      let next = { ...b, [untilKey]: active ? 0 : now + BUFF_SECONDS };
      next = damageToEnemy(next, ti, { action: action.v });
      return { ...next, log: addLog(next.log, [{ k: "skill", name: action.v === "rock" ? "Камінь: +35% шкоди на 60 с" : "Трава: +35% захисту на 60 с" }]) };
    }
    case "TARGET": {
      const n = firstAlive(b.enemies, b.target + 1, b.target);
      if (n < 0) return b;
      return damageToEnemy({ ...b, target: n }, n, { action: "target" });
    }
    case "SELECT_TARGET": {
      const n = Number(action.index);
      if (n < 0 || n >= b.enemies.length || b.enemies[n].hp <= 0 || n === b.target) return b;
      return damageToEnemy({ ...b, target: n }, n, { action: "target" });
    }
    default:
      return b;
  }
}

/* ================= МАЛІ КОМПОНЕНТИ ================= */
function RankBadge({ rank, size = 84, wings = false }) {
  const c = `hsl(34, 62%, ${34 + (26 - rank) * 1.6}%)`;
  return <svg viewBox="0 0 120 70" width={size * 1.4} height={size * 0.82} aria-label={`Ранг ${rank}`}>
    {wings && <g fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"><path d="M44 30 C28 22 14 24 4 30 C16 30 26 36 40 44" /><path d="M76 30 C92 22 106 24 116 30 C104 30 94 36 80 44" /></g>}
    <path d="M60 3 L82 12 V32 C82 46 72 56 60 62 C48 56 38 46 38 32 V12 Z" fill="#1d1a16" stroke={c} strokeWidth="3" />
    <path d="M48 20 L72 40 M72 20 L48 40" stroke={c} strokeWidth="3" strokeLinecap="round" />
    <text x="60" y="58" textAnchor="middle" fontSize="19" fontWeight="700" fill={c} stroke="#000" strokeWidth=".6">{rank}</text>
  </svg>;
}
function Stars({ half }) {
  const full = Math.floor(half / 2), h = half % 2;
  return <div className="stars" aria-label={`Зірок: ${starText(half)} з 5`}>{[0,1,2,3,4].map((i) => <span key={i} className={i < full ? "st full" : i === full && h ? "st half" : "st"}>★</span>)}</div>;
}
const TopBar = ({ left, right }) => <div className="top"><span><i className="ic red" /> {left}</span>{right !== undefined && <><span className="sep">|</span><span><i className="ic violet" /> {right}</span></>}</div>;
function Footer({ me, onNavigate, links = true }) {
  return <>{links && <nav className="nav"><button onClick={() => onNavigate("hero")}>Мій герой</button><button onClick={() => onNavigate("clan")}>Мій клан <span className="plus">(+)</span></button><button onClick={() => onNavigate("home")}>На головну</button></nav>}
    <div className="player"><div className="pname"><i className="ic blue" /> {me.name}</div><div className="pres"><span className="up">▲</span> {me.level} | <i className="ic coin" /> {fmtInt(me.gold)} | <i className="ic silver" /> {fmtBig(me.silver)}</div></div></>;
}

/* ================= ЕКРАНИ ================= */
function Lobby({ me, onJoin, onNavigate }) {
  const target = Math.max(1, me.rank_no - 1);
  const days = me.ends_at ? Math.max(0, Math.ceil((new Date(me.ends_at) - Date.now()) / 864e5)) : null;
  return <>
    <TopBar left={fmtInt(me.power)} right={me.rating} />
    <section className="sec">
      <h2 className="title">Колізей</h2>
      {me.first_win_available ? <p className="mute">Перша перемога принесе нагороду у 20 разів більшу!</p> : <p className="mute">Бийся за ранг, рейтинг і нагороди</p>}
      <button className="btn" onClick={onJoin}>Увійти в чергу</button>
      <p className="small mute">У бою: ти та 2–4 противники. Кожен бореться сам за себе.</p>
    </section>
    <section className="sec"><div className="ranks"><div><RankBadge rank={me.rank_no} size={64}/><p className="mute">Твій ранг</p></div><Stars half={me.stars_half}/><div><RankBadge rank={target} size={64}/><p className="goal">Наступна ціль</p></div></div>
      <p className="place">Твоє місце в рейтингу: <b>{me.place}</b></p><div className="row"><button className="btn sm" onClick={() => onNavigate("colosseum-rating")}>Рейтинг</button><button className="btn sm" onClick={() => onNavigate("boosts")}>Підсилення</button></div>
    </section>
    {days !== null && <section className="sec"><h2 className="title">Турнір Колізею</h2><p className="big">Черепи: 💀 {me.skulls} з {TOURNAMENT_PRIZES[0][0]}</p><p className="small">{TOURNAMENT_PRIZES.map(([n,g],i)=><span key={n}>{i===0?"Накопичи":i===1?"Якщо накопичиш":"Якщо збереш"} {n} черепів — розіграш {fmtInt(g)} золота.<br/></span>)}</p><p className="big">До кінця турніру: {days} {plural(days,["день","дні","днів"])}</p><button className="link" onClick={() => onNavigate("tournament")}>Детальніше</button></section>}
    <ul className="hints"><li>За 3 перемоги поспіль дається додаткова зірка.</li><li>Черепи нараховуються за умовами поточного турніру.</li></ul>
  </>;
}
function Queue({ me, q, onRefresh, onLeave }) {
  return <><TopBar left={fmtInt(me.power)} right={me.rating}/><section className="sec"><h2 className="title">Пошук суперників</h2><p className="big">У черзі: {q.count} з {q.max}</p><p className="mute">Шукаємо від 2 до 4 противників…</p><button className="btn sm" onClick={onRefresh}>Оновити</button><br/><button className="btn" onClick={onLeave}>Скасувати пошук</button></section><section className="sec"><div className="ranks"><div><RankBadge rank={me.rank_no} size={64}/><p className="mute">Твій ранг</p></div><Stars half={me.stars_half}/><div><RankBadge rank={Math.max(1,me.rank_no-1)} size={64}/><p className="goal">Наступна ціль</p></div></div></section></>;
}
function LogLine({ e }) {
  switch (e.k) {
    case "start": return <p className="me">Бій розпочався!</p>;
    case "hit": return <p className="me">Ти завдав {e.tgt} шкоди: <b>{fmtInt(e.n)}</b>{e.crit ? " — критичний удар!" : ""}</p>;
    case "kill": return <p className="me">☠ {e.tgt} вибув із бою.</p>;
    case "skill": return <p className="me">Застосовано: <span className="skill">{e.name}</span></p>;
    case "potion": return <p className="me">Настоянка відновила HP до 100%.</p>;
    case "dodge": return <p className="me">Уворот від атаки {e.who}.</p>;
    case "taken": return <p className="foe">{e.who} завдав тобі <b>{fmtInt(e.n)}</b> шкоди.</p>;
    default: return null;
  }
}
function Battle({ me, opponents, onFinish }) {
  const [b, dispatch] = useReducer(reducer, null, () => initBattle(opponents, me.power));
  const finishCalled = useRef(false);
  useEffect(() => {
    if (b.over) return undefined;
    const timer = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(timer);
  }, [b.over]);
  const target = b.enemies[b.target] || b.enemies.find((e) => e.hp > 0);
  const alive = b.enemies.filter((e) => e.hp > 0).length;
  const place = b.hp <= 0 ? b.enemies.filter((e) => e.hp > 0).length + 1 : alive + 1;
  const finish = () => {
    if (finishCalled.current) return;
    finishCalled.current = true;
    const standings = [{ name: me.name, me: true, hp: b.hp, kills: b.kills }, ...b.enemies.map((e) => ({ name: e.name, hp: e.hp, kills: 0 }))].sort((a, c) => c.hp - a.hp);
    const actualPlace = Math.max(1, standings.findIndex((s) => s.me) + 1);
    onFinish({ place: actualPlace, kills: b.kills, enemies: b.enemies, standings });
  };
  const leave = () => {
    if (window.confirm("Покинути бій? Це буде зараховано як поразка.")) {
      if (!finishCalled.current) { finishCalled.current = true; onFinish({ place: b.enemies.length + 1, kills: b.kills, enemies: b.enemies, standings: [] }); }
    }
  };
  if (!target && !b.over) return <section className="sec"><p>Усі противники вибули.</p><button className="btn" onClick={finish}>Завершити бій</button></section>;
  const buffLeft = (until) => Math.max(0, until - b.clock);
  return <>
    <div className="top"><span><i className="ic red"/> HP {fmtInt(b.hp)} / {fmtInt(b.maxHp)}</span><span className="timer">{mmss(b.time)}</span></div>
    <div className="names"><span><i className="ic blue"/> {me.name}<br/><small>{fmtInt(b.hp)} HP</small></span><span>{target ? target.name : "Бій завершено"}<br/><small>{target ? `${fmtInt(target.hp)} / ${fmtInt(target.maxHp)} HP` : ""}</small></span></div>
    <div className="arena" style={ASSETS.arena ? { backgroundImage: `url(${ASSETS.arena})` } : undefined}>
      <div className="hpbar l"><div style={{width:`${Math.max(0,b.hp/b.maxHp*100)}%`}}/></div>
      <div className="hpbar r"><div style={{width:`${target ? Math.max(0,target.hp/target.maxHp*100):0}%`}}/></div>
      <div className="buffs">{b.rockUntil>b.clock&&<span title="Камінь">⛰ +35% шкоди · {buffLeft(b.rockUntil)}с</span>}{b.grassUntil>b.clock&&<span title="Трава">🌿 +35% захисту · {buffLeft(b.grassUntil)}с</span>}</div>
      <div className="fighter l">{ASSETS.hero?<img src={ASSETS.hero} alt=""/>:"🛡️"}</div>
      <div className={`fighter r ${!target||target.hp<=0?"dead":""}`}>{ASSETS.enemy?<img src={ASSETS.enemy} alt=""/>:"⚔️"}</div>
      {b.fxMe&&<span key={b.fxMe.id} className="fx l">-{b.fxMe.val}</span>}{b.fxEnemy&&<span key={b.fxEnemy.id} className={`fx r ${b.fxEnemy.crit?"crit":""}`}>-{b.fxEnemy.val}</span>}
    </div>
    <div className="target-list"><b>Учасники ({alive} противників залишилося)</b>{b.enemies.map((e,i)=><button key={e.id} disabled={e.hp<=0||i===b.target||b.over} className={`target-chip ${i===b.target?"selected":""} ${e.hp<=0?"dead-chip":""}`} onClick={()=>dispatch({type:"SELECT_TARGET",index:i})}>{e.name}: {fmtInt(e.hp)} HP</button>)}</div>
    <div className="actions">
      <button className="act" disabled={b.over||b.dodgeCd>0} onClick={()=>dispatch({type:"DODGE"})}>💨 Уворот<small>{b.dodgeCd>0?mmss(b.dodgeCd):"раз на 30 с"}</small></button>
      <button className="act main" disabled={b.over||b.attackCd>0} onClick={()=>dispatch({type:"ATTACK"})}>{b.over?"БІЙ ЗАВЕРШЕНО":b.attackCd>0?`АТАКА ${b.attackCd} с`:"АТАКУВАТИ"}<small>раз на 5 секунд</small></button>
      <button className="act" disabled={b.over||alive<2} onClick={()=>dispatch({type:"TARGET"})}>🎯 Змінити ціль<small>і завдати шкоди</small></button>
      <button className="act" disabled={b.over||b.potionCd>0} onClick={()=>dispatch({type:"POTION"})}>🧪 Настоянка<small>{b.potionCd>0?mmss(b.potionCd):"HP до 100% · раз на 60 с"}</small></button>
      <button className={`act ${b.rockUntil>b.clock?"on":"ready"}`} disabled={b.over} onClick={()=>dispatch({type:"STANCE",v:"rock"})}>⛰ Камінь<small>{b.rockUntil>b.clock?`+35% шкоди · ${buffLeft(b.rockUntil)}с`:"+35% шкоди · 60 с"}</small></button>
      <button className={`act ${b.grassUntil>b.clock?"on":"ready"}`} disabled={b.over} onClick={()=>dispatch({type:"STANCE",v:"grass"})}>🌿 Трава<small>{b.grassUntil>b.clock?`+35% захисту · ${buffLeft(b.grassUntil)}с`:"+35% захисту · 60 с"}</small></button>
    </div>
    {b.over&&<button className="btn" onClick={finish}>Підбити підсумки бою</button>}
    <p className="inbattle">Твоє HP: <b>{fmtInt(b.hp)}</b>. Противники: {b.enemies.map((e,i)=><span key={e.id}>{e.hp>0?`${e.name} ${fmtInt(e.hp)} HP`:`${e.name} ☠`}{i<b.enemies.length-1?", ":""}</span>)}</p>
    <div className="log">{b.log.map((e)=><LogLine key={e.id} e={e}/>)}</div>
    <div className="player"><div className="pname"><i className="ic blue"/> {me.name}</div><div className="pres"><span className="up">▲</span> {me.level} | <i className="ic coin"/> {fmtInt(me.gold)} | <i className="ic silver"/> {fmtBig(me.silver)}</div></div>
    {!b.over&&<button className="link leave" onClick={leave}>Покинути бій</button>}
  </>;
}
function Result({ me, r, onAgain, onBack, onNavigate }) {
  const win = r.place === 1;
  const sign = (h) => h > 0 ? "+" : h < 0 ? "-" : "+";
  const standings = Array.isArray(r.standings) ? r.standings : [];
  return <>
    <TopBar left={fmtInt(me.power)} right={me.rating}/>
    <section className="sec result"><h2 className="title">{win?"Перемога":r.place===r.totalPlayers?"Поразка":"Бій завершено"}</h2>
      {r.rank_up?<><p className="mute">Ти отримав новий ранг</p><RankBadge rank={r.new_rank} size={110} wings/></>:<><RankBadge rank={r.new_rank} size={80}/><Stars half={r.stars_half}/></>}
      {r.gold>0&&<p className="goldtxt">+{fmtInt(r.gold)} 🪙 золота</p>}<p className="mute">{r.first_win?"Нагорода ×20 за першу перемогу:":"Нагорода за бій:"}</p>
      <p className="big">⚪ {fmtInt(r.silver)} срібла · ✨ {fmtInt(r.exp)} досвіду</p><p className="mute">Зміна рейтингу: {r.rating_delta>0?"+":""}{r.rating_delta}</p>
    </section>
    <section className="sec"><p className="best">Результати бою</p>
      {standings.map((s,i)=><p key={`${s.name}-${i}`} className="res"><span className={s.me?"lnk":"lnk foe"}>{i+1}. {s.name}</span>{s.me&&<b> — ти</b>}</p>)}
      <button className="btn" onClick={onAgain}>Новий бій</button><br/><button className="link" onClick={onBack}>Повернутися до Колізею</button>
    </section><Footer me={me} onNavigate={onNavigate}/>
  </>;
}

/* ================= СТОРІНКА ================= */
export default function Colosseum({ onNavigate = () => {} }) {
  const api = USE_MOCK ? mockApi : realApi;
  const [screen,setScreen] = useState("lobby");
  const [me,setMe] = useState(null);
  const [err,setErr] = useState(null);
  const [q,setQ] = useState({count:1,max:5});
  const [opps,setOpps] = useState([]);
  const [result,setResult] = useState(null);
  const load = useCallback(() => api.state().then((s)=>{setMe(s);setErr(null);}).catch((e)=>setErr(e.message)),[api]);
  useEffect(()=>{load();},[load]);
  const poll = useCallback(async()=>{
    try{
      const s=await api.status();
      if(s.matched){
        const opponents=(Array.isArray(s.opponents)?s.opponents:[]).slice(0,4);
        if(opponents.length<2) throw new Error("Для бою потрібно щонайменше 2 противники.");
        setOpps(opponents);setScreen("battle");setErr(null);
      } else if(!s.queued) setScreen("lobby");
      else setQ({count:s.count??1,max:s.max??5});
    }catch(e){setErr(e.message);}
  },[api]);
  useEffect(()=>{if(screen!=="queue")return undefined;const t=setInterval(poll,2000);return()=>clearInterval(t);},[screen,poll]);
  const join=async()=>{try{setErr(null);await api.join();setQ({count:1,max:5});setScreen("queue");}catch(e){setErr(e.message);}};
  const leave=async()=>{try{await api.leave();}catch{}setScreen("lobby");};
  const finish=async({place,kills,enemies,standings})=>{
    try{
      const totalPlayers=(Array.isArray(enemies)?enemies.length:0)+1;
      const safePlace=Math.min(totalPlayers,Math.max(1,place||totalPlayers));
      const r=await api.finish({place:safePlace,kills,total_players:totalPlayers});
      const finalStandings=Array.isArray(standings)&&standings.length?standings:[{name:me.name,me:true},...(enemies||[]).map(e=>({name:e.name,hp:e.hp}))].sort((a,b)=>(b.hp||0)-(a.hp||0));
      setResult({...r,place:safePlace,totalPlayers,standings:finalStandings});
      await load();setScreen("result");
    }catch(e){setErr(e.message);setScreen("lobby");}
  };
  if(!me)return <div className="col"><style>{CSS}</style><p className="mute pad">{err?`Не вдалося завантажити: ${err}`:"Завантаження…"}</p>{err&&<button className="btn" onClick={load}>Повторити</button>}{err&&<p className="small mute">Якщо серверного API ще немає, для тесту встанови USE_MOCK = true.</p>}</div>;
  return <div className="col"><style>{CSS}</style>{err&&<p className="error" role="alert">{err}</p>}
    {screen==="lobby"&&<><Lobby me={me} onJoin={join} onNavigate={onNavigate}/><Footer me={me} onNavigate={onNavigate}/></>}
    {screen==="queue"&&<><Queue me={me} q={q} onRefresh={poll} onLeave={leave}/><Footer me={me} onNavigate={onNavigate}/></>}
    {screen==="battle"&&<Battle key={opps.map(o=>o.id||o.name).join("|")} me={me} opponents={opps} onFinish={finish}/>}
    {screen==="result"&&result&&<Result me={me} r={result} onAgain={join} onBack={()=>setScreen("lobby")} onNavigate={onNavigate}/>}
  </div>;
}

/* ================= СТИЛІ ================= */
const CSS = `
.col{--bg:#171511;--line:#3b362d;--gold:#eba43a;--green:#9db37c;--mute:#a29b8d;--text:#ece6d8;--foe:#cf6650;--skill:#c777d6;max-width:560px;margin:0 auto;min-height:100vh;background:var(--bg);color:var(--text);font:16px/1.35 Roboto,system-ui,-apple-system,sans-serif;text-align:center}
.col *{box-sizing:border-box}.col p{margin:6px 12px}.col button{font:inherit;color:inherit;cursor:pointer}.col button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}.col button:disabled{opacity:.42;cursor:not-allowed}
.pad{padding:40px 12px}.error{background:#4a1f18;color:#ffd5cc;padding:8px;margin:0!important}.top{display:flex;justify-content:center;align-items:center;gap:12px;padding:9px 8px;background:#100f0d;border-bottom:2px solid #4a4236;font-size:20px}.top .sep{color:var(--mute)}.timer{margin-left:auto;margin-right:8px;font-variant-numeric:tabular-nums}.top:has(.timer){justify-content:space-between}
.ic{display:inline-block;width:.8em;height:.8em;border-radius:3px;vertical-align:-.05em;margin-right:2px}.ic.red{background:#d2382c;border-radius:2px 2px 50% 50%}.ic.violet{background:#8d63c4;transform:rotate(45deg) scale(.85)}.ic.blue{background:#3f62c8;border-radius:50% 50% 40% 40%}.ic.coin{background:#d19a2d;border-radius:50%}.ic.silver{background:#d8d4cc;border-radius:50%}.ic.exp{background:#a89a62}
.sec{padding:12px 6px 14px;border-bottom:2px solid #34302a}.title{color:var(--green);font-size:22px;font-weight:700;margin:2px 0 4px}.mute{color:var(--mute)}.goal{color:var(--green)}.big{font-size:19px}.small{font-size:14px;line-height:1.4}.place{color:var(--gold);font-size:20px;margin-top:14px!important}.btn{background:linear-gradient(#3c3a37,#2a2927);border:1px solid #74664e;border-radius:6px;padding:11px 22px;margin:10px 4px 2px;box-shadow:inset 0 1px 0 #ffffff14,0 2px 0 #0008;font-size:18px}.btn:active{transform:translateY(1px)}.btn.sm{font-size:16px;padding:9px 14px}.row{display:flex;justify-content:center;flex-wrap:wrap;gap:4px}.link{background:none;border:0;color:var(--mute);text-decoration:underline;font-size:17px;padding:8px}.ranks{display:flex;justify-content:space-around;align-items:center;margin:4px 0}.stars{display:flex;gap:4px;justify-content:center;font-size:27px;line-height:1}.st{color:#4a443a}.st.full{color:#f2a62a;text-shadow:0 0 6px #f2a62a55}.st.half{background:linear-gradient(90deg,#f2a62a 50%,#4a443a 50%);-webkit-background-clip:text;background-clip:text;color:transparent}
.hints{list-style:none;margin:0;padding:10px 12px;color:#e8923a;text-align:left;font-size:14px;border-bottom:2px solid #34302a}.hints li{padding-left:16px;position:relative;margin:4px 0}.hints li:before{content:"";position:absolute;left:0;top:.55em;width:6px;height:6px;background:#b8682a}.nav button{display:block;width:100%;text-align:left;background:none;border:0;border-bottom:1px dotted #4a443a;padding:14px 12px;font-size:20px;color:var(--gold)}.nav .plus{color:#4cae4f}.player{background:#100f0d;padding:10px 12px 12px;border-top:2px solid #4a4236;margin-top:14px}.pname{font-size:21px;text-align:left}.pres{font-size:18px}.up{color:#58b94d}.dn{color:#d2574a}.result .goldtxt{color:var(--gold);font-size:18px}.best{font-weight:700;font-size:20px}.res{font-size:17px}.res .lnk{color:var(--gold);text-decoration:underline}.res .foe{color:#e0a064}
.names{display:flex;justify-content:space-between;gap:10px;padding:10px 12px;font-size:17px}.names span{max-width:48%;overflow-wrap:anywhere}.names small{color:var(--mute);font-size:13px}.arena{position:relative;height:210px;margin:0 12px;border:3px solid #4a4236;overflow:hidden;background:linear-gradient(#554437 0%,#986b42 45%,#75502f 46%,#ad8150 100%) center/cover}.hpbar{position:absolute;top:8px;width:36%;height:7px;background:#12110f;border:1px solid #d2c3a2}.hpbar.l{left:5%}.hpbar.r{right:5%}.hpbar div{height:100%;background:#55a82d;transition:width .25s}.buffs{position:absolute;left:6px;top:24px;display:flex;flex-direction:column;align-items:flex-start;gap:4px;z-index:2}.buffs span{padding:4px 6px;background:#201c17dd;border:1px solid #b18a4c;border-radius:4px;font-size:11px}.fighter{position:absolute;bottom:14px;font-size:76px;filter:drop-shadow(0 6px 4px #0006)}.fighter img{height:160px;max-width:100px;object-fit:contain}.fighter.l{left:15%}.fighter.r{right:15%}.fighter.dead{opacity:.25;transform:rotate(80deg)}.fx{position:absolute;top:36px;font-weight:700;font-size:22px;color:#ff3b30;text-shadow:0 1px 2px #000;animation:rise .9s ease-out forwards}.fx.l{left:30%}.fx.r{right:18%}.fx.crit{font-size:28px;color:#ffd23a}@keyframes rise{from{opacity:1;transform:translateY(18px)}to{opacity:0;transform:translateY(-10px)}}@media(prefers-reduced-motion:reduce){.fx{animation:none;opacity:.9}}
.target-list{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px;padding:10px 12px;border-bottom:1px solid #34302a}.target-list b{width:100%;font-size:13px;color:var(--mute)}.target-chip{background:#29251f;border:1px solid #514737;border-radius:5px;padding:6px 8px;font-size:12px!important}.target-chip.selected{border-color:var(--gold);color:var(--gold)}.target-chip.dead-chip{text-decoration:line-through;opacity:.35}
.actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:12px 10px}.act{min-height:76px;background:linear-gradient(#2c2a27,#232220);border:2px solid #4a443a;border-radius:6px;font-size:15px!important;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:6px 3px;gap:3px}.act small{font-size:11px;color:#c1b8a7;line-height:1.2}.act.ready{border-color:#3f8a26;box-shadow:0 0 8px #3f8a2633}.act.on{background:linear-gradient(#2f4a22,#223618);border-color:#7ccf4f}.act.main{background:linear-gradient(#e0561a,#b53a08);border-color:#ff8a3d;box-shadow:0 0 10px #ff6a1f55;font-weight:700}.act:disabled{opacity:.42}.inbattle{text-align:left!important;font-size:14px;padding:10px 12px;border-top:2px solid #34302a;margin:0!important;overflow-wrap:anywhere}.log{text-align:left;padding:6px 12px 10px;border-top:2px solid #34302a;border-bottom:2px solid #34302a;max-height:220px;overflow:auto}.log p{margin:5px 0;font-size:14px}.log .foe{color:var(--foe)}.log .skill{color:var(--skill)}.leave{display:block;margin:20px auto 30px}
@media(max-width:360px){.actions{gap:5px;padding:10px 6px}.act{font-size:13px!important;min-height:72px}.act small{font-size:10px}.fighter{font-size:62px}.names{font-size:14px}}
`;
