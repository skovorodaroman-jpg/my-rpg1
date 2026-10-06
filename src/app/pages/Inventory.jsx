import { useMemo, useState } from "react";

const initialItems = [
  {
    id: 1,
    name: "Меч Дракона",
    type: "weapon",
    rarity: "Легендарний",
    icon: "⚔️",
    level: 5,
    quantity: 1,
    power: 250,
    description: "Стародавній меч із силою вогняного дракона.",
  },
  {
    id: 2,
    name: "Щит Світла",
    type: "armor",
    rarity: "Епічний",
    icon: "🛡️",
    level: 3,
    quantity: 1,
    power: 120,
    description: "Захищає героя від темної магії.",
  },
  {
    id: 3,
    name: "Зілля здоров'я",
    type: "potion",
    rarity: "Рідкісний",
    icon: "🧪",
    level: 1,
    quantity: 12,
    power: 100,
    description: "Відновлює здоров'я героя.",
  },
  {
    id: 4,
    name: "Кільце сили",
    type: "accessory",
    rarity: "Легендарний",
    icon: "💍",
    level: 4,
    quantity: 1,
    power: 180,
    description: "Збільшує силу атаки.",
  },
  {
    id: 5,
    name: "Кристал мани",
    type: "material",
    rarity: "Рідкісний",
    icon: "💎",
    level: 1,
    quantity: 25,
    power: 0,
    description: "Рідкісний матеріал для покращення предметів.",
  },
  {
    id: 6,
    name: "Руна вогню",
    type: "rune",
    rarity: "Епічний",
    icon: "🔥",
    level: 2,
    quantity: 4,
    power: 75,
    description: "Руна, яка додає вогняну силу.",
  },
];

const categories = [
  { id: "all", label: "Усі", icon: "🎒" },
  { id: "weapon", label: "Зброя", icon: "⚔️" },
  { id: "armor", label: "Броня", icon: "🛡️" },
  { id: "accessory", label: "Аксесуари", icon: "💍" },
  { id: "potion", label: "Зілля", icon: "🧪" },
  { id: "rune", label: "Руни", icon: "🔥" },
  { id: "material", label: "Матеріали", icon: "💎" },
];

const rarityClass = {
  "Рідкісний": "rarity-rare",
  "Епічний": "rarity-epic",
  "Легендарний": "rarity-legendary",
  "Міфічний": "rarity-mythic",
};

export default function Inventory() {
  const [items] = useState(initialItems);
  const [category, setCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        category === "all" || item.type === category;

      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [items, category, search]);

  return (
    <div className="inventory-page">
      <header className="page-header">
        <div>
          <span className="page-header__eyebrow">
            Твої речі
          </span>

          <h1>🎒 Інвентар</h1>

          <p>
            Керуй зброєю, бронею, рунами та іншими предметами.
          </p>
        </div>

        <div className="inventory-counter">
          <strong>{items.length}</strong>
          <span>/ 100</span>
        </div>
      </header>

      <section className="inventory-search">
        <span>🔎</span>

        <input
          type="text"
          placeholder="Пошук предмета..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </section>

      <section className="inventory-categories">
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              category === item.id
                ? "category-button category-button--active"
                : "category-button"
            }
            onClick={() => setCategory(item.id)}
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </button>
        ))}
      </section>

      <section className="inventory-summary">
        <div>
          <span>🎒 Предметів</span>
          <strong>{items.length}</strong>
        </div>

        <div>
          <span>⚔️ Екіпіровано</span>
          <strong>0</strong>
        </div>

        <div>
          <span>✨ Вільно</span>
          <strong>{100 - items.length}</strong>
        </div>
      </section>

      <section className="inventory-list">
        <div className="section-heading">
          <div>
            <h2>Предмети</h2>
            <span>
              Знайдено: {filteredItems.length}
            </span>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <span>🔍</span>
            <h3>Нічого не знайдено</h3>
            <p>
              Спробуй змінити категорію або пошуковий запит.
            </p>
          </div>
        ) : (
          <div className="inventory-grid">
            {filteredItems.map((item) => (
              <button
                type="button"
                key={item.id}
                className="inventory-item"
                onClick={() => setSelectedItem(item)}
              >
                <div className="inventory-item__icon">
                  {item.icon}

                  {item.quantity > 1 && (
                    <span className="item-quantity">
                      x{item.quantity}
                    </span>
                  )}
                </div>

                <div className="inventory-item__info">
                  <strong>{item.name}</strong>

                  <span
                    className={
                      rarityClass[item.rarity]
                    }
                  >
                    {item.rarity}
                  </span>

                  <small>
                    Lv. {item.level}
                  </small>
                </div>

                {item.power > 0 && (
                  <div className="inventory-item__power">
                    ⚔️ {item.power}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedItem && (
        <div
          className="item-modal-overlay"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="item-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="item-modal__close"
              onClick={() => setSelectedItem(null)}
              aria-label="Закрити"
            >
              ✕
            </button>

            <div className="item-modal__icon">
              {selectedItem.icon}
            </div>

            <span
              className={
                rarityClass[selectedItem.rarity]
              }
            >
              {selectedItem.rarity}
            </span>

            <h2>{selectedItem.name}</h2>

            <p>{selectedItem.description}</p>

            <div className="item-details">
              <div>
                <span>Рівень</span>
                <strong>
                  {selectedItem.level}
                </strong>
              </div>

              <div>
                <span>Кількість</span>
                <strong>
                  {selectedItem.quantity}
                </strong>
              </div>

              <div>
                <span>Сила</span>
                <strong>
                  {selectedItem.power}
                </strong>
              </div>
            </div>

            <div className="item-modal__actions">
              {selectedItem.type === "potion" ? (
                <button type="button">
                  🧪 Використати
                </button>
              ) : (
                <button type="button">
                  ⚔️ Екіпірувати
                </button>
              )}

              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedItem(null)}
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
            }
