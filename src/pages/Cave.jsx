import React, { useState } from 'react';
import './Cave.css';

// Повний список можливих ресурсів печери
const CAVE_RESOURCES = [
  { id: 'diamond', name: 'Алмаз', icon: '💎', defaultChance: 13 },
  { id: 'corundum', name: 'Корунд', icon: '🪨', defaultChance: 33 },
  { id: 'obsidian', name: 'Обсидиан', icon: '⬛', defaultChance: 15 },
  { id: 'graphite', name: 'Графит', icon: '✏️', defaultChance: 25 },
  { id: 'onyx', name: 'Оникс', icon: '🔮', defaultChance: 10 },
  { id: 'ambrosia', name: 'Амброзия', icon: '🏺', defaultChance: 5 },
  { id: 'mint', name: 'Мята', icon: '🍃', defaultChance: 20 },
  { id: 'calamus', name: 'Аир', icon: '🌿', defaultChance: 1 },
  { id: 'rowan', name: 'Рябина', icon: '🍒', defaultChance: 18 }
];

const Cave = () => {
  const [gold, setGold] = useState(8492);
  const [silver, setSilver] = useState(2200000); // 2.2M
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState(0);
  const [boosted, setBoosted] = useState(false);

  // Поточні знайдені ресурси в локації
  const [foundResources, setFoundResources] = useState([
    { ...CAVE_RESOURCES[0], chance: 13 },
    { ...CAVE_RESOURCES[1], chance: 33 },
    { ...CAVE_RESOURCES[7], chance: 1 }
  ]);

  // Генерація нових 3 випадкових ресурсів
  const generateNewResources = () => {
    const shuffled = [...CAVE_RESOURCES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map((item) => ({
      ...item,
      chance: Math.floor(Math.random() * 40) + 1
    }));
    setFoundResources(selected);
    setBoosted(false);
  };

  // Новий ошук (безкоштовний або за час)
  const handleNewSearch = () => {
    generateNewResources();
  };

  // Прискорення пошуку за срібло
  const handleSpeedUpSearch = () => {
    const speedUpCost = 50000; // 50k срібла
    if (silver >= speedUpCost) {
      setSilver((prev) => prev - speedUpCost);
      generateNewResources();
      alert('Пошук прискорено за срібло!');
    } else {
      alert('Недостатньо срібла!');
    }
  };

  // Збільшення шансу до 100% за золото
  const handleBoostChance = () => {
    if (boosted) return;
    const boostCost = 21;
    if (gold >= boostCost) {
      setGold((prev) => prev - boostCost);
      setFoundResources((prev) => prev.map((item) => ({ ...item, chance: 100 })));
      setBoosted(true);
    } else {
      alert('Недостатньо золота!');
    }
  };

  const handleStartMining = () => {
    alert('Добування ресурсів розпочато! Ресурси відправлено на склад.');
  };

  return (
    <div className="cave-wrapper">
      <div className="cave-container">
        {/* Шапка гри */}
        <header className="cave-header">
          <span className="header-title">Пещера</span>
          <span className="header-stats">🛡️ 34102 | 🛡️ 2050</span>
        </header>

        {/* Статус огляду */}
        <div className="cave-status">
          <p>Осмотр пещеры завершен</p>
          <p>Вы нашли место с ресурсами:</p>
        </div>

        {/* Список знайдених ресурсів */}
        <div className="resources-list">
          {foundResources.map((item) => (
            <div className="resource-item" key={item.id}>
              <div className="resource-icon-box">{item.icon}</div>
              <div className="resource-info">
                <div className="resource-name">{item.name}</div>
                <div className="resource-chance">Шанс добыть: {item.chance}%</div>
              </div>
            </div>
          ))}
        </div>

        {/* Опції покращення шансів та прискорення */}
        <div className="boost-options">
          <button 
            className="boost-link" 
            onClick={handleBoostChance}
            disabled={boosted}
          >
            ❯ Увеличить шанс до 100% за <span className="icon">🪙</span> 21
          </button>

          <button 
            className="boost-link" 
            onClick={handleSpeedUpSearch}
          >
            ⚡ Ускорить поиск за <span className="icon">⚪</span> 50K
          </button>
        </div>

        {/* Дії */}
        <div className="actions-box">
          <button className="btn-primary" onClick={handleStartMining}>
            Начать добычу
          </button>
          <button className="btn-link" onClick={handleNewSearch}>
            Новый поиск
          </button>
        </div>

        {/* Підказка щодо використання ресурсів */}
        <div className="cave-info-note">
          • Ресурсы можно потратить на усиление своего персонажа в Лаборатории и Кузнице
        </div>

        {/* Навігація */}
        <nav className="cave-nav">
          <a href="#hero" className="nav-item">🧙 Мой герой</a>
          <a href="#clan" className="nav-item">🧙 Мой клан (+)</a>
          <a href="#main" className="nav-item">❯ На главную</a>
        </nav>

        {/* Профіль та ресурси */}
        <footer className="player-profile">
          <div className="profile-top">
            <span className="player-name">👤 Непроромний</span>
            <a href="#settings" className="settings-link">Настройки</a>
          </div>
          <div className="player-resources">
            <span>🟢 75</span>
            <span>🪙 {gold.toLocaleString('ru-RU')}</span>
            <span>⚪ {(silver / 1000000).toFixed(1)}M</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Cave;
                         
