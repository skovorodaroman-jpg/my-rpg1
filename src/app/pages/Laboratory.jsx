import { useMemo, useState } from "react";

const recipes = [
  {
    id: 1,
    name: "Мале зілля здоров'я",
    icon: "❤️",
    rarity: "common",
    description: "Відновлює 15% максимального HP героя.",
    ingredients: [
      { icon: "🌿", name: "Трава життя", amount: 3 },
      { icon: "💧", name: "Чиста вода", amount: 1 },
    ],
    result: "Зілля HP",
    effect: "+15% HP",
    cost: 50,
    available: true,
  },
  {
    id: 2,
    name: "Еліксир сили",
    icon: "⚔️",
    rarity: "rare",
    description: "Тимчасово збільшує атаку героя.",
    ingredients: [
      { icon: "🌿", name: "Трава життя", amount: 5 },
      { icon: "🔥", name: "Вогняний пил", amount: 2 },
    ],
    result: "Еліксир сили",
    effect: "+20% атаки",
    cost: 100,
    available: true,
  },
  {
    id: 3,
    name: "Зілля швидкості",
    icon: "⚡",
    rarity: "epic",
    description: "Збільшує швидкість героя на один бій.",
    ingredients: [
      { icon: "💨", name: "Пил вітру", amount: 4 },
      { icon: "💎", name: "Кристал", amount: 2 },
    ],
    result: "Еліксир швидкості",
    effect: "+25% швидкості",
    cost: 180,
    available: true,
  },
  {
    id: 4,
    name: "Еліксир критичного удару",
    icon: "🎯",
    rarity: "legendary",
    description: "Підвищує шанс критичного удару.",
    ingredients: [
      { icon: "💎", name: "Кристал", amount: 5 },
      { icon: "🩸", name: "Кров тіні", amount: 2 },
      { icon: "✨", name: "Пил світанку", amount: 1 },
    ],
    result: "Еліксир криту",
    effect: "+15% крит. шансу",
    cost: 350,
    available: false,
  },
];

const researches = [
  {
    id: 1,
    name: "Міцне тіло",
    icon: "❤️",
    description: "Збільшує базове HP усіх героїв.",
    level: 3,
    maxLevel: 10,
    bonus: "+6% HP",
    nextBonus: "+2%",
    cost: 750,
  },
  {
    id: 2,
    name: "Знання бою",
    icon: "⚔️",
    description: "Збільшує базову атаку всіх героїв.",
    level: 2,
    maxLevel: 10,
    bonus: "+4% атаки",
    nextBonus: "+2%",
    cost: 900,
  },
  {
    id: 3,
    name: "Швидка реакція",
    icon: "⚡",
    description: "Покращує швидкість усієї команди.",
    level: 1,
    maxLevel: 10,
    bonus: "+2% швидкості",
    nextBonus: "+2%",
    cost: 1100,
  },
  {
    id: 4,
    name: "Таємниці криту",
    icon: "🎯",
    description: "Збільшує шанс критичного удару.",
    level: 0,
    maxLevel: 10,
    bonus: "0% криту",
    nextBonus: "+2%",
    cost: 1500,
  },
];

const resources = [
  { icon: "🌿", name: "Трава життя", amount: 42 },
  { icon: "💧", name: "Чиста вода", amount: 27 },
  { icon: "🔥", name: "Вогняний пил", amount: 18 },
  { icon: "💨", name: "Пил вітру", amount: 14 },
  { icon: "💎", name: "Кристал", amount: 21 },
  { icon: "🩸", name: "Кров тіні", amount: 6 },
  { icon: "✨", name: "Пил світанку", amount: 3 },
];

const rarityClass = {
  common: "lab-common",
  rare: "lab-rare",
  epic: "lab-epic",
  legendary: "lab-legendary",
};

export default function Laboratory() {
  const [tab, setTab] = useState("potions");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [gold, setGold] = useState(2450);
  const [message, setMessage] = useState("");

  const [researchLevels, setResearchLevels] = useState(
    researches.reduce((acc, item) => {
      acc[item.id] = item.level;
      return acc;
    }, {})
  );

  const totalResources = useMemo(
    () => resources.reduce((sum, item) => sum + item.amount, 0),
    []
  );

  const craftPotion = (recipe) => {
    if (!recipe.available) {
      setMessage("🔒 Це дослідження ще не відкрито.");
      return;
    }

    if (gold < recipe.cost) {
      setMessage("❌ Недостатньо золота.");
      return;
    }

    setGold((value) => value - recipe.cost);
    setMessage(`✨ Створено: ${recipe.name}`);
    setSelectedRecipe(null);
  };

  const upgradeResearch = (research) => {
    const currentLevel = researchLevels[research.id];

    if (currentLevel >= research.maxLevel) {
      setMessage("🏆 Дослідження вже має максимальний рівень.");
      return;
    }

    if (gold < research.cost) {
      setMessage("❌ Недостатньо золота для дослідження.");
      return;
    }

    setGold((value) => value - research.cost);

    setResearchLevels((prev) => ({
      ...prev,
      [research.id]: prev[research.id] + 1,
    }));

    setMessage(`🧪 ${research.name} покращено до рівня ${currentLevel + 1}!`);
  };

  return (
    <div className="laboratory-page">
      <style>{`
        .laboratory-page {
          min-height: 100%;
          padding: 20px;
          color: #fff;
          background:
            radial-gradient(circle at 50% -10%, rgba(96, 66, 145, .25), transparent 38%),
            #100d16;
        }

        .lab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .lab-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          font-size: 28px;
          font-weight: 900;
        }

        .lab-title-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: linear-gradient(145deg, #8e59bd, #49306d);
          box-shadow: 0 8px 25px rgba(130, 80, 190, .2);
          font-size: 25px;
        }

        .lab-subtitle {
          margin: 7px 0 0 60px;
          color: #9e97a8;
          font-size: 13px;
        }

        .lab-wallet {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          background: rgba(255,255,255,.04);
          font-weight: 900;
          white-space: nowrap;
        }

        .lab-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          padding: 6px;
          margin-bottom: 18px;
          border-radius: 16px;
          background: rgba(255,255,255,.045);
        }

        .lab-tab {
          border: 0;
          padding: 12px 8px;
          border-radius: 12px;
          color: #aaa4b1;
          background: transparent;
          font-weight: 800;
          cursor: pointer;
        }

        .lab-tab.active {
          color: #fff;
          background: linear-gradient(135deg, #714795, #9d5cc3);
          box-shadow: 0 6px 18px rgba(150, 80, 190, .2);
        }

        .lab-card {
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 20px;
          background: rgba(255,255,255,.035);
          overflow: hidden;
        }

        .lab-section-title {
          padding: 17px 18px;
          font-weight: 900;
        }

        .lab-section-title span {
          display: block;
          margin-top: 4px;
          color: #88818f;
          font-size: 11px;
          font-weight: 600;
        }

        .resource-strip {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .resource {
          min-width: 75px;
          padding: 10px 8px;
          text-align: center;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 14px;
          background: rgba(255,255,255,.035);
        }

        .resource-icon {
          font-size: 21px;
        }

        .resource-name {
          margin-top: 5px;
          color: #938c9b;
          font-size: 9px;
        }

        .resource-amount {
          margin-top: 3px;
          font-weight: 900;
        }

        .recipe-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 0 14px 14px;
        }

        .recipe {
          position: relative;
          padding: 15px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 17px;
          background: rgba(255,255,255,.025);
          cursor: pointer;
          transition: .2s;
        }

        .recipe:hover {
          transform: translateY(-2px);
          border-color: rgba(170,100,210,.4);
        }

        .recipe.locked {
          opacity: .55;
        }

        .recipe-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .recipe-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: rgba(255,255,255,.06);
          font-size: 23px;
        }

        .recipe-name {
          font-weight: 900;
          font-size: 13px;
        }

        .recipe-rarity {
          margin-top: 3px;
          font-size: 9px;
          font-weight: 800;
        }

        .lab-common { color: #b4adb8; }
        .lab-rare { color: #67a8ff; }
        .lab-epic { color: #bf72ff; }
        .lab-legendary { color: #ffbd57; }

        .recipe-description {
          min-height: 38px;
          margin: 12px 0;
          color: #8d8794;
          font-size: 10px;
          line-height: 1.45;
        }

        .recipe-effect {
          padding: 8px 10px;
          border-radius: 9px;
          color: #b9e9ca;
          background: rgba(83,180,113,.08);
          font-size: 10px;
          font-weight: 800;
        }

        .recipe-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }

        .ingredients {
          display: flex;
          gap: 5px;
        }

        .ingredient {
          padding: 4px 6px;
          border-radius: 7px;
          background: rgba(255,255,255,.05);
          font-size: 10px;
        }

        .craft-button,
        .upgrade-button {
          border: 0;
          padding: 8px 11px;
          border-radius: 9px;
          color: #fff;
          background: linear-gradient(135deg, #7c4ca2, #ad62c8);
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .research-list {
          padding: 0 14px 14px;
        }

        .research {
          display: grid;
          grid-template-columns: 48px 1fr auto;
          align-items: center;
          gap: 13px;
          padding: 14px;
          margin-bottom: 9px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 16px;
          background: rgba(255,255,255,.025);
        }

        .research-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: rgba(132,82,173,.12);
          font-size: 21px;
        }

        .research-name {
          font-weight: 900;
        }

        .research-description {
          margin-top: 4px;
          color: #898390;
          font-size: 10px;
        }

        .research-progress {
          height: 5px;
          margin-top: 9px;
          overflow: hidden;
          border-radius: 5px;
          background: rgba(255,255,255,.07);
        }

        .research-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #8d4eb2, #d16ad4);
        }

        .research-bonus {
          margin-top: 6px;
          color: #b99ee8;
          font-size: 10px;
          font-weight: 800;
        }

        .research-level {
          text-align: right;
        }

        .research-level-number {
          font-size: 17px;
          font-weight: 900;
        }

        .research-level-label {
          color: #77717e;
          font-size: 9px;
        }

        .research-cost {
          margin: 8px 0;
          color: #d7c5e9;
          font-size: 10px;
        }

        .message {
          margin-bottom: 15px;
          padding: 12px 14px;
          border: 1px solid rgba(190,110,220,.2);
          border-radius: 13px;
          background: rgba(130,70,160,.1);
          color: #dfc8eb;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
        }

        .lab-info {
          padding: 17px;
        }

        .lab-info-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,.055);
          color: #99929f;
          font-size: 12px;
        }

        .lab-info-row:last-child {
          border-bottom: 0;
        }

        .lab-info-row strong {
          color: #fff;
        }

        @media (max-width: 700px) {
          .laboratory-page {
            padding: 14px;
          }

          .lab-header {
            align-items: flex-start;
          }

          .lab-title {
            font-size: 23px;
          }

          .lab-title-icon {
            width: 42px;
            height: 42px;
          }

          .lab-subtitle {
            margin-left: 54px;
          }

          .recipe-grid {
            grid-template-columns: 1fr;
          }

          .research {
            grid-template-columns: 42px 1fr;
          }

          .research-level {
            grid-column: 2;
            text-align: left;
          }

          .lab-wallet {
            padding: 8px 10px;
            font-size: 11px;
          }
        }
      `}</style>

      <div className="lab-header">
        <div>
          <h1 className="lab-title">
            <span className="lab-title-icon">🧪</span>
            Лабораторія
          </h1>
          <p className="lab-subtitle">
            Дослідження, зілля та таємні знання Eldara
          </p>
        </div>

        <div className="lab-wallet">
          🪙 {gold.toLocaleString("uk-UA")}
        </div>
      </div>

      <div className="lab-tabs">
        <button
          className={`lab-tab ${tab === "potions" ? "active" : ""}`}
          onClick={() => setTab("potions")}
        >
          🧪 Зілля
        </button>

        <button
          className={`lab-tab ${tab === "research" ? "active" : ""}`}
          onClick={() => setTab("research")}
        >
          📚 Дослідження
        </button>

        <button
          className={`lab-tab ${tab === "resources" ? "active" : ""}`}
          onClick={() => setTab("resources")}
        >
          🌿 Ресурси
        </button>
      </div>

      {message && <div className="message">{message}</div>}

      {tab === "potions" && (
        <>
          <div className="lab-card">
            <div className="lab-section-title">
              🧪 Алхімічний стіл
              <span>
                Створюй зілля з ресурсів, знайдених у шахті та пригодах.
              </span>
            </div>

            <div className="recipe-grid">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className={`recipe ${!recipe.available ? "locked" : ""}`}
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <div className="recipe-top">
                    <div className="recipe-icon">{recipe.icon}</div>

                    <div>
                      <div className="recipe-name">{recipe.name}</div>
                      <div className={`recipe-rarity ${rarityClass[recipe.rarity]}`}>
                        {recipe.rarity === "common" && "ЗВИЧАЙНЕ"}
                        {recipe.rarity === "rare" && "РІДКІСНЕ"}
                        {recipe.rarity === "epic" && "ЕПІЧНЕ"}
                        {recipe.rarity === "legendary" && "ЛЕГЕНДАРНЕ"}
                      </div>
                    </div>
                  </div>

                  <div className="recipe-description">
                    {recipe.description}
                  </div>

                  <div className="recipe-effect">
                    ✨ {recipe.effect}
                  </div>

                  <div className="recipe-bottom">
                    <div className="ingredients">
                      {recipe.ingredients.slice(0, 3).map((item) => (
                        <span className="ingredient" key={item.name}>
                          {item.icon} ×{item.amount}
                        </span>
                      ))}
                    </div>

                    <button
                      className="craft-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        craftPotion(recipe);
                      }}
                    >
                      {recipe.available
                        ? `🪙 ${recipe.cost}`
                        : "🔒"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedRecipe && (
            <div
              className="lab-modal-overlay"
              onClick={() => setSelectedRecipe(null)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                display: "grid",
                placeItems: "center",
                padding: 20,
                background: "rgba(0,0,0,.7)",
              }}
            >
              <div
                className="lab-card"
                style={{
                  width: "min(430px, 100%)",
                  padding: 20,
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <div style={{ fontSize: 34 }}>{selectedRecipe.icon}</div>

                <h2 style={{ margin: "10px 0 5px" }}>
                  {selectedRecipe.name}
                </h2>

                <p style={{ color: "#99929f", fontSize: 12 }}>
                  {selectedRecipe.description}
                </p>

                <div style={{ marginTop: 18, fontWeight: 900 }}>
                  Необхідні ресурси
                </div>

                <div style={{ marginTop: 10 }}>
                  {selectedRecipe.ingredients.map((item) => (
                    <div
                      key={item.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "9px 0",
                        borderBottom: "1px solid rgba(255,255,255,.06)",
                        fontSize: 12,
                      }}
                    >
                      <span>
                        {item.icon} {item.name}
                      </span>
                      <strong>×{item.amount}</strong>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 18,
                  }}
                >
                  <button
                    className="craft-button"
                    style={{ flex: 1, padding: 12 }}
                    onClick={() => craftPotion(selectedRecipe)}
                  >
                    🧪 Створити · 🪙 {selectedRecipe.cost}
                  </button>

                  <button
                    className="craft-button"
                    style={{
                      background: "rgba(255,255,255,.08)",
                    }}
                    onClick={() => setSelectedRecipe(null)}
                  >
                    Закрити
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "research" && (
        <div className="lab-card">
          <div className="lab-section-title">
            📚 Дослідницький центр
            <span>
              Постійні бонуси, які працюють для всіх твоїх героїв.
            </span>
          </div>

          <div className="research-list">
            {researches.map((research) => {
              const level = researchLevels[research.id];
              const progress = (level / research.maxLevel) * 100;

              return (
                <div className="research" key={research.id}>
                  <div className="research-icon">
                    {research.icon}
                  </div>

                  <div>
                    <div className="research-name">
                      {research.name}
                    </div>

                    <div className="research-description">
                      {research.description}
                    </div>

                    <div className="research-progress">
                      <div
                        className="research-progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="research-bonus">
                      Поточний бонус:{" "}
                      {level > 0 ? research.bonus : "Немає"}

                      {level < research.maxLevel &&
                        ` • Наступний: ${research.nextBonus}`}
                    </div>
                  </div>

                  <div className="research-level">
                    <div className="research-level-number">
                      {level}/{research.maxLevel}
                    </div>

                    <div className="research-level-label">
                      РІВЕНЬ
                    </div>

                    {level < research.maxLevel && (
                      <>
                        <div className="research-cost">
                          🪙 {research.cost}
                        </div>

                        <button
                          className="upgrade-button"
                          onClick={() => upgradeResearch(research)}
                        >
                          Покращити
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "resources" && (
        <>
          <div className="resource-strip">
            {resources.map((resource) => (
              <div className="resource" key={resource.name}>
                <div className="resource-icon">
                  {resource.icon}
                </div>

                <div className="resource-amount">
                  {resource.amount}
                </div>

                <div className="resource-name">
                  {resource.name}
                </div>
              </div>
            ))}
          </div>

          <div className="lab-card">
            <div className="lab-section-title">
              🌿 Сховище алхіміка

              <span>
                Усі матеріали, доступні для створення предметів.
              </span>
            </div>

            <div className="lab-info">
              <div className="lab-info-row">
                <span>Всього ресурсів</span>
                <strong>{totalResources}</strong>
              </div>

              <div className="lab-info-row">
                <span>Різновидів матеріалів</span>
                <strong>{resources.length}</strong>
              </div>

              <div className="lab-info-row">
                <span>Рівень лабораторії</span>
                <strong>5</strong>
              </div>

              <div className="lab-info-row">
                <span>Максимальний рівень</span>
                <strong>30</strong>
              </div>

              <div className="lab-info-row">
                <span>Наступне покращення</span>
                <strong>🪙 5 000</strong>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
