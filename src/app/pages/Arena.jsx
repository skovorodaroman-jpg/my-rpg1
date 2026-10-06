import React, { useMemo, useState } from "react";
import {
  Shield,
  Trophy,
  Sword,
  User,
  Users,
  Home,
  Settings,
  Coins,
  Circle,
  RefreshCw,
  ChevronRight,
  Crown,
} from "lucide-react";
import "./Arena.css";

const opponents = [
  {
    id: 1,
    name: "Темний Вершник",
    level: 28,
    power: 46973,
    league: "Ліга Тіней",
    image:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=900&auto=format&fit=crop",
    heroes: [
      { name: "Аріан", level: 30 },
      { name: "Луна", level: 29 },
      { name: "Рей", level: 28 },
    ],
  },
  {
    id: 2,
    name: "Вартовий Пітьми",
    level: 31,
    power: 52340,
    league: "Ліга Тіней",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop",
    heroes: [
      { name: "Луна", level: 31 },
      { name: "Аріан", level: 30 },
      { name: "Рей", level: 30 },
    ],
  },
  {
    id: 3,
    name: "Світлоносний",
    level: 27,
    power: 43820,
    league: "Ліга Світла",
    image:
      "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=900&auto=format&fit=crop",
    heroes: [
      { name: "Рей", level: 29 },
      { name: "Луна", level: 28 },
      { name: "Аріан", level: 27 },
    ],
  },
];

export default function Arena({
  username = "Рома",
  playerPower = 64192,
  playerLevel = 30,
  rating = 1250,
  gold = 8338,
  silver = 2100000,
  arenaTickets = 5,
  onAttack,
  onHome,
  onHeroes,
  onClan,
  onSettings,
}) {
  const [opponentIndex, setOpponentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const opponent = useMemo(
    () => opponents[opponentIndex],
    [opponentIndex]
  );

  const changeOpponent = () => {
    setLoading(true);

    setTimeout(() => {
      setOpponentIndex((current) => (current + 1) % opponents.length);
      setLoading(false);
    }, 250);
  };

  const attack = () => {
    if (onAttack) {
      onAttack({
        mode: "arena",
        opponent,
      });
    }
  };

  return (
    <div className="arena-page">
      <main className="arena-container">

        {/* HEADER */}
        <header className="arena-header">
          <div className="arena-title">
            Арена
          </div>

          <div className="arena-header-resources">
            <span>
              <Trophy size={13} />
              {rating.toLocaleString("uk-UA")}
            </span>

            <span>
              <Sword size={13} />
              {arenaTickets}
            </span>
          </div>
        </header>

        {/* LEAGUE */}
        <section className="arena-league">
          <div className="league-left">
            <Shield size={15} />
            <span>Ліга Світла</span>
          </div>

          <div className="league-right">
            <Trophy size={14} />
            <span>970 місце</span>
          </div>
        </section>

        {/* DESCRIPTION */}
        <div className="arena-subtitle">
          Перемагай суперників та отримуй нагороди!
        </div>

        {/* OPPONENT */}
        <section className="opponent-section">

          <div className="opponent-header">
            <div className="opponent-name">
              <span className="enemy-dot">●</span>
              {opponent.name}
            </div>

            <div className="opponent-power">
              Міць: <Sword size={13} />
              {opponent.power.toLocaleString("uk-UA")}
            </div>
          </div>

          {/* IMAGE */}
          <div className="opponent-image-wrapper">
            <img
              src={opponent.image}
              alt={opponent.name}
              className="opponent-image"
            />

            <div className="image-overlay">
              <div className="opponent-level">
                Рівень {opponent.level}
              </div>
            </div>
          </div>

          {/* THREE HEROES */}
          <div className="arena-team">
            {opponent.heroes.map((hero, index) => (
              <div className="arena-hero" key={`${hero.name}-${index}`}>
                <div className="hero-avatar">
                  <User size={19} />
                </div>

                <div className="hero-name">
                  {hero.name}
                </div>

                <div className="hero-level">
                  Ур. {hero.level}
                </div>
              </div>
            ))}
          </div>

          {/* ATTACK */}
          <div className="attack-wrapper">
            <button
              className="attack-button"
              onClick={attack}
            >
              <Sword size={15} />
              Атакувати
            </button>
          </div>

          {/* CHANGE OPPONENT */}
          <button
            className="change-opponent"
            onClick={changeOpponent}
            disabled={loading}
          >
            <RefreshCw
              size={12}
              className={loading ? "rotate-icon" : ""}
            />

            {loading
              ? "Пошук..."
              : "Змінити суперника"}
          </button>
        </section>

        {/* MY POWER */}
        <section className="my-power">
          <div className="my-power-title">
            Моя міць:
            <Sword size={14} />
            {playerPower.toLocaleString("uk-UA")}
          </div>

          <div className="my-power-hint">
            • Чим сильніший суперник, тим більша
            нагорода за перемогу!
          </div>
        </section>

        {/* NAVIGATION */}
        <nav className="arena-navigation">

          <button onClick={onHeroes}>
            <span>
              <User size={15} />
              Мої герої
            </span>

            <ChevronRight size={14} />
          </button>

          <button onClick={onClan}>
            <span>
              <Users size={15} />
              Мій клан
            </span>

            <span className="plus">
              +
            </span>
          </button>

          <button onClick={onHome}>
            <span>
              <Home size={15} />
              На головну
            </span>

            <ChevronRight size={14} />
          </button>

        </nav>

        {/* PROFILE */}
        <section className="arena-profile">

          <div className="profile-top">
            <div className="profile-name">
              <User size={14} />
              {username}
            </div>

            <button
              className="settings-button"
              onClick={onSettings}
            >
              <Settings size={13} />
              Налаштування
            </button>
          </div>

          <div className="profile-resources">

            <span>
              <Circle size={11} fill="currentColor" />
              {playerLevel}
            </span>

            <span>
              <Coins size={12} />
              {gold.toLocaleString("uk-UA")}
            </span>

            <span>
              ⚪
              {formatNumber(silver)}
            </span>

          </div>

        </section>

        {/* PROMOTIONS */}
        <section className="arena-promotions">

          <div className="promo-title">
            АКЦІЇ
          </div>

          <div className="promo-item">
            <span className="promo-icon">◆</span>

            <span>
              <strong>Особлива пропозиція</strong>
              <br />
              Знижка 50% на кільця!
              <span className="promo-time">
                {" "}Залишилось: 12 годин
              </span>
            </span>
          </div>

          <div className="promo-item">
            <span className="promo-icon">◆</span>

            <span>
              <strong>Персональна акція</strong>
              <br />
              До кінця: 2 дні
            </span>
          </div>

        </section>

        {/* FOOTER */}
        <footer className="arena-footer">

          <div className="footer-links">
            <button>Чат</button>
            <span>|</span>
            <button>Рейтинг</button>
            <span>|</span>
            <button>Коментарі</button>
            <span>|</span>
            <button>Інше</button>
          </div>

          <div className="online">
            Онлайн: 2 054
          </div>

          <div className="copyright">
            © 2026 «Хроніки Згаслого Світанку»
          </div>

        </footer>

      </main>
    </div>
  );
}

function formatNumber(number) {
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${Math.floor(number / 1000)}k`;
  }

  return number.toLocaleString("uk-UA");
    }
