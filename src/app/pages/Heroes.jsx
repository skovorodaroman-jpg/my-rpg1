import { useState } from "react";

const heroes = [
  {
    id: 1,
    name: "Аріан",
    className: "Воїн",
    rarity: "Епічний",
    level: 1,
    power: 100,
    attack: 40,
    defense: 35,
    hp: 500,
    speed: 20,
    crit: 10,
    element: "🔥",
    unlocked: true,
  },
  {
    id: 2,
    name: "Луна",
    className: "Маг",
    rarity: "Рідкісний",
    level: 1,
    power: 90,
    attack: 50,
    defense: 20,
    hp: 350,
    speed: 25,
    crit: 15,
    element: "💧",
    unlocked: true,
  },
  {
    id: 3,
    name: "Рей",
    className: "Мисливець",
    rarity: "Легендарний",
    level: 1,
    power: 120,
    attack: 60,
    defense: 25,
    hp: 400,
    speed: 30,
    crit: 20,
    element: "🌿",
    unlocked: true,
  },
  {
    id: 4,
    name: "Нокт",
    className: "Асасин",
    rarity: "Міфічний",
    level: 1,
    power: 150,
    attack: 75,
    defense: 20,
    hp: 320,
    speed: 40,
    crit: 30,
    element: "🌑",
    unlocked: false,
  },
];

const rarityClass = {
  "Рідкісний": "rarity-rare",
  "Епічний": "rarity-epic",
  "Легендарний": "rarity-legendary",
  "Міфічний": "rarity-mythic",
};

export default function Heroes() {
  const [selectedHero, setSelectedHero] = useState(heroes[0]);

  const unlockedHeroes = heroes.filter((hero) => hero.unlocked);

  return (
    <div className="heroes-page">
      <header className="page-header">
        <div>
          <span className="page-header__eyebrow">
            Твоя команда
          </span>

          <h1>🦸 Герої</h1>

          <p>
            Обирай героїв, прокачуй їх та формуй свою команду.
          </p>
        </div>

        <div className="heroes-counter">
          <strong>{unlockedHeroes.length}</strong>
          <span>/ {heroes.length}</span>
        </div>
      </header>

      <section className="selected-hero-card">
        <div className="selected-hero-card__visual">
          <div className="hero-element">
            {selectedHero.element}
          </div>

          <div className="hero-placeholder">
            🦸
          </div>

          <span
            className={`hero-rarity ${
              rarityClass[selectedHero.rarity]
            }`}
          >
            {selectedHero.rarity}
          </span>
        </div>

        <div className="selected-hero-card__info">
          <span>{selectedHero.className}</span>

          <h2>{selectedHero.name}</h2>

          <div className="hero-level">
            Рівень {selectedHero.level}
          </div>

          <div className="hero-power">
            <span>⚔️ Сила</span>
            <strong>{selectedHero.power.toLocaleString()}</strong>
          </div>

          <div className="hero-xp">
            <div className="hero-xp__top">
              <span>Досвід</span>
              <span>0 / 100</span>
            </div>

            <div className="xp-bar">
              <div className="xp-bar__fill" style={{ width: "0%" }} />
            </div>
          </div>

          <div className="hero-actions">
            <button type="button">
              ⬆️ Прокачати
            </button>

            <button type="button">
              ⚙️ Екіпірування
            </button>
          </div>
        </div>
      </section>

      <section className="hero-stats">
        <div className="section-heading">
          <h2>Характеристики</h2>
        </div>

        <div className="stats-grid">
          <Stat
            icon="❤️"
            label="Здоров'я"
            value={selectedHero.hp}
          />

          <Stat
            icon="⚔️"
            label="Атака"
            value={selectedHero.attack}
          />

          <Stat
            icon="🛡️"
            label="Захист"
            value={selectedHero.defense}
          />

          <Stat
            icon="💨"
            label="Швидкість"
            value={selectedHero.speed}
          />

          <Stat
            icon="🎯"
            label="Крит"
            value={`${selectedHero.crit}%`}
          />

          <Stat
            icon={selectedHero.element}
            label="Стихія"
            value={selectedHero.element}
          />
        </div>
      </section>

      <section className="heroes-list-section">
        <div className="section-heading">
          <div>
            <h2>Мої герої</h2>
            <span>{unlockedHeroes.length} відкрито</span>
          </div>
        </div>

        <div className="heroes-grid">
          {heroes.map((hero) => (
            <button
              type="button"
              key={hero.id}
              className={`hero-card ${
                selectedHero.id === hero.id
                  ? "hero-card--selected"
                  : ""
              } ${
                !hero.unlocked
                  ? "hero-card--locked"
                  : ""
              }`}
              onClick={() => {
                if (hero.unlocked) {
                  setSelectedHero(hero);
                }
              }}
            >
              <div className="hero-card__visual">
                {hero.unlocked ? "🦸" : "🔒"}
              </div>

              <div className="hero-card__info">
                <strong>{hero.name}</strong>

                <span>{hero.className}</span>

                <small
                  className={rarityClass[hero.rarity]}
                >
                  {hero.rarity}
                </small>
              </div>

              {hero.unlocked && (
                <div className="hero-card__power">
                  ⚔️ {hero.power}
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="team-section">
        <div className="section-heading">
          <div>
            <h2>⚔️ Команда</h2>
            <span>3 місця</span>
          </div>
        </div>

        <div className="team-slots">
          <TeamSlot hero={heroes[0]} />
          <TeamSlot hero={heroes[1]} />
          <TeamSlot hero={heroes[2]} />
        </div>

        <button
          type="button"
          className="primary-button"
        >
          ✨ Редагувати команду
        </button>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-card__icon">
        {icon}
      </span>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function TeamSlot({ hero }) {
  return (
    <div className="team-slot">
      <div className="team-slot__avatar">
        {hero ? "🦸" : "+"}
      </div>

      {hero ? (
        <>
          <strong>{hero.name}</strong>
          <small>Lv. {hero.level}</small>
        </>
      ) : (
        <span>Додати героя</span>
      )}
    </div>
  );
              }
