import React, { useState } from "react";
import "./Forge.css";

const RUNE_TYPES = {
  strength: {
    name: "Руна Силы",
    icon: "⚔️",
    slots: "Голова, Левая рука, Правая рука",
    parameter: "Сила",
  },
  life: {
    name: "Руна Жизни",
    icon: "❤️",
    slots: "Плечи, Обувь",
    parameter: "Жизнь",
  },
  armor: {
    name: "Руна Брони",
    icon: "🛡️",
    slots: "Торс, Ноги",
    parameter: "Броня",
  },
  luck: {
    name: "Руна Удачи",
    icon: "🍀",
    slots: "Перчатки",
    parameter: "Удача",
  },
};

const RUNE_QUALITIES = [
  {
    id: "common",
    name: "Обычное",
    bonus: 75,
    price: 50,
  },
  {
    id: "common_plus",
    name: "Обычное+",
    bonus: 150,
    price: 200,
  },
  {
    id: "rare",
    name: "Редкое",
    bonus: 250,
    price: 800,
  },
  {
    id: "rare_plus",
    name: "Редкое+",
    bonus: 600,
    price: 5000,
  },
  {
    id: "epic",
    name: "Эпическое",
    bonus: 1000,
    price: 12500,
  },
  {
    id: "epic_plus",
    name: "Эпическое+",
    bonus: 2000,
    price: 25000,
  },
  {
    id: "legendary",
    name: "Легендарное",
    bonus: 3000,
    price: 50000,
  },
  {
    id: "titanic",
    name: "Титаническое",
    bonus: 6000,
    price: 100000,
  },
];

function Forge() {
  const [selectedRune, setSelectedRune] = useState("strength");
  const [gold, setGold] = useState(8493);
  const [message, setMessage] = useState("");

  const rune = RUNE_TYPES[selectedRune];

  const buyRune = (quality) => {
    if (gold < quality.price) {
      setMessage("❌ Недостаточно золота");
      return;
    }

    setGold((prev) => prev - quality.price);

    setMessage(
      `✅ ${rune.name} (${quality.name}) куплена. Бонус: +${quality.bonus} к параметру ${rune.parameter}.`
    );
  };

  return (
    <div className="forge-page">
      <div className="forge-header">
        <h1>Торговец рунами</h1>

        <div className="forge-resources">
          🛡️ 34224
          <span>|</span>
          🪙 {gold.toLocaleString("ru-RU")}
        </div>
      </div>

      <div className="forge-image">
        <div className="forge-image-overlay">
          🔮
        </div>
      </div>

      <div className="forge-description">
        Магические свойства рун улучшат ваши параметры!
      </div>

      <div className="rune-info">
        <h2>🔮 Руны</h2>

        <p>
          Это мощное усиление вещей.
          У рун, так же, как и у вещей, есть качество.
        </p>

        <p>
          Каждая руна устанавливается на слоты под определенный вид вещей.
        </p>

        <p className="warning">
          ⚠️ Внимание: Руны устанавливаются навсегда, их нельзя снять или
          потерять.
        </p>
      </div>

      <div className="rune-types">
        {Object.entries(RUNE_TYPES).map(([id, item]) => (
          <button
            key={id}
            className={`rune-type ${
              selectedRune === id ? "active" : ""
            }`}
            onClick={() => {
              setSelectedRune(id);
              setMessage("");
            }}
          >
            <span className="rune-type-icon">{item.icon}</span>

            <span className="rune-type-content">
              <strong>{item.name}</strong>
              <small>
                {item.slots}
              </small>
              <small>
                Бонус к параметру: {item.parameter}
              </small>
            </span>
          </button>
        ))}
      </div>

      <div className="selected-rune">
        <div className="selected-rune-title">
          {rune.icon} {rune.name}
        </div>

        <div className="selected-rune-subtitle">
          Устанавливается на: {rune.slots}
        </div>

        <div className="rune-list">
          {RUNE_QUALITIES.map((quality) => (
            <div className="rune-row" key={quality.id}>
              <div className="rune-quality">
                <strong>{quality.name}</strong>

                <span>
                  +{quality.bonus} к параметру
                </span>
              </div>

              <div className="rune-price">
                🪙 {quality.price.toLocaleString("ru-RU")}
              </div>

              <button
                className="rune-buy"
                onClick={() => buyRune(quality)}
              >
                Купить
              </button>
            </div>
          ))}
        </div>
      </div>

      {message && (
        <div className="rune-message">
          {message}
        </div>
      )}

      <div className="forge-navigation">
        <button>⚔️ Мой герой</button>
        <button>🛡️ Мой клан (+)</button>
        <button>❯ На главную</button>
      </div>

      <div className="forge-profile">
        <div>
          👤 Непроромний
        </div>

        <a href="#settings">
          Настройки
        </a>

        <div className="profile-resources">
          🟢 75&nbsp;&nbsp; | &nbsp;&nbsp;
          🪙 {gold.toLocaleString("ru-RU")}
        </div>
      </div>
    </div>
  );
}

export default Forge;
