import { useState } from "react";

const quickActions = [
  { id: "battle", icon: "⚔️", title: "Бій", description: "Продовжити пригоду" },
  { id: "arena", icon: "🏟️", title: "Арена", description: "Бийся з гравцями" },
  { id: "mine", icon: "⛏️", title: "Шахта", description: "Добувай ресурси" },
  { id: "shop", icon: "🛒", title: "Магазин", description: "Нові предмети" },
];

const dailyTasks = [
  { id: 1, title: "Завершити 3 бої", progress: 0, total: 3, reward: "💰 500" },
  { id: 2, title: "Перемогти на арені", progress: 0, total: 1, reward: "💎 20" },
  { id: 3, title: "Зібрати ресурси", progress: 0, total: 5, reward: "🎁 Скриня" },
];

export default function Home() {
  const [energy, setEnergy] = useState(100);

  return (
    <div className="home-page">
      <section className="player-header">
        <div className="player-avatar">
          🧙
        </div>

        <div className="player-info">
          <span className="player-label">Гравець</span>
          <h1>Новий герой</h1>

          <div className="player-level">
            <span>Рівень 1</span>

            <div className="xp-bar">
              <div className="xp-bar__fill" style={{ width: "0%" }} />
            </div>

            <span>0 / 100 XP</span>
          </div>
        </div>

        <button
          type="button"
          className="profile-button"
          aria-label="Профіль"
        >
          👤
        </button>
      </section>

      <section className="resources-card">
        <div className="resource">
          <span className="resource__icon">💰</span>
          <div>
            <small>Золото</small>
            <strong>0</strong>
          </div>
        </div>

        <div className="resource">
          <span className="resource__icon">💎</span>
          <div>
            <small>Кристали</small>
            <strong>0</strong>
          </div>
        </div>

        <div className="resource">
          <span className="resource__icon">⚡</span>
          <div>
            <small>Енергія</small>
            <strong>{energy}/100</strong>
          </div>
        </div>
      </section>

      <section className="main-hero-card">
        <div className="main-hero-card__image">
          🦸
        </div>

        <div className="main-hero-card__content">
          <span>Твій головний герой</span>
          <h2>Аріан</h2>
          <p>Рівень 1 • ⚔️ 100 сили</p>

          <button type="button">
            Перейти до героя
          </button>
        </div>
      </section>

      <section className="quick-actions">
        <div className="section-heading">
          <h2>Швидкий доступ</h2>
        </div>

        <div className="quick-actions__grid">
          {quickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="action-card"
            >
              <span className="action-card__icon">
                {action.icon}
              </span>

              <strong>{action.title}</strong>

              <small>{action.description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="daily-tasks">
        <div className="section-heading">
          <h2>📋 Завдання дня</h2>
          <span>0/3</span>
        </div>

        <div className="tasks-list">
          {dailyTasks.map((task) => (
            <div className="task-card" key={task.id}>
              <div className="task-card__icon">
                ✓
              </div>

              <div className="task-card__content">
                <strong>{task.title}</strong>

                <div className="task-progress">
                  <div
                    className="task-progress__fill"
                    style={{
                      width: `${(task.progress / task.total) * 100}%`,
                    }}
                  />
                </div>

                <small>
                  {task.progress}/{task.total}
                </small>
              </div>

              <div className="task-reward">
                {task.reward}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="coming-soon">
        <span>✨</span>
        <div>
          <strong>Світ Eldara готується</strong>
          <p>
            Нові герої, локації, боси та пригоди з'являться тут.
          </p>
        </div>
      </section>
    </div>
  );
}
