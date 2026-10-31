import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  Crown,
  Shield,
  Swords,
  Pickaxe,
  Clock,
  Coins,
  Check,
  RefreshCw,
  Zap,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Boosts.css";

const EFFECTS = [
  {
    id: "blessing",
    title: "Благословення",
    description: "Благословення стародавніх сил",
    cost: 100,
    duration: 72,
    icon: Crown,
    color: "#e8b75d",
    bonuses: [
      "+200 до всіх параметрів",
      "+25% до отримуваного досвіду",
    ],
  },
  {
    id: "main",
    title: "Основний ефект",
    description: "Посилення загальних можливостей героя",
    cost: 25,
    duration: 24,
    icon: Sparkles,
    color: "#b38be0",
    bonuses: [
      "+25% до отримуваного досвіду",
      "+75% до нагороди при поразці на арені",
    ],
  },
  {
    id: "combat",
    title: "Бойовий ефект",
    description: "Благословення для справжнього воїна",
    cost: 25,
    duration: 24,
    icon: Swords,
    color: "#d87555",
    bonuses: [
      "+25% до отримуваного досвіду",
      "+100 до всіх параметрів",
    ],
  },
  {
    id: "gathering",
    title: "Добувний ефект",
    description: "Прискорення пошуку та видобутку",
    cost: 25,
    duration: 24,
    icon: Pickaxe,
    color: "#75b58b",
    bonuses: [
      "+25% до отримуваного досвіду",
      "−25% до часу пошуку та видобутку в печері",
    ],
  },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("uk-UA");
}

function formatTime(expiresAt, now) {
  const remaining = Math.max(
    0,
    new Date(expiresAt).getTime() - now
  );

  if (remaining <= 0) return "Завершено";

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days} д. ${hours} год. ${minutes} хв.`;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function Boosts({ onBack, onProfileUpdate }) {
  const [gold, setGold] = useState(0);
  const [activeEffects, setActiveEffects] = useState({});
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [notice, setNotice] = useState(null);
  const [now, setNow] = useState(Date.now());

  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Увійди в гру, щоб користуватися посиленнями.");

      const [
        { data: profile, error: profileError },
        { data: effects, error: effectsError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("gold")
          .eq("id", user.id)
          .single(),

        supabase
          .from("player_effects")
          .select("effect_key, expires_at")
          .eq("user_id", user.id),
      ]);

      if (profileError) throw profileError;
      if (effectsError) throw effectsError;

      setGold(Number(profile?.gold || 0));

      const normalized = {};

      (effects || []).forEach((effect) => {
        if (new Date(effect.expires_at).getTime() > Date.now()) {
          normalized[effect.effect_key] = effect.expires_at;
        }
      });

      setActiveEffects(normalized);
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Не вдалося завантажити посилення.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  async function handlePurchase(effect) {
    if (buying || loading) return;

    if (gold < effect.cost) {
      setNotice({
        type: "error",
        text: "Недостатньо золота для покупки цього ефекту.",
      });
      return;
    }

    setBuying(effect.id);
    setNotice(null);

    try {
      const { data, error } = await supabase.rpc(
        "buy_player_effect",
        {
          p_effect_key: effect.id,
        }
      );

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result?.success) {
        throw new Error(result?.message || "Не вдалося придбати ефект.");
      }

      setGold(Number(result.gold_left));
      setActiveEffects((previous) => ({
        ...previous,
        [effect.id]: result.expires_at,
      }));

      setNow(Date.now());

      setNotice({
        type: "success",
        text: `${effect.title} успішно активовано!`,
      });

      onProfileUpdate?.();
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Помилка покупки ефекту.",
      });
    } finally {
      setBuying(null);
    }
  }

  return (
    <div className="boosts-page">
      <div className="boosts-header">
        <button
          type="button"
          className="boosts-back"
          onClick={onBack}
          aria-label="Назад"
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <span className="boosts-eyebrow">ЛАБОРАТОРІЯ</span>
          <h2>Посилення</h2>
          <p>Ефекти та благословення</p>
        </div>

        <div className="boosts-header-icon">
          <Zap size={25} />
        </div>
      </div>

      <div className="boosts-wallet">
        <div className="boosts-wallet-icon">
          <Coins size={22} />
        </div>

        <div>
          <span>Твоє золото</span>
          <strong>{formatNumber(gold)}</strong>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading || buying !== null}
          aria-label="Оновити"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      {notice && (
        <div className={`boosts-notice ${notice.type}`} role="status">
          {notice.text}
        </div>
      )}

      <div className="boosts-info">
        <Sparkles size={19} />
        <p>
          Активуй декілька ефектів одночасно. Повторна покупка
          продовжує час дії відповідного ефекту.
        </p>
      </div>

      <div className="boosts-list">
        {EFFECTS.map((effect) => {
          const Icon = effect.icon;
          const expiresAt = activeEffects[effect.id];
          const remaining = expiresAt
            ? new Date(expiresAt).getTime() - now
            : 0;
          const isActive = remaining > 0;
          const isBuying = buying === effect.id;

          return (
            <article
              className={`boost-card ${isActive ? "active" : ""}`}
              key={effect.id}
              style={{ "--boost-color": effect.color }}
            >
              <div className="boost-card-header">
                <div className="boost-icon">
                  <Icon size={26} />
                </div>

                <div className="boost-title">
                  <h3>{effect.title}</h3>
                  <p>{effect.description}</p>
                </div>

                {isActive && (
                  <span className="boost-active-badge">
                    <Check size={13} />
                    Активний
                  </span>
                )}
              </div>

              <div className="boost-bonuses">
                {effect.bonuses.map((bonus, index) => (
                  <div className="boost-bonus" key={index}>
                    <Sparkles size={14} />
                    <span>{bonus}</span>
                  </div>
                ))}
              </div>

              {isActive ? (
                <div className="boost-timer">
                  <Clock size={17} />
                  <div>
                    <span>Залишилося часу</span>
                    <strong>{formatTime(expiresAt, now)}</strong>
                  </div>
                </div>
              ) : (
                <div className="boost-inactive">
                  <Clock size={16} />
                  Ефект не активний
                </div>
              )}

              <div className="boost-card-footer">
                <div className="boost-price">
                  <Coins size={17} />
                  <strong>{effect.cost}</strong>
                  <span>золота</span>
                </div>

                <button
                  type="button"
                  className="boost-buy-button"
                  disabled={loading || buying !== null}
                  onClick={() => handlePurchase(effect)}
                >
                  {isBuying ? (
                    "Купуємо..."
                  ) : isActive ? (
                    "Продовжити"
                  ) : (
                    "Активувати"
                  )}
                </button>
              </div>

              <div className="boost-duration">
                Тривалість покупки: {effect.duration === 72 ? "3 доби" : "24 години"}
                {isActive && " · Час додається до залишку"}
              </div>
            </article>
          );
        })}
      </div>

      {loading && (
        <div className="boosts-loading">
          Завантаження посилень...
        </div>
      )}

      <footer className="boosts-footer">
        <Shield size={15} />
        Ефекти зберігаються у твоєму профілі
      </footer>
    </div>
  );
    }
