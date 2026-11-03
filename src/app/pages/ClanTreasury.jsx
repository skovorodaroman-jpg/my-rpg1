import React, { useCallback, useEffect, useState } from "react";
import {
  Coins,
  RefreshCw,
  Shield,
  Landmark,
  ArrowDownToLine,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Medal,
  Crown,
  RotateCcw,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./ClanTreasury.css";

const formatNumber = (value) =>
  Math.floor(Number(value) || 0).toLocaleString("uk-UA");

export default function ClanTreasury({ onBack }) {
  const [treasury, setTreasury] = useState(null);
  const [goldRanking, setGoldRanking] = useState([]);
  const [silverRanking, setSilverRanking] = useState([]);
  const [memberRole, setMemberRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resource, setResource] = useState("gold");
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState(null);

  const canReset = ["leader", "deputy"].includes(memberRole);

  const loadTreasury = useCallback(async () => {
    setLoading(true);

    try {
      const [
        treasuryResult,
        authResult,
      ] = await Promise.all([
        supabase.rpc("get_clan_treasury_state"),
        supabase.auth.getUser(),
      ]);

      if (treasuryResult.error) throw treasuryResult.error;
      if (authResult.error) throw authResult.error;

      const result = Array.isArray(treasuryResult.data)
        ? treasuryResult.data[0]
        : treasuryResult.data;

      if (!result) {
        throw new Error("Не вдалося отримати дані казни.");
      }

      setTreasury(result);

      const userId = authResult.data?.user?.id;

      if (!userId) {
        throw new Error("Потрібно увійти в гру.");
      }

      const { data: membership, error: membershipError } =
        await supabase
          .from("clan_members")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

      if (membershipError) throw membershipError;

      setMemberRole(membership?.role || "");
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Помилка завантаження казни.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRankings = useCallback(async () => {
    setRankingLoading(true);

    try {
      const [goldResult, silverResult] = await Promise.all([
        supabase.rpc("get_clan_member_contribution_ranking", {
          p_resource_type: "gold",
        }),
        supabase.rpc("get_clan_member_contribution_ranking", {
          p_resource_type: "silver",
        }),
      ]);

      if (goldResult.error) throw goldResult.error;
      if (silverResult.error) throw silverResult.error;

      setGoldRanking(goldResult.data || []);
      setSilverRanking(silverResult.data || []);
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Не вдалося завантажити рейтинги.",
      });
    } finally {
      setRankingLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadTreasury(), loadRankings()]);
  }, [loadTreasury, loadRankings]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const remaining =
    resource === "gold"
      ? Number(treasury?.remaining_gold || 0)
      : Number(treasury?.remaining_silver || 0);

  const dailyLimit =
    resource === "gold"
      ? Number(treasury?.gold_limit || 0)
      : Number(treasury?.silver_limit || 0);

  const donated =
    resource === "gold"
      ? Number(treasury?.donated_gold_today || 0)
      : Number(treasury?.donated_silver_today || 0);

  async function handleDonate() {
    const value = Math.floor(Number(amount));

    if (!Number.isSafeInteger(value) || value <= 0) {
      setNotice({
        type: "error",
        text: "Введи коректну кількість валюти.",
      });
      return;
    }

    if (value > remaining) {
      setNotice({
        type: "error",
        text: `Сьогодні можна внести ще лише ${formatNumber(remaining)}.`,
      });
      return;
    }

    setDonating(true);
    setNotice(null);

    try {
      const { data, error } = await supabase.rpc(
        "contribute_to_clan_treasury",
        {
          p_resource_type: resource,
          p_amount: value,
        }
      );

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result?.success) {
        throw new Error(
          result?.message || "Не вдалося виконати внесок."
        );
      }

      setAmount("");
      await refreshAll();

      setNotice({
        type: "success",
        text: `До казни внесено ${formatNumber(value)} ${
          resource === "gold" ? "золота" : "срібла"
        }!`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Помилка внесення валюти.",
      });
    } finally {
      setDonating(false);
    }
  }

  async function handleResetRankings() {
    if (!canReset || resetting) return;

    const confirmed = window.confirm(
      "Обнулити рейтинги внесків золота та срібла для всього клану? Баланс казни та валюта гравців не зміняться."
    );

    if (!confirmed) return;

    setResetting(true);
    setNotice(null);

    try {
      const { data, error } = await supabase.rpc(
        "reset_clan_contribution_rankings"
      );

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result?.success) {
        throw new Error(
          result?.message || "Не вдалося обнулити рейтинги."
        );
      }

      await loadRankings();

      setNotice({
        type: "success",
        text: "Рейтинги золота та срібла успішно обнулено!",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Помилка обнулення рейтингів.",
      });
    } finally {
      setResetting(false);
    }
  }

  function RankingList({ title, icon, rows, currency, loading }) {
    return (
      <section className="treasury-ranking">
        <div className="treasury-section-heading">
          {icon}
          <strong>{title}</strong>
        </div>

        {loading ? (
          <div className="treasury-ranking-empty">
            <RefreshCw size={17} className="treasury-spin" />
            Завантаження рейтингу...
          </div>
        ) : rows.length === 0 ? (
          <div className="treasury-ranking-empty">
            Поки що немає учасників для рейтингу.
          </div>
        ) : (
          <div className="treasury-ranking-list">
            {rows.map((player, index) => {
              const position = Number(
                player.rank_position || index + 1
              );

              return (
                <article
                  className={`treasury-ranking-row rank-${position}`}
                  key={player.user_id}
                >
                  <div className="treasury-rank-position">
                    {position === 1 ? (
                      <Crown size={21} />
                    ) : position === 2 ? (
                      <Medal size={21} />
                    ) : position === 3 ? (
                      <Medal size={20} />
                    ) : (
                      `#${position}`
                    )}
                  </div>

                  <div className="treasury-rank-avatar">
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt={player.player_name}
                      />
                    ) : (
                      <Shield size={21} />
                    )}
                  </div>

                  <div className="treasury-rank-info">
                    <strong>{player.player_name}</strong>
                    <small>Учасник клану</small>
                  </div>

                  <div className="treasury-rank-balance">
                    <strong>
                      {formatNumber(player.total_contributed)}
                    </strong>
                    <small>{currency}</small>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  if (loading && !treasury) {
    return (
      <div className="treasury-loading">
        <RefreshCw className="treasury-spin" size={25} />
        <span>Відкриваємо казну клану...</span>
      </div>
    );
  }

  return (
    <main className="treasury-page">
      <header className="treasury-header">
        <button
          type="button"
          className="treasury-back"
          onClick={onBack}
        >
          ← Назад
        </button>

        <div className="treasury-heading-icon">
          <Landmark size={32} />
        </div>

        <h1>Казна клану</h1>
        <p>Спільне багатство — сила всього клану</p>
      </header>

      {notice && (
        <div className={`treasury-notice ${notice.type}`}>
          {notice.type === "success" ? (
            <CheckCircle2 size={19} />
          ) : (
            <AlertCircle size={19} />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      <section className="treasury-balances">
        <article className="treasury-balance-card gold">
          <div className="treasury-balance-icon">🪙</div>
          <span>Золото казни</span>
          <strong>{formatNumber(treasury?.treasury_gold)}</strong>
        </article>

        <article className="treasury-balance-card silver">
          <div className="treasury-balance-icon">⚪</div>
          <span>Срібло казни</span>
          <strong>{formatNumber(treasury?.treasury_silver)}</strong>
        </article>
      </section>

      <section className="treasury-loyalty">
        <div className="treasury-section-heading">
          <Shield size={20} />
          <strong>Твоя лояльність</strong>
        </div>

        <div className="treasury-loyalty-value">
          {Number(treasury?.loyalty_percent || 0)}%
        </div>

        <div className="treasury-progress">
          <span
            style={{
              width: `${Math.min(
                100,
                (Number(treasury?.loyalty_percent || 0) / 75) * 100
              )}%`,
            }}
          />
        </div>

        <small>
          Максимальна лояльність для денного ліміту — 75%.
        </small>
      </section>

      <section className="treasury-donation">
        <div className="treasury-section-heading">
          <Coins size={21} />
          <strong>Добровільний внесок</strong>
        </div>

        <div className="treasury-resource-switch">
          <button
            type="button"
            className={resource === "gold" ? "active" : ""}
            onClick={() => {
              setResource("gold");
              setAmount("");
              setNotice(null);
            }}
          >
            🪙 Золото
          </button>

          <button
            type="button"
            className={resource === "silver" ? "active" : ""}
            onClick={() => {
              setResource("silver");
              setAmount("");
              setNotice(null);
            }}
          >
            ⚪ Срібло
          </button>
        </div>

        <div className="treasury-limit-card">
          <div>
            <span>Денний ліміт</span>
            <strong>{formatNumber(dailyLimit)}</strong>
          </div>

          <div>
            <span>Вже внесено сьогодні</span>
            <strong>{formatNumber(donated)}</strong>
          </div>

          <div className="treasury-remaining">
            <span>Можна внести ще</span>
            <strong>{formatNumber(remaining)}</strong>
          </div>
        </div>

        <label className="treasury-input-label">
          Скільки бажаєш внести?
        </label>

        <input
          className="treasury-input"
          type="number"
          min="1"
          max={remaining}
          step="1"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Введи кількість"
          disabled={donating || remaining <= 0}
        />

        <div className="treasury-quick-amounts">
          {[25, 50, 100].map((value) => (
            <button
              type="button"
              key={value}
              disabled={remaining <= 0 || donating}
              onClick={() =>
                setAmount(String(Math.min(value, remaining)))
              }
            >
              {formatNumber(Math.min(value, remaining))}
            </button>
          ))}

          <button
            type="button"
            disabled={remaining <= 0 || donating}
            onClick={() => setAmount(String(remaining))}
          >
            Увесь залишок
          </button>
        </div>

        <button
          type="button"
          className="treasury-donate-button"
          disabled={
            donating ||
            remaining <= 0 ||
            !amount ||
            Number(amount) <= 0
          }
          onClick={handleDonate}
        >
          {donating ? (
            <>
              <RefreshCw size={19} className="treasury-spin" />
              Внесення...
            </>
          ) : (
            <>
              <ArrowDownToLine size={20} />
              Внести до казни
            </>
          )}
        </button>

        {remaining <= 0 && (
          <p className="treasury-limit-message">
            <Lock size={15} />
            Денний ліміт внесків вичерпано.
          </p>
        )}
      </section>

      <div className="treasury-ranking-title">
        <Trophy size={22} />
        <div>
          <strong>Рейтинг внесків клану</strong>
          <small>Хто найбільше допоміг спільній скарбниці</small>
        </div>
      </div>

      <RankingList
        title="Рейтинг за золотом"
        icon={<span>🪙</span>}
        rows={goldRanking}
        currency="золота"
        loading={rankingLoading}
      />

      <RankingList
        title="Рейтинг за сріблом"
        icon={<span>⚪</span>}
        rows={silverRanking}
        currency="срібла"
        loading={rankingLoading}
      />

      {canReset && (
        <button
          type="button"
          className="treasury-reset-button"
          onClick={handleResetRankings}
          disabled={resetting || rankingLoading}
        >
          {resetting ? (
            <>
              <RefreshCw size={18} className="treasury-spin" />
              Обнулення...
            </>
          ) : (
            <>
              <RotateCcw size={18} />
              Обнулити рейтинги внесків
            </>
          )}
        </button>
      )}

      <section className="treasury-info">
        <Sparkles size={19} />
        <div>
          <strong>Разом до величі клану!</strong>
          <p>
            Кожен внесок допомагає розвивати статуї та зміцнювати
            спільну скарбницю. Внески добровільні.
          </p>
        </div>
      </section>

      <button
        type="button"
        className="treasury-refresh"
        onClick={refreshAll}
        disabled={loading || rankingLoading || donating || resetting}
      >
        <RefreshCw size={16} />
        Оновити казну та рейтинги
      </button>
    </main>
  );
          }
