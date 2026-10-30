
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Flame,
  Heart,
  Shield,
  Lock,
  Check,
  Sparkles,
  Crown,
  Coins,
  RefreshCw,
  Gem,
  Zap,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Rings.css";

const MAX_LEVEL = 30;

const RINGS = [
  {
    id: "rage",
    name: "Кільце люті",
    icon: Flame,
    color: "#e66b36",
    description:
      "Перетвори втрату здоров'я на силу. Що менше життя залишається герою, то сильнішим стає критичний удар.",
    effect: "Посилення критичної шкоди",
  },
  {
    id: "resurrection",
    name: "Кільце воскресіння",
    icon: Heart,
    color: "#d85c82",
    description:
      "Дарує шанс повернутися до життя після смертельного удару противника.",
    effect: "Шанс воскресіння після смертельного удару",
  },
  {
    id: "protection",
    name: "Кільце захисту",
    icon: Shield,
    color: "#58a6d8",
    description:
      "Допомагає відбивати критичні удари. Що менше здоров'я залишається герою, то сильніший захист.",
    effect: "Посилення захисту від критичних ударів",
  },
];

const UPGRADE_COSTS = [
  4000, 8000, 12000, 16000, 300,
  30000, 36000, 42000, 48000, 900,
  72000, 80000, 88000, 96000, 2000,
  130000, 140000, 150000, 160000, 5000,
  2000, 4000, 6000, 8000, 10000,
  4000, 8000, 12000, 16000, 20000,
];

const GOLD_LEVELS = new Set([
  5, 10, 15, 20, 21, 22, 23, 24, 25,
  26, 27, 28, 29, 30,
]);

const RAGE_PROTECTION_STATS = [
  [10, 10], [13, 10], [16, 10], [19, 10], [22, 10],
  [22, 16], [25, 16], [28, 16], [31, 16], [34, 16],
  [34, 22], [37, 22], [40, 22], [43, 22], [46, 22],
  [46, 28], [49, 28], [52, 28], [55, 28], [58, 28],
  [58, 34], [61, 34], [64, 34], [67, 34], [70, 34],
  [70, 40], [73, 40], [76, 40], [79, 40], [82, 40],
  [82, 46],
];

const RESURRECTION_STATS = [
  [10, 10], [12, 10], [13, 10], [15, 10], [16, 10],
  [16, 14], [18, 14], [19, 14], [21, 14], [22, 14],
  [22, 17], [24, 17], [25, 17], [27, 17], [28, 17],
  [28, 21], [30, 21], [31, 21], [33, 21], [34, 21],
  [34, 24], [36, 24], [37, 24], [39, 24], [40, 24],
  [40, 28], [42, 28], [43, 28], [45, 28], [46, 28],
  [46, 31],
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("uk-UA");
}

function getQuality(level) {
  if (level >= 30) return "Легендарне";
  if (level >= 26) return "Епічне +";
  if (level >= 21) return "Епічне";
  if (level >= 16) return "Рідкісне +";
  if (level >= 11) return "Рідкісне";
  if (level >= 6) return "Незвичайне +";
  return "Незвичайне";
}

function getStats(ringType, level) {
  const stats =
    ringType === "resurrection"
      ? RESURRECTION_STATS
      : RAGE_PROTECTION_STATS;

  const [bonus, chance] = stats[level];

  return { bonus, chance };
}

function getUpgradeCost(level) {
  const nextLevel = level + 1;
  const cost = UPGRADE_COSTS[level];

  return {
    amount: cost,
    currency: GOLD_LEVELS.has(nextLevel) ? "gold" : "silver",
  };
}

export default function Rings({ profile, onBack }) {
  const [rings, setRings] = useState([]);
  const [gold, setGold] = useState(Number(profile?.gold || 0));
  const [silver, setSilver] = useState(Number(profile?.silver || 0));
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");

  const heroLevel = Number(profile?.level || 1);

  const notify = useCallback((message, type = "info") => {
    setNotice(message);
    setNoticeType(type);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData?.user) {
        throw new Error("Увійди в гру, щоб користуватися кільцями.");
      }

      const userId = authData.user.id;

      const [
        { data: ringRows, error: ringError },
        { data: profileData, error: profileError },
      ] = await Promise.all([
        supabase
          .from("player_rings")
          .select("ring_type, level, is_owned, is_equipped")
          .eq("user_id", userId),

        supabase
          .from("profiles")
          .select("gold, silver, level")
          .eq("id", userId)
          .single(),
      ]);

      if (ringError) throw ringError;
      if (profileError) throw profileError;

      setRings(ringRows || []);
      setGold(Number(profileData?.gold || 0));
      setSilver(Number(profileData?.silver || 0));

      setSelected(
        (ringRows || [])
          .filter((ring) => ring.is_owned && ring.is_equipped)
          .map((ring) => ring.ring_type)
      );
    } catch (error) {
      notify(error.message || "Не вдалося завантажити кільця.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const ringById = useMemo(
    () => new Map(rings.map((ring) => [ring.ring_type, ring])),
    [rings]
  );

  async function handleBuy(ringType) {
    if (busy) return;

    setBusy(true);
    setNotice("");

    try {
      const { error } = await supabase.rpc("buy_player_ring", {
        p_ring_type: ringType,
      });

      if (error) throw error;

      await loadData();
      notify("Кільце успішно придбано!", "success");
    } catch (error) {
      notify(error.message || "Не вдалося придбати кільце.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpgrade(ringType) {
    if (busy) return;

    setBusy(true);
    setNotice("");

    try {
      const { error } = await supabase.rpc("upgrade_player_ring", {
        p_ring_type: ringType,
      });

      if (error) throw error;

      await loadData();
      notify("Кільце успішно покращено!", "success");
    } catch (error) {
      notify(error.message || "Не вдалося покращити кільце.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleSelect(ringType) {
    if (busy) return;

    const ring = ringById.get(ringType);
    if (!ring?.is_owned) return;

    let nextSelected;

    if (selected.includes(ringType)) {
      nextSelected = selected.filter((id) => id !== ringType);
    } else {
      if (selected.length >= 2) {
        notify("Для бою можна вибрати лише два кільця.", "error");
        return;
      }
      nextSelected = [...selected, ringType];
    }

    setBusy(true);

    try {
      const { error } = await supabase.rpc("select_player_rings", {
        p_ring_types: nextSelected,
      });

      if (error) throw error;

      setSelected(nextSelected);
      await loadData();
      notify("Вибір кілець збережено.", "success");
    } catch (error) {
      notify(error.message || "Не вдалося зберегти вибір.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="rings-page">
      <div className="rings-container">
        <header className="rings-header">
          <button
            className="rings-back"
            type="button"
            onClick={onBack}
            aria-label="Назад до кузні"
          >
            <ArrowLeft size={21} />
          </button>

          <div className="rings-heading">
            <span className="rings-eyebrow">МАГІЧНА МАЙСТЕРНЯ</span>
            <h1>Кільця</h1>
            <p>Пробуди приховану силу артефактів</p>
          </div>

          <div className="rings-header-icon">
            <Gem size={25} />
          </div>
        </header>

        <div className="rings-wallet">
          <div>
            <Coins size={17} />
            <span>Золото</span>
            <strong>{formatNumber(gold)}</strong>
          </div>
          <div>
            <Sparkles size={17} />
            <span>Срібло</span>
            <strong>{formatNumber(silver)}</strong>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading || busy}
            aria-label="Оновити"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        {notice && (
          <div className={`rings-notice ${noticeType}`} role="status">
            {notice}
          </div>
        )}

        <section className="rings-info-panel">
          <div className="rings-info-icon">
            <Zap size={22} />
          </div>
          <div>
            <strong>Магія двох кілець</strong>
            <p>
              Обери до двох кілець. Їхні властивості автоматично
              діятимуть у відповідних боях, печері та лізі.
              На арені кільця не працюють.
            </p>
          </div>
        </section>

        {heroLevel < 10 && (
          <div className="rings-locked-message">
            <Lock size={19} />
            <span>
              Покращення кілець відкривається з 10 рівня героя.
              Твій рівень: {heroLevel}.
            </span>
          </div>
        )}

        <div className="rings-section-heading">
          <div>
            <h2>Твої артефакти</h2>
            <p>Придбай кільце та розвивай його силу</p>
          </div>
          <span>3 КІЛЬЦЯ</span>
        </div>

        {loading ? (
          <div className="rings-loading">
            Завантаження магічних артефактів...
          </div>
        ) : (
          <div className="rings-list">
            {RINGS.map((definition) => {
              const ring = ringById.get(definition.id);
              const owned = Boolean(ring?.is_owned);
              const level = Number(ring?.level || 0);
              const equipped = selected.includes(definition.id);
              const Icon = definition.icon;
              const stats = getStats(definition.id, level);
              const maxed = level >= MAX_LEVEL;
              const cost = maxed ? null : getUpgradeCost(level);
              const availableCurrency =
                cost?.currency === "gold" ? gold : silver;
              const enoughResources =
                cost && availableCurrency >= cost.amount;

              return (
                <article
                  className={`ring-card ${owned ? "owned" : "not-owned"}`}
                  key={definition.id}
                  style={{ "--ring-color": definition.color }}
                >
                  <div className="ring-card-top">
                    <div className="ring-artifact-icon">
                      <Icon size={32} />
                    </div>

                    <div className="ring-title-area">
                      <span className="ring-quality">
                        {owned ? getQuality(level) : "Не придбано"}
                      </span>
                      <h3>{definition.name}</h3>
                      <span className="ring-level">
                        Рівень {level}/{MAX_LEVEL}
                      </span>
                    </div>

                    {equipped && (
                      <span className="ring-equipped-badge">
                        <Check size={13} />
                        Активне
                      </span>
                    )}
                  </div>

                  <p className="ring-description">
                    {definition.description}
                  </p>

                  <div className="ring-effect">
                    <Sparkles size={16} />
                    <span>{definition.effect}</span>
                  </div>

                  <div className="ring-stats">
                    <div>
                      <span>
                        {definition.id === "resurrection"
                          ? "Бонус життя"
                          : definition.id === "rage"
                            ? "Бонус критичної шкоди"
                            : "Бонус захисту"}
                      </span>
                      <strong>+{stats.bonus}%</strong>
                    </div>
                    <div>
                      <span>Шанс спрацювання</span>
                      <strong>{stats.chance}%</strong>
                    </div>
                  </div>

                  <div className="ring-progress">
                    <div
                      style={{
                        width: `${(level / MAX_LEVEL) * 100}%`,
                      }}
                    />
                  </div>

                  {!owned ? (
                    <button
                      type="button"
                      className="ring-action-button"
                      disabled={busy}
                      onClick={() => handleBuy(definition.id)}
                    >
                      <Coins size={18} />
                      Придбати за 250 золота
                    </button>
                  ) : (
                    <>
                      <div className="ring-next-upgrade">
                        {maxed ? (
                          <div className="ring-maxed">
                            <Crown size={19} />
                            Максимальний рівень
                          </div>
                        ) : (
                          <>
                            <div>
                              <span>Наступне покращення</span>
                              <strong>Рівень {level + 1}</strong>
                            </div>
                            <div className="ring-cost">
                              {cost.currency === "gold" ? (
                                <Coins size={17} />
                              ) : (
                                <Sparkles size={17} />
                              )}
                              <strong>
                                {formatNumber(cost.amount)}
                              </strong>
                              <small>
                                {cost.currency === "gold" ? "золота" : "срібла"}
                              </small>
                            </div>
                          </>
                        )}
                      </div>

                      {!maxed && (
                        <button
                          type="button"
                          className="ring-action-button"
                          disabled={
                            busy ||
                            loading ||
                            heroLevel < 10 ||
                            !enoughResources
                          }
                          onClick={() => handleUpgrade(definition.id)}
                        >
                          <Sparkles size={18} />
                          Покращити кільце
                        </button>
                      )}

                      {!maxed && !enoughResources && (
                        <p className="ring-insufficient">
                          Недостатньо {cost.currency === "gold" ? "золота" : "срібла"}.
                        </p>
                      )}

                      <button
                        type="button"
                        className={`ring-select-button ${
                          equipped ? "selected" : ""
                        }`}
                        disabled={busy}
                        onClick={() => handleSelect(definition.id)}
                      >
                        {equipped ? (
                          <>
                            <Check size={17} />
                            Зняти кільце
                          </>
                        ) : (
                          <>
                            <Shield size={17} />
                            Обрати для бою
                          </>
                        )}
                      </button>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <footer className="rings-footer">
          <Crown size={17} />
          <span>
            Легендарна якість відкривається на 30 рівні кільця.
          </span>
        </footer>
      </div>
    </main>
  );
  }
         
