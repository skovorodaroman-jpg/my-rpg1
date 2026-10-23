
import React from "react";
import { Trophy, Swords, Shield, ChevronLeft } from "lucide-react";
import "./League.css";

const LEAGUES = [
  { name: "Ліга новачків", min: 1, max: 12 },
  { name: "Ліга досвідчених", min: 13, max: 21 },
  { name: "Ліга претендентів", min: 22, max: 32 },
  { name: "Ліга майстрів", min: 33, max: 40 },
  { name: "Ліга титанів", min: 41, max: 53 },
  { name: "Ліга обраних", min: 54, max: 90 },
];

export function getLeague(level) {
  return LEAGUES.find((l) => level >= l.min && level <= l.max)
    || LEAGUES[0];
}

// Базовий приклад нагороди за поточне місце.
// Реальна нагорода також залежить від ліги та прогресу рівня.
export function getRankReward(rank, expToNextLevel = 0) {
  if (rank >= 51) {
    return {
      silver: Math.max(0, 1001 - rank),
      experience: Math.max(0, (1001 - rank) * 2),
    };
  }

  const places = Math.max(0, 51 - rank);

  return {
    silver: places * 100,
    experience: Math.min(10000, Math.floor(expToNextLevel * places * 0.001)),
  };
}

export default function League({
  hero,
  players = [],
  rank = 1000,
  onBack,
  onAttackPlayer,
  onClaimReward,
  rewardClaimed = false,
}) {
  const league = getLeague(Number(hero?.level || 1));
  const reward = getRankReward(rank, hero?.experience_to_next_level);

  return (
    <main className="league-page">
      <header className="league-header">
        <button onClick={onBack} className="league-back">
          <ChevronLeft /> Арена
        </button>

        <h1><Trophy /> {league.name}</h1>
        <p>Рівні {league.min}–{league.max}</p>
      </header>

      <section className="league-position">
        <small>ТВОЄ МІСЦЕ</small>
        <strong>#{rank}</strong>
        <span>{hero?.display_name || hero?.username || "Мій герой"}</span>
      </section>

      <section className="league-rules">
        <h2>Правила ліги</h2>
        <p>
          <b>Місця 1000–51:</b> при атаці можливе збереження поточного місця.
          На одному місці можуть відображатися різні гравці.
        </p>
        <p>
          <b>Місця 50–1:</b> переможець займає місце супротивника,
          а супротивник переходить на місце атакуючого.
        </p>
      </section>

      <section className="league-daily-reward">
        <h2>Нагорода за поточне місце</h2>
        <div>◉ Срібло: {reward.silver.toLocaleString("uk-UA")}</div>
        <div>✧ Досвід: {reward.experience.toLocaleString("uk-UA")}</div>
        <small>Забрати нагороду можна раз на добу.</small>

        <button
          disabled={rewardClaimed}
          onClick={() => onClaimReward?.(reward)}
        >
          {rewardClaimed ? "Нагороду вже отримано" : "Забрати нагороду"}
        </button>
      </section>

      <section className="league-player-list">
        <h2>Гравці ліги</h2>

        {players.map((player) => (
          <article className="league-player" key={player.id}>
            <div className="league-player-rank">#{player.rank}</div>

            <div className="league-player-avatar">
              <Shield size={22} />
            </div>

            <div className="league-player-info">
              <b>{player.name}</b>
              <small>
                Рівень {player.level} · Мощь{" "}
                {Number(player.power || 0).toLocaleString("uk-UA")}
              </small>
            </div>

            <button
              onClick={() => onAttackPlayer?.(player)}
              disabled={player.id === hero?.id}
              title="Атакувати гравця"
            >
              <Swords size={16} />
            </button>
          </article>
        ))}

        {players.length === 0 && (
          <p className="league-empty">
            Список гравців ще не завантажено з сервера.
          </p>
        )}
      </section>

      <section className="league-monthly">
        <h2>Щомісячний сдвиг рейтингу</h2>
        <p>
          Першого числа місяця місця гравців зсуваються на 100–200 позицій.
          При переході до іншої ліги бонус сгорає.
        </p>
      </section>
    </main>
  );
}
