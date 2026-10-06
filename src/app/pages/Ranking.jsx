import { useMemo, useState } from "react";

const players = [
  {
    id: 1,
    name: "DarkLord",
    avatar: "🦇",
    level: 42,
    power: 18450,
    rating: 3280,
    clan: "Тінь Ночі",
    rank: 1,
    online: true,
  },
  {
    id: 2,
    name: "LightKing",
    avatar: "⚔️",
    level: 40,
    power: 17680,
    rating: 3150,
    clan: "Вартові Світанку",
    rank: 2,
    online: true,
  },
  {
    id: 3,
    name: "FireQueen",
    avatar: "🔥",
    level: 38,
    power: 16920,
    rating: 3010,
    clan: "Полум'я Eldara",
    rank: 3,
    online: false,
  },
  {
    id: 4,
    name: "ShadowFox",
    avatar: "🦊",
    level: 36,
    power: 15480,
    rating: 2860,
    clan: "Тінь Ночі",
    rank: 4,
    online: true,
  },
  {
    id: 5,
    name: "Roma",
    avatar: "🧙",
    level: 34,
    power: 14820,
    rating: 2740,
    clan: "Дракони Світанку",
    rank: 5,
    online: true,
    isPlayer: true,
  },
  {
    id: 6,
    name: "NightWolf",
    avatar: "🐺",
    level: 33,
    power: 14120,
    rating: 2680,
    clan: "Чорний Місяць",
    rank: 6,
    online: false,
  },
  {
    id: 7,
    name: "Arcania",
    avatar: "🔮",
    level: 32,
    power: 13750,
    rating: 2590,
    clan: "Маги Eldara",
    rank: 7,
    online: true,
  },
  {
    id: 8,
    name: "Storm",
    avatar: "⚡",
    level: 31,
    power: 12980,
    rating: 2470,
    clan: "Грім",
    rank: 8,
    online: false,
  },
];

const friends = [
  {
    id: 101,
    name: "DarkLord",
    avatar: "🦇",
    level: 42,
    power: 18450,
    rating: 3280,
    rank: 1,
    online: true,
  },
  {
    id: 102,
    name: "LightKing",
    avatar: "⚔️",
    level: 40,
    power: 17680,
    rating: 3150,
    rank: 2,
    online: true,
  },
  {
    id: 103,
    name: "Roma",
    avatar: "🧙",
    level: 34,
    power: 14820,
    rating: 2740,
    rank: 3,
    online: true,
    isPlayer: true,
  },
];

const clanPlayers = [
  {
    id: 201,
    name: "Roma",
    avatar: "🧙",
    level: 34,
    power: 14820,
    rating: 2740,
    rank: 1,
    online: true,
    isPlayer: true,
  },
  {
    id: 202,
    name: "DragonMaster",
    avatar: "🐉",
    level: 32,
    power: 13240,
    rating: 2510,
    rank: 2,
    online: true,
  },
  {
    id: 203,
    name: "LunaStar",
    avatar: "🌙",
    level: 30,
    power: 11880,
    rating: 2380,
    rank: 3,
    online: false,
  },
  {
    id: 204,
    name: "IronWolf",
    avatar: "🐺",
    level: 29,
    power: 10920,
    rating: 2240,
    rank: 4,
    online: true,
  },
];

const seasons = [
  {
    name: "Сезон Вогняного Світанку",
    remaining: "12 днів",
    reward: "🏆 Епічна скриня",
  },
  {
    name: "Сезон Тіней",
    remaining: "Завершено",
    reward: "💎 500 кристалів",
  },
];

function getRankIcon(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function PlayerRow({ player }) {
  return (
    <div
      className={`ranking-row ${player.isPlayer ? "ranking-row-player" : ""}`}
    >
      <div className="ranking-place">{getRankIcon(player.rank)}</div>

      <div className="ranking-avatar">
        {player.avatar}
        {player.online && <span className="online-dot" />}
      </div>

      <div className="ranking-player-info">
        <div className="ranking-player-name">
          {player.name}
          {player.isPlayer && <span className="you-badge">ТИ</span>}
        </div>

        <div className="ranking-player-meta">
          Рівень {player.level}
          {player.clan && ` • ${player.clan}`}
        </div>
      </div>

      <div className="ranking-power">
        <strong>{player.power.toLocaleString("uk-UA")}</strong>
        <span>⚡ сила</span>
      </div>

      <div className="ranking-rating">
        <strong>{player.rating.toLocaleString("uk-UA")}</strong>
        <span>🏆 рейтинг</span>
      </div>
    </div>
  );
}

export default function Ranking() {
  const [tab, setTab] = useState("global");
  const [period, setPeriod] = useState("season");
  const [selectedSeason, setSelectedSeason] = useState(0);

  const data = useMemo(() => {
    if (tab === "friends") return friends;
    if (tab === "clan") return clanPlayers;
    return players;
  }, [tab]);

  const currentPlayer = players.find((player) => player.isPlayer);

  return (
    <div className="ranking-page">
      <style>{`
        .ranking-page {
          min-height: 100%;
          padding: 20px;
          color: #fff;
          background:
            radial-gradient(circle at 50% -10%, rgba(150, 65, 120, .22), transparent 35%),
            #100d16;
        }

        .ranking-header {
          margin-bottom: 20px;
        }

        .ranking-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          font-size: 28px;
          font-weight: 900;
        }

        .ranking-title-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: linear-gradient(145deg, #ffd86b, #b97921);
          box-shadow: 0 8px 25px rgba(255, 180, 50, .18);
          font-size: 25px;
        }

        .ranking-subtitle {
          margin: 7px 0 0 60px;
          color: #a8a1b2;
          font-size: 13px;
        }

        .ranking-card {
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 20px;
          background: rgba(255,255,255,.035);
          box-shadow: 0 15px 40px rgba(0,0,0,.18);
          overflow: hidden;
        }

        .ranking-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          padding: 6px;
          margin-bottom: 16px;
          border-radius: 16px;
          background: rgba(255,255,255,.045);
        }

        .ranking-tab {
          border: 0;
          padding: 12px 8px;
          border-radius: 12px;
          color: #aaa4b1;
          background: transparent;
          font-weight: 800;
          cursor: pointer;
        }

        .ranking-tab.active {
          color: #fff;
          background: linear-gradient(135deg, #8f315f, #c4487d);
          box-shadow: 0 6px 18px rgba(196,72,125,.2);
        }

        .period-row {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          overflow-x: auto;
        }

        .period-button {
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,.08);
          padding: 9px 14px;
          border-radius: 12px;
          background: rgba(255,255,255,.035);
          color: #aaa4b1;
          cursor: pointer;
        }

        .period-button.active {
          color: #fff;
          border-color: rgba(225,78,132,.45);
          background: rgba(225,78,132,.13);
        }

        .my-rank {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 14px;
          padding: 18px;
          margin-bottom: 18px;
          border-radius: 20px;
          background:
            linear-gradient(135deg, rgba(139,45,91,.32), rgba(67,31,68,.18));
          border: 1px solid rgba(225,78,132,.22);
        }

        .my-rank-number {
          font-size: 27px;
          font-weight: 900;
        }

        .my-rank-label {
          color: #aaa4b1;
          font-size: 12px;
          margin-bottom: 3px;
        }

        .my-rank-name {
          font-size: 18px;
          font-weight: 900;
        }

        .my-rank-stats {
          display: flex;
          gap: 12px;
          color: #d8d2dc;
          font-size: 12px;
        }

        .my-rank-arrow {
          color: #6ee7a0;
          font-weight: 900;
        }

        .ranking-section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 18px;
          font-weight: 900;
        }

        .ranking-section-title span {
          color: #8f8996;
          font-size: 12px;
          font-weight: 600;
        }

        .ranking-row {
          display: grid;
          grid-template-columns: 42px 48px 1fr auto auto;
          gap: 12px;
          align-items: center;
          min-height: 76px;
          padding: 10px 18px;
          border-top: 1px solid rgba(255,255,255,.055);
        }

        .ranking-row-player {
          background: rgba(222,72,130,.08);
        }

        .ranking-place {
          text-align: center;
          font-size: 17px;
          font-weight: 900;
          color: #c6bfcb;
        }

        .ranking-avatar {
          position: relative;
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: linear-gradient(145deg, #35243a, #1c1721);
          border: 1px solid rgba(255,255,255,.08);
          font-size: 23px;
        }

        .online-dot {
          position: absolute;
          right: -2px;
          bottom: -2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #55e88b;
          border: 2px solid #15111b;
        }

        .ranking-player-name {
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 900;
        }

        .ranking-player-meta {
          margin-top: 4px;
          color: #88818f;
          font-size: 11px;
        }

        .you-badge {
          padding: 2px 6px;
          border-radius: 6px;
          color: #fff;
          background: #c4487d;
          font-size: 9px;
        }

        .ranking-power,
        .ranking-rating {
          min-width: 82px;
          text-align: right;
        }

        .ranking-power strong,
        .ranking-rating strong {
          display: block;
          font-size: 13px;
        }

        .ranking-power span,
        .ranking-rating span {
          display: block;
          margin-top: 3px;
          color: #77717e;
          font-size: 9px;
        }

        .season-card {
          margin-top: 18px;
          padding: 18px;
        }

        .season-title {
          font-size: 17px;
          font-weight: 900;
        }

        .season-info {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 12px;
          color: #aaa4b1;
          font-size: 12px;
        }

        .season-select {
          width: 100%;
          margin-top: 12px;
          padding: 11px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          background: #19141f;
          color: #fff;
          outline: none;
        }

        .ranking-footer {
          margin-top: 18px;
          padding: 16px;
          color: #8e8794;
          text-align: center;
          font-size: 11px;
        }

        @media (max-width: 700px) {
          .ranking-page {
            padding: 14px;
          }

          .ranking-row {
            grid-template-columns: 30px 42px 1fr;
            gap: 9px;
          }

          .ranking-power,
          .ranking-rating {
            display: none;
          }

          .my-rank {
            grid-template-columns: auto 1fr auto;
          }

          .my-rank-stats {
            flex-direction: column;
            gap: 2px;
          }
        }
      `}</style>

      <div className="ranking-header">
        <h1 className="ranking-title">
          <span className="ranking-title-icon">🏆</span>
          Рейтинг
        </h1>
        <p className="ranking-subtitle">
          Найсильніші герої Eldara
        </p>
      </div>

      <div className="ranking-tabs">
        <button
          className={`ranking-tab ${tab === "global" ? "active" : ""}`}
          onClick={() => setTab("global")}
        >
          🌍 Глобальний
        </button>

        <button
          className={`ranking-tab ${tab === "friends" ? "active" : ""}`}
          onClick={() => setTab("friends")}
        >
          👥 Друзі
        </button>

        <button
          className={`ranking-tab ${tab === "clan" ? "active" : ""}`}
          onClick={() => setTab("clan")}
        >
          👑 Клан
        </button>
      </div>

      <div className="period-row">
        <button
          className={`period-button ${period === "season" ? "active" : ""}`}
          onClick={() => setPeriod("season")}
        >
          🏆 Сезон
        </button>

        <button
          className={`period-button ${period === "week" ? "active" : ""}`}
          onClick={() => setPeriod("week")}
        >
          📅 Тиждень
        </button>

        <button
          className={`period-button ${period === "power" ? "active" : ""}`}
          onClick={() => setPeriod("power")}
        >
          ⚡ Сила
        </button>
      </div>

      <div className="my-rank">
        <div className="my-rank-number">#5</div>

        <div>
          <div className="my-rank-label">Твоє місце</div>
          <div className="my-rank-name">🧙 Roma</div>
          <div className="my-rank-stats">
            <span>⚡ {currentPlayer.power.toLocaleString("uk-UA")}</span>
            <span>🏆 {currentPlayer.rating}</span>
          </div>
        </div>

        <div className="my-rank-arrow">↑ 3</div>
      </div>

      <div className="ranking-card">
        <div className="ranking-section-title">
          <span>ТОП ГРАВЦІ</span>
          <span>{data.length} учасників</span>
        </div>

        {data.map((player) => (
          <PlayerRow key={player.id} player={player} />
        ))}
      </div>

      <div className="ranking-card season-card">
        <div className="season-title">🔥 Поточний сезон</div>

        <div className="season-info">
          <span>{seasons[selectedSeason].name}</span>
          <strong>{seasons[selectedSeason].remaining}</strong>
        </div>

        <select
          className="season-select"
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(Number(e.target.value))}
        >
          {seasons.map((season, index) => (
            <option key={index} value={index}>
              {season.name}
            </option>
          ))}
        </select>

        <div className="season-info">
          <span>Нагорода за сезон</span>
          <strong>{seasons[selectedSeason].reward}</strong>
        </div>
      </div>

      <div className="ranking-footer">
        Рейтинг оновлюється після завершення боїв та інших активностей.
      </div>
    </div>
  );
}
