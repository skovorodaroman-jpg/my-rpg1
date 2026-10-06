import { useState } from "react";

const initialMembers = [
  {
    id: 1,
    name: "Roma",
    avatar: "🧙",
    level: 12,
    power: 4210,
    role: "Лідер",
    online: true,
  },
  {
    id: 2,
    name: "DarkLord",
    avatar: "🥷",
    level: 11,
    power: 3860,
    role: "Замісник",
    online: true,
  },
  {
    id: 3,
    name: "LightKing",
    avatar: "🛡️",
    level: 10,
    power: 3410,
    role: "Воїн",
    online: false,
  },
  {
    id: 4,
    name: "ShadowFox",
    avatar: "🦊",
    level: 9,
    power: 2980,
    role: "Воїн",
    online: true,
  },
  {
    id: 5,
    name: "FireQueen",
    avatar: "🧙‍♀️",
    level: 8,
    power: 2650,
    role: "Розвідник",
    online: false,
  },
];

const clanTasks = [
  {
    id: 1,
    icon: "⚔️",
    title: "Перемогти 10 ворогів",
    progress: 7,
    total: 10,
    reward: "500 💰",
  },
  {
    id: 2,
    icon: "⛏️",
    title: "Добути 100 ресурсів",
    progress: 64,
    total: 100,
    reward: "20 💎",
  },
  {
    id: 3,
    icon: "🏟️",
    title: "Зіграти 5 боїв на арені",
    progress: 3,
    total: 5,
    reward: "300 🏆",
  },
];

export default function Clan() {
  const [activeTab, setActiveTab] = useState("members");
  const [members, setMembers] = useState(initialMembers);
  const [message, setMessage] = useState("");

  const leaveClan = () => {
    setMessage("⚠️ Для виходу з клану потрібне підтвердження.");
  };

  const donate = () => {
    setMessage("❤️ Ти зробив внесок у розвиток клану!");
  };

  const kickMember = (member) => {
    setMembers((current) =>
      current.filter((item) => item.id !== member.id)
    );

    setMessage(`🚪 ${member.name} видалений з клану.`);
  };

  return (
    <div className="page clan-page">
      {/* Header */}
      <header className="clan-header">
        <div className="clan-emblem">🐉</div>

        <div className="clan-title">
          <span>Твій клан</span>
          <h1>Дракони Світанку</h1>
          <p>Lv. 8 · 18/25 учасників</p>
        </div>

        <button
          className="clan-settings"
          onClick={() =>
            setMessage("⚙️ Налаштування клану доступні лідеру.")
          }
        >
          ⚙️
        </button>
      </header>

      {/* Clan stats */}
      <section className="clan-stats">
        <div>
          <span>⚔️</span>
          <strong>24 580</strong>
          <small>Сила</small>
        </div>

        <div>
          <span>🏆</span>
          <strong>#18</strong>
          <small>Рейтинг</small>
        </div>

        <div>
          <span>💰</span>
          <strong>128K</strong>
          <small>Скарбниця</small>
        </div>

        <div>
          <span>🔥</span>
          <strong>74</strong>
          <small>Активність</small>
        </div>
      </section>

      {/* Clan progress */}
      <section className="clan-progress-card">
        <div className="progress-heading">
          <div>
            <span>Рівень клану</span>
            <strong>8 → 9</strong>
          </div>

          <b>72%</b>
        </div>

        <div className="progress-bar">
          <div style={{ width: "72%" }} />
        </div>

        <p>
          Ще 14 000 XP до наступного рівня
        </p>
      </section>

      {/* Tabs */}
      <div className="clan-tabs">
        <button
          className={activeTab === "members" ? "active" : ""}
          onClick={() => setActiveTab("members")}
        >
          👥 Учасники
        </button>

        <button
          className={activeTab === "tasks" ? "active" : ""}
          onClick={() => setActiveTab("tasks")}
        >
          📜 Завдання
        </button>

        <button
          className={activeTab === "info" ? "active" : ""}
          onClick={() => setActiveTab("info")}
        >
          📖 Інфо
        </button>
      </div>

      {message && (
        <div className="clan-message">
          {message}
        </div>
      )}

      {/* Members */}
      {activeTab === "members" && (
        <section className="clan-section">
          <div className="section-title">
            <h2>👥 Учасники</h2>
            <span>{members.length}/25</span>
          </div>

          <div className="members-list">
            {members.map((member) => (
              <div
                key={member.id}
                className="member-card"
              >
                <div className="member-avatar">
                  {member.avatar}

                  {member.online && (
                    <span className="online-dot" />
                  )}
                </div>

                <div className="member-info">
                  <strong>{member.name}</strong>

                  <span>
                    Lv.{member.level} · ⚔️{" "}
                    {member.power.toLocaleString()}
                  </span>

                  <small>{member.role}</small>
                </div>

                <div className="member-actions">
                  {member.role === "Лідер" ? (
                    <span className="leader-badge">
                      👑
                    </span>
                  ) : (
                    <button
                      onClick={() => kickMember(member)}
                      title="Керування учасником"
                    >
                      ⋮
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            className="invite-button"
            onClick={() =>
              setMessage("📨 Код запрошення скопійовано.")
            }
          >
            ➕ ЗАПРОСИТИ ГРАВЦЯ
          </button>
        </section>
      )}

      {/* Tasks */}
      {activeTab === "tasks" && (
        <section className="clan-section">
          <div className="section-title">
            <h2>📜 Кланові завдання</h2>
            <span>Оновлення щодня</span>
          </div>

          <div className="tasks-list">
            {clanTasks.map((task) => {
              const percent =
                (task.progress / task.total) * 100;

              return (
                <div className="clan-task" key={task.id}>
                  <div className="task-icon">
                    {task.icon}
                  </div>

                  <div className="task-content">
                    <strong>{task.title}</strong>

                    <div className="task-progress">
                      <div
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <span>
                      {task.progress}/{task.total}
                    </span>
                  </div>

                  <div className="task-reward">
                    {task.reward}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="weekly-reward">
            <div className="reward-icon">🎁</div>

            <div>
              <span>Тижнева нагорода</span>
              <strong>Велика скриня Eldara</strong>
              <small>Прогрес: 68%</small>
            </div>

            <button
              onClick={() =>
                setMessage("🔒 Нагорода ще не доступна.")
              }
            >
              🔒
            </button>
          </div>
        </section>
      )}

      {/* Info */}
      {activeTab === "info" && (
        <section className="clan-section">
          <div className="clan-description">
            <div className="description-icon">
              🐉
            </div>

            <h2>Дракони Світанку</h2>

            <p>
              Ми об'єдналися, щоб разом досліджувати Eldara,
              перемагати ворогів та допомагати один одному.
            </p>
          </div>

          <div className="laws-card">
            <h3>📜 Закони клану</h3>

            <div className="law">
              <span>1</span>
              <p>Поважай інших учасників.</p>
            </div>

            <div className="law">
              <span>2</span>
              <p>Допомагай клану виконувати завдання.</p>
            </div>

            <div className="law">
              <span>3</span>
              <p>Будь активним та розвивай свого героя.</p>
            </div>

            <div className="law">
              <span>4</span>
              <p>Не використовуй сторонні програми.</p>
            </div>
          </div>

          <div className="roles-card">
            <h3>👑 Ролі</h3>

            <div>
              <strong>👑 Лідер</strong>
              <span>Повний контроль клану</span>
            </div>

            <div>
              <strong>⭐ Замісник</strong>
              <span>Допомагає керувати кланом</span>
            </div>

            <div>
              <strong>⚔️ Воїн</strong>
              <span>Звичайний учасник</span>
            </div>

            <div>
              <strong>🔭 Розвідник</strong>
              <span>Допомагає знаходити суперників</span>
            </div>
          </div>
        </section>
      )}

      {/* Bottom actions */}
      <section className="clan-actions">
        <button onClick={donate}>
          💰 Зробити внесок
        </button>

        <button onClick={leaveClan}>
          🚪 Вийти з клану
        </button>
      </section>

      <style>{`
        .clan-page {
          padding-bottom: 90px;
        }

        .clan-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px;
          border-radius: 23px;
          background:
            linear-gradient(
              135deg,
              rgba(110,55,180,.35),
              rgba(35,30,60,.8)
            );
          border: 1px solid rgba(255,255,255,.1);
        }

        .clan-emblem {
          width: 72px;
          height: 72px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 21px;
          background: rgba(255,255,255,.08);
          font-size: 40px;
        }

        .clan-title {
          flex: 1;
          min-width: 0;
        }

        .clan-title span {
          font-size: 10px;
          opacity: .5;
        }

        .clan-title h1 {
          margin: 3px 0;
          font-size: 19px;
        }

        .clan-title p {
          margin: 0;
          font-size: 11px;
          opacity: .6;
        }

        .clan-settings {
          width: 38px;
          height: 38px;
          border: 0;
          border-radius: 12px;
          background: rgba(255,255,255,.08);
          color: inherit;
          cursor: pointer;
        }

        .clan-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 7px;
          margin: 12px 0;
        }

        .clan-stats div {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 11px 4px;
          border-radius: 14px;
          background: rgba(255,255,255,.04);
        }

        .clan-stats span {
          font-size: 19px;
        }

        .clan-stats strong {
          font-size: 11px;
        }

        .clan-stats small {
          font-size: 8px;
          opacity: .45;
        }

        .clan-progress-card {
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 18px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.08);
        }

        .progress-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 8px;
        }

        .progress-heading div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .progress-heading span {
          font-size: 10px;
          opacity: .5;
        }

        .progress-heading strong {
          font-size: 15px;
        }

        .progress-heading b {
          font-size: 13px;
        }

        .progress-bar {
          height: 8px;
          overflow: hidden;
          border-radius: 10px;
          background: rgba(255,255,255,.08);
        }

        .progress-bar div {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg,#8d42e8,#db3d91);
        }

        .clan-progress-card > p {
          margin: 8px 0 0;
          font-size: 10px;
          opacity: .5;
        }

        .clan-tabs {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 7px;
          margin-bottom: 14px;
        }

        .clan-tabs button {
          padding: 11px 5px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          background: rgba(255,255,255,.04);
          color: inherit;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .clan-tabs button.active {
          background: rgba(140,70,230,.22);
          border-color: rgba(170,100,255,.55);
        }

        .clan-message {
          margin-bottom: 13px;
          padding: 11px;
          border-radius: 12px;
          background: rgba(255,255,255,.07);
          text-align: center;
          font-size: 11px;
        }

        .clan-section {
          margin-bottom: 22px;
        }

        .section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 11px;
        }

        .section-title h2 {
          margin: 0;
          font-size: 17px;
        }

        .section-title span {
          font-size: 10px;
          opacity: .5;
        }

        .members-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .member-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 15px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.07);
        }

        .member-avatar {
          position: relative;
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 13px;
          background: rgba(255,255,255,.07);
          font-size: 23px;
        }

        .online-dot {
          position: absolute;
          right: 1px;
          bottom: 1px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #4ade80;
          border: 2px solid #191622;
        }

        .member-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .member-info strong {
          font-size: 13px;
        }

        .member-info span,
        .member-info small {
          font-size: 9px;
          opacity: .55;
        }

        .member-actions button {
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 9px;
          background: rgba(255,255,255,.06);
          color: inherit;
          font-size: 18px;
          cursor: pointer;
        }

        .leader-badge {
          font-size: 18px;
        }

        .invite-button {
          width: 100%;
          margin-top: 10px;
          padding: 13px;
          border: 1px dashed rgba(170,100,255,.5);
          border-radius: 14px;
          background: rgba(140,70,230,.08);
          color: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .clan-task {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(255,255,255,.04);
        }

        .task-icon {
          font-size: 25px;
        }

        .task-content {
          flex: 1;
          min-width: 0;
        }

        .task-content strong {
          display: block;
          margin-bottom: 7px;
          font-size: 11px;
        }

        .task-progress {
          height: 6px;
          overflow: hidden;
          border-radius: 8px;
          background: rgba(255,255,255,.08);
        }

        .task-progress div {
          height: 100%;
          background: linear-gradient(90deg,#8d42e8,#db3d91);
        }

        .task-content > span {
          display: block;
          margin-top: 4px;
          font-size: 8px;
          opacity: .45;
        }

        .task-reward {
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .weekly-reward {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
          padding: 14px;
          border-radius: 17px;
          background: rgba(255,190,60,.08);
          border: 1px solid rgba(255,190,60,.15);
        }

        .reward-icon {
          font-size: 30px;
        }

        .weekly-reward div:nth-child(2) {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .weekly-reward span {
          font-size: 9px;
          opacity: .5;
        }

        .weekly-reward strong {
          font-size: 12px;
        }

        .weekly-reward small {
          font-size: 9px;
          opacity: .5;
        }

        .weekly-reward button {
          width: 35px;
          height: 35px;
          border: 0;
          border-radius: 10px;
          background: rgba(255,255,255,.07);
          color: inherit;
          cursor: pointer;
        }

        .clan-description {
          padding: 20px;
          border-radius: 20px;
          background: rgba(255,255,255,.05);
          text-align: center;
        }

        .description-icon {
          font-size: 45px;
        }

        .clan-description h2 {
          margin: 8px 0;
          font-size: 18px;
        }

        .clan-description p {
          margin: 0;
          font-size: 11px;
          line-height: 1.6;
          opacity: .6;
        }

        .laws-card,
        .roles-card {
          margin-top: 10px;
          padding: 15px;
          border-radius: 18px;
          background: rgba(255,255,255,.04);
        }

        .laws-card h3,
        .roles-card h3 {
          margin: 0 0 12px;
          font-size: 14px;
        }

        .law {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 9px 0;
        }

        .law span {
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: rgba(255,255,255,.07);
          font-size: 10px;
        }

        .law p {
          margin: 0;
          font-size: 10px;
          opacity: .65;
        }

        .roles-card > div {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 9px 0;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }

        .roles-card > div:last-child {
          border-bottom: 0;
        }

        .roles-card strong {
          font-size: 11px;
        }

        .roles-card span {
          font-size: 9px;
          opacity: .5;
        }

        .clan-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .clan-actions button {
          padding: 12px 5px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 13px;
          background: rgba(255,255,255,.05);
          color: inherit;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 500px) {
          .clan-header {
            padding: 14px;
          }

          .clan-emblem {
            width: 60px;
            height: 60px;
            font-size: 32px;
         }

          .clan-title h1 {
            font-size: 16px;
          }

          .clan-stats strong {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
}
