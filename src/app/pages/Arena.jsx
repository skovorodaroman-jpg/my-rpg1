
import React, { useCallback, useEffect, useState } from "react";
import {
  Shield,
  Trophy,
  Sword,
  User,
  Users,
  Home,
  Settings,
  Coins,
  Circle,
  RefreshCw,
  ChevronRight,
  Zap,
  Heart,
  Play,
  RotateCcw,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Arena.css";

export default function Arena({
  username = "Рома",
  playerPower = 0,
  playerLevel = 1,
  rating = 1000,
  gold = 0,
  silver = 0,
  arenaTickets = 0,
  energy = 0,
  maxEnergy = 0,
  onAttack,
  onHome,
  onHeroes,
  onClan,
  onSettings,
}) {
  const [opponent, setOpponent] = useState(null);
  const [loadingOpponent, setLoadingOpponent] = useState(false);
  const [battleLoading, setBattleLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [battleResult, setBattleResult] = useState(null);
  const [runProgress, setRunProgress] = useState(null);
  const [currentEnergy, setCurrentEnergy] = useState(energy);
  const [currentGold, setCurrentGold] = useState(gold);
  const [currentSilver, setCurrentSilver] = useState(silver);

  useEffect(() => {
    setCurrentEnergy(energy);
  }, [energy]);

  useEffect(() => {
    setCurrentGold(gold);
  }, [gold]);

  useEffect(() => {
    setCurrentSilver(silver);
  }, [silver]);

  const loadOpponent = useCallback(async () => {
    setLoadingOpponent(true);
    setMessage("");

    try {
      const { data, error } = await supabase.rpc("get_arena_opponent");

      if (error) throw error;

      // RPC може повертати JSON-об'єкт або масив з одним рядком.
      const enemy = Array.isArray(data) ? data[0] : data;

      if (!enemy?.id) {
        throw new Error("Суперника не знайдено. Спробуй ще раз.");
      }

      setOpponent(enemy);
      setBattleResult(null);
    } catch (error) {
      setMessage(error.message || "Не вдалося завантажити суперника.");
    } finally {
      setLoadingOpponent(false);
    }
  }, []);

  useEffect(() => {
    loadOpponent();
  }, [loadOpponent]);

  const getOpponentPower = (enemy) => {
    if (!enemy) return 0;

    return (
      Number(enemy.power) ||
      Number(enemy.base_attack || 0) + Number(enemy.base_defense || 0)
    );
  };

  const performSingleBattle = async () => {
    if (!opponent || battleLoading) return;

    setBattleLoading(true);
    setMessage("");
    setBattleResult(null);

    try {
      const { data: startData, error: startError } = await supabase.rpc(
        "start_arena_battle",
        { p_opponent_id: opponent.id }
      );

      if (startError) throw startError;

      const battleId = startData?.battle_id;

      if (!battleId) {
        throw new Error("Сервер не повернув ID бою.");
      }

      const { data: resultData, error: resultError } = await supabase.rpc(
        "finish_arena_battle",
        { p_battle_id: battleId }
      );

      if (resultError) throw resultError;

      setBattleResult(resultData);
      setCurrentEnergy((previous) => Math.max(0, previous - 1));

      if (resultData?.silver) {
        setCurrentSilver((previous) => previous + Number(resultData.silver));
      }

      setMessage(
        resultData?.result === "win"
          ? `Перемога! +${Number(resultData.silver || 0).toLocaleString("uk-UA")} срібла`
          : "Поразка. Спробуй іншого суперника."
      );

      if (onAttack) {
        onAttack({
          mode: "arena",
          opponent,
          result: resultData,
        });
      }

      // Після бою показуємо наступного супротивника.
      await loadOpponent();
    } catch (error) {
      setMessage(error.message || "Не вдалося провести бій.");
    } finally {
      setBattleLoading(false);
    }
  };

  const runAllEnergyBattles = async () => {
    if (runLoading) return;

    setRunLoading(true);
    setMessage("");
    setRunProgress(null);

    try {
      // Створює серію та списує 1 золото за її запуск.
      const { data: runData, error: runError } = await supabase.rpc(
        "use_all_arena_energy"
      );

      if (runError) throw runError;

      const runId = runData?.run_id;
      const total = Number(runData?.total_battles || 0);

      if (!runId || total <= 0) {
        throw new Error("Немає енергії для запуску серії боїв.");
      }

      setCurrentGold(Number(runData.gold_remaining ?? currentGold - 1));

      let completed = 0;
      let wins = 0;
      let losses = 0;

      setRunProgress({
        total,
        completed: 0,
        wins: 0,
        losses: 0,
      });

      // Обробляємо серію порціями максимум по 5 боїв.
      // Обмеження на кількість викликів захищає UI від нескінченного циклу.
      for (let attempt = 0; attempt < 100 && completed < total; attempt++) {
        const { data, error } = await supabase.rpc(
          "process_arena_battle_run",
          {
            p_run_id: runId,
            p_limit: 5,
          }
        );

        if (error) throw error;

        const processed = Number(data?.processed_now || 0);

        if (processed <= 0 && data?.status !== "completed") {
          throw new Error(
            "Серія зупинилася без прогресу. Перевір енергію та статус боїв."
          );
        }

        completed = Number(data?.completed_battles ?? completed + processed);

        // RPC повертає кількість перемог/поразок саме в поточній порції.
        wins += Number(data?.wins_now || 0);
        losses += Number(data?.losses_now || 0);

        setRunProgress({
          total,
          completed,
          wins,
          losses,
        });

        if (data?.status === "completed") break;
      }

      setCurrentEnergy(0);
      setMessage(
        `Серію завершено: перемог ${wins}, поразок ${losses}.`
      );
    } catch (error) {
      setMessage(error.message || "Не вдалося завершити автоматичну серію.");
    } finally {
      setRunLoading(false);
    }
  };

  const restoreAndFight = async () => {
    if (runLoading) return;

    setRunLoading(true);
    setMessage("");

    try {
      // Коли пакетний режим відкрито — 5 відновлень,
      // інакше виконуємо одне.
      const times = arenaTickets >= 5 ? 5 : 1;

      const { data: restoreData, error: restoreError } = await supabase.rpc(
        "restore_arena_energy_batch",
        { p_times: times }
      );

      if (restoreError) throw restoreError;

      setCurrentEnergy(Number(restoreData?.energy || maxEnergy));
      setCurrentGold(Number(restoreData?.gold_remaining ?? currentGold));

      setMessage(
        `Енергію відновлено ${times} раз${times === 1 ? "" : "ів"}. Запускаю бої…`
      );

      // Після відновлення запускаємо серію.
      // Вона окремо списує 1 золото за запуск.
      const { data: runData, error: runError } = await supabase.rpc(
        "use_all_arena_energy"
      );

      if (runError) throw runError;

      const runId = runData?.run_id;
      const total = Number(runData?.total_battles || 0);

      if (!runId || total <= 0) {
        throw new Error("Енергію відновлено, але серію боїв не створено.");
      }

      setCurrentGold(Number(runData.gold_remaining ?? currentGold - 1));

      let completed = 0;
      let wins = 0;
      let losses = 0;

      setRunProgress({ total, completed: 0, wins: 0, losses: 0 });

      for (let attempt = 0; attempt < 100 && completed < total; attempt++) {
        const { data, error } = await supabase.rpc(
          "process_arena_battle_run",
          { p_run_id: runId, p_limit: 5 }
        );

        if (error) throw error;

        const processed = Number(data?.processed_now || 0);

        if (processed <= 0 && data?.status !== "completed") {
          throw new Error("Автоматична серія зупинилася.");
        }

        completed = Number(data?.completed_battles ?? completed + processed);
        wins += Number(data?.wins_now || 0);
        losses += Number(data?.losses_now || 0);

        setRunProgress({ total, completed, wins, losses });

        if (data?.status === "completed") break;
      }

      setCurrentEnergy(0);
      setMessage(`Готово! Перемог: ${wins}, поразок: ${losses}.`);
    } catch (error) {
      setMessage(error.message || "Не вдалося відновити енергію та провести бої.");
    } finally {
      setRunLoading(false);
    }
  };

  const opponentName = opponent?.name || "Пошук суперника";
  const opponentLevel = Number(opponent?.level || 1);
  const opponentPower = getOpponentPower(opponent);

  return (
    <div className="arena-page">
      <main className="arena-container">
        <header className="arena-header">
          <div className="arena-title">Арена</div>

          <div className="arena-header-resources">
            <span>
              <Trophy size={13} />
              {Number(rating).toLocaleString("uk-UA")}
            </span>

            <span>
              <Zap size={13} />
              {currentEnergy}/{maxEnergy}
            </span>
          </div>
        </header>

        <section className="arena-league">
          <div className="league-left">
            <Shield size={15} />
            <span>Ліга Світла</span>
          </div>

          <div className="league-right">
            <Trophy size={14} />
            <span>Рейтинг арени</span>
          </div>
        </section>

        <div className="arena-subtitle">
          Перемагай суперників та отримуй нагороди!
        </div>

        <section className="opponent-section">
          <div className="opponent-header">
            <div className="opponent-name">
              <span className="enemy-dot">●</span>
              {opponentName}
            </div>

            <div className="opponent-power">
              Міць: <Sword size={13} />
              {opponentPower.toLocaleString("uk-UA")}
            </div>
          </div>

          <div className="opponent-image-wrapper">
            {opponent?.image_url ? (
              <img
                src={opponent.image_url}
                alt={opponentName}
                className="opponent-image"
              />
            ) : (
              <div className="opponent-image opponent-image-placeholder">
                <Shield size={54} />
              </div>
            )}

            <div className="image-overlay">
              <div className="opponent-level">
                Рівень {opponentLevel}
              </div>
            </div>
          </div>

          {/* Один супротивник — без команди з трьох героїв */}
          <div className="arena-team">
            <div className="arena-hero">
              <div className="hero-avatar">
                <User size={19} />
              </div>
              <div className="hero-name">{opponentName}</div>
              <div className="hero-level">Ур. {opponentLevel}</div>
            </div>
          </div>

          <div className="attack-wrapper">
            <button
              className="attack-button"
              onClick={performSingleBattle}
              disabled={!opponent || battleLoading || currentEnergy <= 0}
            >
              <Sword size={15} />
              {battleLoading ? "Бій..." : "Атакувати"}
            </button>
          </div>

          <button
            className="change-opponent"
            onClick={loadOpponent}
            disabled={loadingOpponent || battleLoading || runLoading}
          >
            <RefreshCw
              size={12}
              className={loadingOpponent ? "rotate-icon" : ""}
            />
            {loadingOpponent ? "Пошук..." : "Змінити суперника"}
          </button>
        </section>

        {battleResult && (
          <section className="arena-result">
            <strong>
              {battleResult.result === "win" ? "Перемога!" : "Поразка"}
            </strong>
            <div>
              Нагорода: {Number(battleResult.silver || 0).toLocaleString("uk-UA")} срібла
            </div>
            <div>
              Досвід: {Number(battleResult.experience || 0).toLocaleString("uk-UA")}
            </div>
          </section>
        )}

        <section className="my-power">
          <div className="my-power-title">
            Моя міць:
            <Sword size={14} />
            {Number(playerPower).toLocaleString("uk-UA")}
          </div>

          <div className="my-power-hint">
            • Сильніший суперник може принести більшу нагороду.
          </div>
        </section>

        <section className="arena-auto">
          <h3>Автоматичні бої</h3>

          <button
            className="attack-button"
            onClick={runAllEnergyBattles}
            disabled={runLoading || currentEnergy <= 0}
          >
            <Play size={15} />
            {runLoading ? "Проводжу бої..." : "Використати всю енергію"}
          </button>

          <button
            className="change-opponent"
            onClick={restoreAndFight}
            disabled={runLoading}
          >
            <RotateCcw size={13} />
            Відновити й провести бої
          </button>

          {runProgress && (
            <div className="arena-run-progress">
              <div>
                Прогрес: {runProgress.completed}/{runProgress.total}
              </div>
              <div>
                Перемог: {runProgress.wins} · Поразок: {runProgress.losses}
              </div>
              <progress
                value={runProgress.completed}
                max={runProgress.total || 1}
              />
            </div>
          )}

          {message && (
            <div className="arena-message" role="status">
              {message}
            </div>
          )}
        </section>

        <nav className="arena-navigation">
          <button onClick={onHeroes}>
            <span>
              <User size={15} />
              Мій герой
            </span>
            <ChevronRight size={14} />
          </button>

          <button onClick={onClan}>
            <span>
              <Users size={15} />
              Мій клан
            </span>
            <ChevronRight size={14} />
          </button>

          <button onClick={onHome}>
            <span>
              <Home size={15} />
              На головну
            </span>
            <ChevronRight size={14} />
          </button>
        </nav>

        <section className="arena-profile">
          <div className="profile-top">
            <div className="profile-name">
              <User size={14} />
              {username}
            </div>

            <button className="settings-button" onClick={onSettings}>
              <Settings size={13} />
              Налаштування
            </button>
          </div>

          <div className="profile-resources">
            <span>
              <Circle size={11} fill="currentColor" />
              {playerLevel}
            </span>
            <span>
              <Coins size={12} />
              {Number(currentGold).toLocaleString("uk-UA")}
            </span>
            <span>
              ⚪ {formatNumber(Number(currentSilver))}
            </span>
          </div>
        </section>

        <footer className="arena-footer">
          <div className="footer-links">
            <button>Чат</button>
            <span>|</span>
            <button>Рейтинг</button>
            <span>|</span>
            <button>Коментарі</button>
            <span>|</span>
            <button>Інше</button>
          </div>

          <div className="online">Онлайн: —</div>

          <div className="copyright">
            © 2026 «Хроніки Згаслого Світанку»
          </div>
        </footer>
      </main>
    </div>
  );
}

function formatNumber(number) {
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${Math.floor(number / 1000)}k`;
  }

  return number.toLocaleString("uk-UA");
    }
        
