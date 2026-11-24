
import React, { useEffect, useState } from "react";
import {
  Swords,
  Shield,
  Heart,
  Clock,
  Zap,
  RotateCcw,
  Skull,
  CircleDot,
} from "lucide-react";

const MODES = {
  arena: "Арена",
  league: "Ліга",
  cave: "Печера",
  colosseum: "Колізей",
  altar: "Стародавні Вівтарі",
};

export default function UniversalBattle({
  mode = "league",
  hero = {},
  opponent = {},
  duration = 300,
  onAttack,
  onDefend,
  onSkill,
  onFinish,
  onExit,
  disabled = false,
}) {
  const [heroHp, setHeroHp] = useState(
    hero.hp ?? hero.maxHp ?? 1000
  );
  const [enemyHp, setEnemyHp] = useState(
    opponent.hp ?? opponent.maxHp ?? 1000
  );
  const [timeLeft, setTimeLeft] = useState(duration);
  const [logs, setLogs] = useState([
    "Бій розпочався!",
  ]);
  const [finished, setFinished] = useState(false);
  const [defending, setDefending] = useState(false);

  const heroMaxHp = hero.maxHp ?? 1000;
  const enemyMaxHp = opponent.maxHp ?? 1000;

  const ringsEnabled = mode !== "arena";

  useEffect(() => {
    setHeroHp(hero.hp ?? hero.maxHp ?? 1000);
    setEnemyHp(opponent.hp ?? opponent.maxHp ?? 1000);
    setTimeLeft(duration);
    setLogs(["Бій розпочався!"]);
    setFinished(false);
    setDefending(false);
  }, [hero.id, opponent.id, mode, duration]);

  useEffect(() => {
    if (finished || disabled) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [finished, disabled]);

  useEffect(() => {
    if (!finished) return;

    onFinish?.({
      heroHp,
      enemyHp,
      result:
        heroHp <= 0
          ? "defeat"
          : enemyHp <= 0
          ? "victory"
          : "timeout",
    });
  }, [finished]);

  const addLog = (message) => {
    setLogs((prev) => [message, ...prev].slice(0, 30));
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const getPercent = (current, max) =>
    Math.max(0, Math.min(100, (current / max) * 100));

  const attack = async () => {
    if (finished || disabled || enemyHp <= 0 || heroHp <= 0) return;

    if (!onAttack) {
      addLog("Бойовий рушій ще не підключений.");
      return;
    }

    try {
      const result = await onAttack({
        heroHp,
        enemyHp,
        mode,
        defending,
      });

      if (!result) return;

      if (typeof result.enemyHp === "number") {
        setEnemyHp(Math.max(0, result.enemyHp));
      }

      if (typeof result.heroHp === "number") {
        setHeroHp(Math.max(0, result.heroHp));
      }

      if (result.message) addLog(result.message);

      if (
        result.enemyHp <= 0 ||
        result.heroHp <= 0
      ) {
        setFinished(true);
      }
    } catch (error) {
      addLog("Не вдалося виконати атаку.");
      console.error(error);
    }
  };

  const defend = async () => {
    if (finished || disabled || heroHp <= 0) return;

    setDefending(true);

    try {
      const result = await onDefend?.({
        heroHp,
        enemyHp,
        mode,
      });

      if (result?.heroHp !== undefined) {
        setHeroHp(Math.max(0, result.heroHp));
      }

      addLog(result?.message || "Герой зайняв захисну позицію.");
    } catch (error) {
      addLog("Не вдалося активувати захист.");
      console.error(error);
    }
  };

  const useSkill = async () => {
    if (finished || disabled || !onSkill) return;

    try {
      const result = await onSkill({
        heroHp,
        enemyHp,
        mode,
      });

      if (result?.heroHp !== undefined) {
        setHeroHp(Math.max(0, result.heroHp));
      }

      if (result?.enemyHp !== undefined) {
        setEnemyHp(Math.max(0, result.enemyHp));
      }

      addLog(result?.message || "Здібність використана.");

      if (result?.heroHp <= 0 || result?.enemyHp <= 0) {
        setFinished(true);
      }
    } catch (error) {
      addLog("Не вдалося використати здібність.");
      console.error(error);
    }
  };

  const resultText =
    heroHp <= 0
      ? "Поразка"
      : enemyHp <= 0
      ? "Перемога"
      : "Час бою вичерпано";

  return (
    <div className="w-full max-w-[600px] mx-auto rounded-2xl overflow-hidden bg-[#120E0B] text-[#E8D5B5] border border-[#60452C] shadow-2xl">

      {/* HEADER */}
      <div className="flex items-center justify-between p-4 bg-[#1D1714] border-b border-[#60452C]">
        <div>
          <div className="text-xs text-[#B99A70]">РЕЖИМ БОЮ</div>
          <div className="font-bold text-lg">
            {MODES[mode] || "Бій"}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#E8A23B] font-bold">
          <Clock size={18} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* FIGHTERS */}
      <div className="grid grid-cols-2 gap-3 p-3">

        <FighterCard
          name={hero.name || "Твій герой"}
          level={hero.level}
          hp={heroHp}
          maxHp={heroMaxHp}
          attack={hero.attack}
          defense={hero.defense}
          image={hero.image}
          isHero
        />

        <FighterCard
          name={opponent.name || "Супротивник"}
          level={opponent.level}
          hp={enemyHp}
          maxHp={enemyMaxHp}
          attack={opponent.attack}
          defense={opponent.defense}
          image={opponent.image}
        />

      </div>

      {/* RINGS */}
      {ringsEnabled && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-[#211A14] border border-[#70502B]">
          <div className="flex items-center gap-2 mb-2 text-[#E8A23B] font-bold text-sm">
            <CircleDot size={16} />
            Магічні кільця
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <Ring name="Ярості" />
            <Ring name="Воскресіння" />
            <Ring name="Захисту" />
          </div>

          <div className="text-[10px] text-[#A99376] mt-2 text-center">
            Кільця активуються автоматично згідно з бойовими умовами.
          </div>
        </div>
      )}

      {/* BATTLE LOG */}
      <div className="mx-3 mb-3 p-3 rounded-xl bg-[#1B1714] border border-[#493829]">
        <div className="text-xs text-[#D2A66D] font-bold mb-2">
          ЖУРНАЛ БОЮ
        </div>

        <div className="space-y-1 max-h-32 overflow-y-auto">
          {logs.map((log, index) => (
            <div
              key={`${index}-${log}`}
              className="text-xs text-[#D9C7AD]"
            >
              {log}
            </div>
          ))}
        </div>
      </div>

      {/* ACTIONS */}
      {!finished ? (
        <div className="grid grid-cols-3 gap-2 p-3 pt-0">
          <button
            disabled={disabled || !onAttack}
            onClick={attack}
            className="flex flex-col items-center justify-center gap-1 rounded-xl p-3 bg-[#743C20] hover:bg-[#92502B] disabled:opacity-40"
          >
            <Swords size={22} />
            <span className="text-xs font-bold">Атака</span>
          </button>

          <button
            disabled={disabled}
            onClick={defend}
            className="flex flex-col items-center justify-center gap-1 rounded-xl p-3 bg-[#354238] hover:bg-[#465C49] disabled:opacity-40"
          >
            <Shield size={22} />
            <span className="text-xs font-bold">Захист</span>
          </button>

          <button
            disabled={disabled || !onSkill}
            onClick={useSkill}
            className="flex flex-col items-center justify-center gap-1 rounded-xl p-3 bg-[#44345D] hover:bg-[#594477] disabled:opacity-40"
          >
            <Zap size={22} />
            <span className="text-xs font-bold">Здібність</span>
          </button>
        </div>
      ) : (
        <div className="p-4 text-center">
          <div className="text-xl font-bold text-[#E8A23B] mb-2">
            {resultText}
          </div>

          <button
            onClick={onExit}
            className="px-6 py-2 rounded-xl bg-[#743C20] font-bold"
          >
            Завершити бій
          </button>
        </div>
      )}

    </div>
  );
}

function FighterCard({
  name,
  level,
  hp,
  maxHp,
  attack,
  defense,
  image,
  isHero,
}) {
  const percent = Math.max(
    0,
    Math.min(100, (hp / maxHp) * 100)
  );

  return (
    <div className="rounded-xl bg-[#211A15] border border-[#57432E] p-2 min-w-0">
      <div className="aspect-square rounded-lg overflow-hidden bg-[#30241B] mb-2">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isHero ? (
              <Heart size={42} className="text-[#C78D65]" />
            ) : (
              <Skull size={42} className="text-[#A98B70]" />
            )}
          </div>
        )}
      </div>

      <div className="font-bold text-sm truncate">{name}</div>
      <div className="text-[10px] text-[#B99A70] mb-2">
        Рівень {level ?? 1}
      </div>

      <div className="flex justify-between text-[10px] mb-1">
        <span>HP</span>
        <span>{Math.max(0, hp)} / {maxHp}</span>
      </div>

      <div className="h-2 rounded-full bg-[#4C2525] overflow-hidden mb-2">
        <div
          className="h-full bg-[#D64C4C] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="text-[10px] text-[#C6A981] space-y-1">
        <div>Сила: {attack ?? 0}</div>
        <div>Броня: {defense ?? 0}</div>
      </div>
    </div>
  );
}

function Ring({ name }) {
  return (
    <div className="rounded-lg bg-[#30251A] p-2 border border-[#60472B]">
      <CircleDot
        size={18}
        className="mx-auto mb-1 text-[#E8A23B]"
      />
      <div>{name}</div>
    </div>
  );
}
