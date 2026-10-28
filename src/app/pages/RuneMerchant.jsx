
import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Shield,
  Sword,
  Heart,
  Clover,
  Sparkles,
  LockKeyhole,
  Coins,
  Check,
  Gem,
  Info,
} from "lucide-react";
import "./RuneMerchant.css";

const RUNE_QUALITIES = [
  { id: "common", name: "Звичайна", bonus: 75, price: 50, color: "#a8adb5" },
  { id: "common_plus", name: "Звичайна+", bonus: 150, price: 200, color: "#c8cbd1" },
  { id: "rare", name: "Рідкісна", bonus: 250, price: 800, color: "#438cff" },
  { id: "rare_plus", name: "Рідкісна+", bonus: 600, price: 5000, color: "#38c9ed" },
  { id: "epic", name: "Епічна", bonus: 1000, price: 12500, color: "#bc65ff" },
  { id: "epic_plus", name: "Епічна+", bonus: 2000, price: 25000, color: "#f05be7" },
  { id: "legendary", name: "Легендарна", bonus: 3000, price: 50000, color: "#ffbd48" },
  { id: "titanic", name: "Титанічна", bonus: 6000, price: 100000, color: "#ff6666" },
];

const RUNE_TYPES = {
  strength: { name: "Руна сили", stat: "Сила", icon: Sword, color: "#e8a23b" },
  life: { name: "Руна життя", stat: "Життя", icon: Heart, color: "#e45b67" },
  armor: { name: "Руна броні", stat: "Броня", icon: Shield, color: "#64a8e8" },
  luck: { name: "Руна удачі", stat: "Удача", icon: Clover, color: "#67c88b" },
};

const EQUIPMENT = [
  { id: "helmet", name: "Шолом", rune: "strength", icon: Shield },
  { id: "weapon", name: "Меч", rune: "strength", icon: Sword },
  { id: "offhand", name: "Щит / друга рука", rune: "strength", icon: Shield },
  { id: "shoulders", name: "Наплечники", rune: "life", icon: Shield },
  { id: "pants", name: "Штани", rune: "armor", icon: Shield },
  { id: "gloves", name: "Рукавиці", rune: "luck", icon: Sparkles },
  { id: "boots", name: "Сапоги", rune: "life", icon: Shield },
  { id: "armor", name: "Броня", rune: "armor", icon: Shield },
  { id: "ring_armor", name: "Каблучка I", rune: "armor", icon: Gem },
  { id: "ring_life", name: "Каблучка II", rune: "life", icon: Gem },
];

export default function RuneMerchant({
  onBack = () => {},
  gold = 10000,
  equippedSlots = {},
  installedRunes = {},
  onBuyRune,
}) {
  const [selectedSlot, setSelectedSlot] = useState("helmet");
  const [selectedQuality, setSelectedQuality] = useState("common");
  const [message, setMessage] = useState("");

  const slot = EQUIPMENT.find((item) => item.id === selectedSlot);
  const rune = RUNE_TYPES[slot.rune];
  const quality = RUNE_QUALITIES.find((item) => item.id === selectedQuality);
  const installed = installedRunes[selectedSlot];

  const compatibleRunes = useMemo(
    () => RUNE_QUALITIES,
    []
  );

  const handleBuy = () => {
    setMessage("");

    if (installed) {
      setMessage("У цьому слоті вже встановлена руна. Її не можна замінити.");
      return;
    }

    if (gold < quality.price) {
      setMessage("Недостатньо золота для придбання цієї руни.");
      return;
    }

    if (typeof onBuyRune === "function") {
      onBuyRune({
        slotId: selectedSlot,
        slotName: slot.name,
        runeType: slot.rune,
        qualityId: quality.id,
        qualityName: quality.name,
        bonus: quality.bonus,
        price: quality.price,
      });
      return;
    }

    setMessage(
      "Демонстраційний режим: покупку ще не підключено до збереження гри."
    );
  };

  return (
    <main className="rune-page">
      <header className="rune-header">
        <button
          className="rune-back"
          onClick={onBack}
          aria-label="Назад"
          type="button"
        >
          <ArrowLeft size={23} />
        </button>

        <div className="rune-heading">
          <span className="rune-eyebrow">КУЗНИЦЯ</span>
          <h1>Торговець рунами</h1>
          <p>Магія, що посилює твого героя</p>
        </div>

        <div className="rune-header-gem">
          <Gem size={32} />
        </div>
      </header>

      <section className="rune-gold-panel">
        <div className="rune-gold-icon"><Coins size={27} /></div>
        <div>
          <span>Твоє золото</span>
          <strong>{Number(gold).toLocaleString("uk-UA")}</strong>
        </div>
      </section>

      <section className="rune-merchant-banner">
        <div className="rune-merchant-art">
          <Sparkles size={46} />
        </div>
        <div>
          <h2>Сила древніх рун</h2>
          <p>
            Обери спорядження, а потім встанови руну,
            яка назавжди посилить відповідну характеристику.
          </p>
        </div>
      </section>

      <div className="rune-warning">
        <LockKeyhole size={19} />
        <p>
          <strong>Увага!</strong> Руны встановлюються назавжди.
          Їх не можна зняти або втратити. Після заміни предмета
          руна залишається у своєму слоті.
        </p>
      </div>

      <section className="rune-section">
        <div className="rune-section-title">
          <h2>Твоє спорядження</h2>
          <span>{EQUIPMENT.length} слотів</span>
        </div>

        <div className="rune-equipment-grid">
          {EQUIPMENT.map((item) => {
            const ItemIcon = item.icon;
            const TypeIcon = RUNE_TYPES[item.rune].icon;
            const isSelected = selectedSlot === item.id;
            const installedRune = installedRunes[item.id];
            const equippedItem = equippedSlots[item.id];

            return (
              <button
                type="button"
                key={item.id}
                className={`rune-equipment-card ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() => {
                  setSelectedSlot(item.id);
                  setMessage("");
                }}
              >
                <div className="rune-item-icon">
                  {equippedItem?.image ? (
                    <img src={equippedItem.image} alt="" />
                  ) : (
                    <ItemIcon size={29} />
                  )}
                </div>

                <div className="rune-item-info">
                  <strong>{item.name}</strong>
                  <span className="rune-item-name">
                    {equippedItem?.name || "Слот спорядження"}
                  </span>
                  <span
                    className="rune-type-label"
                    style={{ color: RUNE_TYPES[item.rune].color }}
                  >
                    <TypeIcon size={13} />
                    {RUNE_TYPES[item.rune].name}
                  </span>
                  {installedRune && (
                    <span className="rune-installed-label">
                      <Check size={13} /> Встановлена
                    </span>
                  )}
                </div>

                <div className="rune-select-indicator">
                  {isSelected ? <Check size={17} /> : <span />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rune-section rune-shop-section">
        <div className="rune-section-title">
          <h2>Руни для слота</h2>
          <span>{slot.name}</span>
        </div>

        <div
  className="rune-selected-icon"
  style={{ color: rune.color }}
>
  {(() => {
    const RuneIcon = rune.icon;
    return <RuneIcon size={28} />;
  })()}
</div>
          <div>
            <strong>{rune.name}</strong>
            <span>Бонус до характеристики: {rune.stat}</span>
          </div>
        </div>

        {installed ? (
          <div className="rune-already-installed">
            <Check size={24} />
            <div>
              <strong>Руну вже встановлено</strong>
              <p>
                {installed.qualityName || installed.quality} · +
                {Number(installed.bonus).toLocaleString("uk-UA")} {rune.stat}
              </p>
              <span>Ця руна залишається в слоті назавжди.</span>
            </div>
          </div>
        ) : (
          <>
            <div className="rune-quality-list">
              {compatibleRunes.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`rune-quality-card ${
                    selectedQuality === item.id ? "active" : ""
                  }`}
                  style={{ "--quality-color": item.color }}
                  onClick={() => {
                    setSelectedQuality(item.id);
                    setMessage("");
                  }}
                >
                  <div className="rune-quality-gem">
                    <Gem size={22} />
                  </div>
                  <div className="rune-quality-info">
                    <strong>{item.name}</strong>
                    <span>+{item.bonus.toLocaleString("uk-UA")} {rune.stat}</span>
                  </div>
                  <div className="rune-quality-price">
                    <strong>{item.price.toLocaleString("uk-UA")}</strong>
                    <span>золота</span>
                  </div>
                  <span className="rune-quality-radio">
                    {selectedQuality === item.id && <Check size={14} />}
                  </span>
                </button>
              ))}
            </div>

            <div className="rune-purchase-summary">
              <div>
                <span>Обрана руна</span>
                <strong>{rune.name} · {quality.name}</strong>
              </div>
              <div className="rune-total-price">
                <Coins size={19} />
                <strong>{quality.price.toLocaleString("uk-UA")}</strong>
              </div>
            </div>

            <button
              type="button"
              className="rune-buy-button"
              onClick={handleBuy}
            >
              <Gem size={19} />
              Купити та встановити
            </button>
          </>
        )}

        {message && (
          <div className="rune-message" role="status">
            <Info size={18} />
            <span>{message}</span>
          </div>
        )}
      </section>

      <footer className="rune-footer">
        <LockKeyhole size={16} />
        Руни незнімні. Перевір якість і ціну перед встановленням.
      </footer>

      <button
        type="button"
        className="rune-bottom-back"
        onClick={onBack}
      >
        <ArrowLeft size={18} />
        Повернутися до кузні
      </button>
    </main>
  );
  }
                  
