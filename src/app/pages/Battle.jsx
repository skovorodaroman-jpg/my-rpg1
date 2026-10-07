import React, { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Sword,
  Shield,
  User,
  Users,
  Home,
  Settings,
  Coins,
  Crown,
  Gift,
  Lock,
  Star,
  Zap,
  Clock,
} from "lucide-react";
import "./Career.css";

const MAX_BATTLES = 5;

const PLAYERS = [
  "Тіньовий Вовк",
  "Арден",
  "Лорд Нокс",
  "Ніжно",
  "Angel Ofgoodnes",
  "Непроромний",
  "Николайсс",
  "Ramzes Lv",
  "Кровавий Страж",
  "Темний Мисливець",
];

const REWARD_TYPES = ["gold", "dust", "xp", "resource"];

function randomReward(chapter) {
  const type =
    REWARD_TYPES[Math.floor(Math.random() * REWARD_TYPES.length)];

  const multiplier = Math.max(1, chapter);

  switch (type) {
    case "gold":
      return {
        type,
        icon: "🪙",
        name: "Золото",
        amount: Math.floor((50 + Math.random() * 100) * multiplier),
      };

    case "dust":
      return {
        type,
        icon: "⭐",
        name: "Зоряна пилюка",
        amount: Math.floor((20 + Math.random() * 60) * multiplier),
      };

    case "xp":
      return {
        type,
        icon: "✨",
        name: "Досвід",
        amount: Math.floor((100 + Math.random() * 200) * multiplier),
      };

    default:
      return {
        type,
        icon: "💎",
        name: "Ресурс",
        amount: Math.floor((10 + Math.random() * 30) * multiplier),
      };
  }
}

function createDailyBanners(chapter) {
  return [
    randomReward(chapter),
    randomReward(chapter),
    randomReward(chapter),
  ].map((reward) => ({
    ...reward,
    opened: false,
  }));
}

function createRanking(playerPower) {
  const enemies = [];

  for (let i = 0; i < 99; i++) {
    enemies.push({
      id: i + 1,
      name: PLAYERS[i % PLAYERS.length],
      power: Math.floor(
        playerPower * (0.65 + Math.random() * 0.25)
      ),
    });
  }

  return enemies;
}

export default function Career({
  username = "Непроромний",
  playerPower = 64192,

  initialGold = 8492,
  initialEnergy = 75,
  initialSilver = 2100000,

  onAttack,
  onHome,
  onHeroes,
  onClan,
  onSettings,
}) {
  const [chapter, setChapter] = useState(1);
  const [place, setPlace] = useState(100);
  const [battlesUsed, setBattlesUsed] = useState(0);

  const [gold, setGold] = useState(initialGold);
  const [energy] = useState(initialEnergy);
  const [silver] = useState(initialSilver);

  const [ranking, setRanking] = useState(() =>
    createRanking(playerPower)
  );

  const [chapterLockedUntil, setChapterLockedUntil] =
    useState(null);

  const [unlockCountToday, setUnlockCountToday] = useState(0);

  const [banners, setBanners] = useState(() =>
    createDailyBanners(1)
  );

  const [bannerDate, setBannerDate] = useState(
    getServerDayKey()
  );

  const [message, setMessage] = useState(null);

  /*
   * Перевірка щоденного оновлення вимпелів.
   *
   * У production це буде контролюватися сервером/Supabase.
   */
  useEffect(() => {
    const checkDailyReset = () => {
      const currentDay = getServerDayKey();

      if (currentDay !== bannerDate) {
        setBannerDate(currentDay);

        setBanners(createDailyBanners(chapter));

        setUnlockCountToday(0);
      }
    };

    const interval = setInterval(
      checkDailyReset,
      30 * 1000
    );

    return () => clearInterval(interval);
  }, [bannerDate, chapter]);

  /*
   * Поточні суперники навколо гравця.
   */
  const visiblePlayers = useMemo(() => {
    const rows = [];

    for (
      let position = Math.max(1, place - 2);
      position <= Math.min(100, place + 2);
      position++
    ) {
      if (position === place) {
        rows.push({
          place,
          name: username,
          power: playerPower,
          isPlayer: true,
        });
      } else {
        const enemy = ranking[position - 1];

        rows.push({
          place: position,
          name: enemy?.name || "Невідомий",
          power: enemy?.power || 0,
          isPlayer: false,
        });
      }
    }

    return rows;
  }, [
    place,
    ranking,
    username,
    playerPower,
  ]);

  /*
   * Бій.
   */
  const handleAttack = () => {
    if (chapterLockedUntil) {
      showMessage("Глава зараз закрита.");
      return;
    }

    if (battlesUsed >= MAX_BATTLES) {
      showMessage("Усі 5 боїв уже використано.");
      return;
    }

    /*
     * Визначаємо суперника.
     *
     * Для тесту:
     * приблизно 60% шанс перемогти.
     */
    const win = Math.random() < 0.6;

    let newPlace = place;

    if (win) {
      const jump = Math.floor(Math.random() * 20) + 5;

      newPlace = Math.max(1, place - jump);
    } else {
      const fall = Math.floor(Math.random() * 8) + 1;

      newPlace = Math.min(100, place + fall);
    }

    const newBattlesUsed = battlesUsed + 1;

    setPlace(newPlace);
    setBattlesUsed(newBattlesUsed);

    if (onAttack) {
      onAttack({
        mode: "career",
        chapter,
        place,
        result: win ? "win" : "lose",
      });
    }

    if (newPlace === 1) {
      finishChapter(1);

      return;
    }

    if (newBattlesUsed >= MAX_BATTLES) {
      finishChapter(newPlace);

      return;
    }

    showMessage(
      win
        ? `Перемога! Ти піднявся на ${place - newPlace} позицій.`
        : `Поразка. Ти опустився до ${newPlace} місця.`
    );
  };

  /*
   * Завершення глави.
   */
  const finishChapter = (finalPlace) => {
    const reward = calculateChapterReward(
      chapter,
      finalPlace
    );

    setGold((value) => value + reward.gold);

    if (finalPlace === 1) {
      setMessage({
        type: "success",
        title: "🏆 ПЕРШЕ МІСЦЕ!",
        text: `Глава ${chapter} пройдена!`,
        reward,
      });

      /*
       * Наступна глава відкривається одразу.
       */
      setTimeout(() => {
        setChapter((value) => value + 1);
        setPlace(100);
        setBattlesUsed(0);
        setChapterLockedUntil(null);

        setRanking(createRanking(playerPower));

        setBanners(
          createDailyBanners(chapter + 1)
        );

        setMessage(null);
      }, 2500);
    } else {
      /*
       * 8 годин очікування.
       */
      const lockedUntil =
        Date.now() + 8 * 60 * 60 * 1000;

      setChapterLockedUntil(lockedUntil);

      setMessage({
        type: "finish",
        title: `Глава ${chapter} завершена`,
        text: `Твоє місце: ${finalPlace}`,
        reward,
      });
    }
  };

  /*
   * Дострокове відкриття.
   */
  const unlockChapter = () => {
    if (!chapterLockedUntil) return;

    const price = (unlockCountToday + 1) * 10;

    if (gold < price) {
      showMessage("Недостатньо золота.");

      return;
    }

    setGold((value) => value - price);

    setUnlockCountToday(
      (value) => value + 1
    );

    setChapterLockedUntil(null);

    setPlace(100);

    setBattlesUsed(0);

    setRanking(createRanking(playerPower));

    showMessage(
      `Глава ${chapter} відкрита за ${price} золота.`
    );
  };

  /*
   * Відкриття вимпела.
   */
  const openBanner = (index) => {
    const banner = banners[index];

    if (!banner || banner.opened) return;

    const isFirstPlace = place === 1;

    let price = 0;

    if (index === 0) {
      price = 0;
    } else if (index === 1) {
      price = 10;
    } else {
      price = 50;
    }

    /*
     * Перше місце дає всі три безкоштовно.
     */
    if (isFirstPlace) {
      price = 0;
    }

    if (gold < price) {
      showMessage("Недостатньо золота.");

      return;
    }

    if (price > 0) {
      setGold((value) => value - price);
    }

    setBanners((current) =>
      current.map((item, i) =>
        i === index
          ? {
              ...item,
              opened: true,
            }
          : item
      )
    );

    showMessage(
      `🎁 Отримано: ${banner.name} ${formatNumber(
        banner.amount
      )}`
    );
  };

  const showMessage = (text) => {
    setMessage({
      type: "info",
      title: "Кар'єра",
      text,
    });

    setTimeout(() => {
      setMessage(null);
    }, 2500);
  };

  const remainingTime = getRemainingTime(
    chapterLockedUntil
  );

  return (
    <div className="career-page">
      <main className="career-container">

        {/* HEADER */}
        <header className="career-header">
          <div className="career-title">
            <Trophy size={17} />
            <span>Кар'єра</span>
          </div>

          <div className="career-top-resources">
            <span>
              <Shield size={13} />
              {formatNumber(chapter)}
            </span>

            <span>
              <Shield size={13} />
              {formatNumber(place)}
            </span>
          </div>
        </header>

        {/* DESCRIPTION */}
        <div className="career-description">
          Кар'єра — це проходження глав.
          <br />
          Займи <b>1 місце</b>, щоб відкрити
          наступну главу.
        </div>

        {/* CHAPTER */}
        <section className="chapter-section">

          <div className="chapter-heading">
            <Crown size={17} />
            <span>Глава {chapter}</span>
          </div>

          <div className="career-card">

            <div className="rank-area">
  <div className="career-art">
    {/* Ліва картинка суперника */}
  </div>

  <div className="rank-status">
    Ти на{" "}
    <strong>{place} місці</strong>
  </div>

  <div className="career-art">
    {/* Права картинка суперника */}
  </div>
</div>

            {!chapterLockedUntil && (
              <button
                className="career-attack-button"
                onClick={handleAttack}
              >
                <Sword size={16} />

                АТАКУВАТИ{" "}
                {MAX_BATTLES - battlesUsed}/
                {MAX_BATTLES}
              </button>
            )}

            {chapterLockedUntil && (
              <div className="chapter-lock">

                <Clock size={18} />

                <div>
                  <strong>
                    Глава закрита
                  </strong>

                  <span>
                    Нова спроба через{" "}
                    {remainingTime}
                  </span>
                </div>

                <button
                  onClick={unlockChapter}
                >
                  ВІДКРИТИ
                  <small>
                    {(unlockCountToday + 1) *
                      10}{" "}
                    🪙
                  </small>
                </button>

              </div>
            )}

            {/* RANKING */}
            <div className="ranking-head">
              <span className="rank-col">
                Місце
              </span>

              <span className="name-col">
                Ім'я
              </span>

              <span className="power-col">
                Міць
              </span>
            </div>

            <div className="ranking-list">
              {visiblePlayers.map(
                (player) => (
                  <div
                    key={player.place}
                    className={`ranking-row ${
                      player.isPlayer
                        ? "current-player"
                        : ""
                    }`}
                  >
                    <span className="rank-col">
                      {player.place}
                    </span>

                    <span className="name-col player-name">
                      <Shield size={12} />

                      {player.name}
                    </span>

                    <span className="power-col">
                      <Sword size={11} />

                      {formatNumber(
                        player.power
                      )}
                    </span>
                  </div>
                )
              )}
            </div>

          </div>
        </section>

        {/* REWARD */}
        <section className="reward-info">

          <div className="reward-title">
            🎁 Нагорода за завершення
          </div>

          <p>
            Після завершення глави ти
            отримуєш нагороду незалежно
            від зайнятого місця.
          </p>

          <p>
            Чим вище глава та краще місце —
            тим більша нагорода.
          </p>

        </section>

        {/* BANNERS */}
        <section className="banners-section">

          <div className="section-title">
            <Gift size={16} />
            <span>Щоденні вимпели</span>
          </div>

          <div className="banner-info">
            Оновлення щодня о 10:00
            за серверним часом
          </div>

          <div className="banners">

            {banners.map((banner, index) => {

              const isFirstPlace =
                place === 1;

              const price =
                isFirstPlace
                  ? 0
                  : index === 0
                  ? 0
                  : index === 1
                  ? 10
                  : 50;

              return (
                <button
                  key={index}
                  className={`banner ${
                    banner.opened
                      ? "opened"
                      : ""
                  }`}
                  onClick={() =>
                    openBanner(index)
                  }
                  disabled={banner.opened}
                >

                  {banner.opened ? (
                    <>
                      <span className="banner-reward-icon">
                        {banner.icon}
                      </span>

                      <strong>
                        {formatNumber(
                          banner.amount
                        )}
                      </strong>

                      <small>
                        {banner.name}
                      </small>
                    </>
                  ) : (
                    <>
                      <Gift size={25} />

                      <strong>
                        ВІДКРИТИ
                      </strong>

                      <small>
                        {price === 0
                          ? "БЕЗКОШТОВНО"
                          : `${price} 🪙`}
                      </small>
                    </>
                  )}

                </button>
              );
            })}

          </div>

          <div className="banner-rules">
            <div>
              🎲 Вимпели відкриваються
              у випадковому порядку.
            </div>

            <div>
              ⭐ Нагороди залежать
              від поточної глави.
            </div>

            <div>
              🏆 Перше місце робить
              всі три вимпели безкоштовними.
            </div>
          </div>

        </section>

        {/* NAVIGATION */}
        <nav className="career-navigation">

          <button onClick={onHeroes}>
            <User size={16} />
            <span>Мій герой</span>
          </button>

          <button onClick={onClan}>
            <Users size={16} />
            <span>Мій клан</span>
            <b>+</b>
          </button>

          <button onClick={onHome}>
            <Home size={16} />
            <span>На головну</span>
          </button>

        </nav>

        {/* PROFILE */}
        <section className="career-profile">

          <div className="profile-top">

            <div className="profile-name">
              <User size={15} />
              {username}
            </div>

            <button onClick={onSettings}>
              <Settings size={14} />
              Налаштування
            </button>

          </div>

          <div className="profile-resources">

            <span>
              🟢 {formatNumber(energy)}
            </span>

            <span>
              🪙 {formatNumber(gold)}
            </span>

            <span>
              ⚪ {formatNumber(silver)}
            </span>

          </div>

        </section>

        <footer className="career-footer">
          Хроніки Згаслого Світанку · 2026
        </footer>

        {/* MESSAGE */}
        {message && (
          <div
            className={`career-message ${message.type}`}
          >
            <strong>
              {message.title}
            </strong>

            <span>
              {message.text}
            </span>

            {message.reward && (
              <div className="message-reward">
                🪙 +{formatNumber(
                  message.reward.gold
                )}
                золота
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}


/* =========================
   REWARDS
========================= */

function calculateChapterReward(
  chapter,
  place
) {
  const positionMultiplier =
    Math.max(
      0.2,
      (101 - place) / 100
    );

  const baseGold =
    50 * chapter;

  return {
    gold: Math.floor(
      baseGold * positionMultiplier
    ),

    dust: Math.floor(
      20 *
        chapter *
        positionMultiplier
    ),

    xp: Math.floor(
      100 *
        chapter *
        positionMultiplier
    ),
  };
}


/* =========================
   SERVER DAY
========================= */

function getServerDayKey() {
  const now = new Date();

  /*
   * Тут поки використовується
   * локальний час для тесту.
   *
   * Після підключення Supabase
   * переведемо на серверний час.
   */

  if (now.getHours() < 10) {
    now.setDate(
      now.getDate() - 1
    );
  }

  return now.toISOString().slice(0, 10);
}


/* =========================
   TIMER
========================= */

function getRemainingTime(
  timestamp
) {
  if (!timestamp) {
    return "";
  }

  const difference =
    Math.max(
      0,
      timestamp - Date.now()
    );

  const hours = Math.floor(
    difference / 3600000
  );

  const minutes = Math.floor(
    (difference % 3600000) /
      60000
  );

  const seconds = Math.floor(
    (difference % 60000) /
      1000
  );

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}


/* =========================
   NUMBER
========================= */

function formatNumber(number) {
  return Number(
    number || 0
  ).toLocaleString("uk-UA");
        }
