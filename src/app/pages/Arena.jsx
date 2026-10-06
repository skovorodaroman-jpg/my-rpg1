import { useState } from "react";

const enemies = [
  {
    id: 1,
    name: "Тіньовий Воїн",
    player: "DarkLord",
    level: 8,
    power: 1240,
    avatar: "🥷",
    rank: "Бронза II",
    reward: 120,
  },
  {
    id: 2,
    name: "Лицар Світла",
    player: "LightKing",
    level: 11,
    power: 1680,
    avatar: "🛡️",
    rank: "Срібло III",
    reward: 180,
  },
  {
    id: 3,
    name: "Вогняна Відьма",
    player: "FireQueen",
    level: 14,
    power: 2150,
    avatar: "🧙‍♀️",
    rank: "Срібло I",
    reward: 250,
  },
];

const ranking = [
  { place: 1, name: "DarkLord", power: 5420, avatar: "👑" },
  { place: 2, name: "LightKing", power: 5180, avatar: "⚔️" },
  { place: 3, name: "FireQueen", power: 4960, avatar: "🔥" },
  { place: 4, name: "ShadowFox", power: 4720, avatar: "🦊" },
  { place: 5, name: "Roma", power: 4210, avatar: "🧙" },
];

export default function Arena() {
  const [selectedEnemy, setSelectedEnemy] = useState(enemies[0]);
  const [energy, setEnergy] = useState(10);
  const [message, setMessage] = useState("");

  const startBattle = () => {
    if (energy <= 0) {
      setMessage("⚡ Недостатньо енергії");
      return;
    }

    setEnergy((value) => value - 1);
    setMessage(`⚔️ Виклик прийнято! Бій проти ${selectedEnemy.name}`);
  };

  return (
    <div className="page arena-page">
      <header className="page-header">
        <div>
          <h1>🏟️ Арена</h1>
          <p>Змагайся з іншими героями Eldara</p>
        </div>

        <div className="arena-energy">
          ⚡ {energy}/10
        </div>
      </header>

      {/* Player rank */}
      <section className="arena-rank-card">
        <div className="rank-avatar">🧙</div>

        <div className="rank-info">
          <span>Твій рейтинг</span>
          <strong>4210 🏆</strong>
          <small>Срібло II</small>
        </div>

        <div className="rank-place">
          <span>Місце</span>
          <strong>#5</strong>
        </div>
      </section>

      {/* Selected opponent */}
      <section className="arena-section">
        <div className="section-title">
          <h2>⚔️ Суперник</h2>
          <span>Обери противника</span>
        </div>

        <div className="opponent-main">
          <div className="opponent-avatar">
            {selectedEnemy.avatar}
          </div>

          <div className="opponent-info">
            <h3>{selectedEnemy.name}</h3>
            <p>👤 {selectedEnemy.player}</p>
            <p>
              Рівень {selectedEnemy.level} · ⚔️ {selectedEnemy.power}
            </p>
            <span className="opponent-rank">
              🏆 {selectedEnemy.rank}
            </span>
          </div>

          <div className="arena-reward">
            <span>Нагорода</span>
            <strong>+{selectedEnemy.reward}</strong>
            <small>🏆 рейтинг</small>
          </div>
        </div>

        <button
          className="arena-battle-button"
          onClick={startBattle}
          disabled={energy <= 0}
        >
          ⚔️ ПОЧАТИ БІЙ
        </button>

        {message && (
          <div className="arena-message">
            {message}
          </div>
        )}
      </section>

      {/* Opponents */}
      <section className="arena-section">
        <div className="section-title">
          <h2>🎯 Суперники</h2>
          <span>Доступні гравці</span>
        </div>

        <div className="opponents-list">
          {enemies.map((enemy) => (
            <button
              key={enemy.id}
              className={`opponent-card ${
                selectedEnemy.id === enemy.id ? "selected" : ""
              }`}
              onClick={() => {
                setSelectedEnemy(enemy);
                setMessage("");
              }}
            >
              <div className="opponent-card-avatar">
                {enemy.avatar}
              </div>

              <div className="opponent-card-info">
                <strong>{enemy.name}</strong>
                <span>👤 {enemy.player}</span>
                <span>
                  Lv.{enemy.level} · ⚔️ {enemy.power}
                </span>
              </div>

              <div className="opponent-card-reward">
                +{enemy.reward} 🏆
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Ranking */}
      <section className="arena-section">
        <div className="section-title">
          <h2>🏆 Рейтинг арени</h2>
          <span>Топ гравців</span>
        </div>

        <div className="ranking-list">
          {ranking.map((player) => (
            <div
              key={player.place}
              className={`ranking-row ${
                player.name === "Roma" ? "current-player" : ""
              }`}
            >
              <div className="ranking-place">
                {player.place === 1
                  ? "🥇"
                  : player.place === 2
                  ? "🥈"
                  : player.place === 3
                  ? "🥉"
                  : `#${player.place}`}
              </div>

              <div className="ranking-avatar">
                {player.avatar}
              </div>

              <div className="ranking-name">
                <strong>{player.name}</strong>
                {player.name === "Roma" && (
                  <span>Це ти</span>
                )}
              </div>

              <div className="ranking-power">
                ⚔️ {player.power}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Arena rules */}
      <section className="arena-rules">
        <h3>📜 Правила арени</h3>

        <div className="rule">
          <span>⚡</span>
          <p>Один бій витрачає 1 одиницю енергії.</p>
        </div>

        <div className="rule">
          <span>🏆</span>
          <p>Перемога підвищує твій рейтинг.</p>
        </div>

        <div className="rule">
          <span>💀</span>
          <p>Поразка знижує рейтинг.</p>
        </div>

        <div className="rule">
          <span>🎁</span>
          <p>За перемоги можна отримувати нагороди.</p>
        </div>
      </section>

      <style>{`
        .arena-page {
          padding-bottom: 90px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .page-header h1 {
          margin: 0 0 5px;
        }

        .page-header p {
          margin: 0;
          opacity: .65;
        }

        .arena-energy {
          padding: 10px 14px;
          border-radius: 14px;
          background: rgba(255,255,255,.08);
          font-weight: 700;
          white-space: nowrap;
        }

        .arena-rank-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 18px;
          margin-bottom: 22px;
          border-radius: 22px;
          background: linear-gradient(
            135deg,
            rgba(100,70,180,.35),
            rgba(30,30,60,.8)
          );
          border: 1px solid rgba(255,255,255,.1);
        }

        .rank-avatar {
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          font-size: 34px;
          border-radius: 18px;
          background: rgba(255,255,255,.1);
        }

        .rank-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .rank-info span,
        .rank-info small,
        .rank-place span {
          opacity: .65;
          font-size: 13px;
        }

        .rank-info strong {
          font-size: 22px;
        }

        .rank-place {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .rank-place strong {
          font-size: 22px;
        }

        .arena-section {
          margin-bottom: 24px;
        }

        .section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .section-title h2 {
          margin: 0;
          font-size: 18px;
        }

        .section-title span {
          font-size: 12px;
          opacity: .55;
        }

        .opponent-main {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 18px;
          border-radius: 22px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
        }

        .opponent-avatar {
          width: 72px;
          height: 72px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 20px;
          background: rgba(255,255,255,.08);
          font-size: 38px;
        }

        .opponent-info {
          flex: 1;
          min-width: 0;
        }

        .opponent-info h3 {
          margin: 0 0 5px;
        }

        .opponent-info p {
          margin: 3px 0;
          font-size: 13px;
          opacity: .65;
        }

        .opponent-rank {
          display: inline-block;
          margin-top: 7px;
          padding: 4px 8px;
          border-radius: 8px;
          background: rgba(255,255,255,.08);
          font-size: 11px;
        }

        .arena-reward {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .arena-reward span,
        .arena-reward small {
          font-size: 11px;
          opacity: .55;
        }

        .arena-reward strong {
          font-size: 18px;
        }

        .arena-battle-button {
          width: 100%;
          margin-top: 12px;
          padding: 15px;
          border: 0;
          border-radius: 16px;
          background: linear-gradient(135deg, #8f3cff, #ff3c9e);
          color: white;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }

        .arena-battle-button:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .arena-message {
          margin-top: 10px;
          padding: 12px;
          border-radius: 12px;
          background: rgba(255,255,255,.06);
          text-align: center;
          font-size: 13px;
        }

        .opponents-list,
        .ranking-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .opponent-card {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 17px;
          background: rgba(255,255,255,.04);
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .opponent-card.selected {
          border-color: rgba(170,90,255,.7);
          background: rgba(120,60,220,.12);
        }

        .opponent-card-avatar {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: rgba(255,255,255,.07);
          font-size: 25px;
        }

        .opponent-card-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .opponent-card-info strong {
          font-size: 14px;
        }

        .opponent-card-info span {
          font-size: 11px;
          opacity: .6;
        }

        .opponent-card-reward {
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .ranking-row {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 12px;
          border-radius: 15px;
          background: rgba(255,255,255,.04);
        }

        .ranking-row.current-player {
          background: rgba(120,60,220,.15);
          border: 1px solid rgba(150,90,255,.3);
        }

        .ranking-place {
          width: 30px;
          text-align: center;
          font-weight: 700;
        }

        .ranking-avatar {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: rgba(255,255,255,.07);
          font-size: 21px;
        }

        .ranking-name {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ranking-name strong {
          font-size: 14px;
        }

        .ranking-name span {
          font-size: 10px;
          opacity: .55;
        }

        .ranking-power {
          font-size: 12px;
          font-weight: 700;
        }

        .arena-rules {
          padding: 17px;
          border-radius: 20px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
        }

        .arena-rules h3 {
          margin: 0 0 13px;
        }

        .rule {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 10px 0;
        }

        .rule span {
          width: 30px;
          text-align: center;
        }

        .rule p {
          margin: 0;
          font-size: 12px;
          opacity: .7;
        }

        @media (max-width: 600px) {
          .page-header {
            align-items: flex-start;
          }

          .page-header h1 {
            font-size: 22px;
          }

          .opponent-main {
            flex-wrap: wrap;
          }

          .opponent-info {
            min-width: calc(100% - 90px);
          }

          .arena-reward {
            width: 100%;
            flex-direction: row;
            align-items: center;
            justify-content: flex-end;
            gap: 7px;
          }
        }
      `}</style>
    </div>
  );
    }
