import React, { useState } from 'react';
import './Colosseum.css';

const Colosseum = () => {
  // 'main' | 'tournament_rules' | 'battle' | 'results'
  const [view, setView] = useState('main');

  // Игровые данные
  const [gold, setGold] = useState(8492);
  const [silver, setSilver] = useState(2200000);
  const [myHp, setMyHp] = useState(34102);
  const maxHp = 34102;

  // Лог боя
  const [battleLogs, setBattleLogs] = useState([
    'Сражение началось!'
  ]);

  // Данные врагов в бою
  const [enemies, setEnemies] = useState([
    { id: 1, name: 'Бормансс', hp: 2190, maxHp: 2190, isDead: false },
    { id: 2, name: 'Амбаш', hp: 1733, maxHp: 1733, isDead: false }
  ]);

  // Переключение экранов
  const goToTournamentRules = () => setView('tournament_rules');
  const goToMain = () => setView('main');

  // Старт боя
  const handleStartBattle = () => {
    setMyHp(34102);
    setEnemies([
      { id: 1, name: 'Бормансс', hp: 2190, maxHp: 2190, isDead: false },
      { id: 2, name: 'Амбаш', hp: 1733, maxHp: 1733, isDead: false }
    ]);
    setBattleLogs(['Сражение началось!']);
    setView('battle');
  };

  // Атака в бою
  const handleAttack = () => {
    const aliveEnemies = enemies.filter(e => !e.isDead);
    if (aliveEnemies.length === 0) {
      setView('results');
      return;
    }

    const target = aliveEnemies[0];
    const damage = Math.floor(Math.random() * 800) + 4000;
    const newHp = Math.max(0, target.hp - damage);
    const isKilled = newHp === 0;

    const newLogs = [
      ...battleLogs,
      `Вы ударили 🛡️ ${target.name} на ${damage} крит`
    ];

    if (isKilled) {
      newLogs.push(`🏴‍☠️ Вы убили 🛡️ ${target.name}`);
    } else {
      // Ответный удар
      const enemyDmg = Math.floor(Math.random() * 100) + 80;
      setMyHp(prev => Math.max(0, prev - enemyDmg));
      newLogs.push(`🛡️ ${target.name} ударил Вас на ${enemyDmg}`);
    }

    setEnemies(prev => prev.map(e => e.id === target.id ? { ...e, hp: newHp, isDead: isKilled } : e));
    setBattleLogs(newLogs);

    // Проверка на победу
    if (enemies.every(e => e.id === target.id ? isKilled : e.isDead)) {
      setTimeout(() => setView('results'), 800);
    }
  };

  return (
    <div className="colosseum-wrapper">
      <div className="colosseum-container">
        {/* Хедер с хп/щитом */}
        <header className="colosseum-header">
          <span>🛡️ {myHp} | 🛡️ 2050</span>
        </header>

        {/* 1. ГЛАВНЫЙ ЭКРАН КОЛИЗЕЯ */}
        {view === 'main' && (
          <div className="view-content">
            <div className="subtitle-text">Сражайся и получай новые ранги с наградой</div>

            <div className="queue-box">
              <div className="queue-title">🛡️🛡️ Титанов в очереди: 1 из 5</div>
              <button className="btn-dark" onClick={handleStartBattle}>Обновить</button>
              <button className="btn-dark mt-4">Выйти из очереди</button>
            </div>

            <div className="rank-display">
              <div className="rank-side">
                <div className="rank-icon">🏆</div>
                <div className="rank-num">15</div>
                <div className="rank-label">Твой ранг</div>
              </div>
              <div className="stars-row">★★☆☆☆</div>
              <div className="rank-side">
                <div className="rank-icon">⚔️</div>
                <div className="rank-num">14</div>
                <div className="rank-label">Твоя цель</div>
              </div>
            </div>

            <div className="action-buttons-row">
              <button className="btn-dark">📜 Рейтинг колизея</button>
              <button className="btn-dark">🛡️ Боевые усиления</button>
            </div>
            <div className="hint-text">Боевые усиления увеличивают твою атаку и защиту</div>

            <div className="tournament-banner">
              <div className="tournament-title">⚔️ Турнир колизея! ⚔️</div>
              <div className="skulls-count">Черепа: 💀 0 из 25</div>
              <p className="tournament-desc">
                Накопи 25 черепов и прими участие в розыгрыше 5000 золота!<br/>
                Если накопишь 125 черепов, то примешь участие в розыгрыше 7500 золота!<br/>
                А если соберешь 250 черепов, то примешь участие в розыгрыше 10000 золота!
              </p>
              <div className="timer-text">До конца турнира осталось 6 ч 32 мин!</div>
              <button className="link-btn" onClick={goToTournamentRules}>подробней</button>
            </div>

            <div className="info-bullets">
              <p>• Ранги: За 3 и больше победы подряд ты будешь получать дополнительную ⭐ звезду</p>
              <p>• Черепа выпадают начиная с 23 ранга и только за первые 15 боев</p>
            </div>
          </div>
        )}

        {/* 2. ЭКРАН ПРАВИЛ И НАГРАД ТУРНИРА */}
        {view === 'tournament_rules' && (
          <div className="view-content">
            <div className="tournament-title orange">Турнир колизея!</div>
            <div className="skulls-icons">💀💀💀💀💀</div>
            <p className="rules-text">
              Каждую неделю с субботы по среду проводится турнир.<br/>
              В турнире участвуют игроки набравшие больше 25 черепов в колизее.
            </p>

            <div className="rules-section">
              <p className="bold">Черепа выпадают за убийства других игроков:</p>
              <p>с 23 по 15 ранг - 1 череп</p>
              <p>с 14 по 10 ранг - 5 черепов</p>
              <p>с 9 по 5 ранг - 10 черепов</p>
              <p>на 4 ранге - 15 черепов</p>
              <p>на 3 ранге - 20 черепов</p>
              <p>на 2 ранге - 25 черепов</p>
              <p>на 1 ранге - 100 черепов</p>
            </div>

            <div className="warning-text">
              Внимание: Если вы сбежите живым до окончания битвы, то потеряете черепа.<br/>
              С вас будет списано в пять раз больше черепов, чем награда за убийство игрока на текущем ранге.
            </div>

            <button className="btn-dark center-btn" onClick={goToMain}>Перейти в колизей</button>

            <div className="rewards-section">
              <p className="bold">Персональная награда за каждый собранный череп:</p>
              <p>⚪ 150 серебра и 🛡️ 225 опыта</p>
              <p className="small">Награда выдается максимум за 1000 черепов</p>

              <p className="bold mt-8">Турнирная награда:</p>
              <p>🪙 500 золота - 10 игроков набравших 💀 25 черепов!</p>
              <p>🪙 750 золота - 10 игроков набравших 💀 125 черепов!</p>
              <p>🪙 1000 золота - 10 игроков набравших 💀 250 черепов!</p>
              <p className="bold mt-4">Победители выбираются случайным образом из всех игроков!</p>
            </div>

            <div className="info-bullets">
              <p>• Черепа выпадают начиная с 23 ранга и только за первые 15 боев</p>
            </div>

            <button className="link-btn left" onClick={goToMain}>❯ Вернуться в колизей</button>
          </div>
        )}

        {/* 3. ЭКРАН БОЯ */}
        {view === 'battle' && (
          <div className="view-content">
            <div className="battle-top-bar">
              <span>🛡️ Непроромний 🛡️ {myHp}</span>
              <span className="timer">04:57</span>
              <span>🛡️ Бормансс 🛡️ {enemies[0]?.hp || 0}</span>
            </div>

            {/* Арена боя */}
            <div className="arena-stage">
              <div className="hero-sprite left">🧙‍♂️</div>
              <div className="hero-sprite right">⚔️</div>
            </div>

            {/* Панель умений и атаки */}
            <div className="battle-controls">
              <button className="btn-skill green">Уворот</button>
              <button className="btn-attack" onClick={handleAttack}>АТАКОВАТЬ</button>
              <button className="btn-skill grey">Сменить цель</button>
              
              <button className="btn-skill green">🧪 Настойка</button>
              <button className="btn-skill green">🌋 Камень <br/><small>+35% урон</small></button>
              <button className="btn-skill green">🌿 Трава <br/><small>-35% урон</small></button>
            </div>

            <div className="in-battle-info">
              В бою: 🛡️ {myHp}, 🛡️ {enemies[0]?.hp || 0}, 🛡️ {enemies[1]?.hp || 0}
            </div>

            {/* Логи боя */}
            <div className="battle-log-box">
              {battleLogs.slice(-6).map((log, idx) => (
                <div key={idx} className="log-line">{log}</div>
              ))}
            </div>

            <button className="link-btn center mt-8" onClick={goToMain}>Покинуть бой</button>
          </div>
        )}

        {/* 4. ЭКРАН ПОБЕДЫ / РЕЗУЛЬТАТОВ */}
        {view === 'results' && (
          <div className="view-content text-center">
            <div className="victory-title">⚔️ Победа! ⚔️</div>

            <div className="rank-display center-flex">
              <div className="rank-side">
                <div className="rank-icon">🏆</div>
                <div className="rank-num">15</div>
              </div>
            </div>
            <div className="stars-row gold">★★★★★</div>

            <div className="results-text">
              <p>Ты получаешь +1⭐ звезду!</p>
              <p>+1⭐ звезда за серию побед!</p>
              <p>+2 🪙 золота за открытие ⭐ 2 новых звезд!</p>
            </div>

            <div className="rewards-box">
              <p>Награда x20 за первую победу:</p>
              <p>⚪ 3500 серебра, 🛡️ 2553 опыта</p>
            </div>

            <div className="best-player">
              Лучший: 🛡️ Непроромний
            </div>

            <div className="battle-summary">
              <p className="bold">Итоги боя:</p>
              <p>🛡️ Непроромний + 1⭐ звезда</p>
              <p>🛡️ Санягрот + ½⭐ звезд</p>
              <p>🛡️ Амбаш + 0⭐ звезд</p>
              <p>🛡️ Бормансс - ½⭐ звезд</p>
            </div>

            <div className="actions-box">
              <button className="btn-primary" onClick={handleStartBattle}>
                Начать новый бой
              </button>
              <button className="btn-link" onClick={goToMain}>
                Вернуться в колизей
              </button>
            </div>
          </div>
        )}

        {/* Нижнее меню */}
        <nav className="colosseum-nav">
          <a href="#hero" className="nav-item">🧙 Мой герой</a>
          <a href="#clan" className="nav-item">🧙 Мой клан (+)</a>
          <a href="#main" className="nav-item">❯ На главную</a>
        </nav>

        {/* Подвал игрока */}
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

export default Colosseum;
      
