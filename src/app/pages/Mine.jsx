import { useEffect, useState } from "react";

const mineLevels = [
  {
    id: 1,
    name: "Стара шахта",
    icon: "⛏️",
    level: 1,
    reward: "Золото",
    amount: "50–120",
    time: 10,
    requiredLevel: 1,
  },
  {
    id: 2,
    name: "Кристальна печера",
    icon: "💎",
    level: 2,
    reward: "Кристали",
    amount: "5–15",
    time: 20,
    requiredLevel: 5,
  },
  {
    id: 3,
    name: "Рунні глибини",
    icon: "🔮",
    level: 3,
    reward: "Рунний матеріал",
    amount: "1–5",
    time: 30,
    requiredLevel: 10,
  },
];

const materials = [
  { name: "Залізна руда", icon: "🪨", amount: 42 },
  { name: "Кристал", icon: "💎", amount: 17 },
  { name: "Рунний камінь", icon: "🔮", amount: 8 },
];

export default function Mine() {
  const [selectedMine, setSelectedMine] = useState(mineLevels[0]);
  const [mining, setMining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!mining) return;

    const duration = selectedMine.time * 1000;
    const interval = 100;

    const timer = setInterval(() => {
      setProgress((value) => {
        const next = value + (interval / duration) * 100;

        if (next >= 100) {
          clearInterval(timer);
          setMining(false);
          setProgress(100);
          setMessage(
            `🎉 Видобуток завершено! Ти отримав ${selectedMine.reward}.`
          );
          return 100;
        }

        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [mining, selectedMine]);

  const startMining = () => {
    if (mining) return;

    setProgress(0);
    setMessage("");
    setMining(true);
  };

  const resetMining = () => {
    setMining(false);
    setProgress(0);
    setMessage("");
  };

  return (
    <div className="page mine-page">
      <header className="page-header">
        <div>
          <h1>⛏️ Шахта</h1>
          <p>Добувай ресурси для розвитку героя</p>
        </div>

        <div className="mine-energy">⚡ 8/10</div>
      </header>

      {/* Main mine */}
      <section className="main-mine-card">
        <div className="mine-illustration">
          {selectedMine.icon}
        </div>

        <div className="main-mine-info">
          <span>Поточна шахта</span>
          <h2>{selectedMine.name}</h2>
          <p>
            Нагорода: <strong>{selectedMine.reward}</strong>
          </p>
          <p>
            Кількість: <strong>{selectedMine.amount}</strong>
          </p>
        </div>
      </section>

      {/* Progress */}
      {mining && (
        <section className="mining-progress-card">
          <div className="progress-header">
            <span>⛏️ Видобування...</span>
            <strong>{Math.floor(progress)}%</strong>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p>
            Не закривай гру — твій герой працює в шахті.
          </p>
        </section>
      )}

      {message && (
        <div className="mine-message">
          {message}
        </div>
      )}

      {/* Start button */}
      <button
        className="start-mining-button"
        onClick={mining ? resetMining : startMining}
      >
        {mining ? "⏹️ ЗУПИНИТИ" : "⛏️ ПОЧАТИ ВИДОБУТОК"}
      </button>

      {/* Mine selection */}
      <section className="mine-section">
        <div className="section-title">
          <h2>🗺️ Шахти</h2>
          <span>Обери місце</span>
        </div>

        <div className="mine-list">
          {mineLevels.map((mine) => {
            const locked = mine.requiredLevel > 1;

            return (
              <button
                key={mine.id}
                className={`mine-card ${
                  selectedMine.id === mine.id ? "selected" : ""
                } ${locked ? "locked" : ""}`}
                onClick={() => {
                  if (!locked && !mining) {
                    setSelectedMine(mine);
                    setMessage("");
                    setProgress(0);
                  }
                }}
                disabled={locked || mining}
              >
                <div className="mine-icon">
                  {locked ? "🔒" : mine.icon}
                </div>

                <div className="mine-info">
                  <strong>{mine.name}</strong>
                  <span>Рівень шахти {mine.level}</span>
                  <span>
                    🎁 {mine.reward}: {mine.amount}
                  </span>
                </div>

                <div className="mine-time">
                  ⏱️ {mine.time}с
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Materials */}
      <section className="mine-section">
        <div className="section-title">
          <h2>🎒 Видобуті матеріали</h2>
          <span>Твої ресурси</span>
        </div>

        <div className="materials-grid">
          {materials.map((material) => (
            <div className="material-card" key={material.name}>
              <div className="material-icon">
                {material.icon}
              </div>

              <div>
                <strong>{material.name}</strong>
                <span>x{material.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upgrade */}
      <section className="mine-upgrade">
        <div className="upgrade-icon">🏗️</div>

        <div className="upgrade-info">
          <span>Покращення</span>
          <h3>Розширити шахту</h3>
          <p>
            Збільшить кількість ресурсів та відкриє нові рівні.
          </p>
        </div>

        <button>💰 1 000</button>
      </section>

      <style>{`
        .mine-page {
          padding-bottom: 90px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .page-header h1 {
          margin: 0 0 5px;
        }

        .page-header p {
          margin: 0;
          opacity: .6;
          font-size: 13px;
        }

        .mine-energy {
          padding: 10px 14px;
          border-radius: 14px;
          background: rgba(255,255,255,.07);
          font-weight: 700;
        }

        .main-mine-card {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 22px;
          border-radius: 24px;
          background:
            linear-gradient(
              135deg,
              rgba(80,55,35,.8),
              rgba(35,25,25,.9)
            );
          border: 1px solid rgba(255,255,255,.1);
          margin-bottom: 14px;
        }

        .mine-illustration {
          width: 82px;
          height: 82px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 22px;
          background: rgba(255,255,255,.08);
          font-size: 44px;
        }

        .main-mine-info {
          flex: 1;
        }

        .main-mine-info span {
          font-size: 12px;
          opacity: .55;
        }

        .main-mine-info h2 {
          margin: 4px 0 8px;
          font-size: 21px;
        }

        .main-mine-info p {
          margin: 3px 0;
          font-size: 12px;
          opacity: .65;
        }

        .mining-progress-card {
          padding: 16px;
          margin-bottom: 12px;
          border-radius: 18px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 13px;
        }

        .progress-bar {
          height: 10px;
          overflow: hidden;
          border-radius: 10px;
          background: rgba(255,255,255,.08);
        }

        .progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #d89a45, #f3c76b);
          transition: width .1s linear;
        }

        .mining-progress-card p {
          margin: 10px 0 0;
          font-size: 11px;
          opacity: .5;
        }

        .mine-message {
          margin-bottom: 12px;
          padding: 12px;
          border-radius: 14px;
          background: rgba(70,180,100,.12);
          text-align: center;
          font-size: 13px;
        }

        .start-mining-button {
          width: 100%;
          padding: 15px;
          margin-bottom: 25px;
          border: 0;
          border-radius: 17px;
          background: linear-gradient(135deg, #a86525, #e2a94e);
          color: white;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .mine-section {
          margin-bottom: 24px;
        }

        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .section-title h2 {
          margin: 0;
          font-size: 18px;
        }

        .section-title span {
          font-size: 11px;
          opacity: .5;
        }

        .mine-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .mine-card {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          border-radius: 17px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.04);
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .mine-card.selected {
          border-color: rgba(220,160,70,.7);
          background: rgba(180,120,50,.12);
        }

        .mine-card.locked {
          opacity: .45;
          cursor: not-allowed;
        }

        .mine-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 14px;
          background: rgba(255,255,255,.07);
          font-size: 25px;
        }

        .mine-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .mine-info strong {
          font-size: 14px;
        }

        .mine-info span {
          font-size: 10px;
          opacity: .55;
        }

        .mine-time {
          font-size: 11px;
          opacity: .65;
          white-space: nowrap;
        }

        .materials-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .material-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.07);
        }

        .material-icon {
          font-size: 27px;
        }

        .material-card div:last-child {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .material-card strong {
          font-size: 11px;
        }

        .material-card span {
          font-size: 12px;
          font-weight: 700;
          opacity: .7;
        }

        .mine-upgrade {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 19px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.08);
        }

        .upgrade-icon {
          font-size: 30px;
        }

        .upgrade-info {
          flex: 1;
        }

        .upgrade-info span {
          font-size: 10px;
          opacity: .5;
        }

        .upgrade-info h3 {
          margin: 3px 0;
          font-size: 14px;
        }

        .upgrade-info p {
          margin: 0;
          font-size: 10px;
          opacity: .55;
        }

        .mine-upgrade button {
          padding: 9px 12px;
          border: 0;
          border-radius: 11px;
          background: rgba(255,255,255,.1);
          color: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 500px) {
          .main-mine-card {
            padding: 16px;
          }

          .mine-illustration {
            width: 65px;
            height: 65px;
            font-size: 34px;
          }

          .main-mine-info h2 {
            font-size: 18px;
          }

          .materials-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
