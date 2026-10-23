import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Swords,
  Shield,
  Heart,
  Zap,
  Trophy,
  Coins,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Skull,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Arena.css";

const ENERGY_PER_FIGHT = 50;
const ENERGY_REGEN_MS = 5000;

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export default function Arena({
  profile,
  player,
  onProfileUpdate,
  onOpenLeague,
}) {
  const source = profile ?? player ?? {};
  const profileUpdateRef = useRef(onProfileUpdate);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [battle, setBattle] = useState(null);
  const [clockNow, setClockNow] = useState(Date.now());

  useEffect(() => {
    profileUpdateRef.current = onProfileUpdate;
  }, [onProfileUpdate]);

  // Оновлюємо годинник, щоб енергія на екрані відновлювалася кожні 5 секунд.
  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Підтягуємо енергію, яка накопичилася, поки гравець був офлайн.
  useEffect(() => {
    let cancelled = false;

    async function refreshEnergy() {
      const { error: refreshError } = await supabase.rpc(
        "refresh_player_energy"
      );

      if (refreshError) {
        console.error("Не вдалося оновити енергію:", refreshError);
        return;
      }

      if (!cancelled) {
        await profileUpdateRef.current?.();
      }
    }

    refreshEnergy();

    return () => {
      cancelled = true;
    };
  }, []);

  const level = Math.max(1, toNumber(source.level, 1));
  const maxEnergy = Math.max(1, toNumber(source.max_energy, 1000));
  const storedEnergy = Math.max(0, toNumber(source.energy, 0));
  const lastEnergyUpdate = source.last_energy_update
    ? Date.parse(source.last_energy_update)
    : clockNow;

  const elapsedSteps = Number.isFinite(lastEnergyUpdate)
    ? Math.floor(Math.max(0, clockNow - lastEnergyUpdate) / ENERGY_REGEN_MS)
    : 0;

  const energy = Math.min(maxEnergy, storedEnergy + elapsedSteps);
  const silver = toNumber(source.silver, 0);
  const gold = toNumber(source.gold, 0);
  const experience = toNumber(source.experience, 0);

  const enemy = useMemo(() => {
    const enemyLevel = Math.max(1, level + 1);
    return {
      level: enemyLevel,
      name:
        enemyLevel <= 5
          ? "Похмурий розбійник"
          : enemyLevel <= 15
          ? "Воїн тіней"
          : "Лицар згаслого світанку",
      power: enemyLevel * 125 + 350,
    };
  }, [level]);

  const canFight = !busy && energy >= ENERGY_PER_FIGHT;

  async function fight() {
    if (busy) return;

    setError("");
    setBusy(true);
    setBattle(null);

    try {
      // Сервер спочатку нараховує енергію за час офлайну.
      const { error: energyError } = await supabase.rpc(
        "refresh_player_energy"
      );

      if (energyError) throw energyError;

      // Сам бій, витрата енергії та нагороди обробляються сервером.
      const { data, error: fightError } = await supabase.rpc("arena_fight", {
        p_enemy_level: enemy.level,
      });

      if (fightError) throw fightError;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result) {
        throw new Error("Сервер не повернув результат бою.");
      }

      setBattle(result);

      // Оновлюємо профіль після бою, щоб показати актуальні ресурси.
      await profileUpdateRef.current?.();
    } catch (err) {
      console.error("Помилка бою на арені:", err);
      setError(
        err?.message ||
          "Не вдалося провести бій. Перевір з'єднання та спробуй ще раз."
      );
    } finally {
      setBusy(false);
    }
  }

  const won = battle?.result === "win";
  const lost = battle?.result === "loss";

  return (
    <main className="arena-page">
      <section className="arena-heading">
        <div>
          <div className="arena-eyebrow">ХРОНІКИ ЗГАСЛОГО СВІТАНКУ</div>
          <h1>Арена</h1>
          <p>Вийди на бій, доведи свою силу та здобудь нагороду.</p>
        </div>

        <button
          className="arena-league-button"
          type="button"
          onClick={onOpenLeague}
        >
          <Trophy size={17} />
          Ліга
        </button>
      </section>

      <section className="arena-resource-row">
        <div className="arena-resource">
          <Zap size={18} />
          <div>
            <span>Енергія</span>
            <strong>
              {energy} <small>/ {maxEnergy}</small>
            </strong>
          </div>
        </div>

        <div className="arena-resource">
          <Coins size={18} />
          <div>
            <span>Срібло</span>
            <strong>{silver.toLocaleString("uk-UA")}</strong>
          </div>
        </div>

        <div className="arena-resource">
          <Sparkles size={18} />
          <div>
            <span>Досвід</span>
            <strong>{experience.toLocaleString("uk-UA")}</strong>
          </div>
        </div>
      </section>

      <section className="arena-battlefield">
        <div className="arena-battlefield-top">
          <span className="arena-location-label">
            <Swords size={15} />
            ПІСКИ АРЕНИ
          </span>
          <span className="arena-level-label">Твій рівень: {level}</span>
        </div>

        <div className="arena-combatants">
          <article className="arena-combatant arena-hero">
            <div className="arena-character-art hero-art">
              <Shield size={58} strokeWidth={1.4} />
            </div>
            <h2>{source.display_name || source.username || "Твій герой"}</h2>
            <span className="arena-character-subtitle">Герой · рівень {level}</span>
            <div className="arena-power">
              <Swords size={14} />
              <span>Твоя сила</span>
              <strong>{Math.max(1, level * 150)}</strong>
            </div>
          </article>

          <div className="arena-vs">VS</div>

          <article className="arena-combatant arena-enemy">
            <div className="arena-character-art enemy-art">
              <Skull size={58} strokeWidth={1.4} />
            </div>
            <h2>{enemy.name}</h2>
            <span className="arena-character-subtitle">
              Супротивник · рівень {enemy.level}
            </span>
            <div className="arena-power">
              <Swords size={14} />
              <span>Сила ворога</span>
              <strong>{enemy.power}</strong>
            </div>
          </article>
        </div>

        <div className="arena-battle-info">
          <div>
            <Zap size={16} />
            <span>Вартість бою</span>
            <strong>{ENERGY_PER_FIGHT} енергії</strong>
          </div>
          <div>
            <RefreshCw size={16} />
            <span>Відновлення</span>
            <strong>+1 кожні 5 сек.</strong>
          </div>
        </div>

        <button
          className="arena-fight-button"
          type="button"
          onClick={fight}
          disabled={!canFight}
        >
          {busy ? (
            <>
              <RefreshCw className="arena-spin" size={19} />
              Бій триває…
            </>
          ) : energy < ENERGY_PER_FIGHT ? (
            <>
              <Zap size={19} />
              Недостатньо енергії
            </>
          ) : (
            <>
              <Swords size={19} />
              Розпочати бій
            </>
          )}
        </button>

        {energy < ENERGY_PER_FIGHT && !busy && (
          <p className="arena-energy-hint">
            Потрібно ще {ENERGY_PER_FIGHT - energy} енергії. Вона відновлюється
            автоматично, навіть коли гра закрита.
          </p>
        )}
      </section>

      {error && (
        <div className="arena-message arena-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {battle && (
        <section
          className={`arena-result ${won ? "is-win" : lost ? "is-loss" : ""}`}
        >
          <div className="arena-result-title">
            {won ? <Trophy size={22} /> : <Shield size={22} />}
            <h2>
              {won
                ? "Перемога!"
                : lost
                ? "Поразка"
                : "Бій завершено"}
            </h2>
          </div>

          <p>
            {won
              ? `Ти переміг супротивника ${enemy.name}.`
              : lost
              ? "Супротивник виявився сильнішим. Віднови сили та спробуй знову."
              : "Сервер повернув результат бою."}
          </p>

          <div className="arena-rewards">
            <div>
              <Coins size={17} />
              <span>Срібло</span>
              <strong>
                {toNumber(battle.silver_reward, 0) > 0 ? "+" : ""}
                {toNumber(battle.silver_reward, 0)}
              </strong>
            </div>
            <div>
              <Sparkles size={17} />
              <span>Досвід</span>
              <strong>
                {toNumber(battle.xp_reward, 0) > 0 ? "+" : ""}
                {toNumber(battle.xp_reward, 0)}
              </strong>
            </div>
            <div>
              <Zap size={17} />
              <span>Витрачено</span>
              <strong>{toNumber(battle.energy_spent, ENERGY_PER_FIGHT)}</strong>
            </div>
          </div>

          {battle.item_name && (
            <div className="arena-item-drop">
              <Sparkles size={17} />
              Знайдено предмет: <strong>{battle.item_name}</strong>
            </div>
          )}
        </section>
      )}
    </main>
  );
        }
