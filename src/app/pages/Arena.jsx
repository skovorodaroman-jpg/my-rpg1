
import React, { useEffect, useMemo, useState } from "react";
import {
  Swords,
  Shield,
  Heart,
  Zap,
  Trophy,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  Skull,
} from "lucide-react";
import "./Arena.css";

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

function getNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return null;
}

function createHero(hero = {}) {
  const level = getNumber(hero.level, hero.lvl) || 1;
  const maxHp =
    getNumber(hero.max_hp, hero.max_health, hero.maxHealth) ||
    100 + level * 15;

  return {
    name:
      hero.display_name ||
      hero.username ||
      hero.name ||
      "Мій герой",
    level,
    hp: maxHp,
    maxHp,
    attack:
      getNumber(
        hero.attack,
        hero.attack_power,
        hero.power_attack,
        hero.damage
      ) || 15 + level * 3,
    defense:
      getNumber(
        hero.defense,
        hero.defense_power,
        hero.defense_bonus
      ) || 5 + level * 2,
    avatar: hero.avatar_url || hero.avatar || null,
  };
}

function createEnemy(heroLevel, suppliedEnemy, number) {
  const enemyLevel =
    getNumber(suppliedEnemy?.level, suppliedEnemy?.lvl) ||
    Math.max(1, heroLevel + (number % 3) - 1);

  const maxHp =
    getNumber(
      suppliedEnemy?.max_hp,
      suppliedEnemy?.max_health,
      suppliedEnemy?.maxHealth,
      suppliedEnemy?.hp
    ) || 90 + enemyLevel * 13;

  return {
    name:
      suppliedEnemy?.display_name ||
      suppliedEnemy?.name ||
      ["Темний лицар", "Вартовий руїн", "Воїн тіней"][
        (number - 1) % 3
      ],
    level: enemyLevel,
    hp: maxHp,
    maxHp,
    attack:
      getNumber(
        suppliedEnemy?.attack,
        suppliedEnemy?.attack_power,
        suppliedEnemy?.damage
      ) || 12 + enemyLevel * 2,
    defense:
      getNumber(
        suppliedEnemy?.defense,
        suppliedEnemy?.defense_power
      ) || 4 + enemyLevel,
    avatar: suppliedEnemy?.avatar_url || null,
  };
}

function HealthBar({ value, max, enemy = false }) {
  const percent = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;

  return (
    <div className={`arena-health ${enemy ? "enemy-health" : ""}`}>
      <div className="arena-health-track">
        <div
          className="arena-health-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="arena-health-label">
        <span>
          <Heart size={13} />
          Здоров'я
        </span>
        <strong>
          {Math.ceil(value)} / {max}
        </strong>
      </div>
    </div>
  );
}

export default function Arena({
  hero,
  profile,
  player,
  enemy: suppliedEnemy,
  leagueName = "Ліга обраних",
  onOpenLeague,
  onFight,
  onRecover,
  onNavigate,
  onProfileUpdate,
}) {
  const sourceHero = hero || profile || player || {};
  const heroKey = sourceHero.id || sourceHero.username || "default";

  const baseHero = useMemo(
    () => createHero(sourceHero),
    [heroKey, sourceHero.level, sourceHero.display_name,
      sourceHero.username, sourceHero.max_hp, sourceHero.avatar_url]
  );

  const [round, setRound] = useState(1);
  const [heroHp, setHeroHp] = useState(baseHero.maxHp);
  const [enemyNumber, setEnemyNumber] = useState(1);
  const [enemyHp, setEnemyHp] = useState(null);
  const [battleLog, setBattleLog] = useState([
    "Ти виходиш на арену. Обери момент для атаки!",
  ]);
  const [busy, setBusy] = useState(false);

  const enemy = useMemo(
    () => createEnemy(
      baseHero.level,
      suppliedEnemy,
      enemyNumber
    ),
    [baseHero.level, suppliedEnemy, enemyNumber]
  );

  const currentEnemyHp = enemyHp ?? enemy.maxHp;
  const heroAlive = heroHp > 0;
  const enemyAlive = currentEnemyHp > 0;
  const battleFinished = !heroAlive || !enemyAlive;

  useEffect(() => {
    setHeroHp(baseHero.maxHp);
    setEnemyHp(null);
    setEnemyNumber(1);
    setRound(1);
    setBusy(false);
    setBattleLog(["Ти виходиш на арену. Обери момент для атаки!"]);
  }, [heroKey]);

  function addLog(messages) {
    setBattleLog((previous) => [...messages, ...previous].slice(0, 8));
  }

  function attack() {
    if (busy || battleFinished) return;

    setBusy(true);

    const damageToEnemy = Math.max(
      1,
      Math.floor(
        baseHero.attack * (0.8 + Math.random() * 0.4) -
        enemy.defense * 0.45
      )
    );

    const nextEnemyHp = Math.max(0, currentEnemyHp - damageToEnemy);

    const messages = [
      `Ти завдаєш ${damageToEnemy} од. шкоди!`,
    ];

    setEnemyHp(nextEnemyHp);

    if (nextEnemyHp <= 0) {
      messages.unshift(`🏆 Перемога! ${enemy.name} переможений.`);
      addLog(messages);
      setRound((value) => value + 1);
      setBusy(false);

      if (typeof onFight === "function") {
        try {
          onFight({ hero: baseHero, enemy, result: "win" });
        } catch (error) {
          console.error("Помилка обробки бою:", error);
        }
      }
      return;
    }

    const damageToHero = Math.max(
      1,
      Math.floor(
        enemy.attack * (0.8 + Math.random() * 0.4) -
        baseHero.defense * 0.4
      )
    );

    const nextHeroHp = Math.max(0, heroHp - damageToHero);
    setHeroHp(nextHeroHp);
    messages.push(`${enemy.name} завдає тобі ${damageToHero} од. шкоди!`);

    if (nextHeroHp <= 0) {
      messages.push("☠️ Тебе переможено. Віднови здоров'я та спробуй ще.");
    }

    addLog(messages);
    setRound((value) => value + 1);
    setBusy(false);

    if (typeof onFight === "function" && nextHeroHp <= 0) {
      try {
        onFight({ hero: baseHero, enemy, result: "loss" });
      } catch (error) {
        console.error("Помилка обробки бою:", error);
      }
    }
  }

  function recover() {
    const restoredHp = baseHero.maxHp;

    setHeroHp(restoredHp);
    setEnemyHp(null);
    setRound(1);
    setBusy(false);
    setBattleLog(["Здоров'я відновлено. Ти готовий до нового бою!"]);

    if (typeof onRecover === "function") {
      try {
        onRecover();
      } catch (error) {
        console.error("Помилка відновлення:", error);
      }
    }
  }

  function nextEnemy() {
    if (heroHp <= 0) {
      recover();
      return;
    }

    setEnemyNumber((value) => value + 1);
    setEnemyHp(null);
    setRound(1);
    setBusy(false);
    setBattleLog(["Новий супротивник виходить на арену!"]);
  }

  return (
    <main className="arena-page">
      <header className="arena-header">
        <button
          type="button"
          className="arena-back"
          onClick={() => {
            if (typeof onNavigate === "function") onNavigate("home");
          }}
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
        <div className="arena-league-icon">
          <Trophy size={22} />
        </div>
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
            <ChevronRight size={20} />
          </button>
        )}
      </section>

      <section className="arena-battle-card">
        <div className="arena-battle-top">
          <span className="arena-battle-tag">
            <span className="arena-live-dot" />
            {battleFinished ? "БІЙ ЗАВЕРШЕНО" : "БОЙОВА ЗОНА"}
          </span>
          <span className="arena-round">РАУНД {round}</span>
        </div>

        <div className="arena-combatants">
          <div className="arena-combatant">
            <div className="arena-avatar hero-avatar">
              {baseHero.avatar ? (
                <img src={baseHero.avatar} alt={baseHero.name} />
              ) : (
                <Shield size={43} />
              )}
              <span className="arena-level">{baseHero.level}</span>
            </div>

            <h3>{baseHero.name}</h3>
            <span className="arena-role">ТВІЙ ГЕРОЙ</span>

            <HealthBar value={heroHp} max={baseHero.maxHp} />

            <div className="arena-stats">
              <span><Swords size={14} /> {baseHero.attack}</span>
              <span><Shield size={14} /> {baseHero.defense}</span>
            </div>
          </div>

          <div className="arena-vs">
            <div className="arena-vs-line" />
            <span>VS</span>
            <div className="arena-vs-line" />
          </div>

          <div className="arena-combatant">
            <div className="arena-avatar enemy-avatar">
              {enemy.avatar ? (
                <img src={enemy.avatar} alt={enemy.name} />
              ) : (
                <Skull size={43} />
              )}
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
          {!battleFinished ? (
            <button
              type="button"
              className="arena-fight-button"
              onClick={attack}
              disabled={busy}
            >
              <Swords size={20} />
              БИТИСЯ
            </button>
          ) : (
            <button
              type="button"
              className="arena-fight-button"
              onClick={heroAlive ? nextEnemy : recover}
            >
              {heroAlive ? <Swords size={20} /> : <RefreshCw size={20} />}
              {heroAlive ? "НАСТУПНИЙ СУПРОТИВНИК" : "ВІДНОВИТИ ЗДОРОВ'Я"}
            </button>
          )}

          <button
            type="button"
            className="arena-recover-button"
            onClick={recover}
          >
            <Heart size={17} />
            Відновити здоров'я
          </button>
        </div>
      </section>

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
