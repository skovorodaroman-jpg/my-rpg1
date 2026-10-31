
import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Gem,
  Sparkles,
  Hammer,
  Coins,
  Lock,
  Check,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Amulet.css";

const QUALITIES = [
  { name: "Звичайний", bonus: 9 },
  { name: "Звичайний+", bonus: 8 },
  { name: "Рідкісний", bonus: 7 },
  { name: "Рідкісний+", bonus: 6 },
  { name: "Епічний", bonus: 5 },
  { name: "Епічний+", bonus: 5 },
];

const RESOURCES = {
  diamond: { name: "Алмаз", icon: "💎" },
  corundum: { name: "Корунд", icon: "🔹" },
  obsidian: { name: "Обсидіан", icon: "⬛" },
  graphite: { name: "Графіт", icon: "◾" },
  onyx: { name: "Онікс", icon: "🟤" },
};

const PART_NAMES = [
  "Основа",
  "Серцевина",
  "Ланцюг",
  "Кристал",
  "Оберіг",
  "Печатка",
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("uk-UA");
}

export default function Amulet({ onBack }) {
  const [amulet, setAmulet] = useState(null);
  const [resources, setResources] = useState({});
  const [gold, setGold] = useState(0);
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");

  const notify = (message, type = "info") => {
    setNotice(message);
    setNoticeType(type);
  };

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const user = authData?.user;
      if (!user) throw new Error("Увійди в гру, щоб користуватися амулетом.");

      const [
        { data: amuletData, error: amuletError },
        { data: resourceData, error: resourceError },
        { data: profile, error: profileError },
      ] = await Promise.all([
        supabase
          .from("player_amulets")
          .select("*")
          .eq("user_id", user.id)
          .single(),

        supabase
          .from("player_cave_resources")
          .select("resource_key, quantity")
          .eq("user_id", user.id),

        supabase
          .from("profiles")
          .select("gold, level")
          .eq("id", user.id)
          .single(),
      ]);

      if (amuletError) throw amuletError;
      if (resourceError) throw resourceError;
      if (profileError) throw profileError;

      const resourceMap = {};
      (resourceData || []).forEach((row) => {
        resourceMap[row.resource_key] = Number(row.quantity || 0);
      });

      setAmulet(amuletData);
      setResources(resourceMap);
      setGold(Number(profile?.gold || 0));
    } catch (error) {
      notify(error.message || "Не вдалося завантажити амулет.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const parts = amulet
    ? [
        amulet.part_1,
        amulet.part_2,
        amulet.part_3,
        amulet.part_4,
        amulet.part_5,
        amulet.part_6,
      ]
    : [];

  const collectedParts = parts.filter(Boolean).length;
  const allPartsCollected = collectedParts === 6;
  const qualityLevel = Number(amulet?.upgrade_level || 0);
  const sharpenLevel = Number(amulet?.sharpen_level || 0);

  const quality = QUALITIES[qualityLevel] || QUALITIES[0];
  const upgradeBonus = QUALITIES
    .slice(0, qualityLevel + 1)
    .reduce((sum, item) => sum + item.bonus, 0);

  const sharpenBonus = sharpenLevel * 2;
  const totalBonus = upgradeBonus + sharpenBonus;

  async function handleImprove() {
    if (!amulet || busy || loading) return;

    setBusy(true);
    setNotice("");
    setOffer(null);

    try {
      if (allPartsCollected) {
        if (qualityLevel >= 5) {
          throw new Error("Амулет уже має максимальну якість.");
        }

        const { data, error } = await supabase.rpc(
          "upgrade_player_amulet"
        );

        if (error) throw error;

        const result = Array.isArray(data) ? data[0] : data;

        await loadData();

        notify(
          `Амулет покращено! Нова якість: ${result?.quality_name || "наступна якість"}.`,
          "success"
        );
      } else {
        const { data, error } = await supabase.rpc(
          "get_amulet_exchange_offer"
        );

        if (error) throw error;

        const result = Array.isArray(data) ? data[0] : data;
        if (!result) throw new Error("Не вдалося отримати пропозицію обміну.");

        setOffer({
          resourceKey: result.resource_key,
          quantity: Number(result.required_quantity),
        });
      }
    } catch (error) {
      notify(error.message || "Не вдалося покращити амулет.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function confirmExchange() {
    if (!offer || busy) return;

    setBusy(true);
    setNotice("");

    try {
      const { data, error } = await supabase.rpc("exchange_amulet_part");
      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;
      const partNumber = Number(result?.part_number || 0);
      const repeated = Boolean(result?.already_owned);

      setOffer(null);
      await loadData();

      if (repeated) {
        notify(
          `Випала повторна частинка №${partNumber}. Вона не зарахована вдруге.`,
          "info"
        );
      } else {
        notify(
          `Отримано нову частинку №${partNumber}!`,
          "success"
        );
      }
    } catch (error) {
      notify(error.message || "Не вдалося обміняти ресурс.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleSharpen() {
    if (!amulet || busy || loading) return;

    if (sharpenLevel >= 30) {
      notify("Амулет уже заточений максимально.", "info");
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      const { data, error } = await supabase.rpc(
        "sharpen_player_amulet"
      );

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;

      await loadData();

      notify(
        `Заточка успішна! Рівень +${result?.new_sharpen_level}. Витрачено ${formatNumber(result?.gold_spent)} золота.`,
        "success"
      );
    } catch (error) {
      notify(error.message || "Не вдалося заточити амулет.", "error");
    } finally {
      setBusy(false);
    }
  }

  const offerResource = offer ? RESOURCES[offer.resourceKey] : null;
  const offerAvailable = offer
    ? Number(resources[offer.resourceKey] || 0)
    : 0;

  if (loading && !amulet) {
    return (
      <main className="amulet-page">
        <div className="amulet-loading">Завантаження амулета...</div>
      </main>
    );
  }

  return (
    <main className="amulet-page">
      <div className="amulet-container">
        <header className="amulet-header">
          <button
            type="button"
            className="amulet-back"
            onClick={onBack}
            aria-label="Назад"
          >
            <ArrowLeft size={21} />
          </button>

          <div>
            <span className="amulet-eyebrow">МАГІЧНА РЕЛІКВІЯ</span>
            <h1>Амулет</h1>
            <p>Сила, що примножує досвід героя</p>
          </div>

          <Gem className="amulet-header-icon" size={30} />
        </header>

        <div className="amulet-description">
          Магічне властивість амулета збільшує отримуваний досвід
          у битвах. Збирай частини, покращуй якість та заточуй
          амулет, щоб отримати до +100% досвіду.
        </div>

        {notice && (
          <div className={`amulet-notice ${noticeType}`} role="status">
            {notice}
          </div>
        )}

        <section className="amulet-hero-card">
          <div className="amulet-art">
            <div className="amulet-art-glow" />
            <div className="amulet-art-frame">
              <Gem size={76} strokeWidth={1.2} />
              <Sparkles className="amulet-sparkle sparkle-one" size={20} />
              <Sparkles className="amulet-sparkle sparkle-two" size={15} />
            </div>
          </div>

          <div className="amulet-quality">{quality.name}</div>
          <h2>Стародавній амулет</h2>

          <div className="amulet-total-bonus">
            <span>Бонус до досвіду</span>
            <strong>+{totalBonus}%</strong>
          </div>

          <div className="amulet-bonus-breakdown">
            <span>Покращення: +{upgradeBonus}%</span>
            <span>Заточка: +{sharpenBonus}%</span>
          </div>
        </section>

        <section className="amulet-parts-panel">
          <div className="amulet-section-heading">
            <div>
              <h3>Частини амулета</h3>
              <p>Збери всі шість частин поточної якості</p>
            </div>
            <strong>{collectedParts}/6</strong>
          </div>

          <div className="amulet-parts-grid">
            {PART_NAMES.map((name, index) => (
              <div
                className={`amulet-part ${parts[index] ? "collected" : ""}`}
                key={name}
              >
                {parts[index] ? (
                  <Check size={22} />
                ) : (
                  <Lock size={20} />
                )}
                <span>{name}</span>
              </div>
            ))}
          </div>

          <div className="amulet-parts-progress">
            <span style={{ width: `${(collectedParts / 6) * 100}%` }} />
          </div>

          {qualityLevel < 5 ? (
            <p className="amulet-next-quality">
              Наступна якість: {QUALITIES[qualityLevel + 1].name}
            </p>
          ) : (
            <p className="amulet-next-quality">
              Досягнуто максимальної якості!
            </p>
          )}
        </section>

        {offer && (
          <section className="amulet-offer-panel">
            <h3>Підтвердження обміну</h3>
            <p>Для отримання випадкової частинки потрібно:</p>

            <div className="amulet-offer-resource">
              <span>{offerResource?.icon || "◾"}</span>
              <strong>
                {formatNumber(offer.quantity)} {offerResource?.name || offer.resourceKey}
              </strong>
            </div>

            <p className="amulet-resource-balance">
              У тебе: {formatNumber(offerAvailable)}
            </p>

            {offerAvailable >= offer.quantity ? (
              <button
                type="button"
                className="amulet-confirm-button"
                disabled={busy}
                onClick={confirmExchange}
              >
                {busy ? "Обмінюємо..." : "Підтвердити обмін"}
              </button>
            ) : (
              <p className="amulet-insufficient">
                Недостатньо ресурсу для обміну.
              </p>
            )}

            <button
              type="button"
              className="amulet-cancel-button"
              onClick={() => setOffer(null)}
              disabled={busy}
            >
              Скасувати
            </button>
          </section>
        )}

        <section className="amulet-actions">
          <button
            type="button"
            className="amulet-improve-button"
            onClick={handleImprove}
            disabled={busy || loading || (qualityLevel >= 5 && allPartsCollected)}
          >
            <Sparkles size={19} />
            {busy
              ? "Зачекай..."
              : allPartsCollected
                ? "Покращити якість"
                : "Отримати частинку"}
          </button>

          <button
            type="button"
            className="amulet-sharpen-button"
            onClick={handleSharpen}
            disabled={busy || loading || sharpenLevel >= 30}
          >
            <Hammer size={19} />
            {sharpenLevel >= 30
              ? "Максимальна заточка"
              : `Заточити +${sharpenLevel + 1}`}
          </button>
        </section>

        <section className="amulet-sharpen-panel">
          <div className="amulet-section-heading">
            <div>
              <h3>Заточка амулета</h3>
              <p>Покращуй магічну силу за золото</p>
            </div>
            <span className="amulet-sharpen-level">
              +{sharpenLevel}/30
            </span>
          </div>

          <div className="amulet-sharpen-info">
            <div>
              <Coins size={18} />
              <span>Твоє золото</span>
              <strong>{formatNumber(gold)}</strong>
            </div>
            <div>
              <Sparkles size={18} />
              <span>Бонус заточки</span>
              <strong>+{sharpenBonus}%</strong>
            </div>
          </div>

          <div className="amulet-parts-progress">
            <span style={{ width: `${(sharpenLevel / 30) * 100}%` }} />
          </div>
        </section>

        <section className="amulet-resources-panel">
          <h3>Ресурси Печери</h3>
          {Object.entries(RESOURCES).map(([key, resource]) => (
            <div className="amulet-resource-row" key={key}>
              <span>{resource.icon} {resource.name}</span>
              <strong>{formatNumber(resources[key] || 0)}</strong>
            </div>
          ))}
        </section>

        <footer className="amulet-footer">
          <ShieldCheck size={17} />
          Амулет є постійним спорядженням героя
        </footer>
      </div>
    </main>
  );
}
