
import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Swords,
  Shield,
  Heart,
  Trophy,
  Zap,
  ChevronLeft,
  User,
  RefreshCw,
} from "lucide-react";
import "./Arena.css";

const DEMO_ENEMIES = [
  { id: "enemy-1", name: "Рембу", level: 28, power: 48037, hp: 9800, luck: 55, armor: 1420 },
  { id: "enemy-2", name: "Figvam", level: 27, power: 46606, hp: 9200, luck: 48, armor: 1300 },
  { id: "enemy-3", name: "Темний Вершник", level: 32, power: 61200, hp: 14000, luck: 82, armor: 2100 },
  { id: "enemy-4", name: "Кривавий Страж", level: 35, power: 70300, hp: 16600, luck: 65, armor: 2700 },
];

const number = (value) =>
  Number(value || 0).toLocaleString("uk-UA");

function getPower(profile) {
  // Якщо в профілі вже є power, використовуємо його.
  // Інакше — умовна потужність за рівнем.
  return Number(profile?.power || (Number(profile?.level || 1) * 1600 + 10000));
}

function getStats(profile) {
  return {
    power: getPower(profile),
    hp: Number(profile?.hp || 10000),
    luck: Number(profile?.luck || 50),
    armor: Number(profile?.armor || 1000),
  };
}

export default function Arena() {
  const [hero, setHero] = useState(null);
  const [enemies, setEnemies] = useState(DEMO_ENEMIES);
  const [selectedEnemy, setSelectedEnemy] = useState(null);
  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attacking, setAttacking] = useState(false);
  const [error, setError] = useState("");
  const [rank, setRank] = useState(1000);
  const [battleCount, setBattleCount] = useState(0);

  const loadArena = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Спочатку увійди у свій акаунт.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      setHero(profile);

      // Підтягуємо інших гравців. Якщо RLS не дозволяє читати
      // чужі профілі або список порожній — використовуємо демо-ворогів.
      const { data: players, error: playersError } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .order("level", { ascending: false })
        .limit(8);

      if (!playersError && players?.length) {
        const mapped = players.map((player, index) => {
          const stats = getStats(player);

          return {
            id: player.id,
            name: player.display_name || player.username || `Гравець ${index + 1}`,
            level: Number(player.level || 1),
            power: stats.power,
            hp: stats.hp,
            luck: stats.luck,
            armor: stats.armor,
            profile: player,
          };
        });

        setEnemies(mapped);
      } else {
        setEnemies(DEMO_ENEMIES);
      }
    } catch (err) {
      setError(err.message || "Не вдалося завантажити арену.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArena();
  }, [loadArena]);

  const attack = async (enemy) => {
    if (!hero || attacking) return;

    const energy = Number(hero.energy ?? 0);

    if (energy <= 0) {
      setBattle({
        win: false,
        title: "Немає енергії",
        message: "Енергія закінчилася. Віднови її, щоб продовжити бої.",
      });
      return;
    }

    setAttacking(true);
    setSelectedEnemy(enemy);
    setBattle(null);
    setError("");

    try {
      const my = getStats(hero);
      const foe = getStats(enemy);

      // Бойовий рейтинг. Удача додає випадковий бонус.
      const myScore =
        my.power +
        my.armor * 2 +
        my.luck * 35 +
        Math.random() * my.power * 0.12;

      const foeScore =
        foe.power +
        foe.armor * 2 +
        foe.luck * 35 +
        Math.random() * foe.power * 0.12;

      const win = myScore >= foeScore;
      const goldReward = win ? Math.round(500 + foe.power * 0.012) : 0;
      const expReward = win ? Math.round(foe.power * 0.004) : 25;

      const newEnergy = Math.max(0, energy - 1);
      const newGold = Number(hero.gold || 0) + goldReward;
      const newExperience = Number(hero.experience || 0) + expReward;

      // Зберігаємо ресурси в існуючому профілі.
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          energy: newEnergy,
          gold: newGold,
          experience: newExperience,
        })
        .eq("id", hero.id)
        .select("*")
        .single();

      if (updateError) throw updateError;

      setHero(updatedProfile);
      setBattleCount((count) => count + 1);

      // Рейтинг тут поки локальний: для справжньої таблиці ліги
      // потрібна серверна логіка та відповідне поле/таблиця.
      if (win) setRank((current) => Math.max(1, current - 1));

      setBattle({
        win,
        title: win ? "Перемога!" : "Поразка",
        message: win
          ? `Ти переміг ${enemy.name}!`
          : `${enemy.name} виявився сильнішим цього разу.`,
        goldReward,
        expReward,
        myScore: Math.round(myScore),
        foeScore: Math.round(foeScore),
      });
    } catch (err) {
      setError(err.message || "Не вдалося зберегти результат бою.");
    } finally {
      setAttacking(false);
    }
  };

  if (loading) {
    return (
      <div className="arena-loading">
        <RefreshCw className="arena-spin" />
        <p>Завантаження арени...</p>
      </div>
    );
  }

  const heroStats = getStats(hero);

  return (
    <div className="arena-page">
      <div className="arena-top">
        <div className="arena-brand">
          <Swords size={24} />
          <div>
            <strong>АРЕНА</strong>
            <small>ЛІГА ВОЇНІВ</small>
          </div>
        </div>

        <div className="arena-currency">
          <span><Zap size={14} /> {hero?.energy ?? 0}</span>
          <span>◉ {number(hero?.gold)}</span>
        </div>
      </div>

      <div className="arena-league">
        <span><Shield size={15} /> Ліга обраних</span>
        <strong><Trophy size={15} /> {rank} місце</strong>
      </div>

      {!selectedEnemy && (
        <>
          <section className="arena-hero-card">
            <div className="arena-overline">ТВІЙ ЧЕМПІОН</div>
            <div className="arena-hero-avatar"><User size={42} /></div>

            <h2>{hero?.display_name || hero?.username || "Мій герой"}</h2>
            <div className="arena-level">РІВЕНЬ {hero?.level || 1}</div>

            <div className="arena-power">
              <Swords size={17} />
              МОЩЬ <b>{number(heroStats.power)}</b>
            </div>

            <div className="arena-stats">
              <Stat icon={<Heart />} label="Життя" value={heroStats.hp} />
              <Stat icon={<Zap />} label="Удача" value={heroStats.luck} />
              <Stat icon={<Shield />} label="Броня" value={heroStats.armor} />
            </div>

            <button
              className="arena-primary"
              onClick={() => setSelectedEnemy(enemies[0] || null)}
            >
              ОБРАТИ СУПРОТИВНИКА <span>›</span>
            </button>
          </section>

          <div className="arena-summary">
            <div><small>ЗОЛОТО</small><b>◉ {number(hero?.gold)}</b></div>
            <div><small>ДОСВІД</small><b>✧ {number(hero?.experience)}</b></div>
            <div><small>БОЇ</small><b>{battleCount}</b></div>
          </div>
        </>
      )}

      {selectedEnemy && (
        <section className="arena-fight-view">
          <button className="arena-back" onClick={() => {
            setSelectedEnemy(null);
            setBattle(null);
          }}>
            <ChevronLeft size={18} /> До списку ворогів
          </button>

          <div className="arena-versus">
            <div className="arena-fighter">
              <div className="arena-figure"><User size={35} /></div>
              <b>{hero?.display_name || hero?.username || "Герой"}</b>
              <small>Мощь {number(heroStats.power)}</small>
            </div>
            <div className="arena-vs">VS</div>
            <div className="arena-fighter">
              <div className="arena-figure enemy-figure"><Shield size={35} /></div>
              <b>{selectedEnemy.name}</b>
              <small>Мощь {number(selectedEnemy.power)}</small>
            </div>
          </div>

          {battle && (
            <div className={`arena-result ${battle.win ? "is-win" : "is-loss"}`}>
              <h2>{battle.title}</h2>
              <p>{battle.message}</p>
              {battle.goldReward > 0 && (
                <div className="arena-reward">
                  +{number(battle.goldReward)} золота · +{number(battle.expReward)} досвіду
                </div>
              )}
              {battle.myScore && (
                <small>
                  Твій бойовий рейтинг: {number(battle.myScore)}<br />
                  Рейтинг ворога: {number(battle.foeScore)}
                </small>
              )}
            </div>
          )}

          <button
            className="arena-primary arena-attack"
            disabled={attacking || Number(hero?.energy ?? 0) <= 0}
            onClick={() => attack(selectedEnemy)}
          >
            {attacking ? "БІЙ..." : "⚔ АТАКУВАТИ"}
          </button>

          <div className="arena-energy-note">
            <Zap size={14} /> Кожна атака витрачає 1 енергію.
          </div>
        </section>
      )}

      {!selectedEnemy && (
        <section className="arena-enemies">
          <div className="arena-section-title">
            <h3>СУПРОТИВНИКИ</h3>
            <span>{enemies.length} воїнів</span>
          </div>

          {enemies.map((enemy) => (
            <EnemyCard
              key={enemy.id}
              enemy={enemy}
              onAttack={() => {
                setSelectedEnemy(enemy);
                setBattle(null);
              }}
            />
          ))}
        </section>
      )}

      {error && <div className="arena-error">{error}</div>}

      <div className="arena-bottom-note">
        Чим сильніший супротивник, тим більше нагорода за перемогу.
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="arena-stat">
      <span>{icon}</span>
      <small>{label}</small>
      <b>{number(value)}</b>
    </div>
  );
}

function EnemyCard({ enemy, onAttack }) {
  return (
    <article className="arena-enemy-card">
      <div className="arena-enemy-avatar"><Shield size={25} /></div>

      <div className="arena-enemy-info">
        <b>{enemy.name}</b>
        <small>Рівень {enemy.level} · ⚔ {number(enemy.power)}</small>
        <div className="arena-enemy-stats">
          <span><Heart size={12} /> {number(enemy.hp)}</span>
          <span><Zap size={12} /> {enemy.luck}</span>
          <span><Shield size={12} /> {number(enemy.armor)}</span>
        </div>
      </div>

      <button className="arena-small-attack" onClick={onAttack}>
        Атакувати
      </button>
    </article>
  );
}
