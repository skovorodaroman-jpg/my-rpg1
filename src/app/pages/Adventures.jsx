
import { useCallback, useEffect, useState } from "react";
import {
  Shield, Gem, Coins, Swords, Clock, Heart,
  Mountain, Leaf, Trophy, ArrowLeft, RefreshCw
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Adventures.css";

const MONSTER_ICONS = {
  "Орки": "👹",
  "Князь Троллей": "👑",
  "Повелитель Бури": "🌩️",
  "Каменный Голем": "🗿",
  "Лесной Шаман": "🌿",
  "Ящерозавр": "🦎",
  "Владыка Камня": "⛰️",
  "Летающий Ужас": "🦇",
  "Древесный Страж": "🌳",
  "Тролль": "👺",
  "Телекинетик": "🧙",
  "Земляной Червь": "🐛",
  "Адский Вампир": "🧛",
  "Горный Великан": "🪨",
  "Смертельный шторм": "🌪️",
  "Мифический Левиафан": "🐉",
  "Каменный Ящер": "🐲",
  "Император Тьмы": "💀",
};

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(
    safe % 60
  ).padStart(2, "0")}`;
}

export default function Adventures({ profile, onNavigate, onProfileUpdate }) {
  const [screen, setScreen] = useState("home");
  const [adventure, setAdventure] = useState(null);
  const [inventory, setInventory] = useState({ stones_count: 0, grass_count: 0 });
  const [stats, setStats] = useState({ attacks: 0, victories: 0, defeats: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  const loadData = useCallback(async () => {
    if (!profile?.id) return;

    setError("");

    const [stateResult, inventoryResult] = await Promise.all([
      supabase.rpc("get_adventure_state"),
      supabase.from("adventure_inventory")
        .select("stones_count, grass_count")
        .eq("user_id", profile.id)
        .maybeSingle(),
    ]);

    if (stateResult.error) {
      setError(stateResult.error.message);
      return;
    }

    if (inventoryResult.error) {
      setError(inventoryResult.error.message);
      return;
    }

    const state = stateResult.data;
    if (state?.adventure) {
  setAdventure(state.adventure);

  switch (state.adventure.status) {
    case "found":
      setScreen("monster");
      break;

    case "active":
      setScreen("battle");
      break;

    case "won":
    case "lost":
      setScreen("result");
      break;

    default:
      setAdventure(null);
      setScreen("home");
      break;
  }
} else {
  setAdventure(null);
  setScreen("home");
}

    setInventory(inventoryResult.data || {
      stones_count: 0,
      grass_count: 0,
    });

    if (state?.stats) setStats(state.stats);
  }, [profile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = adventure?.ends_at
    ? Math.max(
        0,
        Math.ceil((new Date(adventure.ends_at).getTime() - now) / 1000)
      )
    : 300;

  const callAction = async (rpcName, args = {}) => {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const { data, error: rpcError } = await supabase.rpc(rpcName, args);
      if (rpcError) throw rpcError;

      if (data?.error) throw new Error(data.error);

      if (data?.adventure !== undefined) {
        setAdventure(data.adventure);
      }

      if (data?.inventory) setInventory(data.inventory);
      if (data?.stats) setStats(data.stats);

      if (data?.profile && onProfileUpdate) {
        onProfileUpdate(data.profile);
      }

      if (data?.status === "won" || data?.status === "lost") {
        setScreen("result");
      } else if (data?.adventure?.status === "found") {
        setScreen("monster");
      } else if (data?.adventure?.status === "active") {
        setScreen("battle");
      } else if (data?.adventure?.status === "won" ||
                 data?.adventure?.status === "lost") {
        setScreen("result");
      } else if (rpcName === "start_adventure") {
        setScreen("monster");
      } else if (rpcName === "begin_adventure_battle") {
        setScreen("battle");
      } else if (rpcName === "leave_adventure") {
        setAdventure(null);
        setScreen("home");
      }

      await loadData();
    } catch (err) {
      setError(err.message || "Не вдалося виконати дію.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (screen !== "battle" || remaining > 0 || busy) return;
    callAction("resolve_adventure_timeout");
    // Сервер сам перевіряє точний час завершення бою.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, remaining, busy]);

  if (!profile?.id) {
    return <div className="adventure-page">Увійди в гру, щоб вирушити в похід.</div>;
  }

  const monster = adventure?.monster || {};
  const monsterName = monster.name || "Невідомий монстр";
  const hp = Number(adventure?.monster_hp || 0);
  const maxHp = Math.max(1, Number(adventure?.monster_max_hp || hp || 1));
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const attacksLeft = Number(adventure?.attacks_left ?? 9);

  return (
    <main className="adventure-page">
      <header className="adventure-resources">
        <div><Gem size={17} /> {profile.crystals ?? 0}</div>
        <div><Shield size={17} /> {profile.silver ?? 0}</div>
        <div><Coins size={17} /> {profile.gold ?? 0}</div>
      </header>

      {error && (
        <div className="adventure-error">
          {error}
          <button onClick={() => setError("")} aria-label="Закрити">×</button>
        </div>
      )}

      {screen === "home" && (
        <>
          <section className="adventure-hero">
            <div className="adventure-location-art">🌑</div>
            <div className="adventure-eyebrow">НЕБЕЗПЕЧНІ ЗЕМЛІ</div>
            <h1>Похід</h1>
            <p>
              На своєму шляху ти зустрінеш безліч небезпечних істот!
              Перемагай монстрів і забирай цінні нагороди.
            </p>
            <div className="adventure-counter">
              <Swords size={18} />
              Походів сьогодні: {adventure?.remaining_today ?? "—"}
            </div>
            <button
              className="adventure-button"
              disabled={busy}
              onClick={() => callAction("start_adventure")}
            >
              <Swords size={19} />
              {busy ? "Пошук..." : "Вирушити в похід"}
            </button>
          </section>

          <section className="adventure-panel">
            <h2>📜 Правила походу</h2>
            <ul className="adventure-rules">
              <li>Переможи монстра максимум за 9 ударів.</li>
              <li>На кожен бій дається 5 хвилин.</li>
              <li>🪨 Камінь: +35% шкоди на 60 секунд.</li>
              <li>🌿 Трава: +35% захисту на 60 секунд.</li>
              <li>Що вищі твої параметри, то більша нагорода.</li>
            </ul>
          </section>

          <section className="adventure-panel">
            <h2>⚗️ Бойові підсилення</h2>
            <div className="adventure-boost-row">
              <div className="adventure-boost-icon">🪨</div>
              <div className="adventure-boost-copy">
                <strong>Камінь</strong>
                <span>+35% шкоди · 60 секунд</span>
                <small>У запасі: {inventory.stones_count}</small>
              </div>
              <button
                className="adventure-small-button"
                onClick={() => onNavigate?.("equipmentShop")}
              >
                Купити
              </button>
            </div>
            <div className="adventure-boost-row">
              <div className="adventure-boost-icon">🌿</div>
              <div className="adventure-boost-copy">
                <strong>Трава</strong>
                <span>+35% захисту · 60 секунд</span>
                <small>У запасі: {inventory.grass_count}</small>
              </div>
              <button
                className="adventure-small-button"
                onClick={() => onNavigate?.("equipmentShop")}
              >
                Купити
              </button>
            </div>
          </section>
        </>
      )}

      {screen === "monster" && (
        <section className="adventure-encounter">
          <div className="adventure-eyebrow">НОВА ЗАГРОЗА</div>
          <h1>Ти зустрів монстра!</h1>
          <div className="adventure-monster-art">
            {monster.image_url ? (
              <img src={monster.image_url} alt={monsterName} />
            ) : (
              MONSTER_ICONS[monsterName] || "👹"
            )}
          </div>
          <h2>{monsterName}</h2>
          <p>Рівень {monster.level_required ?? "?"}</p>
          <div className="adventure-hp-label">
            <Heart size={17} /> Здоров'я: {hp.toLocaleString("uk-UA")}
          </div>
          <div className="adventure-hp-track">
            <div style={{ width: `${hpPercent}%` }} />
          </div>
          <button
            className="adventure-button"
            disabled={busy}
            onClick={() => callAction("begin_adventure_battle")}
          >
            Почати бій
          </button>
          <button
            className="adventure-secondary-button"
            disabled={busy}
            onClick={() => callAction("leave_adventure")}
          >
            Відступити
          </button>
        </section>
      )}

      {screen === "battle" && (
        <section className="adventure-battle">
          <div className="adventure-timer">
            <Clock size={20} /> {formatTime(remaining)}
          </div>

          <div className="adventure-eyebrow">СУПРОТИВНИК</div>
          <div className="adventure-monster-art">
            {monster.image_url ? (
              <img src={monster.image_url} alt={monsterName} />
            ) : (
              MONSTER_ICONS[monsterName] || "👹"
            )}
          </div>
          <h1>{monsterName}</h1>
          <div className="adventure-hp-label">
            <Heart size={17} /> {hp.toLocaleString("uk-UA")} / {maxHp.toLocaleString("uk-UA")}
          </div>
          <div className="adventure-hp-track">
            <div style={{ width: `${hpPercent}%` }} />
          </div>

          <div className="adventure-turns">
            Залишилося ударів: <strong>{attacksLeft}</strong>
          </div>

          <div className="adventure-battle-boosts">
            <button
              disabled={busy || inventory.stones_count <= 0}
              onClick={() => callAction("use_adventure_boost", { p_boost: "stone" })}
            >
              🪨 Камінь <small>{inventory.stones_count}</small>
            </button>
            <button
              disabled={busy || inventory.grass_count <= 0}
              onClick={() => callAction("use_adventure_boost", { p_boost: "grass" })}
            >
              🌿 Трава <small>{inventory.grass_count}</small>
            </button>
          </div>

          {adventure?.stone_until && new Date(adventure.stone_until) > now &&
            <p className="adventure-active-boost">🪨 Камінь активний</p>}
          {adventure?.grass_until && new Date(adventure.grass_until) > now &&
            <p className="adventure-active-boost">🌿 Трава активна</p>}

          <button
            className="adventure-button adventure-attack"
            disabled={busy || hp <= 0 || remaining <= 0}
            onClick={() => callAction("attack_adventure_monster")}
          >
            <Swords size={20} />
            {busy ? "Виконується..." : "Атакувати монстра"}
          </button>

          <button
            className="adventure-secondary-button"
            disabled={busy}
            onClick={() => callAction("leave_adventure")}
          >
            <ArrowLeft size={17} /> Покинути бій
          </button>
        </section>
      )}

      {screen === "result" && (
        <section className="adventure-result">
          <div className="adventure-monster-art">
            {adventure?.status === "won" ? "🏆" : "💀"}
          </div>
          <h1>{adventure?.status === "won" ? "Перемога!" : "Поразка"}</h1>
          <p>
            {adventure?.status === "won"
              ? "Монстра переможено. Нагороду обробляє сервер."
              : "Цього разу монстр виявився сильнішим. Спробуй ще раз."}
          </p>
          {adventure?.reward && (
            <div className="adventure-reward">
              <Trophy size={20} />
              {Object.entries(adventure.reward)
                .filter(([, value]) => Number(value) > 0)
                .map(([key, value]) => `${key}: +${value}`)
                .join(" · ")}
            </div>
          )}
          <button
            className="adventure-button"
            onClick={() => {
              setAdventure(null);
              setScreen("home");
              loadData();
            }}
          >
            <RefreshCw size={18} /> Повернутися до походу
          </button>
        </section>
      )}

      <section className="adventure-player">
        <div className="adventure-player-avatar">🛡️</div>
        <div className="adventure-player-info">
          <strong>{profile.display_name || profile.username || "Мандрівник"}</strong>
          <span>Рівень {profile.level ?? 1}</span>
          <span>Золото: {profile.gold ?? 0} · Срібло: {profile.silver ?? 0}</span>
        </div>
        <div className="adventure-player-stats">
          <span>⚔️ {profile.attack ?? "—"}</span>
          <span>🛡️ {profile.defense ?? "—"}</span>
        </div>
      </section>

      <nav className="adventure-bottom-nav">
        <button onClick={() => onNavigate?.("hero")}>🛡️<span>Мій герой</span></button>
        <button onClick={() => onNavigate?.("clan")}>⚔️<span>Мій клан</span></button>
        <button onClick={() => onNavigate?.("home")}>🏠<span>На головну</span></button>
      </nav>
    </main>
  );
                                                   }
                 
