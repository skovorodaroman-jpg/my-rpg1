
import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Sparkles,
  Coins,
  Shield,
  Sword,
  HardHat,
  Shirt,
  Hand,
  Footprints,
  CircleDot,
  Gem,
  LoaderCircle,
  Lock,
  CheckCircle2,
} from "lucide-react";
import "./Bonuses.css";

const SLOTS = [
  { id: "weapon", name: "Зброя", icon: Sword },
  { id: "helmet", name: "Шолом", icon: HardHat },
  { id: "shoulders", name: "Наплічники", icon: Shield },
  { id: "armor", name: "Обладунок", icon: Shirt },
  { id: "gloves", name: "Рукавиці", icon: Hand },
  { id: "shield", name: "Щит", icon: Shield },
  { id: "pants", name: "Штани", icon: Shirt },
  { id: "boots", name: "Чоботи", icon: Footprints },
  { id: "amulet", name: "Амулет", icon: Gem },
  { id: "ring", name: "Кільце", icon: CircleDot },
  { id: "ring_armor", name: "Кільце захисту", icon: CircleDot },
  { id: "ring_life", name: "Кільце життя", icon: CircleDot },
  { id: "offhand", name: "Друга рука", icon: Shield },
];

const COSTS = [
  4, 5, 10, 15, 20, 25, 30, 35, 40, 50,
  60, 80, 120, 160, 200, 240, 280, 320, 360, 400,
  440, 480, 520, 560, 600, 640, 680, 720, 760, 800,
  840, 880, 920, 960, 1000, 1040, 1080, 1120, 1160, 1200,
  1240, 1280, 1320, 1360, 1400, 1440, 1480, 1520, 1560, 1600,
  1640, 1680, 1720, 1760, 1800, 1840, 1880, 1920, 1960, 2000,
  2040, 2080, 2120, 2160, 2200, 2300, 2400, 2500, 3000, 3500,
  3750, 4000, 4250, 4500, 4750, 5000, 5375, 5750, 6125, 6500,
  6875, 7250, 7625, 8000, 8375, 8950, 9525, 10100, 10675, 11250,
];

const formatNumber = (value) =>
  Math.round(Number(value) || 0).toLocaleString("uk-UA");

export default function Bonuses({ onBack = () => {} }) {
  const [bonuses, setBonuses] = useState({});
  const [gold, setGold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busySlot, setBusySlot] = useState(null);
  const [notice, setNotice] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData?.user) throw new Error("Увійди в гру.");

      const userId = authData.user.id;

      const [profileResult, bonusResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("gold")
          .eq("id", userId)
          .single(),

        supabase
          .from("player_slot_bonuses")
          .select("slot_type, bonus_level")
          .eq("user_id", userId),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (bonusResult.error) throw bonusResult.error;

      const bonusMap = {};

      (bonusResult.data || []).forEach((row) => {
        bonusMap[row.slot_type] = Number(row.bonus_level) || 0;
      });

      setBonuses(bonusMap);
      setGold(Number(profileResult.data?.gold) || 0);
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Не вдалося завантажити бонуси.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const upgrade = async (slot) => {
    const currentLevel = Number(bonuses[slot.id]) || 0;

    if (currentLevel >= 90) return;

    const cost = COSTS[currentLevel];

    if (gold < cost) {
      setNotice({
        type: "error",
        text: `Недостатньо золота. Потрібно ${formatNumber(cost)}.`,
      });
      return;
    }

    setBusySlot(slot.id);
    setNotice(null);

    try {
      const { data, error } = await supabase.rpc(
        "upgrade_slot_bonus",
        { p_slot_type: slot.id }
      );

      if (error) throw error;

      if (!data?.success) {
        if (data?.reason === "not_enough_gold") {
          setGold(Number(data.available_gold) || 0);
          throw new Error(
            `Недостатньо золота. Потрібно ${formatNumber(data.required_gold)}.`
          );
        }

        throw new Error(data?.message || "Не вдалося покращити бонус.");
      }

      setBonuses((previous) => ({
        ...previous,
        [slot.id]: Number(data.bonus_level),
      }));

      setGold((previous) =>
        Math.max(0, previous - Number(data.gold_spent || cost))
      );

      setNotice({
        type: "success",
        text: `${slot.name}: бонус покращено до ${data.bonus_level}/90. Додано +24 до параметрів.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Помилка покращення.",
      });
    } finally {
      setBusySlot(null);
    }
  };

  const totalBonusLevels = Object.values(bonuses).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  return (
    <main className="bonuses-page">
      <header className="bonuses-header">
        <button
          className="bonuses-back"
          onClick={onBack}
          aria-label="Назад до кузниці"
        >
          <ArrowLeft size={21} />
        </button>

        <div className="bonuses-heading">
          <span>КУЗНИЦЯ</span>
          <h1>Бонуси</h1>
        </div>

        <div className="bonuses-header-icon">
          <Sparkles size={25} />
        </div>
      </header>

      <section className="bonuses-intro">
        <div className="bonuses-intro-symbol">
          <Sparkles size={34} />
        </div>
        <div>
          <span>ПОСИЛЕННЯ СПОРЯДЖЕННЯ</span>
          <h2>Сила кожної речі</h2>
          <p>
            Покращуй бонуси слотів. Вони залишаються навіть після
            заміни спорядження.
          </p>
        </div>
      </section>

      <section className="bonuses-wallet">
        <div className="bonuses-wallet-icon">
          <Coins size={23} />
        </div>
        <div>
          <span>Твоє золото</span>
          <strong>{loading ? "…" : formatNumber(gold)}</strong>
        </div>
        <div className="bonuses-wallet-total">
          <span>Рівнів бонусів</span>
          <strong>{formatNumber(totalBonusLevels)}</strong>
        </div>
      </section>

      {notice && (
        <div className={`bonuses-notice ${notice.type}`}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      <div className="bonuses-section-title">
        <span>СЛОТИ СПОРЯДЖЕННЯ</span>
        <small>+24 до параметрів за рівень</small>
      </div>

      {loading ? (
        <div className="bonuses-loading">
          <LoaderCircle className="bonuses-spinner" size={28} />
          <span>Завантаження бонусів...</span>
        </div>
      ) : (
        <section className="bonuses-list">
          {SLOTS.map((slot) => {
            const Icon = slot.icon;
            const level = Number(bonuses[slot.id]) || 0;
            const cost = level < 90 ? COSTS[level] : null;
            const isBusy = busySlot === slot.id;
            const canAfford = cost !== null && gold >= cost;

            return (
              <article className="bonuses-card" key={slot.id}>
                <div className="bonuses-card-top">
                  <div className="bonuses-slot-icon">
                    <Icon size={25} />
                  </div>

                  <div className="bonuses-slot-info">
                    <strong>{slot.name}</strong>
                    <span>
                      Бонус: <b>{level}/90</b>
                    </span>
                  </div>

                  <div className="bonuses-slot-value">
                    <Sparkles size={15} />
                    <strong>+{formatNumber(level * 24)}</strong>
                  </div>
                </div>

                <div className="bonuses-progress">
                  <div
                    className="bonuses-progress-fill"
                    style={{ width: `${(level / 90) * 100}%` }}
                  />
                </div>

                <div className="bonuses-card-bottom">
                  {level >= 90 ? (
                    <div className="bonuses-max">
                      <CheckCircle2 size={17} />
                      Максимальний рівень
                    </div>
                  ) : (
                    <>
                      <div className="bonuses-next-cost">
                        <Coins size={17} />
                        <span>
                          Наступний рівень: <b>{formatNumber(cost)}</b>
                        </span>
                      </div>

                      <button
                        className="bonuses-upgrade-button"
                        disabled={isBusy || !canAfford}
                        onClick={() => upgrade(slot)}
                      >
                        {isBusy ? (
                          <LoaderCircle
                            size={17}
                            className="bonuses-spinner"
                          />
                        ) : !canAfford ? (
                          <>
                            <Lock size={15} />
                            Бракує золота
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            Покращити
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      <div className="bonuses-footer-note">
        <Sparkles size={17} />
        <span>
          Кожен рівень додає +24 до параметрів відповідного слота.
          Максимум — 90 рівнів.
        </span>
      </div>
    </main>
  );
  }
      
