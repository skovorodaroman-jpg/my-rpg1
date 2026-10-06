import { useMemo, useState } from "react";

const chapters = [
  {
    id: 1,
    name: "Пробудження Світанку",
    description: "Перший шлях Світлоносця крізь небезпечні землі Eldara.",
    requiredLevel: 1,
    completed: 8,
    total: 10,
    stages: [
      { id: 1, name: "Покинуте село", power: 120, gold: 80, xp: 40, stars: 3 },
      { id: 2, name: "Темний ліс", power: 180, gold: 95, xp: 55, stars: 3 },
      { id: 3, name: "Стежка мисливця", power: 250, gold: 110, xp: 70, stars: 3 },
      { id: 4, name: "Зруйнований храм", power: 330, gold: 130, xp: 85, stars: 3 },
      { id: 5, name: "Варта Тіней", power: 450, gold: 160, xp: 100, stars: 3 },
      { id: 6, name: "Долина попелу", power: 560, gold: 190, xp: 120, stars: 2 },
      { id: 7, name: "Забутий міст", power: 680, gold: 220, xp: 145, stars: 2 },
      { id: 8, name: "Вежа спостерігача", power: 820, gold: 260, xp: 170, stars: 2 },
      { id: 9, name: "Врата темряви", power: 980, gold: 300, xp: 200, stars: 1 },
      { id: 10, name: "Лорд Тіней", power: 1250, gold: 500, xp: 350, stars: 0, boss: true },
    ],
  },
  {
    id: 2,
    name: "Ліс Забутих",
    description: "Давній ліс приховує істот, яких Eldara давно забула.",
    requiredLevel: 8,
    completed: 0,
    total: 10,
    stages: [
      { id: 1, name: "Вхід у ліс", power: 1450, gold: 340, xp: 240, stars: 0 },
      { id: 2, name: "Коріння темряви", power: 1650, gold: 370, xp: 260, stars: 0 },
      { id: 3, name: "Шепіт дерев", power: 1850, gold: 400, xp: 280, stars: 0 },
      { id: 4, name: "Зелена безодня", power: 2100, gold: 430, xp: 300, stars: 0 },
      { id: 5, name: "Старий друїд", power: 2400, gold: 500, xp: 340, stars: 0, boss: true },
    ],
  },
  {
    id: 3,
    name: "Палаючі землі",
    description: "Вогонь поглинає землю. Тут виживають лише найсильніші.",
    requiredLevel: 15,
    completed: 0,
    total: 10,
    stages: [
      { id: 1, name: "Попеляста рівнина", power: 2800, gold: 550, xp: 400, stars: 0 },
      { id: 2, name: "Ріка лави", power: 3200, gold: 600, xp: 430, stars: 0 },
      { id: 3, name: "Фортеця вогню", power: 3700, gold: 680, xp: 470, stars: 0 },
      { id: 4, name: "Пекельні ворота", power: 4300, gold: 760, xp: 520, stars: 0 },
      { id: 5, name: "Вогняний володар", power: 5200, gold: 1000, xp: 700, stars: 0, boss: true },
    ],
  },
  {
    id: 4,
    name: "Землі Тіней",
    description: "Місце, де навіть світло боїться власної тіні.",
    requiredLevel: 25,
    completed: 0,
    total: 10,
    stages: [
      { id: 1, name: "Мертве місто", power: 6000, gold: 850, xp: 600, stars: 0 },
      { id: 2, name: "Безмовне кладовище", power: 6800, gold: 920, xp: 650, stars: 0 },
      { id: 3, name: "Палац ночі", power: 7800, gold: 1000, xp: 720, stars: 0 },
      { id: 4, name: "Серце темряви", power: 9000, gold: 1150, xp: 800, stars: 0 },
      { id: 5, name: "Володар Тіней", power: 11000, gold: 1800, xp: 1200, stars: 0, boss: true },
    ],
  },
  {
    id: 5,
    name: "Фрагмент Світанку",
    description: "Останній шлях до одного з п'яти фрагментів Сонця.",
    requiredLevel: 35,
    completed: 0,
    total: 10,
    stages: [
      { id: 1, name: "Священні руїни", power: 12500, gold: 1400, xp: 950, stars: 0 },
      { id: 2, name: "Зала Світла", power: 14000, gold: 1550, xp: 1050, stars: 0 },
      { id: 3, name: "Храм Світанку", power: 16000, gold: 1700, xp: 1150, stars: 0 },
      { id: 4, name: "Втрачене Сонце", power: 18000, gold: 2000, xp: 1300, stars: 0 },
      { id: 5, name: "Страж Фрагмента", power: 22000, gold: 3000, xp: 2000, stars: 0, boss: true },
    ],
  },
];

const difficulties = [
  { id: "normal", name: "Звичайний", icon: "⚔️", multiplier: 1 },
  { id: "hard", name: "Складний", icon: "🔥", multiplier: 1.7 },
  { id: "nightmare", name: "Кошмар", icon: "💀", multiplier: 2.5 },
];

function getStars(stars) {
  return "★".repeat(stars) + "☆".repeat(3 - stars);
}

export default function Adventures() {
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [difficulty, setDifficulty] = useState("normal");
  const [energy, setEnergy] = useState(18);
  const [message, setMessage] = useState("");
  const [selectedStage, setSelectedStage] = useState(null);

  const chapter = chapters[selectedChapter];

  const currentDifficulty = useMemo(
    () => difficulties.find((item) => item.id === difficulty),
    [difficulty]
  );

  const startStage = (stage) => {
    if (stage.id > chapter.completed + 1) {
      setMessage("🔒 Спочатку пройди попередній рівень.");
      return;
    }

    if (energy <= 0) {
      setMessage("⚡ Недостатньо енергії.");
      return;
    }

    setEnergy((value) => value - 1);
    setSelectedStage(stage);
    setMessage(`⚔️ Підготовка до бою: ${stage.name}`);
  };

  return (
    <div className="adventures-page">
      <style>{`
        .adventures-page {
          min-height: 100%;
          padding: 20px;
          color: #fff;
          background:
            radial-gradient(circle at 50% -10%, rgba(194, 74, 94, .20), transparent 38%),
            #100d16;
        }

        .adv-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 20px;
        }

        .adv-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .adv-icon {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: linear-gradient(145deg, #c15b54, #70323d);
          box-shadow: 0 8px 25px rgba(190, 70, 80, .18);
          font-size: 25px;
        }

        .adv-title {
          margin: 0;
          font-size: 27px;
          font-weight: 900;
        }

        .adv-subtitle {
          margin: 5px 0 0;
          color: #9b94a3;
          font-size: 12px;
        }

        .energy-box {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 14px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          background: rgba(255,255,255,.04);
          font-weight: 900;
        }

        .adv-layout {
          display: grid;
          grid-template-columns: 290px 1fr;
          gap: 16px;
        }

        .adv-card {
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 20px;
          background: rgba(255,255,255,.035);
          overflow: hidden;
        }

        .chapter-list {
          padding: 10px;
        }

        .chapter {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 13px 12px;
          margin-bottom: 7px;
          border: 1px solid transparent;
          border-radius: 14px;
          cursor: pointer;
          transition: .2s;
        }

        .chapter:hover {
          background: rgba(255,255,255,.04);
        }

        .chapter.active {
          border-color: rgba(213,83,111,.3);
          background: rgba(192,71,100,.13);
        }

        .chapter.locked {
          opacity: .45;
          cursor: not-allowed;
        }

        .chapter-number {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 12px;
          background: rgba(255,255,255,.06);
          font-weight: 900;
        }

        .chapter.active .chapter-number {
          background: linear-gradient(135deg, #a63d61, #d25c7b);
        }

        .chapter-name {
          font-size: 12px;
          font-weight: 900;
        }

        .chapter-progress {
          margin-top: 4px;
          color: #85808b;
          font-size: 9px;
        }

        .chapter-lock {
          margin-left: auto;
          font-size: 14px;
        }

        .adv-main {
          padding: 18px;
        }

        .chapter-banner {
          position: relative;
          min-height: 145px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          border-radius: 18px;
          overflow: hidden;
          background:
            linear-gradient(90deg, rgba(15,10,18,.95), rgba(15,10,18,.35)),
            radial-gradient(circle at 75% 30%, rgba(211,74,100,.45), transparent 30%),
            linear-gradient(135deg, #34202c, #17131b);
        }

        .chapter-banner-number {
          position: absolute;
          right: 22px;
          top: 10px;
          color: rgba(255,255,255,.06);
          font-size: 100px;
          font-weight: 900;
        }

        .chapter-banner h2 {
          position: relative;
          z-index: 1;
          margin: 0;
          font-size: 23px;
          font-weight: 900;
        }

        .chapter-banner p {
          position: relative;
          z-index: 1;
          max-width: 520px;
          margin: 7px 0 0;
          color: #a9a1ae;
          font-size: 11px;
          line-height: 1.5;
        }

        .chapter-progress-wrap {
          position: relative;
          z-index: 1;
          max-width: 350px;
          margin-top: 13px;
        }

        .progress-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          color: #aaa2ae;
          font-size: 9px;
        }

        .progress-bar {
          height: 6px;
          overflow: hidden;
          border-radius: 10px;
          background: rgba(255,255,255,.09);
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #c74e73, #e37a8e);
        }

        .difficulty-row {
          display: flex;
          gap: 8px;
          margin: 15px 0;
          overflow-x: auto;
        }

        .difficulty {
          padding: 9px 13px;
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 11px;
          color: #918a98;
          background: rgba(255,255,255,.025);
          cursor: pointer;
          font-size: 11px;
          font-weight: 800;
        }

        .difficulty.active {
          color: #fff;
          border-color: rgba(211,83,111,.4);
          background: rgba(202,71,102,.13);
        }

        .stage-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 9px;
        }

        .stage {
          position: relative;
          min-height: 112px;
          padding: 10px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 15px;
          background: rgba(255,255,255,.025);
          cursor: pointer;
          transition: .2s;
        }

        .stage:hover:not(.locked) {
          transform: translateY(-2px);
          border-color: rgba(211,83,111,.35);
        }

        .stage.completed {
          background: rgba(86,160,105,.06);
          border-color: rgba(86,160,105,.16);
        }

        .stage.locked {
          opacity: .4;
          cursor: not-allowed;
        }

        .stage.boss {
          background:
            linear-gradient(145deg, rgba(117,39,50,.22), rgba(255,255,255,.025));
          border-color: rgba(220,72,86,.24);
        }

        .stage-number {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #89828f;
          font-size: 9px;
          font-weight: 800;
        }

        .stage-boss {
          color: #ef7181;
          font-size: 9px;
        }

        .stage-icon {
          margin: 7px 0 5px;
          font-size: 23px;
        }

        .stage-name {
          min-height: 27px;
          font-size: 10px;
          font-weight: 900;
        }

        .stage-power {
          margin-top: 6px;
          color: #a69eab;
          font-size: 9px;
        }

        .stage-stars {
          margin-top: 5px;
          color: #e7b75a;
          letter-spacing: 1px;
          font-size: 9px;
        }

        .rewards {
          display: flex;
          gap: 5px;
          margin-top: 9px;
        }

        .reward {
          padding: 4px 6px;
          border-radius: 7px;
          background: rgba(255,255,255,.05);
          font-size: 9px;
        }

        .message {
          margin-bottom: 14px;
          padding: 11px 14px;
          border: 1px solid rgba(211,83,111,.2);
          border-radius: 12px;
          background: rgba(170,50,80,.09);
          color: #e4b4bf;
          text-align: center;
          font-size: 11px;
          font-weight: 800;
        }

        .adv-info {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 15px;
        }

        .info-box {
          padding: 13px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 14px;
          background: rgba(255,255,255,.025);
        }

        .info-label {
          color: #817a87;
          font-size: 9px;
        }

        .info-value {
          margin-top: 5px;
          font-size: 15px;
          font-weight: 900;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(0,0,0,.72);
        }

        .modal {
          width: min(420px, 100%);
          padding: 22px;
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 22px;
          background: #18131e;
          box-shadow: 0 25px 80px rgba(0,0,0,.5);
        }

        .modal-icon {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          margin-bottom: 12px;
          border-radius: 17px;
          background: rgba(207,69,92,.14);
          font-size: 29px;
        }

        .modal h2 {
          margin: 0;
          font-size: 20px;
        }

        .modal-description {
          margin: 7px 0 18px;
          color: #918a97;
          font-size: 11px;
          line-height: 1.5;
        }

        .modal-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .modal-stat {
          padding: 11px;
          border-radius: 12px;
          background: rgba(255,255,255,.045);
        }

        .modal-stat span {
          display: block;
          color: #817a87;
          font-size: 9px;
        }

        .modal-stat strong {
          display: block;
          margin-top: 4px;
          font-size: 13px;
        }

        .modal-actions {
          display: flex;
          gap: 8px;
          margin-top: 18px;
        }

        .modal-button {
          flex: 1;
          padding: 12px;
          border: 0;
          border-radius: 11px;
          color: #fff;
          background: linear-gradient(135deg, #a53f61, #d15c7c);
          font-weight: 900;
          cursor: pointer;
        }

        .modal-button.secondary {
          background: rgba(255,255,255,.07);
        }

        @media (max-width: 900px) {
          .adv-layout {
            grid-template-columns: 1fr;
          }

          .chapter-list {
            display: flex;
            gap: 8px;
            overflow-x: auto;
          }

          .chapter {
            min-width: 210px;
            margin-bottom: 0;
          }

          .stage-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 600px) {
          .adventures-page {
            padding: 14px;
          }

          .adv-title {
            font-size: 23px;
          }

          .stage-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .adv-info {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="adv-header">
        <div className="adv-title-wrap">
          <div className="adv-icon">🗺️</div>

          <div>
            <h1 className="adv-title">Пригоди</h1>
            <p className="adv-subtitle">
              Подорож крізь світ Хронік Згаслого Світанку
            </p>
          </div>
        </div>

        <div className="energy-box">
          ⚡ {energy}/30
        </div>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="adv-layout">
        <div className="adv-card">
          <div className="chapter-list">
            {chapters.map((item, index) => {
              const locked = item.requiredLevel > 34;

              return (
                <div
                  key={item.id}
                  className={`chapter ${
                    selectedChapter === index ? "active" : ""
                  } ${locked ? "locked" : ""}`}
                  onClick={() => {
                    if (!locked) {
                      setSelectedChapter(index);
                      setMessage("");
                    } else {
                      setMessage(
                        `🔒 Потрібен ${item.requiredLevel} рівень героя.`
                      );
                    }
                  }}
                >
                  <div className="chapter-number">
                    {locked ? "🔒" : item.id}
                  </div>

                  <div>
                    <div className="chapter-name">
                      {item.name}
                    </div>

                    <div className="chapter-progress">
                      {item.completed}/{item.total} рівнів
                      {" • "}
                      рівень {item.requiredLevel}+
                    </div>
                  </div>

                  {item.completed === item.total && (
                    <div className="chapter-lock">✓</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="adv-card adv-main">
          <div className="chapter-banner">
            <div className="chapter-banner-number">
              {chapter.id}
            </div>

            <h2>{chapter.name}</h2>

            <p>{chapter.description}</p>

            <div className="chapter-progress-wrap">
              <div className="progress-top">
                <span>Прогрес глави</span>
                <span>
                  {chapter.completed}/{chapter.total}
                </span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      (chapter.completed / chapter.total) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="difficulty-row">
            {difficulties.map((item) => (
              <button
                key={item.id}
                className={`difficulty ${
                  difficulty === item.id ? "active" : ""
                }`}
                onClick={() => setDifficulty(item.id)}
              >
                {item.icon} {item.name}
              </button>
            ))}
          </div>

          <div className="stage-grid">
            {chapter.stages.map((stage) => {
              const unlocked = stage.id <= chapter.completed + 1;
              const completed = stage.id <= chapter.completed;

              const adjustedPower = Math.round(
                stage.power * currentDifficulty.multiplier
              );

              return (
  <div
    key={stage.id}
    className={`stage ${
      completed ? "completed" : ""
    } ${stage.boss ? "boss" : ""} ${
      !unlocked ? "locked" : ""
    }`}
    onClick={() => {
      if (unlocked) {
        startStage(stage);
      } else {
        setMessage("🔒 Спочатку пройди попередній рівень.");
      }
    }}
  >
    <div className="stage-number">
      <span>РІВЕНЬ {stage.id}</span>

      {stage.boss && (
        <span className="stage-boss">
          👑 БОС
        </span>
      )}
    </div>

    <div className="stage-icon">
      {stage.boss
        ? "👹"
        : completed
        ? "✅"
        : "⚔️"}
    </div>

    <div className="stage-name">
      {stage.name}
    </div>

    <div className="stage-power">
      ⚡ {adjustedPower.toLocaleString("uk-UA")}
    </div>

    <div className="stage-stars">
      {getStars(stage.stars)}
    </div>

    <div className="rewards">
      <span className="reward">
        🪙{" "}
        {Math.round(
          stage.gold * currentDifficulty.multiplier
        )}
      </span>

      <span className="reward">
        ✨{" "}
        {Math.round(
          stage.xp * currentDifficulty.multiplier
        )}
      </span>
    </div>
  </div>
);
})}
</div>

<div className="adv-info">
  <div className="info-box">
    <div className="info-label">
      ЕНЕРГІЯ ЗА БІЙ
    </div>

    <div className="info-value">
      ⚡ 1
    </div>
  </div>

  <div className="info-box">
    <div className="info-label">
      МНОЖНИК НАГОРОДИ
    </div>

    <div className="info-value">
      ×{currentDifficulty.multiplier}
    </div>
  </div>

  <div className="info-box">
    <div className="info-label">
      СКЛАДНІСТЬ
    </div>

    <div className="info-value">
      {currentDifficulty.name}
    </div>
  </div>
</div>
</div>
</div>

{selectedStage && (
  <div
    className="modal-overlay"
    onClick={() => setSelectedStage(null)}
  >
    <div
      className="modal"
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <div className="modal-icon">
        {selectedStage.boss
          ? "👹"
          : "⚔️"}
      </div>

      <h2>{selectedStage.name}</h2>

      <p className="modal-description">
        Твоя команда готова вирушити в бій.
        Переможи ворогів та отримай нагороду.
      </p>

      <div className="modal-stats">
        <div className="modal-stat">
          <span>СИЛА ВОРОГА</span>

          <strong>
            ⚡{" "}
            {Math.round(
              selectedStage.power *
                currentDifficulty.multiplier
            ).toLocaleString("uk-UA")}
          </strong>
        </div>

        <div className="modal-stat">
          <span>ЕНЕРГІЯ</span>

          <strong>
            ⚡ 1
          </strong>
        </div>

        <div className="modal-stat">
          <span>ЗОЛОТО</span>

          <strong>
            🪙{" "}
            {Math.round(
              selectedStage.gold *
                currentDifficulty.multiplier
            )}
          </strong>
        </div>

        <div className="modal-stat">
          <span>ДОСВІД</span>

          <strong>
            ✨{" "}
            {Math.round(
              selectedStage.xp *
                currentDifficulty.multiplier
            )}
          </strong>
        </div>
      </div>

      <div className="modal-actions">
        <button
          className="modal-button"
          onClick={() => {
            setMessage(
              `⚔️ Бій "${selectedStage.name}" запущено!`
            );

            setSelectedStage(null);
          }}
        >
          ⚔️ У БІЙ
        </button>

        <button
          className="modal-button secondary"
          onClick={() =>
            setSelectedStage(null)
          }
        >
          Назад
        </button>
      </div>
    </div>
  </div>
)}
</div>
);
}
