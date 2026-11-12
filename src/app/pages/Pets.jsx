
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const PET_ICONS = {
  "Дракон": "🐉",
  "Гідра": "🐲",
  "Цербер": "🐺",
  "Фенікс": "🔥",
  "Тигр і Пантера": "🐅",
  "Грифон": "🦅",
};

const STAT_INFO = [
  { key: "attack", label: "Атака", icon: "⚔️" },
  { key: "hp", label: "Здоров'я", icon: "❤️" },
  { key: "defense", label: "Захист", icon: "🛡️" },
  { key: "crit", label: "Критичний шанс", icon: "🎯" },
];

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("uk-UA");

const errorMessage = (error) =>
  error?.message || "Сталася невідома помилка";

export default function Pets() {
  const [pets, setPets] = useState([]);
  const [ownedPets, setOwnedPets] = useState([]);
  const [petLevels, setPetLevels] = useState([]);
  const [bonuses, setBonuses] = useState({
    pets_count: 0,
    total_bonus: 0,
    bonuses: { attack: 0, hp: 0, defense: 0, crit: 0 },
    pets: [],
  });

  const [profile, setProfile] = useState(null);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Увійди в гру, щоб переглянути вихованців.");

      const [
        petsResult,
        ownedResult,
        levelsResult,
        profileResult,
        bonusesResult,
      ] = await Promise.all([
        supabase
          .from("pets")
          .select("*")
          .eq("is_active", true)
          .order("name"),

        supabase
          .from("player_pets")
          .select("*")
          .eq("user_id", user.id),

        supabase
          .from("pet_levels")
          .select("level, bonus, upgrade_amount, currency")
          .order("level"),

        supabase
          .from("profiles")
          .select("id, gold, silver, level")
          .eq("id", user.id)
          .single(),

        supabase.rpc("get_player_pet_bonuses_v1"),
      ]);

      if (petsResult.error) throw petsResult.error;
      if (ownedResult.error) throw ownedResult.error;
      if (levelsResult.error) throw levelsResult.error;
      if (profileResult.error) throw profileResult.error;
      if (bonusesResult.error) throw bonusesResult.error;

      setPets(petsResult.data || []);
      setOwnedPets(ownedResult.data || []);
      setPetLevels(levelsResult.data || []);
      setProfile(profileResult.data);
      setBonuses(
        bonusesResult.data || {
          pets_count: 0,
          total_bonus: 0,
          bonuses: { attack: 0, hp: 0, defense: 0, crit: 0 },
          pets: [],
        }
      );

      const activePet = (ownedResult.data || []).find(
        (pet) => pet.is_active
      );

      const firstOwned = (ownedResult.data || [])[0];

      setSelectedPetId(
        activePet?.pet_id || firstOwned?.pet_id || null
      );
    } catch (error) {
      console.error("Pets loading error:", error);
      setMessage({
        type: "error",
        text: errorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const ownedByPetId = useMemo(
    () =>
      new Map(
        ownedPets.map((pet) => [pet.pet_id, pet])
      ),
    [ownedPets]
  );

  const selectedPet = pets.find(
    (pet) => pet.id === selectedPetId
  );

  const selectedOwnedPet = selectedPet
    ? ownedByPetId.get(selectedPet.id)
    : null;

  const unlockedCount = ownedPets.length;

  const nextUpgrade = selectedOwnedPet
    ? petLevels.find(
        (item) => item.level === selectedOwnedPet.level
      )
    : null;

  const filteredPets = useMemo(() => {
    if (filter === "unlocked") {
      return pets.filter((pet) => ownedByPetId.has(pet.id));
    }

    if (filter === "locked") {
      return pets.filter((pet) => !ownedByPetId.has(pet.id));
    }

    return pets;
  }, [pets, filter, ownedByPetId]);

  const runAction = async (action, successText) => {
    if (actionLoading) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const { data, error } = await action();

      if (error) throw error;

      if (data?.success === false) {
        throw new Error(data.message || "Операцію не виконано.");
      }

      setMessage({
        type: "success",
        text: data?.message || successText,
      });

      await loadData();
    } catch (error) {
      console.error("Pet action error:", error);
      setMessage({
        type: "error",
        text: errorMessage(error),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const purchasePet = (pet) =>
    runAction(
      () =>
        supabase.rpc("game_purchase_pet_v1", {
          p_pet_id: pet.id,
        }),
      `${pet.name} придбано!`
    );

  const activatePet = (playerPet) =>
    runAction(
      () =>
        supabase.rpc("game_set_active_pet_v1", {
          p_player_pet_id: playerPet.id,
        }),
      "Активного вихованця змінено!"
    );

  const upgradePet = (playerPet) =>
    runAction(
      () =>
        supabase.rpc("game_upgrade_pet_v1", {
          p_player_pet_id: playerPet.id,
        }),
      "Вихованця покращено!"
    );

  if (loading) {
    return (
      <div className="pets-page pets-loading">
        <div className="pets-loading__icon">🐾</div>
        <h2>Завантажуємо вихованців...</h2>
      </div>
    );
  }

  return (
    <div className="pets-page">
      <header className="page-header">
        <div>
          <span className="page-header__eyebrow">
            Твої супутники
          </span>
          <h1>🐾 Вихованці</h1>
          <p>
            Вихованці допомагають герою та дають постійні бонуси.
          </p>
        </div>

        <div className="pets-counter">
          <strong>{unlockedCount}</strong>
          <span>/ {pets.length}</span>
        </div>
      </header>

      {message && (
        <div
          className={`pets-message pets-message--${message.type}`}
          role="status"
        >
          {message.text}
        </div>
      )}

      <section className="pet-wallet">
        <div>
          <span>🪙 Золото</span>
          <strong>{formatNumber(profile?.gold)}</strong>
        </div>
        <div>
          <span>🥈 Срібло</span>
          <strong>{formatNumber(profile?.silver)}</strong>
        </div>
      </section>

      <section className="pet-total-bonuses">
        <div className="section-heading">
          <div>
            <h2>✨ Загальні бонуси</h2>
            <span>
              Від усіх придбаних вихованців
            </span>
          </div>
        </div>

        <div className="pet-bonus-grid">
          {STAT_INFO.map((stat) => (
            <div className="pet-bonus-stat" key={stat.key}>
              <span>{stat.icon}</span>
              <small>{stat.label}</small>
              <strong>
                +{formatNumber(bonuses.bonuses?.[stat.key])}
              </strong>
            </div>
          ))}
        </div>

        <div className="pet-total-bonuses__footer">
          <span>Сумарний бонус вихованців</span>
          <strong>
            +{formatNumber(bonuses.total_bonus)}
          </strong>
        </div>
      </section>

      {selectedPet && selectedOwnedPet && (
        <section className="active-pet-card">
          <div className="active-pet-card__visual">
            <div className="pet-element">✨</div>
            <div className="pet-placeholder">
              {PET_ICONS[selectedPet.name] || "🐾"}
            </div>
            <span className="pet-rarity">
              {selectedPet.rarity}
            </span>
          </div>

          <div className="active-pet-card__info">
            <span>{selectedPet.description || "Твій супутник"}</span>
            <h2>{selectedPet.name}</h2>

            <div className="pet-level">
              Рівень {selectedOwnedPet.level} / 80
            </div>

            {selectedOwnedPet.is_active && (
              <div className="pet-active-label">
                <span>●</span> Активний вихованець
              </div>
            )}

            <div className="pet-bonus">
              <span>✨</span>
              <div>
                <small>Особистий бонус</small>
                <strong>
                  +{formatNumber(
                    bonuses.pets?.find(
                      (pet) =>
                        pet.player_pet_id === selectedOwnedPet.id
                    )?.bonus
                  )}
                </strong>
              </div>
            </div>

            {nextUpgrade && selectedOwnedPet.level < 80 && (
              <div className="pet-upgrade-cost">
                <span>Наступний рівень</span>
                <strong>
                  {nextUpgrade.currency === "gold" ? "🪙" : "🥈"}{" "}
                  {formatNumber(nextUpgrade.upgrade_amount)}
                </strong>
              </div>
            )}

            {selectedOwnedPet.level >= 80 && (
              <div className="pet-max-level">
                Максимальний рівень досягнуто
              </div>
            )}

            <div className="pet-actions">
              {selectedOwnedPet.level < 80 && (
                <button
                  type="button"
                  disabled={actionLoading || !nextUpgrade}
                  onClick={() => upgradePet(selectedOwnedPet)}
                >
                  {actionLoading ? "Обробка..." : "⬆️ Покращити"}
                </button>
              )}

              {!selectedOwnedPet.is_active && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => activatePet(selectedOwnedPet)}
                >
                  ⚔️ Зробити активним
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="pet-filters">
        {[
          ["all", "🐾 Усі"],
          ["unlocked", "🔓 Придбані"],
          ["locked", "🔒 Не придбані"],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={
              filter === value
                ? "filter-button filter-button--active"
                : "filter-button"
            }
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </section>

      <section className="pets-list">
        <div className="section-heading">
          <div>
            <h2>Мої вихованці</h2>
            <span>{unlockedCount} придбано</span>
          </div>
        </div>

        <div className="pets-grid">
          {filteredPets.map((pet) => {
            const owned = ownedByPetId.get(pet.id);
            const isSelected = selectedPetId === pet.id;

            return (
              <button
                type="button"
                key={pet.id}
                className={`pet-card ${
                  isSelected ? "pet-card--selected" : ""
                } ${!owned ? "pet-card--locked" : ""}`}
                onClick={() => {
                  if (owned) setSelectedPetId(pet.id);
                }}
              >
                <div className="pet-card__visual">
                  {owned
                    ? PET_ICONS[pet.name] || "🐾"
                    : "🔒"}
                </div>

                <div className="pet-card__info">
                  <strong>{pet.name}</strong>
                  <span>{pet.description || "Вихованець"}</span>
                  <small>{pet.rarity}</small>
                </div>

                {owned ? (
                  <div className="pet-card__bottom">
                    <span>Lv. {owned.level}</span>
                    <strong>
                      {owned.is_active ? "✨ Активний" : "Придбано"}
                    </strong>
                  </div>
                ) : (
                  <div className="pet-card__bottom">
                    <span>Придбати</span>
                    <strong>
                      🪙 {formatNumber(
                        150 * Math.pow(2, unlockedCount)
                      )}
                    </strong>
                  </div>
                )}

                {!owned && (
                  <span
                    className="pet-buy-action"
                    onClick={(event) => {
                      event.stopPropagation();
                      purchasePet(pet);
                    }}
                  >
                    Купити
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="pet-upgrade-info">
        <span>✨</span>
        <div>
          <strong>Розвивай своїх вихованців</strong>
          <p>
            Кожен придбаний вихованець додає постійні бонуси
            до характеристик героя. Активний вихованець
            визначає бойову підтримку.
          </p>
        </div>
      </section>
    </div>
  );
    }
