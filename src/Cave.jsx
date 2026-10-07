import React, { useState } from "react";
import {
  Mountain,
  Pickaxe,
  Coins,
  User,
  Users,
  Home,
  Settings,
  Shield,
} from "lucide-react";
import "./Cave.css";

const RESOURCES = [
  { name: "Алмаз", chance: 13, icon: "💎" },
  { name: "Корунд", chance: 33, icon: "🔴" },
  { name: "Обсидиан", chance: 18, icon: "⬛" },
  { name: "Графит", chance: 24, icon: "⚫" },
  { name: "Оникс", chance: 16, icon: "🖤" },
  { name: "Амброзия", chance: 8, icon: "✨" },
  { name: "Мята", chance: 12, icon: "🌿" },
  { name: "Аир", chance: 1, icon: "🌱" },
  { name: "Рябина", chance: 7, icon: "🔴" },
];

export default function Cave({
  username = "Непроромний",
  playerPower = 64192,

  initialGold = 8492,
  initialEnergy = 75,
  initialSilver = 2200000,

  onHome,
  onHeroes,
  onClan,
  onSettings,
}) {
  const [gold] = useState(initialGold);
  const [energy] = useState(initialEnergy);
  const [silver] = useState(initialSilver);

  const [searched, setSearched] = useState(true);
  const [selectedResources, setSelectedResources] = useState(
    RESOURCES.slice(0, 3)
  );

  const handleNewSearch = () => {
    const shuffled = [...RESOURCES].sort(
      () => Math.random() - 0.5
    );

    setSelectedResources(shuffled.slice(0, 3));
    setSearched(true);
  };

  return (
    <div className="cave-page">
      <main className="cave-container">

        {/* HEADER */}
        <header className="cave-header">
          <div className="cave-title">
            <Mountain size={17} />
            <span>Пещера</span>
          </div>

          <div className="cave-top-resources">
            <span>
              <Shield size={13} />
              {formatNumber(playerPower)}
            </span>

            <span>
              <Shield size={13} />
              {formatNumber(2050)}
            </span>
          </div>
        </header>

        {/* CONTENT */}
        <section className="cave-content">

          <div className="cave-status">
            <strong>Осмотр пещеры завершен</strong>
            <span>
              Вы нашли место с ресурсами:
            </span>
          </div>

          <div className="cave-resources">
            {searched &&
              selectedResources.map((resource) => (
                <div
                  className="cave-resource"
                  key={resource.name}
                >
                  <div className="resource-icon">
                    {resource.icon}
                  </div>

                  <div className="resource-info">
                    <strong>{resource.name}</strong>

                    <span>
                      Шанс добыть:{" "}
                      <b>{resource.chance}%</b>
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* INCREASE CHANCE */}
          <button className="chance-button">
            <span>❯ Увеличить шанс до 100%</span>

            <span className="chance-price">
              за 🪙 21
            </span>
          </button>

          {/* ACTIONS */}
          <div className="cave-actions">

            <button className="mine-button">
              <Pickaxe size={17} />
              Начать добычу
            </button>

            <button
              className="new-search-button"
              onClick={handleNewSearch}
            >
              Новый поиск
            </button>

          </div>

        </section>

        {/* NAVIGATION */}
        <nav className="cave-navigation">

          <button onClick={onHeroes}>
            <User size={16} />
            <span>Мой герой</span>
          </button>

          <button onClick={onClan}>
            <Users size={16} />
            <span>Мой клан</span>
            <b>+</b>
          </button>

          <button onClick={onHome}>
            <Home size={16} />
            <span>На главную</span>
          </button>

        </nav>

        {/* PROFILE */}
        <section className="cave-profile">

          <div className="profile-top">
            <div className="profile-name">
              <User size={15} />
              {username}
            </div>

            <button onClick={onSettings}>
              <Settings size={14} />
              Настройки
            </button>
          </div>

          <div className="profile-resources">
            <span>🟢 {formatNumber(energy)}</span>
            <span>🪙 {formatNumber(gold)}</span>
            <span>⚪ {formatNumber(silver)}</span>
          </div>

        </section>

      </main>
    </div>
  );
}

function formatNumber(number) {
  return Number(number || 0).toLocaleString("uk-UA");
                      }
