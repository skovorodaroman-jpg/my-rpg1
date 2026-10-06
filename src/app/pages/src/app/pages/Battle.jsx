import { useEffect, useMemo, useState } from "react";

const initialHeroes = [
  {
    id: 1,
    name: "Аріан",
    role: "Воїн",
    icon: "🦸",
    element: "🔥",
    level: 10,
    maxHp: 1200,
    hp: 1200,
    attack: 180,
    defense: 100,
    speed: 25,
    crit: 15,
    ultimate: 0,
  },
  {
    id: 2,
    name: "Луна",
    role: "Маг",
    icon: "🧙",
    element: "💧",
    level: 10,
    maxHp: 850,
    hp: 850,
    attack: 230,
    defense: 65,
    speed: 35,
    crit: 20,
    ultimate: 0,
  },
  {
    id: 3,
    name: "Рей",
    role: "Мисливець",
    icon: "🏹",
    element: "🌿",
    level: 10,
    maxHp: 950,
    hp: 950,
    attack: 210,
    defense: 75,
    speed: 40,
    crit: 25,
    ultimate: 0,
  },
];

const initialEnemies = [
  {
    id: 101,
    name: "Темний вовк",
    icon: "🐺",
    element: "🌑",
    maxHp: 900,
    hp: 900,
    attack: 150,
    defense: 60,
    speed: 30,
  },
  {
    id: 102,
    name: "Тіньовий маг",
    icon: "👹",
    element: "🌑",
    maxHp: 700,
    hp: 700,
    attack: 190,
    defense: 45,
    speed: 38,
  },
  {
    id: 103,
    name: "Кам'яний страж",
    icon: "🗿",
    element: "🌿",
    maxHp: 1400,
    hp: 1400,
    attack: 120,
    defense: 130,
    speed: 15,
  },
];

const skills = [
  {
    id: "basic",
    name: "Удар",
    icon: "⚔️",
    type: "basic",
    description: "Звичайна атака.",
  },
  {
    id: "skill",
    name: "Особлива навичка",
    icon: "✨",
    type: "skill",
    description: "Посилена атака.",
  },
  {
    id: "ultimate",
    name: "Ultimate",
    icon: "💥",
    type: "ultimate",
    description: "Потужна спеціальна атака.",
  },
];

export default function Battle() {
  const [heroes, setHeroes] = useState(initialHeroes);
  const [enemies, setEnemies] = useState(initialEnemies);
  const [selectedHeroId, setSelectedHeroId] = useState(1);
  const [selectedEnemyId, setSelectedEnemyId] = useState(101);
  const [selectedSkill, setSelectedSkill] = useState("basic");
  const [battleSpeed, setBattleSpeed] = useState(1);
  const [autoBattle, setAutoBattle] = useState(false);
  const [battleState, setBattleState] = useState("fighting");
  const [turn, setTurn] = useState(1);
  const [logs, setLogs] = useState([
    "⚔️ Бій розпочато!",
  ]);
  const [animating, setAnimating] = useState(false);

  const selectedHero = useMemo(
    () =>
      heroes.find(
        (hero) => hero.id === selectedHeroId
      ),
    [heroes, selectedHeroId]
  );

  const selectedEnemy = useMemo(
    () =>
      enemies.find(
        (enemy) => enemy.id === selectedEnemyId
      ),
    [enemies, selectedEnemyId]
  );

  const aliveHeroes = heroes.filter(
    (hero) => hero.hp > 0
  );

  const aliveEnemies = enemies.filter(
    (enemy) => enemy.hp > 0
  );

  const totalEnemyHp = enemies.reduce(
    (sum, enemy) => sum + enemy.hp,
    0
  );

  const totalEnemyMaxHp = enemies.reduce(
    (sum, enemy) => sum + enemy.maxHp,
    0
  );

  useEffect(() => {
    if (aliveHeroes.length === 0 && battleState === "fighting") {
      setBattleState("defeat");
    }

    if (aliveEnemies.length === 0 && battleState === "fighting") {
      setBattleState("victory");
    }
  }, [aliveHeroes.length, aliveEnemies.length, battleState]);

  useEffect(() => {
    if (!autoBattle || battleState !== "fighting") {
      return;
    }

    const timer = setTimeout(() => {
      performAttack(true);
    }, battleSpeed === 2 ? 700 : 1300);

    return () => clearTimeout(timer);
  }, [
    autoBattle,
    battleState,
    turn,
    selectedHeroId,
    selectedEnemyId,
    selectedSkill,
    battleSpeed,
  ]);

  function addLog(message) {
    setLogs((current) => [
      message,
      ...current,
    ].slice(0, 8));
  }

  function performAttack(isAuto = false) {
    if (
      battleState !== "fighting" ||
      animating ||
      !selectedHero ||
      !selectedEnemy
    ) {
      return;
    }

    if (selectedHero.hp <= 0 || selectedEnemy.hp <= 0) {
      return;
    }

    setAnimating(true);

    const skill = skills.find(
      (item) => item.id === selectedSkill
    );

    let multiplier = 1;

    if (skill.type === "skill") {
      multiplier = 1.5;
    }

    if (skill.type === "ultimate") {
      multiplier = 2.5;
    }

    const isCritical =
      Math.random() * 100 < selectedHero.crit;

    if (isCritical) {
      multiplier *= 1.5;
    }

    const rawDamage =
      selectedHero.attack * multiplier;

    const damage = Math.max(
      1,
      Math.round(
        rawDamage - selectedEnemy.defense * 0.5
      )
    );

    const newEnemyHp = Math.max(
      0,
      selectedEnemy.hp - damage
    );

    setEnemies((current) =>
      current.map((enemy) =>
        enemy.id === selectedEnemy.id
          ? {
              ...enemy,
              hp: newEnemyHp,
            }
          : enemy
      )
    );

    setHeroes((current) =>
      current.map((hero) =>
        hero.id === selectedHero.id
          ? {
              ...hero,
              ultimate: Math.min(
                100,
                hero.ultimate +
                  (skill.type === "ultimate"
                    ? 0
                    : 20)
              ),
            }
          : hero
      )
    );

    addLog(
      `${selectedHero.icon} ${selectedHero.name} → ${selectedEnemy.icon} ${selectedEnemy.name}: -${damage} HP${
        isCritical ? " 💥 КРИТ!" : ""
      }`
    );

    if (skill.type === "ultimate") {
      setSelectedSkill("basic");
    }

    setTimeout(() => {
      setAnimating(false);

      if (newEnemyHp > 0) {
        enemyAttack();
      } else {
        setBattleState("victory");
        setAutoBattle(false);
        addLog("🏆 Перемога!");
      }

      setTurn((current) => current + 1);
    }, battleSpeed === 2 ? 250 : 500);
  }

  function enemyAttack() {
    const alivePlayerHeroes = heroes.filter(
      (hero) => hero.hp > 0
    );

    if (alivePlayerHeroes.length === 0) {
      return;
    }

    const attacker =
      enemies
        .filter((enemy) => enemy.hp > 0)
        .sort((a, b) => b.speed - a.speed)[0];

    if (!attacker) {
      return;
    }

    const target =
      alivePlayerHeroes[
        Math.floor(
          Math.random() *
            alivePlayerHeroes.length
        )
      ];

    const damage = Math.max(
      1,
      Math.round(
        attacker.attack -
          target.defense * 0.5
      )
    );

    const newHp = Math.max(
      0,
      target.hp - damage
    );

    setHeroes((current) =>
      current.map((hero) =>
        hero.id === target.id
          ? {
              ...hero,
              hp: newHp,
            }
          : hero
      )
    );

    addLog(
      `${attacker.icon} ${attacker.name} атакує ${target.name}: -${damage} HP`
    );

    if (newHp <= 0) {
      addLog(`💀 ${target.name} вибув з бою.`);
    }
  }

  function restartBattle() {
    setHeroes(initialHeroes);
    setEnemies(initialEnemies);
    setSelectedHeroId(1);
    setSelectedEnemyId(101);
    setSelectedSkill("basic");
    setBattleState("fighting");
    setTurn(1);
    setLogs(["⚔️ Новий бій розпочато!"]);
    setAutoBattle(false);
  }

  function getHpPercent(current, max) {
    return Math.max(
      0,
      Math.min(100, (current / max) * 100)
    );
  }

  return (
    <div className="battle-page">
      <header className="battle-header">
        <div>
          <span>ПРИГОДА</span>
          <h1>⚔️ Битва</h1>
        </div>

        <div className="battle-header__controls">
          <button
            type="button"
            className={
              autoBattle
                ? "battle-control battle-control--active"
                : "battle-control"
            }
            onClick={() =>
              setAutoBattle((value) => !value)
            }
          >
            {autoBattle ? "⏸ AUTO" : "▶ AUTO"}
          </button>

          <button
            type="button"
            className={
              battleSpeed === 2
                ? "battle-control battle-control--active"
                : "battle-control"
            }
            onClick={() =>
              setBattleSpeed((value) =>
                value === 1 ? 2 : 1
              )
            }
          >
            ×{battleSpeed}
          </button>
        </div>
      </header>

      <section className="battle-stage">
        <div className="battle-team battle-team--enemy">
          <div className="team-title">
            <span>👹 ВОРОГИ</span>
            <strong>
              {Math.round(
                (totalEnemyHp /
                  totalEnemyMaxHp) *
                  100
              )}
              %
            </strong>
          </div>

          <div className="battle-formation">
            {enemies.map((enemy) => (
              <button
                type="button"
                key={enemy.id}
                disabled={enemy.hp <= 0}
                className={`battle-unit ${
                  selectedEnemyId === enemy.id
                    ? "battle-unit--selected"
                    : ""
                } ${
                  enemy.hp <= 0
                    ? "battle-unit--dead"
                    : ""
                }`}
                onClick={() =>
                  setSelectedEnemyId(enemy.id)
                }
              >
                <div className="unit-level">
                  Lv. 10
                </div>

                <div className="unit-avatar">
                  {enemy.hp > 0
                    ? enemy.icon
                    : "💀"}
                </div>

                <strong>{enemy.name}</strong>

                <HpBar
                  hp={enemy.hp}
                  maxHp={enemy.maxHp}
                />

                <small>
                  {enemy.hp} / {enemy.maxHp}
                </small>
              </button>
            ))}
          </div>
        </div>

        <div className="battle-divider">
          <span>VS</span>
          <small>ХІД {turn}</small>
        </div>

        <div className="battle-team battle-team--player">
          <div className="team-title">
            <span>🦸 ТВОЯ КОМАНДА</span>
            <strong>
              {aliveHeroes.length}/3
            </strong>
          </div>

          <div className="battle-formation">
            {heroes.map((hero) => (
              <button
                type="button"
                key={hero.id}
                disabled={hero.hp <= 0}
                className={`battle-unit ${
                  selectedHeroId === hero.id
                    ? "battle-unit--selected"
                    : ""
                } ${
                  hero.hp <= 0
                    ? "battle-unit--dead"
                    : ""
                }`}
                onClick={() =>
                  setSelectedHeroId(hero.id)
                }
              >
                <div className="unit-level">
                  Lv. {hero.level}
                </div>

                <div className="unit-avatar">
                  {hero.hp > 0
                    ? hero.icon
                    : "💀"}
                </div>

                <strong>{hero.name}</strong>

                <HpBar
                  hp={hero.hp}
                  maxHp={hero.maxHp}
                />

                <small>
                  {hero.hp} / {hero.maxHp}
                </small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="battle-info">
        <div className="selected-target">
          <span>ЦІЛЬ</span>
          <strong>
            {selectedEnemy?.icon}{" "}
            {selectedEnemy?.name}
          </strong>
        </div>

        <div className="battle-log">
          {logs.map((log, index) => (
            <div key={`${log}-${index}`}>
              {log}
            </div>
          ))}
        </div>
      </section>

      <section className="battle-actions">
        <div className="skill-list">
          {skills.map((skill) => {
            const disabled =
              skill.type === "ultimate" &&
              (!selectedHero ||
                selectedHero.ultimate < 100);

            return (
              <button
                type="button"
                key={skill.id}
                disabled={disabled}
                className={
                  selectedSkill === skill.id
                    ? "skill-button skill-button--selected"
                    : "skill-button"
                }
                onClick={() =>
                  setSelectedSkill(skill.id)
                }
              >
                <span>{skill.icon}</span>

                <strong>{skill.name}</strong>

                <small>
                  {skill.type === "ultimate"
                    ? `${selectedHero?.ultimate ?? 0}%`
                    : skill.type === "skill"
                    ? "×1.5"
                    : "×1"}
                </small>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="attack-button"
          disabled={
            battleState !== "fighting" ||
            animating ||
            !selectedEnemy ||
            selectedEnemy.hp <= 0 ||
            !selectedHero ||
            selectedHero.hp <= 0
          }
          onClick={() => performAttack(false)}
        >
          <span>⚔️</span>
          <strong>АТАКА</strong>
          <small>
            {skills.find(
              (skill) =>
                skill.id === selectedSkill
            )?.name}
          </small>
        </button>
      </section>

      {battleState !== "fighting" && (
        <div className="battle-result-overlay">
          <div className="battle-result">
            <div className="battle-result__icon">
              {battleState === "victory"
                ? "🏆"
                : "💀"}
            </div>

            <span>
              {battleState === "victory"
                ? "БИТВА ЗАВЕРШЕНА"
                : "ПОРАЗКА"}
            </span>

            <h2>
              {battleState === "victory"
                ? "ПЕРЕМОГА!"
                : "Твоя команда переможена"}
            </h2>

            {battleState === "victory" && (
              <div className="battle-rewards">
                <div>
                  <span>💰</span>
                  <strong>+500</strong>
                  <small>Золото</small>
                </div>

                <div>
                  <span>✨</span>
                  <strong>+250</strong>
                  <small>XP</small>
                </div>
              </div>
            )}

            <button
              type="button"
              className="primary-button"
              onClick={restartBattle}
            >
              🔄 Битися знову
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HpBar({ hp, maxHp }) {
  const percentage =
    maxHp > 0
      ? Math.max(
          0,
          Math.min(100, (hp / maxHp) * 100)
        )
      : 0;

  return (
    <div className="hp-bar">
      <div
        className="hp-bar__fill"
        style={{
          width: `${percentage}%`,
        }}
      />
    </div>
  );
            }
