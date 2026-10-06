import { useState } from "react";

const equipment = [
  {
    id: 1,
    name: "Меч Дракона",
    type: "Зброя",
    icon: "⚔️",
    level: 7,
    maxLevel: 20,
    rarity: "epic",
    stat: "Атака",
    value: 145,
    nextValue: 158,
    cost: 350,
  },
  {
    id: 2,
    name: "Щит Світла",
    type: "Броня",
    icon: "🛡️",
    level: 5,
    maxLevel: 20,
    rarity: "rare",
    stat: "Захист",
    value: 92,
    nextValue: 104,
    cost: 250,
  },
  {
    id: 3,
    name: "Кільце Сили",
    type: "Аксесуар",
    icon: "💍",
    level: 3,
    maxLevel: 15,
    rarity: "legendary",
    stat: "Крит",
    value: 8,
    nextValue: 10,
    cost: 500,
  },
];

const runes = [
  {
    id: 1,
    name: "Руна Вогню",
    icon: "🔥",
    level: 4,
    maxLevel: 10,
    bonus: "+12% шкоди",
    cost: 180,
  },
  {
    id: 2,
    name: "Руна Землі",
    icon: "🌿",
    level: 2,
    maxLevel: 10,
    bonus: "+8% захисту",
    cost: 140,
  },
  {
    id: 3,
    name: "Руна Припливу",
    icon: "💧",
    level: 1,
    maxLevel: 10,
    bonus: "+5% HP",
    cost: 100,
  },
];

const rarityNames = {
  rare: "Рідкісний",
  epic: "Епічний",
  legendary: "Легендарний",
};

export default function Forge() {
  const [tab, setTab] = useState("equipment");
  const [gold, setGold] = useState(2450);
  const [selected, setSelected] = useState(equipment[0]);
  const [message, setMessage] = useState("");

  const list = tab === "equipment" ? equipment : runes;

  const upgrade = () => {
    if (!selected) return;

    if (selected.level >= selected.maxLevel) {
      setMessage("⭐ Предмет уже має максимальний рівень");
      return;
    }

    if (gold < selected.cost) {
      setMessage("❌ Недостатньо золота");
      return;
    }

    setGold((value) => value - selected.cost);

    setMessage(
      `✨ ${selected.name} покращено до рівня ${selected.level + 1}!`
    );

    setSelected({
      ...selected,
      level: selected.level + 1,
      value: selected.nextValue || selected.value,
      nextValue: selected.nextValue
        ? selected.nextValue + Math.ceil(selected.nextValue * 0.08)
        : undefined,
    });
  };

  const selectItem = (item) => {
    setSelected(item);
    setMessage("");
  };

  return (
    <div className="page forge-page">
      <header className="page-header">
        <div>
          <h1>🔨 Кузня</h1>
          <p>Посилюй своє спорядження</p>
        </div>

        <div className="forge-gold">💰 {gold.toLocaleString()}</div>
      </header>

      {/* Hero preview */}
      <section className="forge-hero">
        <div className="hero-avatar">🧙</div>

        <div className="hero-info">
          <span>Твій герой</span>
          <strong>Аріан</strong>
          <small>⚔️ Загальна сила: 4210</small>
        </div>

        <div className="forge-level">
          <span>Рівень</span>
          <strong>12</strong>
        </div>
      </section>

      {/* Tabs */}
      <div className="forge-tabs">
        <button
          className={tab === "equipment" ? "active" : ""}
          onClick={() => {
            setTab("equipment");
            setSelected(equipment[0]);
            setMessage("");
          }}
        >
          ⚔️ Спорядження
        </button>

        <button
          className={tab === "runes" ? "active" : ""}
          onClick={() => {
            setTab("runes");
            setSelected(runes[0]);
            setMessage("");
          }}
        >
          🔮 Руни
        </button>
      </div>

      {/* Selected item */}
      {selected && (
        <section className="selected-item">
          <div className={`selected-icon rarity-${selected.rarity || "rare"}`}>
            {selected.icon}
          </div>

          <div className="selected-info">
            <span>{selected.type || "Руна"}</span>
            <h2>{selected.name}</h2>

            <div className="selected-level">
              Рівень {selected.level}/{selected.maxLevel}
            </div>

            <div className="level-bar">
              <div
                className="level-fill"
                style={{
                  width: `${
                    (selected.level / selected.maxLevel) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      {selected && (
        <section className="upgrade-preview">
          <div className="stat-box">
            <span>Зараз</span>
            <strong>
              {selected.value ?? selected.bonus}
            </strong>
          </div>

          <div className="arrow">→</div>

          <div className="stat-box next">
            <span>Після покращення</span>
            <strong>
              {selected.nextValue
                ? selected.nextValue
                : selected.bonus}
            </strong>
          </div>
        </section>
      )}

      {/* Upgrade */}
      {selected && (
        <section className="upgrade-card">
          <div className="upgrade-cost">
            <span>Вартість покращення</span>
            <strong>💰 {selected.cost}</strong>
          </div>

          <button
            className="upgrade-button"
            onClick={upgrade}
            disabled={selected.level >= selected.maxLevel}
          >
            {selected.level >= selected.maxLevel
              ? "⭐ МАКСИМАЛЬНИЙ РІВЕНЬ"
              : "🔨 ПОКРАЩИТИ"}
          </button>

          {message && (
            <div className="forge-message">
              {message}
            </div>
          )}
        </section>
      )}

      {/* Equipment list */}
      <section className="forge-section">
        <div className="section-title">
          <h2>
            {tab === "equipment"
              ? "🎒 Твоє спорядження"
              : "🔮 Твої руни"}
          </h2>
          <span>{list.length} предмети</span>
        </div>

        <div className="forge-list">
          {list.map((item) => (
            <button
              key={item.id}
              className={`forge-item ${
                selected?.id === item.id ? "selected" : ""
              }`}
              onClick={() => selectItem(item)}
            >
              <div className="forge-item-icon">
                {item.icon}
              </div>

              <div className="forge-item-info">
                <strong>{item.name}</strong>

                <span>
                  Lv.{item.level}/{item.maxLevel}
                </span>

                <small>
                  {item.stat
                    ? `${item.stat}: ${item.value}`
                    : item.bonus}
                </small>
              </div>

              <div className="forge-item-arrow">
                ›
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Materials */}
      <section className="forge-materials">
        <div className="section-title">
          <h2>🧱 Матеріали</h2>
        </div>

        <div className="materials">
          <div>
            <span>🪨</span>
            <strong>42</strong>
            <small>Залізо</small>
          </div>

          <div>
            <span>🔮</span>
            <strong>18</strong>
            <small>Руни</small>
          </div>

          <div>
            <span>💎</span>
            <strong>7</strong>
            <small>Кристали</small>
          </div>
        </div>
      </section>

      {/* Forge info */}
      <section className="forge-info-card">
        <h3>📜 Як працює кузня?</h3>

        <p>
          Покращення підвищує характеристики спорядження.
          Чим вищий рівень — тим дорожче наступне покращення.
        </p>

        <p>
          🔮 Руни можна встановлювати у спорядження та
          отримувати додаткові бонуси.
        </p>
      </section>

      <style>{`
        .forge-page {
          padding-bottom: 90px;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 20px;
        }

        .page-header h1 {
          margin: 0 0 5px;
        }

        .page-header p {
          margin: 0;
          font-size: 12px;
          opacity: .6;
        }

        .forge-gold {
          padding: 10px 13px;
          border-radius: 13px;
          background: rgba(255,255,255,.07);
          font-weight: 700;
          white-space: nowrap;
        }

        .forge-hero {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 19px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.08);
        }

        .hero-avatar {
          width: 55px;
          height: 55px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: rgba(255,255,255,.08);
          font-size: 30px;
        }

        .hero-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .hero-info span,
        .hero-info small,
        .forge-level span {
          font-size: 10px;
          opacity: .55;
        }

        .hero-info strong {
          font-size: 16px;
        }

        .forge-level {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
        }

        .forge-level strong {
          font-size: 20px;
        }

        .forge-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 15px;
        }

        .forge-tabs button {
          padding: 12px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 13px;
          background: rgba(255,255,255,.04);
          color: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .forge-tabs button.active {
          background: rgba(140,70,230,.22);
          border-color: rgba(170,100,255,.6);
        }

        .selected-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 18px;
          border-radius: 22px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
        }

        .selected-icon {
          width: 78px;
          height: 78px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 21px;
          background: rgba(255,255,255,.07);
          font-size: 40px;
        }

        .selected-icon.rarity-epic {
          background: rgba(150,70,230,.16);
        }

        .selected-icon.rarity-legendary {
          background: rgba(220,160,50,.15);
        }

        .selected-info {
          flex: 1;
        }

        .selected-info > span {
          font-size: 10px;
          opacity: .5;
        }

        .selected-info h2 {
          margin: 3px 0 7px;
          font-size: 19px;
        }

        .selected-level {
          font-size: 11px;
          opacity: .65;
          margin-bottom: 6px;
        }

        .level-bar {
          height: 7px;
          overflow: hidden;
          border-radius: 10px;
          background: rgba(255,255,255,.08);
        }

        .level-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #9a50e8, #dc4c9b);
          transition: width .3s ease;
        }

        .upgrade-preview {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin: 12px 0;
        }

        .stat-box {
          flex: 1;
          padding: 13px;
          border-radius: 15px;
          background: rgba(255,255,255,.04);
          text-align: center;
        }

        .stat-box span {
          display: block;
          margin-bottom: 5px;
          font-size: 9px;
          opacity: .5;
        }

        .stat-box strong {
          font-size: 16px;
        }

        .stat-box.next {
          background: rgba(80,170,100,.08);
        }

        .arrow {
          opacity: .5;
        }

        .upgrade-card {
          padding: 15px;
          border-radius: 19px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.08);
        }

        .upgrade-cost {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .upgrade-cost span {
          font-size: 11px;
          opacity: .55;
        }

        .upgrade-cost strong {
          font-size: 15px;
        }

        .upgrade-button {
          width: 100%;
          padding: 14px;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, #8d42e8, #dc3d91);
          color: white;
          font-weight: 800;
          cursor: pointer;
        }

        .upgrade-button:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        .forge-message {
          margin-top: 10px;
          padding: 10px;
          border-radius: 11px;
          background: rgba(255,255,255,.06);
          text-align: center;
          font-size: 11px;
        }

        .forge-section {
          margin-top: 24px;
        }

        .section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 11px;
        }

        .section-title h2 {
          margin: 0;
          font-size: 17px;
        }

        .section-title span {
          font-size: 10px;
          opacity: .5;
        }

        .forge-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .forge-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 16px;
          background: rgba(255,255,255,.04);
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .forge-item.selected {
          border-color: rgba(160,90,255,.6);
          background: rgba(130,70,220,.12);
        }

        .forge-item-icon {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: rgba(255,255,255,.07);
          font-size: 23px;
        }

        .forge-item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .forge-item-info strong {
          font-size: 13px;
        }

        .forge-item-info span,
        .forge-item-info small {
          font-size: 9px;
          opacity: .55;
        }

        .forge-item-arrow {
          font-size: 22px;
          opacity: .35;
        }

        .forge-materials {
          margin-top: 24px;
        }

        .materials {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .materials div {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 12px 5px;
          border-radius: 15px;
          background: rgba(255,255,255,.04);
        }

        .materials span {
          font-size: 24px;
        }

        .materials strong {
          font-size: 14px;
        }

        .materials small {
          font-size: 8px;
          opacity: .5;
        }

        .forge-info-card {
          margin-top: 24px;
          padding: 16px;
          border-radius: 18px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.07);
        }

        .forge-info-card h3 {
          margin: 0 0 10px;
          font-size: 15px;
        }

        .forge-info-card p {
          margin: 7px 0;
          font-size: 11px;
          line-height: 1.5;
          opacity: .6;
        }

        @media (max-width: 500px) {
          .selected-icon {
            width: 65px;
            height: 65px;
            font-size: 32px;
          }

          .selected-info h2 {
            font-size: 16px;
          }

          .upgrade-preview {
            gap: 7px;
          }
        }
      `}</style>
    </div>
  );
          }
