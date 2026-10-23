
import React, { useState } from "react";
import { Swords, Shield, Heart, Zap, Trophy } from "lucide-react";
import "./Arena.css";

export default function Arena({
  hero,
  enemy,
  leagueName = "Ліга обраних",
  onOpenLeague,
  onFight,
  onRecover,
}) {
  const [battleResult, setBattleResult] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [totalBattles, setTotalBattles] = useState(0);
  const [restClicks, setRestClicks] = useState(0);
  const [batchEnabled, setBatchEnabled] = useState(false);
  const [showBatchResult, setShowBatchResult] = useState(false);

  const energy = Number(hero?.energy || 0);
  const gold = Number(hero?.gold || 0);
  const potionPrice = restClicks >= 25 ? 4 : 1;

  const fmt = (n) => Number(n || 0).toLocaleString("uk-UA");

  async function fight(count = 1) {
    if (!enemy || !onFight) return;

    setBattleResult(null);
    setShowBatchResult(false);

    try {
      // onFight має виконувати бій на сервері та повертати результат.
      const result = await onFight(enemy, count);

      setBattleResult(result);
      setTotalBattles((prev) => prev + Number(result?.battles || count));
      setShowBatchResult(count > 1);
    } catch (err) {
      setBattleResult({
        win: false,
        message: err?.message || "Не вдалося провести бій.",
      });
    }
  }

  async function useAllEnergy() {
    if (energy <= 0 || gold < 1) return;

    // Сервер повинен списати 1 золото і провести бої на всю енергію.
    await fight(energy);
  }

  async function recoverAndFight(multiplier = 1) {
    if (!onRecover) return;

    const price = potionPrice * multiplier;

    if (gold < price) {
      setBattleResult({ win: false, message: "Недостатньо золота." });
      return;
    }

    try {
      // Сервер відновлює HP та енергію і проводить задану кількість циклів.
      const result = await onRecover({
        cycles: multiplier,
        price,
      });

      setBattleResult(result);
      setTotalBattles((prev) => prev + Number(result?.battles || 0));
      setRestClicks((prev) => prev + multiplier);

      if (restClicks + multiplier >= 5) {
        setBatchEnabled(true);
      }
    } catch (err) {
      setBattleResult({
        win: false,
        message: err?.message || "Не вдалося відновити героя.",
      });
    }
  }

  if (!hero || !enemy) {
    return <div className="arena-page">Завантаження арени...</div>;
  }

  return (
    <main className="arena-page">
      <div className="arena-heading">
        <Swords />
        <h1>Арена</h1>
      </div>

      <p className="arena-description">
        Унікальні поля битв. Перемагай ворогів і отримуй срібло та досвід.
      </p>

      {/* Кнопка переходу до окремої сторінки Ліги */}
      <button className="arena-league-link" onClick={onOpenLeague}>
        <Trophy size={17} />
        {leagueName}
        <span>›</span>
      </button>

      {/* Завжди один поточний супротивник */}
      <section className="arena-enemy">
        <div className="arena-enemy-faction">
          Фракція ворога: {enemy.faction || "Протилежна"}
        </div>

        <div className="arena-enemy-art">
          {enemy.image ? (
            <img src={enemy.image} alt={enemy.name} />
          ) : (
            <Shield size={70} />
          )}
        </div>

        <h2>{enemy.name}</h2>
        <div className="arena-enemy-power">
          <Swords size={15} /> Мощь: {fmt(enemy.power)}
        </div>

        <div className="arena-enemy-stats">
          <span><Heart /> {fmt(enemy.hp)}</span>
          <span><Zap /> {fmt(enemy.luck)}</span>
          <span><Shield /> {fmt(enemy.armor)}</span>
        </div>

        <button
          className="arena-details-link"
          onClick={() => setDetailsOpen((v) => !v)}
        >
          {detailsOpen ? "Сховати деталі бою" : "Деталі бою"}
        </button>

        {detailsOpen && (
          <div className="arena-details">
            <p>Супротивник: {enemy.name}</p>
            <p>Мощь: {fmt(enemy.power)}</p>
            <p>Життя: {fmt(enemy.hp)}</p>
            <p>Удача: {fmt(enemy.luck)}</p>
            <p>Броня: {fmt(enemy.armor)}</p>
          </div>
        )}
      </section>

      {/* Нагорода та звичайна атака */}
      <section className="arena-reward">
        <h3>Нагорода за перемогу</h3>
        <div>◉ Срібло: {fmt(enemy.silverReward)}</div>
        <div>✧ Досвід: {fmt(enemy.expReward)}</div>

        <button
          className="arena-attack"
          disabled={energy <= 0}
          onClick={() => fight(1)}
        >
          Атакувати
        </button>

        {/* Після першої атаки доступна оплата всієї енергії */}
        {totalBattles > 0 && (
          <button
            className="arena-energy-button"
            disabled={energy <= 0 || gold < 1}
            onClick={useAllEnergy}
          >
            Використати всю енергію за 1 золото
          </button>
        )}

        {showBatchResult && (
          <div className="arena-batch-result">
            Проведено боїв: {totalBattles}
          </div>
        )}
      </section>

      {/* Автоматичне відновлення */}
      {totalBattles > 0 && (
        <section className="arena-recovery">
          <h3>Відновлення</h3>
          <p>Життя та енергія відновлюються до 100%.</p>

          <button
            className="arena-recover"
            disabled={gold < potionPrice}
            onClick={() => recoverAndFight(1)}
          >
            Відновити та провести бої · {potionPrice} золота
          </button>

          {batchEnabled && (
            <button
              className="arena-recover arena-recover-batch"
              disabled={gold < potionPrice * 5}
              onClick={() => recoverAndFight(5)}
            >
              5 відновлень і боїв · {potionPrice * 5} золота
            </button>
          )}

          <small>
            Виконано відновлень: {restClicks}/25
          </small>

          {restClicks >= 25 && (
            <p className="arena-price-warning">
              Ціна відновлення збільшена у 4 рази до кінця доби.
            </p>
          )}
        </section>
      )}

      {battleResult && (
        <section className={`arena-result ${battleResult.win ? "win" : "loss"}`}>
          <h3>{battleResult.win ? "Перемога!" : "Результат бою"}</h3>
          <p>{battleResult.message}</p>
          {battleResult.silver && <p>Срібло: +{fmt(battleResult.silver)}</p>}
          {battleResult.experience && <p>Досвід: +{fmt(battleResult.experience)}</p>}
          {battleResult.battles && <p>Боїв: {fmt(battleResult.battles)}</p>}
        </section>
      )}

      <footer className="arena-footer">
        <span><Heart size={14} /> HP: {fmt(hero.hp)}</span>
        <span><Zap size={14} /> Енергія: {energy}</span>
        <span>◉ {fmt(gold)} золота</span>
      </footer>
    </main>
  );
      }
