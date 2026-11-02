
import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Swords,
  Shield,
  Clock,
  Coins,
  Trophy,
  RefreshCw,
  Flame,
  Skull,
  Heart,
  Zap,
  Crown,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./ClanDungeon.css";

const formatNumber = (value) =>
  Math.floor(Number(value) || 0).toLocaleString("uk-UA");

function formatTime(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getMonsterIcon(level) {
  if (level <= 6) return "🐺";
  if (level <= 12) return "💀";
  if (level <= 18) return "🪓";
  if (level <= 24) return "🗿";
  if (level <= 30) return "🐍";
  if (level <= 36) return "🐂";
  if (level <= 42) return "🔥";
  if (level <= 48) return "☠️";
  return "👹";
}

function getMonsterDescription(level) {
  if (level <= 6) return "Вогняний пес";
  if (level <= 12) return "Лицар смерті";
  if (level <= 18) return "Кат";
  if (level <= 24) return "Горгулья";
  if (level <= 30) return "Змій";
  if (level <= 36) return "Мінотавр";
  if (level <= 42) return "Володар вогню";
  if (level <= 48) return "Вершник апокаліпсиса";
  return "Горлум";
}

export default function ClanDungeon({
  clan,
  membership,
  members,
  profile,
  player,
  onBack,
  onRefresh,
}) {
  const hero = player || profile || {};

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attacking, setAttacking] = useState(false);
  const [attackResult, setAttackResult] = useState(null);
  const [notice, setNotice] = useState(null);
  const [seconds, setSeconds] = useState(0);

  const loadDungeon = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc(
        "get_clan_dungeon_state"
      );

      if (error) throw error;

      setState(data);

      if (data?.battle?.remaining_seconds != null) {
        setSeconds(Number(data.battle.remaining_seconds));
      } else {
        setSeconds(0);
      }
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Не вдалося завантажити підземелля.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDungeon();
  }, [loadDungeon]);

  useEffect(() => {
    if (!state?.battle) return;

    const timer = setInterval(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [Boolean(state?.battle?.id)]);

  const handleAttack = async (type) => {
    if (attacking || loading) return;

    setAttacking(true);
    setNotice(null);
    setAttackResult(null);

    try {
      const { data, error } = await supabase.rpc(
        "clan_dungeon_attack",
        { p_hit_type: type }
      );

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.message || "Удар не виконано.");
      }

      setAttackResult(data);

      setNotice({
        type: data.victory ? "success" : "info",
        text: data.victory
          ? "Монстра переможено! Нагороди учасникам виплачено."
          : "Удар успішно завдано!",
      });

      await loadDungeon();
      onRefresh?.();
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Не вдалося виконати удар.",
      });
    } finally {
      setAttacking(false);
    }
  };

  const monster = state?.monster;
  const battle = state?.battle;
  const level = Number(state?.current_level || 1);

  const maxHealth = Number(
    battle?.max_health || monster?.max_health || 1
  );

  const currentHealth = Number(
    battle?.current_health ?? maxHealth
  );

  const healthPercent = Math.max(
    0,
    Math.min(100, (currentHealth / maxHealth) * 100)
  );

  const freeAvailable = Boolean(state?.free_hit_available);
  const eligible = Boolean(state?.eligible);

  const leaderboard = state?.leaderboard || [];

  const isInClan = state?.in_clan === true;

  if (loading) {
    return (
      <div className="clan-dungeon-loading">
        <RefreshCw className="clan-dungeon-spin" size={26} />
        <span>Завантаження підземелля...</span>
      </div>
    );
  }

  if (!isInClan) {
    return (
      <main className="clan-dungeon-page">
        <button className="cd-back" onClick={onBack}>
          <ArrowLeft size={19} /> Назад
        </button>

        <div className="cd-empty">
          <Shield size={42} />
          <h2>Потрібен клан</h2>
          <p>Щоб брати участь у підземеллі, вступи до клану.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="clan-dungeon-page">
      <header className="cd-header">
        <button className="cd-back" onClick={onBack}>
          <ArrowLeft size={19} />
          Назад
        </button>

        <button
          className="cd-refresh"
          onClick={loadDungeon}
          disabled={attacking}
          title="Оновити"
        >
          <RefreshCw size={18} />
        </button>

        <div className="cd-heading">
          <span className="cd-eyebrow">КЛАНОВЕ ВИПРОБУВАННЯ</span>
          <h1>Підземелля</h1>
          <p>{clan?.name || "Спільна битва клану"}</p>
        </div>
      </header>

      <section className="cd-level-card">
        <div>
          <span>ПОТОЧНИЙ РІВЕНЬ</span>
          <strong>{level} / 50</strong>
        </div>
        <div className="cd-cycle">
          <Crown size={17} />
          Пройдено циклів: {formatNumber(state?.completed_cycles)}
        </div>
      </section>

      <section className="cd-monster-card">
        <div className="cd-monster-top">
          <span className="cd-monster-label">
            <Skull size={15} /> ПРОТИВНИК
          </span>
          <span className="cd-monster-level">РІВЕНЬ {level}</span>
        </div>

        <div className="cd-monster-art">
          <div className="cd-monster-glow" />
          <span>{getMonsterIcon(level)}</span>
        </div>

        <h2>{monster?.name || getMonsterDescription(level)}</h2>

        <div className="cd-health-heading">
          <span><Heart size={16} /> Здоров'я монстра</span>
          <strong>
            {formatNumber(currentHealth)} / {formatNumber(maxHealth)}
          </strong>
        </div>

        <div className="cd-health-track">
          <div
            className="cd-health-fill"
            style={{ width: `${healthPercent}%` }}
          />
        </div>

        <div className="cd-health-percent">
          {healthPercent.toFixed(1)}% залишилося
        </div>

        {battle && (
          <div className="cd-timer">
            <Clock size={17} />
            <span>До завершення бою</span>
            <strong>{formatTime(seconds)}</strong>
          </div>
        )}

        {!battle && (
          <div className="cd-no-battle">
            <Flame size={17} />
            Битва ще не розпочалася. Завдай першого удару!
          </div>
        )}
      </section>

      {notice && (
        <div className={`cd-notice ${notice.type}`}>
          {notice.type === "success" ? (
            <CheckCircle2 size={19} />
          ) : (
            <AlertCircle size={19} />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {attackResult && (
        <section className="cd-result">
          <div className="cd-result-title">
            {attackResult.victory ? "🏆 Перемога!" : "⚔️ Результат удару"}
          </div>

          <div className="cd-result-damage">
            -{formatNumber(attackResult.damage)}
          </div>

          {attackResult.critical && (
            <span className="cd-critical">КРИТИЧНИЙ УДАР ×1,5</span>
          )}

          <div className="cd-result-info">
            {attackResult.victory
              ? "Монстр переможений!"
              : `Залишилося здоров'я: ${formatNumber(attackResult.remaining_health)}`}
          </div>
        </section>
      )}

      {!eligible ? (
        <section className="cd-locked">
          <LockIcon />
          <strong>Підземелля поки недоступне</strong>
          <p>
            Для участі потрібно перебувати в клані щонайменше 24 години.
          </p>
        </section>
      ) : (
        <section className="cd-attacks">
          <div className="cd-section-title">
            <Swords size={20} />
            <div>
              <strong>Твій удар</strong>
              <small>Допоможи клану перемогти монстра</small>
            </div>
          </div>

          <button
            className="cd-free-button"
            disabled={!freeAvailable || attacking}
            onClick={() => handleAttack("free")}
          >
            <span className="cd-button-icon"><Zap size={22} /></span>
            <span>
              <strong>
                {attacking ? "Виконується удар..." : "Безкоштовний удар"}
              </strong>
              <small>
                {freeAvailable
                  ? "Доступний зараз"
                  : `Наступний через ${formatTime(
                      Math.max(
                        0,
                        Math.floor(
                          (new Date(state.free_hit_ready_at).getTime() -
                            Date.now()) / 1000
                        )
                      )
                    )}`}
              </small>
            </span>
            <span className="cd-free-tag">0 зол.</span>
          </button>

          <button
            className="cd-paid-button"
            disabled={attacking}
            onClick={() => handleAttack("purchased")}
          >
            <span className="cd-button-icon"><Coins size={22} /></span>
            <span>
              <strong>
                {attacking ? "Виконується удар..." : "Додатковий удар"}
              </strong>
              <small>
                Куплено сьогодні: {state.daily_purchases_count || 0}
                {" · "}після 5 покупок ціна ×4
              </small>
            </span>
            <span className="cd-paid-tag">
              {formatNumber(state.paid_hit_price)} зол.
            </span>
          </button>

          <p className="cd-reset-note">
            Щоденне скидання ліміту покупок — о 10:00 за Києвом.
          </p>
        </section>
      )}

      <section className="cd-ranking">
        <div className="cd-section-title">
          <Trophy size={21} />
          <div>
            <strong>Рейтинг учасників</strong>
            <small>Сортування за завданою шкодою</small>
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="cd-ranking-empty">
            Поки що ніхто не завдавав шкоди цьому монстру.
          </div>
        ) : (
          <div className="cd-ranking-list">
            {leaderboard.map((item) => (
              <div className="cd-ranking-row" key={item.user_id}>
                <div className={`cd-rank-number rank-${item.rank}`}>
                  {item.rank <= 3 ? ["🥇", "🥈", "🥉"][item.rank - 1] : item.rank}
                </div>

                <div className="cd-rank-avatar">
                  {item.avatar_url ? (
                    <img src={item.avatar_url} alt="" />
                  ) : (
                    <Shield size={19} />
                  )}
                </div>

                <div className="cd-rank-player">
                  <strong>
                    {item.username || "Гравець"}
                    {item.user_id === hero.id ? " (Ти)" : ""}
                  </strong>
                  <small>{item.rank} місце</small>
                </div>

                <div className="cd-rank-damage">
                  <Swords size={14} />
                  {formatNumber(item.damage)}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="cd-ranking-note">
          При однаковій шкоді вище місце отримує гравець, який раніше завдав
          перший удар.
        </p>
      </section>

      <section className="cd-rewards">
        <div className="cd-section-title">
          <Coins size={20} />
          <div>
            <strong>Нагороди учасникам</strong>
            <small>Виплата після перемоги над монстром</small>
          </div>
        </div>

        <div className="cd-reward-table">
          <div className="cd-reward-row cd-reward-head">
            <span>Рівень</span>
            <span>1–5 місце</span>
            <span>6–10 місце</span>
            <span>Інші</span>
          </div>

          {[
            [1, "1–10", 6, 4, 2],
            [2, "11–20", 8, 6, 4],
            [3, "21–30", 10, 8, 6],
            [4, "31–40", 12, 10, 8],
            [5, "41–50", 16, 14, 12],
          ].map((row) => (
            <div className="cd-reward-row" key={row[0]}>
              <span>{row[1]}</span>
              <strong>{row[2]} 🪙</strong>
              <strong>{row[3]} 🪙</strong>
              <strong>{row[4]} 🪙</strong>
            </div>
          ))}
        </div>
        <p className="cd-ranking-note">
          Усі учасники, які завдали шкоди, отримують нагороду відповідно до
          свого місця в рейтингу.
        </p>
      </section>

      <footer className="cd-footer">
        <Flame size={17} />
        Сила клану — у спільних ударах!
      </footer>
    </main>
  );
}

function LockIcon() {
  return <Shield size={30} />;
                                  }
            
