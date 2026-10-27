
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

/*
 * Колізей — Хроніки Згаслого Світанку
 * true  = тестовий бій
 * false = використання RPC Supabase (потребує узгодження формату відповіді)
 */
const USE_MOCK = false;

const MAX_PLAYERS = 5;
const BATTLE_SECONDS = 300;

const MOCK_PLAYER = {
  name: "Мандрівник",
  level: 75,
  power: 34424,
  gold: 13706,
  silver: 2400000,
  rating: 1523,
  rank_no: 15,
  stars_half: 8,
  place: 48,
  skulls: 0,
  first_win_available: true,
};

const mockNames = [
  "Темний Вершник",
  "Мисливець Тіней",
  "Вартовий Бездни",
  "Сталевий Вовк",
];

const number = (n) =>
  Math.round(Number(n) || 0).toLocaleString("uk-UA");

const timerText = (seconds) => {
  const s = Math.max(0, seconds);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(
    s % 60
  ).padStart(2, "0")}`;
};

const initialMockOpponents = (power) =>
  mockNames.slice(0, 3).map((name, i) => {
    const p = Math.round(power * (0.75 + Math.random() * 0.45));
    return {
      id: `enemy-${i}`,
      name,
      power: p,
      hp: p,
      maxHp: p,
      alive: true,
    };
  });

const makeBattle = (me) => ({
  hp: me.power,
  maxHp: me.power,
  seconds: BATTLE_SECONDS,
  attackCd: 0,
  dodgeCd: 0,
  potionCd: 0,
  rockUntil: 0,
  grassUntil: 0,
  clock: 0,
  kills: 0,
  target: 0,
  log: ["Бій розпочався!"],
  opponents: initialMockOpponents(me.power),
});

export default function Colosseum({ onNavigate = () => {} }) {
  const [screen, setScreen] = useState("lobby");
  const [me, setMe] = useState(MOCK_PLAYER);
  const [queueCount, setQueueCount] = useState(1);
  const [battle, setBattle] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const matchId = useRef(null);
  const finished = useRef(false);
    const queuePollLock = useRef(false);

  useEffect(() => {
    if (USE_MOCK || screen !== "queue" || !matchId.current) return;

    let cancelled = false;

    const checkQueue = async () => {
      if (queuePollLock.current || cancelled) return;
      queuePollLock.current = true;

      try {
        const id = matchId.current;
        if (!id) return;

        const { data, error } = await supabase.rpc(
          "colosseum_get_state",
          { p_match_id: id }
        );

        if (error) throw error;
        if (cancelled || matchId.current !== id) return;

        setQueueCount(Array.isArray(data?.players) ? data.players.length : 0);

        if (data?.status === "active") {
          const { data: state, error: startError } = await supabase.rpc(
            "colosseum_start_battle",
            { p_match_id: id }
          );

          if (startError) throw startError;
          if (cancelled || matchId.current !== id) return;

          const players = state?.players || {};
          const entries = Object.entries(players);
          const { data: userData } = await supabase.auth.getUser();
          const myId = userData?.user?.id;
          const meState = players[myId];

          if (!meState) {
            throw new Error("Твого персонажа немає в бойовому стані матчу.");
          }

          const opponents = entries
            .filter(([id]) => id !== myId)
            .map(([id, p]) => ({
              id,
              name: p.name || "Воїн",
              power: Number(p.power) || 100,
              hp: Number(p.hp) || 0,
              maxHp: Number(p.max_hp) || 100,
              alive: p.alive !== false,
            }));

          if (cancelled) return;

          finished.current = false;
          setBattle({
            hp: Number(meState.hp) || 0,
            maxHp: Number(meState.max_hp) || 100,
            seconds: BATTLE_SECONDS,
            attackCd: 0,
            dodgeCd: 0,
            potionCd: 0,
            rockUntil: 0,
            grassUntil: 0,
            clock: 0,
            kills: Number(meState.kills) || 0,
            target: Math.max(0, opponents.findIndex(o => o.hp > 0)),
            log: ["Серверний бій розпочався!"],
            opponents,
          });

          setScreen("battle");
        } else if (data?.status === "finished" || data?.status === "cancelled") {
          setError("Цей матч уже завершено. Повернися до Колізею та шукай новий.");
          matchId.current = null;
          setScreen("lobby");
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Не вдалося оновити чергу.");
      } finally {
        queuePollLock.current = false;
      }
    };

    checkQueue();
    const timer = setInterval(checkQueue, 2500);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [screen]);

  const loadPlayer = useCallback(async () => {
    if (USE_MOCK) {
      setMe(MOCK_PLAYER);
      return;
    }

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError) throw userError;
    if (!userData.user) throw new Error("Увійди в обліковий запис.");

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();

    if (profileError) throw profileError;

    setMe({
      ...MOCK_PLAYER,
      name: data.display_name || data.username || "Гравець",
      level: data.level || 1,
      power: Math.max(1, Number(data.power) || 100),
      gold: data.gold || 0,
      silver: data.silver || 0,
      rating: data.rating || 0,
    });
  }, []);

  useEffect(() => {
    loadPlayer().catch((e) => setError(e.message));
  }, [loadPlayer]);

  useEffect(() => {
    if (screen !== "battle" || !battle) return;

    const id = setInterval(() => {
      setBattle((old) => {
        if (!old) return old;

        const clock = old.clock + 1;
        let hp = old.hp;
        const log = [...old.log];
        let opponents = old.opponents.map((o) => ({ ...o }));

        // Автоматичні атаки суперників у тестовому режимі.
        if (USE_MOCK && Math.random() < 0.35) {
          const alive = opponents.filter((o) => o.hp > 0);

          if (alive.length && hp > 0) {
            const enemy = alive[
              Math.floor(Math.random() * alive.length)
            ];
            const damage = Math.max(
              1,
              Math.round(enemy.power * (0.02 + Math.random() * 0.025))
            );

            hp = Math.max(0, hp - damage);
            log.unshift(`${enemy.name} завдав ${number(damage)} шкоди.`);
          }
        }

        const seconds = Math.max(0, old.seconds - 1);
        const next = {
          ...old,
          hp,
          seconds,
          clock,
          opponents,
          log: log.slice(0, 40),
          attackCd: Math.max(0, old.attackCd - 1),
          dodgeCd: Math.max(0, old.dodgeCd - 1),
          potionCd: Math.max(0, old.potionCd - 1),
        };

        const living = opponents.filter((o) => o.hp > 0).length;
        if (hp <= 0 || living === 0 || seconds === 0) {
          setTimeout(() => conclude(next), 0);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [screen, Boolean(battle)]); // eslint-disable-line react-hooks/exhaustive-deps

  const joinQueue = async () => {
    setError("");
    setBusy(true);

    try {
      if (USE_MOCK) {
        setScreen("queue");
        setQueueCount(1);

        await new Promise((resolve) => setTimeout(resolve, 1200));

        setQueueCount(4);
        await new Promise((resolve) => setTimeout(resolve, 900));

        setBattle(makeBattle(me));
        finished.current = false;
        setScreen("battle");
        return;
      }

      const { data, error } = await supabase.rpc(
        "colosseum_join_queue"
      );

      if (error) throw error;

            const id = data?.match_id ?? data?.id;

      if (!id) {
        throw new Error("Сервер не повернув ID матчу.");
      }

      matchId.current = id;
      setQueueCount(Number(data?.players) || 1);
      finished.current = false;
      setScreen("queue");
    } catch (e) {
      setError(e.message || "Не вдалося увійти в чергу.");
    } finally {
      setBusy(false);
    }
  };

  const leaveQueue = async () => {
    try {
      if (!USE_MOCK) {
        const { error } = await supabase.rpc("colosseum_leave_queue");
        if (error) throw error;
      }

      matchId.current = null;
      setScreen("lobby");
    } catch (e) {
      setError(e.message);
    }
  };

  const updateBattle = (fn) => {
    setBattle((old) => {
      if (!old || finished.current) return old;
      return fn(old);
    });
  };

  const attack = () => updateBattle((b) => {
    if (b.attackCd > 0) return b;

    const opponents = b.opponents.map((o) => ({ ...o }));
    let index = b.target;

    if (!opponents[index] || opponents[index].hp <= 0) {
      index = opponents.findIndex((o) => o.hp > 0);
    }

    if (index < 0) return b;

    const enemy = opponents[index];
    const crit = Math.random() < 0.1;
    const damage = Math.max(
      1,
      Math.round(
        b.hp * 0.08 * (b.rockUntil > b.clock ? 1.35 : 1) *
          (crit ? 2 : 1)
      )
    );

    enemy.hp = Math.max(0, enemy.hp - damage);

    const log = [
      `Ти завдав ${enemy.name} ${number(damage)} шкоди${crit ? " — критичний удар!" : "."}`,
      ...b.log,
    ];

    let kills = b.kills;
    if (enemy.hp === 0) {
      kills++;
      log.unshift(`${enemy.name} вибув із бою.`);
    }

    const nextTarget =
      enemy.hp > 0
        ? index
        : opponents.findIndex((o) => o.hp > 0);

    return {
      ...b,
      opponents,
      target: Math.max(0, nextTarget),
      attackCd: 5,
      kills,
      log: log.slice(0, 40),
    };
  });

  const dodge = () => updateBattle((b) => {
    if (b.dodgeCd > 0) return b;

    return {
      ...b,
      dodgeCd: 30,
      log: ["Ти підготувався ухилитися від наступної атаки.", ...b.log].slice(0, 40),
    };
  });

  const potion = () => updateBattle((b) => {
    if (b.potionCd > 0) return b;

    return {
      ...b,
      hp: b.maxHp,
      potionCd: 60,
      log: ["Настоянка відновила здоров'я до 100%.", ...b.log].slice(0, 40),
    };
  });

  const stance = (type) => updateBattle((b) => {
    const until = type === "rock" ? "rockUntil" : "grassUntil";
    const active = b[until] > b.clock;

    return {
      ...b,
      [until]: active ? 0 : b.clock + 60,
      log: [
        type === "rock"
          ? active ? "Стійку Каменя вимкнено." : "Камінь: +35% шкоди на 60 секунд."
          : active ? "Стійку Трави вимкнено." : "Трава: +35% захисту на 60 секунд.",
        ...b.log,
      ].slice(0, 40),
    };
  });

  const conclude = async (b) => {
    if (finished.current) return;
    finished.current = true;

    const living = b.opponents.filter((o) => o.hp > 0).length;
    const place = b.hp <= 0 ? living + 1 : 1;

    if (USE_MOCK) {
      const silver = place === 1 ? 500 : 150;
      const exp = place === 1 ? 250 : 75;

      setResult({
        place,
        kills: b.kills,
        silver,
        exp,
        standings: [
          { name: me.name, hp: b.hp, me: true },
          ...b.opponents.map((o) => ({ name: o.name, hp: o.hp })),
        ].sort((a, c) => c.hp - a.hp),
      });
    } else {
      try {
        if (!matchId.current) {
          throw new Error("Не знайдено ID матчу.");
        }

        const { data, error } = await supabase.rpc(
          "colosseum_check_battle_end",
          { p_match_id: matchId.current }
        );

        if (error) throw error;

        setResult({
          place,
          kills: b.kills,
          silver: 0,
          exp: 0,
          serverResult: data,
          standings: [],
        });
      } catch (e) {
        setError(
          `Не вдалося підтвердити завершення бою на сервері: ${e.message}`
        );
      }
    }

    setScreen("result");
  };

  const newBattle = () => {
    setResult(null);
    setBattle(null);
    setScreen("lobby");
    finished.current = false;
    matchId.current = null;
  };

  const alive = battle?.opponents.filter((o) => o.hp > 0).length || 0;

  return (
    <div className="colosseum">
      <style>{`
        .colosseum {
          --bg:#171511; --panel:#211e19; --line:#494033;
          --gold:#e9ac50; --text:#eee6d7; --muted:#aaa092;
          background:var(--bg);color:var(--text);
          max-width:520px;min-height:100vh;margin:auto;
          font:15px/1.45 system-ui,sans-serif;text-align:center;
          padding-bottom:20px
        }
        .colosseum *{box-sizing:border-box}
        .colosseum button{color:inherit;font:inherit;cursor:pointer}
        .colosseum button:disabled{opacity:.45;cursor:not-allowed}
        .c-top{display:flex;justify-content:space-between;gap:10px;
          padding:14px;background:#100f0d;border-bottom:2px solid var(--line)}
        .c-panel{padding:18px 12px;border-bottom:1px solid var(--line)}
        .c-title{font-size:25px;color:var(--gold);font-weight:800;margin:5px}
        .c-muted{color:var(--muted)}
        .c-btn{border:1px solid #967443;border-radius:7px;
          background:linear-gradient(#51402a,#30271b);padding:12px 18px;
          margin:6px;font-weight:700}
        .c-btn.primary{background:linear-gradient(#a66e27,#654018)}
        .c-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));
          gap:8px;padding:12px}
        .c-card{background:var(--panel);border:1px solid var(--line);
          border-radius:8px;padding:12px}
        .c-bar{height:9px;background:#080807;border-radius:8px;overflow:hidden;margin:8px 0}
        .c-bar span{display:block;height:100%;background:#75a947}
        .c-arena{margin:12px;background:
          radial-gradient(ellipse at 50% 25%,#69503b,#30251b 65%,#17130f);
          border:2px solid var(--line);border-radius:10px;padding:22px 8px}
        .c-fighters{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .c-fighter{background:#17130f99;border:1px solid #6b5337;border-radius:8px;padding:10px}
        .c-avatar{font-size:44px}
        .c-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:12px}
        .c-action{background:#29241d;border:1px solid var(--line);border-radius:7px;padding:12px 5px}
        .c-action small{display:block;color:var(--muted);font-size:12px}
        .c-action.attack{background:#753b20;border-color:#ce8240}
        .c-list{padding:10px;text-align:left;max-height:200px;overflow:auto}
        .c-log{font-size:13px;color:#d1c5b1;border-top:1px solid var(--line);padding:8px 12px;text-align:left}
        .c-error{margin:10px;padding:10px;border-radius:6px;background:#54251e;color:#ffd8cf}
        .c-nav{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:12px}
        @media(max-width:350px){.c-grid,.c-actions{grid-template-columns:1fr 1fr}}
      `}</style>

      <div className="c-top">
        <span>⚔️ {number(me.power)} сили</span>
        <span>🏆 {number(me.rating)} рейтингу</span>
      </div>

      {error && (
        <div className="c-error" role="alert">
          {error}
          <button className="c-btn" onClick={() => setError("")}>Закрити</button>
        </div>
      )}

      {screen === "lobby" && (
        <>
          <section className="c-panel">
            <div className="c-title">Колізей</div>
            <p className="c-muted">Випробуй силу проти інших воїнів.</p>
            <p>Ранг: <b>{me.rank_no}</b> · Рівень: <b>{me.level}</b></p>
            <button className="c-btn primary" disabled={busy} onClick={joinQueue}>
              {busy ? "Пошук..." : "⚔️ Увійти в чергу"}
            </button>
            <p className="c-muted">Тестовий режим: {USE_MOCK ? "увімкнено" : "вимкнено"}</p>
          </section>
          <div className="c-grid">
            <div className="c-card"><div>🪙 Золото</div><b>{number(me.gold)}</b></div>
            <div className="c-card"><div>⚪ Срібло</div><b>{number(me.silver)}</b></div>
            <div className="c-card"><div>⭐ Зірки</div><b>{me.stars_half / 2} / 5</b></div>
            <div className="c-card"><div>💀 Черепи</div><b>{me.skulls}</b></div>
          </div>
        </>
      )}

      {screen === "queue" && (
        <section className="c-panel">
          <div className="c-title">Пошук суперників</div>
          <p>У черзі: {queueCount} / {MAX_PLAYERS}</p>
          <p className="c-muted">Очікуємо на бій...</p>
          <button className="c-btn" onClick={leaveQueue}>Скасувати пошук</button>
          {!USE_MOCK && (
            <p className="c-muted">
              Серверна черга потребує опитування стану матчу. Цей екран не запускає бій автоматично.
            </p>
          )}
        </section>
      )}

      {screen === "battle" && battle && (
        <>
          <div className="c-top">
            <span>❤️ {number(battle.hp)} / {number(battle.maxHp)}</span>
            <b>{timerText(battle.seconds)}</b>
          </div>

          <div className="c-arena">
            <div className="c-fighters">
              <div className="c-fighter">
                <div className="c-avatar">🛡️</div>
                <b>{me.name}</b>
                <div className="c-bar">
                  <span style={{ width: `${Math.max(0, battle.hp / battle.maxHp * 100)}%` }} />
                </div>
                {number(battle.hp)} HP
              </div>
              <div className="c-fighter">
                <div className="c-avatar">
                  {battle.opponents[battle.target]?.hp > 0 ? "⚔️" : "☠️"}
                </div>
                <b>{battle.opponents[battle.target]?.name || "Немає цілі"}</b>
                <div className="c-bar">
                  <span style={{
                    width: `${Math.max(0, (battle.opponents[battle.target]?.hp || 0) /
                      (battle.opponents[battle.target]?.maxHp || 1) * 100)}%`
                  }} />
                </div>
                {number(battle.opponents[battle.target]?.hp || 0)} HP
              </div>
            </div>
          </div>

          <div className="c-panel">
            <b>Суперники: {alive}</b>
            <div className="c-list">
              {battle.opponents.map((o, i) => (
                <button
                  key={o.id}
                  className="c-btn"
                  disabled={o.hp <= 0}
                  onClick={() => setBattle((b) => ({ ...b, target: i }))}
                  style={{ borderColor: i === battle.target ? "var(--gold)" : undefined }}
                >
                  {o.hp <= 0 ? "☠️ " : "🎯 "}
                  {o.name} — {number(o.hp)} HP
                </button>
              ))}
            </div>
          </div>

          <div className="c-actions">
            <button className="c-action attack" disabled={battle.attackCd > 0} onClick={attack}>
              ⚔️ Атакувати <small>{battle.attackCd ? `${battle.attackCd} с` : "раз на 5 с"}</small>
            </button>
            <button className="c-action" disabled={battle.dodgeCd > 0} onClick={dodge}>
              💨 Уворот <small>{battle.dodgeCd ? `${battle.dodgeCd} с` : "раз на 30 с"}</small>
            </button>
            <button className="c-action" disabled={battle.potionCd > 0} onClick={potion}>
              🧪 Настоянка <small>{battle.potionCd ? `${battle.potionCd} с` : "відновити HP"}</small>
            </button>
            <button className="c-action" onClick={() => stance("rock")}>
              ⛰ Камінь <small>+35% шкоди · 60 с</small>
            </button>
            <button className="c-action" onClick={() => stance("grass")}>
              🌿 Трава <small>+35% захисту · 60 с</small>
            </button>
            <button className="c-action" onClick={() => conclude(battle)}>
              🏁 Завершити бій
            </button>
          </div>

          <div className="c-log">
            <b>Журнал бою</b>
            {battle.log.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </>
      )}

      {screen === "result" && result && (
        <>
          <section className="c-panel">
            <div className="c-title">
              {result.place === 1 ? "Перемога!" : "Бій завершено"}
            </div>
            <p>Місце: <b>{result.place}</b></p>
            <p>Переможені противники: <b>{result.kills}</b></p>
            {USE_MOCK ? (
              <>
                <p>⚪ Срібло: <b>{number(result.silver)}</b></p>
                <p>✨ Досвід: <b>{number(result.exp)}</b></p>
                <p className="c-muted">Це тестові нагороди, вони не збережені на сервері.</p>
              </>
            ) : (
              <p className="c-muted">Відповідь сервера: {JSON.stringify(result.serverResult)}</p>
            )}
          </section>

          <section className="c-panel">
            <h3>Результати учасників</h3>
            {result.standings.map((s, i) => (
              <p key={`${s.name}-${i}`}>
                {i + 1}. {s.name} — {number(s.hp)} HP {s.me ? "(ти)" : ""}
              </p>
            ))}
            <button className="c-btn primary" onClick={newBattle}>Повернутися до Колізею</button>
          </section>
        </>
      )}

      <nav className="c-nav">
        <button className="c-btn" onClick={() => onNavigate("hero")}>Мій герой</button>
        <button className="c-btn" onClick={() => onNavigate("clan")}>Мій клан</button>
        <button className="c-btn" onClick={() => onNavigate("home")}>Головна</button>
      </nav>
    </div>
  );
                      }
