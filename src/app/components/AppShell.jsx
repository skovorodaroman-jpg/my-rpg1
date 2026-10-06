import { useState } from "react";

const navigation = [
  { id: "home", icon: "🏠", label: "Головна" },
  { id: "heroes", icon: "🦸", label: "Герої" },
  { id: "inventory", icon: "🎒", label: "Інвентар" },
  { id: "pets", icon: "🐾", label: "Пети" },
  { id: "battle", icon: "⚔️", label: "Бій" },
  { id: "arena", icon: "🏟️", label: "Арена" },
  { id: "mine", icon: "⛏️", label: "Шахта" },
  { id: "shop", icon: "🛒", label: "Магазин" },
  { id: "forge", icon: "🔨", label: "Кузня" },
  { id: "clan", icon: "👑", label: "Клан" },
  { id: "ranking", icon: "🏆", label: "Рейтинг" },
];

export default function AppShell({ children }) {
  const [activePage, setActivePage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const activeItem = navigation.find(
    (item) => item.id === activePage
  );

  function handleNavigation(page) {
    setActivePage(page);
    setMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          className="menu-button"
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Відкрити меню"
        >
          ☰
        </button>

        <div className="app-header__brand">
          <span className="app-header__logo">⚔️</span>

          <div>
            <strong>MY RPG</strong>
            <small>{activeItem?.label}</small>
          </div>
        </div>

        <div className="app-header__resources">
          <span>💰 0</span>
          <span>💎 0</span>
        </div>
      </header>

      <aside className={`side-menu ${menuOpen ? "side-menu--open" : ""}`}>
        <div className="side-menu__title">
          <span>⚔️</span>
          <strong>MY RPG</strong>
        </div>

        <nav>
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                activePage === item.id
                  ? "nav-item nav-item--active"
                  : "nav-item"
              }
              onClick={() => handleNavigation(item.id)}
            >
              <span className="nav-item__icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="side-menu__footer">
          <button
            type="button"
            className="nav-item"
            onClick={() => handleNavigation("settings")}
          >
            <span className="nav-item__icon">⚙️</span>
            <span>Налаштування</span>
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="menu-overlay"
          type="button"
          aria-label="Закрити меню"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="app-content">
        {children}
      </main>

      <nav className="bottom-navigation">
        {navigation.slice(0, 5).map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              activePage === item.id
                ? "bottom-nav-item bottom-nav-item--active"
                : "bottom-nav-item"
            }
            onClick={() => handleNavigation(item.id)}
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </button>
        ))}
      </nav>
    </div>
  );
            }
