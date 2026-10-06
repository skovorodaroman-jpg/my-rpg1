import { useMemo, useState } from "react";

const initialPets = [
  {
    id: 1,
    name: "Вогник",
    species: "Дракончик",
    rarity: "Епічний",
    icon: "🐉",
    level: 5,
    power: 180,
    bonus: "+12% атаки",
    bonusType: "attack",
    unlocked: true,
  },
  {
    id: 2,
    name: "Місяць",
    species: "Місячний вовк",
    rarity: "Легендарний",
    icon: "🐺",
    level: 3,
    power: 220,
    bonus: "+15% швидкості",
    bonusType: "speed",
    unlocked: true,
  },
  {
    id: 3,
    name: "Крапля",
    species: "Водяний дух",
    rarity: "Рідкісний",
    icon: "🦦",
    level: 4,
    power: 120,
    bonus: "+10% здоров'я",
    bonusType: "hp",
    unlocked: true,
  },
  {
    id: 4,
    name: "Тінь",
    species: "Темний фамільяр",
    rarity: "Міфічний",
    icon: "🦇",
    level: 1,
    power: 300,
    bonus: "+20% критичного удару",
    bonusType: "crit",
    unlocked: false,
  },
  {
    id: 5,
    name: "Камінчик",
    species: "Гірський голем",
    rarity: "Рідкісний",
    icon: "🪨",
    level: 1,
    power: 100,
    bonus: "+8% захисту",
    bonusType: "defense",
    unlocked: false,
  },
  {
    id: 6,
    name: "Іскра",
    species: "Вогняний дух",
    rarity: "Епічний",
    icon: "🦊",
    level: 1,
    power: 170,
    bonus: "+10% атаки",
    bonusType: "attack",
    unlocked: false,
  },
];

const rarityClass = {
  "Рідкісний": "rarity-rare",
  "Епічний": "rarity-epic",
  "Легендарний": "rarity-legendary",
  "Міфічний": "rarity-mythic",
};

const bonusIcons = {
  attack: "⚔️",
  defense: "🛡️",
  hp: "❤️",
  speed: "💨",
  crit: "🎯",
};

export default function Pets() {
  const [pets] = useState(initialPets);
  const [selectedPet, setSelectedPet] = useState(pets[0]);
  const [filter, setFilter] = useState("all");

  const unlockedPets = pets.filter((pet) => pet.unlocked);

  const filteredPets = useMemo(() => {
    if (filter === "unlocked") {
      return pets.filter((pet) => pet.unlocked);
    }

    if (filter === "locked") {
      return pets.filter((pet) => !pet.unlocked);
    }

    return pets;
  }, [pets, filter]);

  return (
    <div className="pets-page">
      <header className="page-header">
        <div>
          <span className="page-header__eyebrow">
            Твої супутники
          </span>

          <h1>🐾 Пети</h1>

          <p>
            Пети допомагають героям у боях та дають постійні бонуси.
          </p>
        </div>

        <div className="pets-counter">
          <strong>{unlockedPets.length}</strong>
          <span>/ {pets.length}</span>
        </div>
      </header>

      <section className="active-pet-card">
        <div className="active-pet-card__visual">
          <div className="pet-element">
            ✨
          </div>

          <div className="pet-placeholder">
            {selectedPet.icon}
          </div>

          <span
            className={`pet-rarity ${
              rarityClass[selectedPet.rarity]
            }`}
          >
            {selectedPet.rarity}
          </span>
        </div>

        <div className="active-pet-card__info">
          <span>{selectedPet.species}</span>

          <h2>{selectedPet.name}</h2>

          <div className="pet-level">
            Рівень {selectedPet.level}
          </div>

          <div className="pet-power">
            <span>💪 Сила</span>
            <strong>
              {selectedPet.power.toLocaleString()}
            </strong>
          </div>

          <div className="pet-bonus">
            <span>
              {bonusIcons[selectedPet.bonusType]}
            </span>

            <div>
              <small>Активний бонус</small>
              <strong>{selectedPet.bonus}</strong>
            </div>
          </div>

          <div className="pet-actions">
            <button type="button">
              ⬆️ Покращити
            </button>

            <button type="button">
              ⚔️ Призначити герою
            </button>
          </div>
        </div>
      </section>

      <section className="pet-filters">
        <button
          type="button"
          className={
            filter === "all"
              ? "filter-button filter-button--active"
              : "filter-button"
          }
          onClick={() => setFilter("all")}
        >
          🐾 Усі
        </button>

        <button
          type="button"
          className={
            filter === "unlocked"
              ? "filter-button filter-button--active"
              : "filter-button"
          }
          onClick={() => setFilter("unlocked")}
        >
          🔓 Відкриті
        </button>

        <button
          type="button"
          className={
            filter === "locked"
              ? "filter-button filter-button--active"
              : "filter-button"
          }
          onClick={() => setFilter("locked")}
        >
          🔒 Заблоковані
        </button>
      </section>

      <section className="pets-list">
        <div className="section-heading">
          <div>
            <h2>Мої пети</h2>
            <span>
              {unlockedPets.length} відкрито
            </span>
          </div>
        </div>

        <div className="pets-grid">
          {filteredPets.map((pet) => (
            <button
              type="button"
              key={pet.id}
              className={`pet-card ${
                selectedPet.id === pet.id
                  ? "pet-card--selected"
                  : ""
              } ${
                !pet.unlocked
                  ? "pet-card--locked"
                  : ""
              }`}
              onClick={() => {
                if (pet.unlocked) {
                  setSelectedPet(pet);
                }
              }}
            >
              <div className="pet-card__visual">
                {pet.unlocked ? pet.icon : "🔒"}
              </div>

              <div className="pet-card__info">
                <strong>{pet.name}</strong>

                <span>{pet.species}</span>

                <small
                  className={rarityClass[pet.rarity]}
                >
                  {pet.rarity}
                </small>
              </div>

              {pet.unlocked && (
                <div className="pet-card__bottom">
                  <span>Lv. {pet.level}</span>
                  <strong>💪 {pet.power}</strong>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="pet-slots-section">
        <div className="section-heading">
          <div>
            <h2>🦸 Супутники героїв</h2>
            <span>3 місця</span>
          </div>
        </div>

        <div className="pet-slots">
          <PetSlot pet={pets[0]} hero="Аріан" />
          <PetSlot pet={pets[1]} hero="Луна" />
          <PetSlot pet={null} hero="Рей" />
        </div>
      </section>

      <section className="pet-upgrade-info">
        <span>✨</span>

        <div>
          <strong>Покращуй своїх супутників</strong>

          <p>
            Підвищуй рівень петів, відкривай нові бонуси та
            збільшуй силу всієї команди.
          </p>
        </div>
      </section>
    </div>
  );
}

function PetSlot({ pet, hero }) {
  return (
    <div className="pet-slot">
      <div className="pet-slot__hero">
        🦸
      </div>

      <span className="pet-slot__arrow">
        ←
      </span>

      <div className="pet-slot__pet">
        {pet ? pet.icon : "+"}
      </div>

      <div className="pet-slot__info">
        <strong>{hero}</strong>

        {pet ? (
          <>
            <span>{pet.name}</span>
            <small>+ {pet.bonus}</small>
          </>
        ) : (
          <span>Обрати пета</span>
        )}
      </div>
    </div>
  );
}
