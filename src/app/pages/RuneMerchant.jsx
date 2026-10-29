
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Coins,
  Gem,
  Shield,
  Sword,
  Heart,
  Sparkles,
  Dumbbell,
  Footprints,
  Hand,
  CircleDot,
  Crown,
  Lock,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./RuneMerchant.css";

const RUNE_QUALITIES = [
  { id: "common", name: "Звичайна", bonus: 75, price: 50, color: "#a8a8a8" },
  { id: "common_plus", name: "Звичайна+", bonus: 150, price: 200, color: "#73b879" },
  { id: "rare", name: "Рідкісна", bonus: 250, price: 800, color: "#4b9ce2" },
  { id: "rare_plus", name: "Рідкісна+", bonus: 600, price: 5000, color: "#8265e8" },
  { id: "epic", name: "Епічна", bonus: 1000, price: 12500, color: "#c05ce0" },
  { id: "epic_plus", name: "Епічна+", bonus: 2000, price: 25000, color: "#ed8b42" },
  { id: "legendary", name: "Легендарна", bonus: 3000, price: 50000, color: "#e7c34d" },
  { id: "titanic", name: "Титанічна", bonus: 6000, price: 100000, color: "#ff694f" },
];

const EQUIPMENT = [
  { id: "helmet", name: "Шолом", stat: "сили", icon: Crown, type: "strength" },
  { id: "weapon", name: "Зброя", stat: "сили", icon: Sword, type: "strength" },
  { id: "offhand", name: "Друга рука", stat: "сили", icon: Shield, type: "strength" },
  { id: "shoulders", name: "Наплічники", stat: "життя", icon: Dumbbell, type: "life" },
  { id: "pants", name: "Штани", stat: "броні", icon: Shield, type: "armor" },
  { id: "gloves", name: "Рукавиці", stat: "удачі", icon: Hand, type: "luck" },
  { id: "boots", name: "Чоботи", stat: "життя", icon: Footprints, type: "life" },
  { id: "armor", name: "Броня", stat: "броні", icon: Shield, type: "armor" },
  { id: "ring_armor", name: "Перстень броні", stat: "броні", icon: CircleDot, type: "armor" },
  { id: "ring_life", name: "Перстень життя", stat: "життя", icon: Heart, type: "life" },
];

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("uk-UA");

export default function RuneMerchant({ onBack }) {
  const [userId, setUserId] = useState(null);
  const [gold, setGold] = useState(0);
  const [installedRunes, setInstalledRunes] = useState({});
  const [selectedSlot, setSelectedSlot] = useState("helmet");
  const [selectedQuality, setSelectedQuality] = useState("common");
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const rune = useMemo(
    () => EQUIPMENT.find((item) => item.id === selectedSlot) || EQUIPMENT[0],
    [selectedSlot]
  );

  const quality = useMemo(
    () =>
      RUNE_QUALITIES.find((item) => item.id === selectedQuality) ||
      RUNE_QUALITIES[0],
    [selectedQuality]
  );

  const installed = installedRunes[selectedSlot];

  const qualityRank = (id) =>
    RUNE_QUALITIES.findIndex((item) => item.id === id);

  const canUpgrade =
    !installed ||
    qualityRank(selectedQuality) > qualityRank(installed.quality);

  const currentPrice =
    RUNE_QUALITIES.find((item) => item.id === installed?.quality)?.price || 0;

  const upgradeCost = installed
    ? Math.max(0, quality.price - currentPrice)
    : quality.price;

  const notify = useCallback((text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setUserId(null);
        setGold(0);
        setInstalledRunes({});
        notify("Увійди в гру, щоб користуватися торговцем рун.", "error");
        return;
      }

      setUserId(user.id);

      const [profileResult, runesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("gold")
          .eq("id", user.id)
          .single(),
        supabase
          .from("player_runes")
          .select("slot_id, rune_type, quality_id, quality_name, bonus, price_paid")
          .eq("user_id", user.id),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (runesResult.error) throw runesResult.error;

      setGold(Number(profileResult.data?.gold) || 0);

      const mappedRunes = {};

      (runesResult.data || []).forEach((item) => {
        mappedRunes[item.slot_id] = {
          runeType: item.rune_type,
          quality: item.quality_id,
          qualityName:
            item.quality_name ||
            RUNE_QUALITIES.find((q) => q.id === item.quality_id)?.name ||
            item.quality_id,
          bonus: Number(item.bonus) || 0,
          pricePaid: Number(item.price_paid) || 0,
        };
      });

      setInstalledRunes(mappedRunes);

      setSelectedQuality((previous) => {
        const currentRune = mappedRunes[selectedSlot];
        if (!currentRune) return "common";

        const previousRank = qualityRank(previous);
        const installedRank = qualityRank(currentRune.quality);

        return previousRank > installedRank
          ? previous
          : currentRune.quality;
      });
    } catch (error) {
      notify(
        error.message || "Не вдалося завантажити дані торговця рун.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [notify, selectedSlot]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectSlot = (slotId) => {
    setSelectedSlot(slotId);
    setSelectedQuality(installedRunes[slotId]?.quality || "common");
    setMessage("");
  };

  const handleBuy = async () => {
    if (buying || loading) return;

    if (!userId) {
      notify("Спочатку увійди в гру.", "error");
      return;
    }

    if (!canUpgrade) {
      notify("Обери якість вищу за встановлену руну.", "error");
      return;
    }

    if (gold < upgradeCost) {
      notify("Недостатньо золота для цієї покупки.", "error");
      return;
    }

    setBuying(true);
    setMessage("");

    try {
      const { data, error } = await supabase.rpc("buy_player_rune", {
        p_slot_id: selectedSlot,
        p_quality_id: selectedQuality,
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error("Не вдалося встановити або покращити руну.");
      }

      setGold(Number(data.remaining_gold) || 0);

      setInstalledRunes((previous) => ({
        ...previous,
        [selectedSlot]: {
          runeType: data.rune_type,
          quality: data.quality_id,
          qualityName: data.quality_name || quality.name,
          bonus: Number(data.bonus) || 0,
          pricePaid: Number(data.price_paid) || 0,
        },
      }));

      notify(
        data.upgraded
          ? `Руну покращено до «${quality.name}»! Бонус: +${formatNumber(data.bonus)} ${rune.stat}. Доплата: ${formatNumber(data.price_paid)} золота.`
          : `Встановлено руну «${quality.name}»! Бонус: +${formatNumber(data.bonus)} ${rune.stat}.`,
        "success"
      );
    } catch (error) {
      notify(
        error.message || "Не вдалося встановити або покращити руну.",
        "error"
      );
      await loadData();
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="rune-page">
      <div className="rune-container">
        <header className="rune-header">
          <button
            type="button"
            className="rune-back-button"
            onClick={onBack}
            aria-label="Назад"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="rune-header-title">
            <span className="rune-eyebrow">МАГІЯ СПОРЯДЖЕННЯ</span>
            <h1>Торговець рун</h1>
            <p>Посилюй спорядження давньою магією</p>
          </div>

          <div className="rune-gold">
            <Coins size={19} />
            <strong>{formatNumber(gold)}</strong>
          </div>
        </header>

        {message && (
          <div className={`rune-message rune-message-${messageType}`}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="rune-loading">
            <RefreshCw size={24} className="rune-spin" />
            <p>Завантаження рун...</p>
          </div>
        ) : (
          <>
            <section className="rune-intro">
              <div className="rune-intro-icon">
                <Sparkles size={27} />
              </div>
              <div>
                <h2>Постійні руни</h2>
                <p>
                  Руна закріплюється за слотом спорядження та зберігається
                  навіть після заміни предмета. Встановлену руну можна лише
                  покращувати.
                </p>
              </div>
            </section>

            <section className="rune-section">
              <div className="rune-section-heading">
                <h2>Слоти рун</h2>
                <span>{Object.keys(installedRunes).length}/10 встановлено</span>
              </div>

              <div className="rune-slot-grid">
                {EQUIPMENT.map((item) => {
                  const SlotIcon = item.icon;
                  const slotRune = installedRunes[item.id];
                  const active = selectedSlot === item.id;

                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`rune-slot-card ${active ? "active" : ""} ${slotRune ? "has-rune" : ""}`}
                      onClick={() => handleSelectSlot(item.id)}
                    >
                      <span className="rune-slot-icon">
                        <SlotIcon size={22} />
                      </span>
                      <strong>{item.name}</strong>
                      <span className="rune-slot-stat">+{slotRune ? formatNumber(slotRune.bonus) : "0"} {item.stat}</span>
                      {slotRune ? (
                        <span className="rune-slot-quality" style={{ color: RUNE_QUALITIES.find((q) => q.id === slotRune.quality)?.color }}>
                          {slotRune.qualityName}
                        </span>
                      ) : (
                        <span className="rune-slot-empty">Руна відсутня</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rune-selected-panel">
              <div className="rune-selected-heading">
                <div className="rune-selected-icon">
                  <Gem size={25} />
                </div>
                <div>
                  <span className="rune-eyebrow">ОБРАНИЙ СЛОТ</span>
                  <h2>{rune.name}</h2>
                  <p>Бонус до {rune.stat}</p>
                </div>
              </div>

              {installed && (
                <div className="rune-already-installed">
                  <Check size={23} />
                  <div>
                    <strong>Поточна руна: {installed.qualityName}</strong>
                    <p>
                      +{formatNumber(installed.bonus)} {rune.stat}
                    </p>
                    <span>Обери якість вище, щоб покращити руну.</span>
                  </div>
                </div>
              )}

              <div className="rune-section-heading rune-quality-heading">
                <h2>{installed ? "Покращення руни" : "Оберіть якість"}</h2>
                <span>8 рівнів</span>
              </div>

              <div className="rune-quality-list">
                {RUNE_QUALITIES.map((item) => {
                  const rank = qualityRank(item.id);
                  const currentRank = installed
                    ? qualityRank(installed.quality)
                    : -1;
                  const isCurrent = installed?.quality === item.id;
                  const isLower = rank < currentRank;
                  const isDisabled = isCurrent || isLower;

                  const difference = installed
                    ? Math.max(0, item.price - currentPrice)
                    : item.price;

                  return (
                    <button
                      type="button"
                      key={item.id}
                      disabled={isDisabled}
                      className={`rune-quality-card ${selectedQuality === item.id ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
                      style={{ "--quality-color": item.color }}
                      onClick={() => {
                        setSelectedQuality(item.id);
                        setMessage("");
                      }}
                    >
                      <span className="rune-quality-gem">
                        <Gem size={22} />
                      </span>

                      <span className="rune-quality-info">
                        <strong>
                          {item.name}
                          {isCurrent ? " · Поточна" : ""}
                        </strong>
                        <span>+{formatNumber(item.bonus)} {rune.stat}</span>
                      </span>

                      <span className="rune-quality-price">
                        <strong>
                          {isCurrent
                            ? "Встановлена"
                            : isLower
                              ? "Недоступна"
                              : formatNumber(difference)}
                        </strong>
                        {!isDisabled && <span>золота</span>}
                      </span>

                      <span className="rune-quality-radio">
                        {selectedQuality === item.id && <Check size={14} />}
                        {isDisabled && selectedQuality !== item.id && (
                          <Lock size={13} />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="rune-purchase-summary">
                <div className="rune-summary-label">
                  <span>{installed ? "Покращення до" : "Обрана руна"}</span>
                  <strong>{quality.name}</strong>
                  <small>
                    Новий бонус: +{formatNumber(quality.bonus)} {rune.stat}
                  </small>
                </div>

                <div className="rune-total-price">
                  <Coins size={21} />
                  <div>
                    <strong>{formatNumber(upgradeCost)}</strong>
                    <span>до сплати</span>
                  </div>
                </div>
              </div>

              {installed && canUpgrade && (
                <p className="rune-upgrade-note">
                  <Sparkles size={15} />
                  Сплачується лише різниця між ціною нової та поточної руни.
                </p>
              )}

              <button
                type="button"
                className="rune-buy-button"
                onClick={handleBuy}
                disabled={
                  loading ||
                  buying ||
                  !userId ||
                  !canUpgrade ||
                  gold < upgradeCost
                }
              >
                {buying ? (
                  <RefreshCw size={19} className="rune-spin" />
                ) : (
                  <Gem size={19} />
                )}
                {buying
                  ? "Обробка..."
                  : installed
                    ? "Покращити руну"
                    : "Купити та встановити"}
              </button>

              {gold < upgradeCost && (
                <p className="rune-insufficient-gold">
                  Недостатньо золота. Потрібно ще{" "}
                  {formatNumber(upgradeCost - gold)}.
                </p>
              )}
            </section>

            <footer className="rune-footer">
              <Lock size={15} />
              Руни постійні: їх не можна зняти, продати або втратити.
            </footer>
          </>
        )}
      </div>
    </div>
  );
                         }
                    
