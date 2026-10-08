import React, { useEffect, useMemo, useState } from "react";
import "./Cave.css";

const CAVE_RESOURCES = [
  {
    id: "diamond",
    name: "Алмаз",
    icon: "💎",
    defaultChance: 13,
    min: 1,
    max: 3,
  },
  {
    id: "corundum",
    name: "Корунд",
    icon: "🪨",
    defaultChance: 33,
    min: 2,
    max: 6,
  },
  {
    id: "obsidian",
    name: "Обсидіан",
    icon: "⬛",
    defaultChance: 15,
    min: 2,
    max: 5,
  },
  {
    id: "graphite",
    name: "Графіт",
    icon: "✏️",
    defaultChance: 25,
    min: 3,
    max: 10,
  },
  {
    id: "onyx",
    name: "Онікс",
    icon: "🔮",
    defaultChance: 10,
    min: 1,
    max: 4,
  },
  {
    id: "ambrosia",
    name: "Амброзія",
    icon: "🏺",
    defaultChance: 5,
    min: 1,
    max: 2,
  },
  {
    id: "mint",
    name: "М'ята",
    icon: "🍃",
    defaultChance: 20,
    min: 3,
    max: 12,
  },
  {
    id: "calamus",
    name: "Аїр",
    icon: "🌿",
    defaultChance: 1,
    min: 1,
    max: 2,
  },
  {
    id: "rowan",
    name: "Горобина",
    icon: "🍒",
    defaultChance: 18,
    min: 2,
    max: 8,
  },
];

const SEARCH_TIME = 15;
const MINING_TIME = 30;
const SPEED_UP_COST = 50000;
const BOOST_COST = 21;

function randomChance() {
  return Math.floor(Math.random() * 40) + 1;
}

function randomAmount(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateResources() {
  const shuffled = [...CAVE_RESOURCES].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, 3).map((resource) => ({
    ...resource,
    chance: randomChance(),
  }));
}

export default function Cave({ profile, player, onNavigate }) {
  const currentPlayer = profile || player || {};

  const [gold, setGold] = useState(Number(currentPlayer.gold || 0));

  /*
   * У твоєму profiles зараз немає поля silver.
   * Тимчасово беремо значення з profile.silver, якщо воно з'явиться.
   */
  const [silver, setSilver] = useState(
    Number(currentPlayer.silver || 2200000)
  );

  const [foundResources, setFoundResources] = useState(() => [
    {
      ...CAVE_RESOURCES[0],
      chance: CAVE_RESOURCES[0].defaultChance,
    },
    {
      ...CAVE_RESOURCES[1],
      chance: CAVE_RESOURCES[1].defaultChance,
    },
    {
      ...CAVE_RESOURCES[7],
      chance: CAVE_RESOURCES[7].defaultChance,
    },
  ]);

  const [boosted, setBoosted] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState(0);

  const [isMining, setIsMining] = useState(false);
  const [miningTimer, setMiningTimer] = useState(0);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const playerName = useMemo(
    () =>
      currentPlayer.display_name ||
      currentPlayer.username ||
      "Мандрівник",
    [currentPlayer]
  );

  const playerLevel = Number(currentPlayer.level || 1);

  useEffect(() => {
    if (!isSearching || searchTimer <= 0) return;

    const timer = setInterval(() => {
      setSearchTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSearching(false);
          setFoundResources(generateResources());
          setBoosted(false);
          showMessage("Новий пошук завершено. Ресурси знайдено!", "success");
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSearching, searchTimer]);

  useEffect(() => {
    if (!isMining || miningTimer <= 0) return;

    const timer = setInterval(() => {
      setMiningTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishMining();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMining, miningTimer]);

  function showMessage(text, type = "info") {
    setMessage(text);
    setMessageType(type);
  }

  function generateSearch() {
    if (isSearching || isMining) return;

    setIsSearching(true);
    setSearchTimer(SEARCH_TIME);
    setMessage("");
    setBoosted(false);
  }

  function handleNewSearch() {
    if (isSearching) return;

    if (isMining) {
      showMessage(
        "Спочатку дочекайся завершення добування.",
        "warning"
      );
      return;
    }

    generateSearch();
  }

  function handleSpeedUpSearch() {
    if (!isSearching) {
      showMessage("Зараз немає активного пошуку.", "warning");
      return;
    }

    if (silver < SPEED_UP_COST) {
      showMessage(
        `Недостатньо срібла. Потрібно ${SPEED_UP_COST.toLocaleString("uk-UA")}.`,
        "error"
      );
      return;
    }

    setSilver((prev) => prev - SPEED_UP_COST);
    setSearchTimer(1);

    showMessage("Пошук прискорено за 50 000 срібла.", "success");
  }

  function handleBoostChance() {
    if (boosted) return;

    if (isSearching) {
      showMessage(
        "Не можна змінити шанси під час пошуку.",
        "warning"
      );
      return;
    }

    if (isMining) {
      showMessage(
        "Добування вже розпочато.",
        "warning"
      );
      return;
    }

    if (gold < BOOST_COST) {
      showMessage(
        `Недостатньо золота. Потрібно ${BOOST_COST}.`,
        "error"
      );
      return;
    }

    setGold((prev) => prev - BOOST_COST);

    setFoundResources((prev) =>
      prev.map((resource) => ({
        ...resource,
        chance: 100,
      }))
    );

    setBoosted(true);

    showMessage(
      "Шанс добування всіх знайдених ресурсів збільшено до 100%.",
      "success"
    );
  }

  function handleStartMining() {
    if (isSearching) {
      showMessage(
        "Спочатку дочекайся завершення огляду печери.",
        "warning"
      );
      return;
    }

    if (isMining) return;

    setIsMining(true);
    setMiningTimer(MINING_TIME);
    setMessage("");

    showMessage(
      "Добування розпочато. Герой вирушив у печеру.",
      "success"
    );
  }

  function finishMining() {
    setIsMining(false);

    const obtained = foundResources.filter(
      (resource) =>
        Math.random() * 100 < resource.chance
    );

    if (obtained.length === 0) {
      showMessage(
        "Добування завершено, але цього разу нічого знайти не вдалося.",
        "warning"
      );
      return;
    }

    const rewards = obtained.map((resource) => ({
      ...resource,
      amount: randomAmount(resource.min, resource.max),
    }));

    const rewardText = rewards
      .map(
        (reward) =>
          `${reward.icon} ${reward.name} ×${reward.amount}`
      )
      .join(", ");

    showMessage(
      `Добування завершено! Отримано: ${rewardText}`,
      "success"
    );
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const secs = (seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${secs}`;
  }

  const headerPower = currentPlayer.power || currentPlayer.attack || 0;
  const headerDefense =
    currentPlayer.defense || currentPlayer.defence || 0;

  return (
    <div className="cave-wrapper">
      <div className="cave-container">

        {/* Шапка */}
        <header className="cave-header">
          <span className="header-title">
            🗿 Печера
          </span>

          <span className="header-stats">
            ⚔️ {headerPower} &nbsp; 🛡️ {headerDefense}
          </span>
        </header>

        {/* Статус */}
        <div className="cave-status">
          {isSearching ? (
            <>
              <p>Огляд печери триває...</p>
              <strong>{formatTime(searchTimer)}</strong>
            </>
          ) : isMining ? (
            <>
              <p>Герой добуває ресурси...</p>
              <strong>{formatTime(miningTimer)}</strong>
            </>
          ) : (
            <>
              <p>Огляд печери завершено</p>
              <p>Ви знайшли місце з ресурсами:</p>
            </>
          )}
        </div>

        {/* Повідомлення */}
        {message && (
          <div
            className={`cave-message cave-message-${messageType}`}
          >
            {message}
          </div>
        )}

        {/* Ресурси */}
        <div className="resources-list">
          {foundResources.map((item) => (
            <div
              className="resource-item"
              key={item.id}
            >
              <div className="resource-icon-box">
                {item.icon}
              </div>

              <div className="resource-info">
                <div className="resource-name">
                  {item.name}
                </div>

                <div className="resource-chance">
                  Шанс добути:{" "}
                  <strong>{item.chance}%</strong>
                </div>

                <div className="resource-amount">
                  Можна отримати: {item.min}–{item.max}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Покращення */}
        <div className="boost-options">

          <button
            className="boost-link"
            onClick={handleBoostChance}
            disabled={
              boosted ||
              isSearching ||
              isMining
            }
          >
            ❯ Збільшити шанс до 100% за{" "}
            <span className="icon">🪙</span>{" "}
            {BOOST_COST}
          </button>

          <button
            className="boost-link"
            onClick={handleSpeedUpSearch}
            disabled={!isSearching}
          >
            ⚡ Прискорити пошук за{" "}
            <span className="icon">⚪</span>{" "}
            {SPEED_UP_COST.toLocaleString("uk-UA")}
          </button>

        </div>

        {/* Дії */}
        <div className="actions-box">

          <button
            className="btn-primary"
            onClick={handleStartMining}
            disabled={isSearching || isMining}
          >
            {isMining
              ? `Добування ${formatTime(miningTimer)}`
              : "Почати добування"}
          </button>

          <button
            className="btn-link"
            onClick={handleNewSearch}
            disabled={isSearching || isMining}
          >
            {isSearching
              ? `Новий пошук через ${formatTime(searchTimer)}`
              : "Новий пошук"}
          </button>

        </div>

        {/* Підказка */}
        <div className="cave-info-note">
          • Ресурси можна витратити на посилення свого
          персонажа в Лабораторії та Кузні.
        </div>

        {/* Навігація */}
        <nav className="cave-nav">

          <button
            className="nav-item"
            onClick={() => onNavigate?.("hero")}
          >
            🧙 Мій герой
          </button>

          <button
            className="nav-item"
            onClick={() => onNavigate?.("clan")}
          >
            🛡️ Мій клан (+)
          </button>

          <button
            className="nav-item"
            onClick={() => onNavigate?.("home")}
          >
            ❯ На головну
          </button>

        </nav>

        {/* Профіль */}
        <footer className="player-profile">

          <div className="profile-top">

            <span className="player-name">
              👤 {playerName}
            </span>

            <button
              className="settings-link"
              onClick={() => onNavigate?.("home")}
            >
              Налаштування
            </button>

          </div>

          <div className="player-resources">

            <span>
              🟢 {playerLevel}
            </span>

            <span>
              🪙 {gold.toLocaleString("uk-UA")}
            </span>

            <span>
              ⚪{" "}
              {silver >= 1000000
                ? `${(silver / 1000000).toFixed(1)}M`
                : silver.toLocaleString("uk-UA")}
            </span>

          </div>

        </footer>

      </div>
    </div>
  );
                                     }
