
import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Anvil,
  Shield,
  Sword,
  Gem,
  Coins,
  Check,
  Lock,
  Sparkles,
  TrendingUp,
  Hammer,
  Package,
} from "lucide-react";
import "./Sharpening.css";

const MAX_LEVEL = 35;

const MATERIALS = [
  { id: "diamond", name: "Алмаз", icon: "💎" },
  { id: "corundum", name: "Корунд", icon: "🔹" },
  { id: "obsidian", name: "Обсидіан", icon: "⬛" },
  { id: "graphite", name: "Графіт", icon: "◾" },
  { id: "onyx", name: "Онікс", icon: "🟤" },
  { id: "silver", name: "Срібло", icon: "⚪" },
];

const EQUIPMENT = [
  { id: "helmet", name: "Шолом", icon: Shield, rarity: "Легендарний" },
  { id: "weapon", name: "Зброя", icon: Sword, rarity: "Легендарна" },
  { id: "shoulders", name: "Наплічники", icon: Shield, rarity: "Епічні" },
  { id: "armor", name: "Броня", icon: Shield, rarity: "Легендарна" },
  { id: "gloves", name: "Рукавиці", icon: Shield, rarity: "Рідкісні" },
  { id: "pants", name: "Штани", icon: Shield, rarity: "Епічні" },
  { id: "boots", name: "Чоботи", icon: Shield, rarity: "Легендарні" },
  { id: "offhand", name: "Друга рука", icon: Shield, rarity: "Епічна" },
  { id: "ring_armor", name: "Перстень броні", icon: Gem, rarity: "Рідкісний" },
  { id: "ring_life", name: "Перстень життя", icon: Gem, rarity: "Рідкісний" },
];

function getSilverCost(level) {
  if (level <= 14) return level * 1000;
  if (level <= 20) return 50000;
  if (level <= 22) return 100000;
  if (level === 23) return 200000;
  if (level === 24) return 300000;
  if (level === 25) return 400000;
  if (level <= 27) return 450000;
  if (level <= 30) return 500000;
  if (level <= 32) return 550000;
  if (level <= 34) return 600000;
  return 650000;
}

function getMaterialCost(level) {
  if (level <= 14) {
    return {
      diamond: level,
      corundum: level * 2,
      obsidian: level * 2,
      graphite: level * 2,
      onyx: level * 2,
      silver: getSilverCost(level),
    };
  }

  if (level <= 20) {
    return {
      diamond: 25,
      corundum: 30,
      obsidian: 30,
      graphite: 30,
      onyx: 30,
      silver: getSilverCost(level),
    };
  }

  let amount;

  if (level <= 22) amount = 50;
  else if (level <= 24) amount = 75;
  else if (level <= 26) amount = 100;
  else if (level <= 28) amount = 120;
  else if (level <= 30) amount = 135;
  else if (level <= 32) amount = 150;
  else if (level <= 34) amount = 165;
  else amount = 180;

  return {
    diamond: amount,
    corundum: amount,
    obsidian: amount,
    graphite: amount,
    onyx: amount,
    silver: getSilverCost(level),
  };
}

function getBonus(level) {
  return level === 0 ? 0 : 20 + level * 4;
}

function getSuccessChance(level, pityBonus = 0) {
  const baseChance = Math.max(10, 100 - level * 3);
  return Math.min(100, baseChance + pityBonus);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("uk-UA");
}

export default function Sharpening({
  onBack,
  equipment = EQUIPMENT,
  materials = {},
  silver = 0,
  onSharpen,
}) {
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [levels, setLevels] = useState({});
  const [pity, setPity] = useState({});
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");
  const [busy, setBusy] = useState(false);

  const selectedItem = equipment.find(
    (item) => item.id === selectedItemId
  );

  const level = levels[selectedItemId] || 0;
  const nextLevel = level + 1;
  const pityBonus = pity[selectedItemId] || 0;

  const requirements = useMemo(
    () => getMaterialCost(nextLevel),
    [nextLevel]
  );

  const chance = getSuccessChance(nextLevel, pityBonus);
  const bonus = getBonus(nextLevel);

  const isMaxLevel = level >= MAX_LEVEL;

  const hasResources =
    Number(silver) >= requirements.silver &&
    MATERIALS.filter((item) => item.id !== "silver").every(
      (item) =>
        Number(materials[item.id] || 0) >= requirements[item.id]
    );

  function notify(text, type = "info") {
    setNotice(text);
    setNoticeType(type);
  }

  async function handleSharpen() {
    if (!selectedItem || busy || isMaxLevel) return;

    if (!hasResources) {
      notify("Не вистачає ресурсів для наступної заточки.", "error");
      return;
    }

    if (typeof onSharpen !== "function") {
      notify(
        "Демонстраційний режим: підключи Supabase, щоб витрачати ресурси й зберігати заточку.",
        "info"
      );
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      const result = await onSharpen({
        item: selectedItem,
        currentLevel: level,
        nextLevel,
        chance,
        bonus,
        requirements,
      });

      if (result?.success) {
        setLevels((previous) => ({
          ...previous,
          [selectedItemId]: nextLevel,
        }));

        setPity((previous) => ({
          ...previous,
          [selectedItemId]: 0,
        }));

        notify(
          `Успіх! ${selectedItem.name} заточено до +${nextLevel}.`,
          "success"
        );
      } else {
        setPity((previous) => ({
          ...previous,
          [selectedItemId]: Math.min(
            100,
            (previous[selectedItemId] || 0) + 3
          ),
        }));

        notify(
          "Заточка не вдалася. Наступний шанс для цього предмета збільшено на 3%.",
          "error"
        );
      }
    } catch (error) {
      notify(error.message || "Помилка заточки.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="sharpening-page">
      <div className="sharpening-container">
        <header className="sharpening-header">
          <button
            className="sharpening-back"
            type="button"
            onClick={onBack}
            aria-label="Назад"
          >
            <ArrowLeft size={21} />
          </button>

          <div>
            <span className="sharpening-eyebrow">МАЙСТЕРНЯ</span>
            <h1>Заточка</h1>
            <p>Зміцнюй спорядження свого героя</p>
          </div>

          <div className="sharpening-level-badge">
            <Anvil size={23} />
          </div>
        </header>

        {notice && (
          <div className={`sharpening-notice ${noticeType}`}>
            {notice}
          </div>
        )}

        {!selectedItem ? (
          <section className="sharpening-list-section">
            <div className="sharpening-section-title">
              <div>
                <h2>Твоє спорядження</h2>
                <p>Обери предмет для заточки</p>
              </div>
              <span>{equipment.length} предметів</span>
            </div>

            <div className="sharpening-equipment-list">
              {equipment.map((item) => {
                const ItemIcon = item.icon || Shield;
                const itemLevel = levels[item.id] || item.sharpenLevel || 0;

                return (
                  <article
                    className="sharpening-equipment-card"
                    key={item.id}
                  >
                    <div className="sharpening-item-icon">
                      <ItemIcon size={29} />
                      <span>+{itemLevel}</span>
                    </div>

                    <div className="sharpening-item-info">
                      <strong>{item.name}</strong>
                      <span>{item.rarity || "Спорядження героя"}</span>
                      <small>
                        Заточка +{itemLevel}/{MAX_LEVEL}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="sharpening-select-button"
                      onClick={() => {
                        setSelectedItemId(item.id);
                        setNotice("");
                      }}
                    >
                      Заточити
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="sharpening-detail">
            <button
              type="button"
              className="sharpening-change-item"
              onClick={() => {
                setSelectedItemId(null);
                setNotice("");
              }}
            >
              <ArrowLeft size={17} />
              До вибору речей
            </button>

            <div className="sharpening-item-preview">
              <div className="sharpening-preview-icon">
                {React.createElement(selectedItem.icon || Shield, {
                  size: 43,
                })}
                <span>+{level}</span>
              </div>

              <div className="sharpening-preview-info">
                <h2>{selectedItem.name}</h2>
                <span>{selectedItem.rarity || "Спорядження героя"}</span>
                <strong>
                  Рівень заточки: +{level}/{MAX_LEVEL}
                </strong>
              </div>
            </div>

            {isMaxLevel ? (
              <div className="sharpening-max-level">
                <CrownIcon />
                <h3>Максимальна заточка!</h3>
                <p>Цей предмет уже має рівень +{MAX_LEVEL}.</p>
              </div>
            ) : (
              <>
                <div className="sharpening-chance-panel">
                  <span>Шанс заточити до +{nextLevel}</span>
                  <strong>{chance}%</strong>
                  <div className="sharpening-progress">
                    <span style={{ width: `${chance}%` }} />
                  </div>
                  <p>
                    <TrendingUp size={16} />
                    +{bonus} до параметрів предмета
                  </p>
                  {pityBonus > 0 && (
                    <small>
                      Бонус невдалих спроб: +{pityBonus}%
                    </small>
                  )}
                </div>

                <div className="sharpening-cost-panel">
                  <h3>
                    <Package size={19} />
                    Ресурси для заточки +{nextLevel}
                  </h3>

                  <div className="sharpening-material-list">
                    {MATERIALS.map((material) => {
                      const required = requirements[material.id];
                      const available =
                        material.id === "silver"
                          ? Number(silver)
                          : Number(materials[material.id] || 0);
                      const enough = available >= required;

                      return (
                        <div
                          className={`sharpening-material-row ${enough ? "enough" : "missing"}`}
                          key={material.id}
                        >
                          <span className="sharpening-material-name">
                            <span>{material.icon}</span>
                            {material.name}
                          </span>

                          <span className="sharpening-material-count">
                            {formatNumber(available)} / {formatNumber(required)}
                          </span>

                          <span className="sharpening-material-status">
                            {enough ? (
                              <Check size={17} />
                            ) : (
                              <Lock size={16} />
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="sharpening-silver-cost">
                    <Coins size={20} />
                    <span>Потрібно срібла</span>
                    <strong>{formatNumber(requirements.silver)}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="sharpening-main-button"
                  disabled={busy || !hasResources}
                  onClick={handleSharpen}
                >
                  <Hammer size={21} />
                  {busy ? "Заточуємо..." : `Заточити до +${nextLevel}`}
                </button>

                {!hasResources && (
                  <p className="sharpening-missing-note">
                    Не вистачає ресурсів. Їх можна буде отримати в печері,
                    кар'єрі або придбати у коваля після підключення магазину.
                  </p>
                )}
              </>
            )}
          </section>
        )}

        <footer className="sharpening-footer">
          <Sparkles size={16} />
          Максимальний рівень заточки — +{MAX_LEVEL}
        </footer>
      </div>
    </main>
  );
}

function CrownIcon() {
  return <Sparkles size={30} />;
    }
          
