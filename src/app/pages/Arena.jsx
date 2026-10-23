
import React, { useEffect, useMemo, useState } from "react";
import {
  Swords,
  Shield,
  Heart,
  Zap,
  Trophy,
  RefreshCw,
  ArrowLeft,
  Skull,
  Coins,
  Sparkles,
  Backpack,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Arena.css";

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function makeEnemy(level, number) {
  const names = ["Темний лицар", "Вартовий руїн", "Воїн тіней"];
  return {
    name: names[(number - 1) % names.length],
    level,
    maxHp: 90 + level * 13,
    attack: 12 + level * 2,
    defense: 4 + level,
  };
}

function HealthBar({ value, max, enemy = false }) {
  const percent = max > 0
    ? Math.max(0, Math.min(100, value / max * 100))
    : 0;

  return (
    <div className={`arena-health ${enemy ? "enemy-health" : ""}`}>
      <div className="arena-health-track">
        <div
          className="arena-health-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="arena-health-label">
        <span><Heart size={13} /> Здоров'я</span>
        <strong>{Math.ceil(value)} / {max}</strong>
      </div>
    </div>
  );
}

export default function Arena({
  hero,
  profile,
  player,
  leagueName = "Ліга обраних",
  onOpenLeague,
  onNavigate,
  onProfileUpdate,
}) {
  const source = hero || profile || player || {};
  const level = Math.max(1, number(source.level, 1));
  const name =
    source.display_name ||
    source.username ||
    source.name ||
    "Мій герой";

  const maxHp = Math.max(
    1,
    number(source.max_hp, number(source.max_health, 100 + level * 15))
  );

  const attack = number(source.attack, 15 + level * 3);
  const defense = number(source.defense, 5 + level * 2);

  const [enemyNumber, setEnemyNumber] = useState(1);
  const [enemyHp, setEnemyHp] = useState(null);
  const [heroHp, setHeroHp] = useState(maxHp);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [battleLog, setBattleLog] = useState([
    "Ти виходиш на арену. Час довести свою силу!",
  ]);

  const enemyLevel = Math.max(1, level + ((enemyNumber % 3) - 1));
  const enemy = useMemo(
    () => makeEnemy(enemyLevel, enemyNumber),
    [enemyLevel, enemyNumber]
  );

  const currentEnemyHp = enemyHp ?? enemy.maxHp;
  const finished = Boolean(result);

  useEffect(() => {
    setHeroHp(maxHp);
  }, [maxHp]);

  async function fight() {
    if (busy || finished) return;

    setBusy(true);
    setError("");
    setResult(null);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "arena_fight",
        { p_enemy_level: enemy.level }
      );

      if (rpcError) throw rpcError;

      const outcome = typeof data === "string" ? JSON.parse(data) : data;

      setResult(outcome);
      setEnemyHp(outcome.result === "win" ? 0 : enemy.maxHp);
      setHeroHp(outcome.result === "win" ? maxHp : Math.max(0, heroHp - 1));

      const messages = [
        outcome.result === "win"
          ? `🏆 Перемога! ${enemy.name} переможений.`
          : `☠️ Поразка! ${enemy.name} переміг у цьому бою.`,
        `⚡ Витрачено енергії: ${outcome.energy_spent}`,
        `🪙 Срібло: +${outcome.silver_reward}`,
        `✨ Досвід: +${outcome.xp_reward}`,
      ];

      if (outcome.item_name) {
        messages.push(`🎁 Знайдено предмет: ${outcome.item_name}`);
      }

      setBattleLog(messages);
      if (typeof onProfileUpdate === "function") {
        await onProfileUpdate();
      }
    } catch (e) {
      console.error("Помилка бою на арені:", e);
      setError(
        e?.message?.includes("Недостатньо енергії")
          ? "Недостатньо енергії. Для бою потрібно 50."
          : e?.message || "Не вдалося провести бій. Спробуй ще раз."
      );
    } finally {
      setBusy(false);
    }
  }

  function nextEnemy() {
    setEnemyNumber((n) => n + 1);
    setEnemyHp(null);
    setHeroHp(maxHp);
    setResult(null);
    setError("");
    setBattleLog(["Новий супротивник виходить на арену!"]);
  }

  return (
    <main className="arena-page">
      <header className="arena-header">
        <button
          type="button"
          className="arena-back"
          onClick={() => onNavigate?.("home")}
          aria-label="На головну"
        >
          <ArrowLeft size={19} />
        </button>

        <div className="arena-heading">
          <span className="arena-eyebrow">ВИПРОБУВАННЯ СИЛИ</span>
          <h1>АРЕНА</h1>
          <p>Перемагай. Ставай сильнішим.</p>
        </div>

        <div className="arena-header-icon">
          <Swords size={25} />
        </div>
      </header>

      <section className="arena-league">
        <div className="arena-league-icon"><Trophy size={22} /></div>
        <div className="arena-league-info">
          <span>ТВОЯ ЛІГА</span>
          <strong>{leagueName}</strong>
        </div>
        {onOpenLeague && (
          <button
            type="button"
            className="arena-league-button"
            onClick={onOpenLeague}
            aria-label="Відкрити лігу"
          >
            <Trophy size={18} />
          </button>
        )}
      </section>

      <section className="arena-battle-card">
        <div className="arena-battle-top">
          <span className="arena-battle-tag">
            <span className="arena-live-dot" />
            {finished ? "БІЙ ЗАВЕРШЕНО" : "БОЙОВА ЗОНА"}
          </span>
          <span className="arena-round">ОДИН УДАР</span>
        </div>

        <div className="arena-combatants">
          <div className="arena-combatant">
            <div className="arena-avatar hero-avatar">
              {source.avatar_url
                ? <img src={source.avatar_url} alt={name} />
                : <Shield size={43} />}
              <span className="arena-level">{level}</span>
            </div>
            <h3>{name}</h3>
            <span className="arena-role">ТВІЙ ГЕРОЙ</span>
            <HealthBar value={heroHp} max={maxHp} />
            <div className="arena-stats">
              <span><Swords size={14} /> {attack}</span>
              <span><Shield size={14} /> {defense}</span>
            </div>
          </div>

          <div className="arena-vs">
            <div className="arena-vs-line" />
            <span>VS</span>
            <div className="arena-vs-line" />
          </div>

          <div className="arena-combatant">
            <div className="arena-avatar enemy-avatar">
              <Skull size={43} />
              <span className="arena-level">{enemy.level}</span>
            </div>
            <h3>{enemy.name}</h3>
            <span className="arena-role">СУПРОТИВНИК</span>
            <HealthBar
              value={currentEnemyHp}
              max={enemy.maxHp}
              enemy
            />
            <div className="arena-stats">
              <span><Swords size={14} /> {enemy.attack}</span>
              <span><Shield size={14} /> {enemy.defense}</span>
            </div>
          </div>
        </div>

        <div className="arena-action-area">
          {!finished ? (
            <button
              type="button"
              className="arena-fight-button"
              onClick={fight}
              disabled={busy}
            >
              <Swords size={20} />
              {busy ? "ОБЧИСЛЕННЯ..." : "БИТИСЯ · 50 ⚡"}
            </button>
          ) : (
            <button
              type="button"
              className="arena-fight-button"
              onClick={nextEnemy}
            >
              <Swords size={20} />
              НАСТУПНИЙ СУПРОТИВНИК
            </button>
          )}
        </div>
      </section>

      {result && (
        <section className="arena-log-card">
          <div className="arena-section-title">
            <Sparkles size={18} />
            <h2>{result.result === "win" ? "ПЕРЕМОГА" : "ПОРАЗКА"}</h2>
          </div>

          <div className="arena-rewards">
            <p><Zap size={17} /> −{result.energy_spent} енергії</p>
            <p><Coins size={17} /> +{result.silver_reward} срібла</p>
            <p><Sparkles size={17} /> +{result.xp_reward} досвіду</p>
            {result.item_name && (
              <p><Backpack size={17} /> {result.item_name}</p>
            )}
          </div>
        </section>
      )}

      {error && (
        <div className="arena-error" role="alert">{error}</div>
      )}

      <section className="arena-log-card">
        <div className="arena-section-title">
          <Zap size={18} />
          <h2>ЖУРНАЛ БОЮ</h2>
        </div>
        <div className="arena-log-list" aria-live="polite">
          {battleLog.map((message, index) => (
            <div
              className={`arena-log-entry ${index === 0 ? "latest" : ""}`}
              key={`${message}-${index}`}
            >
              <span className="arena-log-marker" />
              <p>{message}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="arena-footer">
        Кожна перемога наближає тебе до вершини.
      </p>
    </main>
  );
}
