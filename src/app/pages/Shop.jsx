import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { EQUIPMENT_DATABASE, EQUIPMENT_RARITIES } from "../game/items.js";

export default function Shop({ profile, subsection, onProfileUpdate }) {
  const [buyingId, setBuyingId] = useState(null);
  const [message, setMessage] = useState("");

  // Визначаємо поточний раритет із вкладеного меню (якщо subsection порожній — беремо common)
  const currentRarityKey = subsection || "common";
  const currentRarityInfo =
    EQUIPMENT_RARITIES[currentRarityKey] || EQUIPMENT_RARITIES.common;

  // Фільтруємо предмети під вибрану категорію
  const items = EQUIPMENT_DATABASE.filter(
    (item) => item.rarity === currentRarityKey
  );

  // Функція купівлі предмета
  async function handleBuy(item) {
    if (!profile) {
      setMessage("❌ Помилка: профіль гравця не знайдено.");
      return;
    }

    setMessage("");
    setBuyingId(item.id);

    try {
      // 1. Перевірка балансу
      const playerGold = Number(profile.gold || 0);
      const playerCrystals = Number(profile.crystals || 0);

      const costGold = item.priceGold || 0;
      const costCrystals = item.priceCrystals || 0;

      if (playerGold < costGold) {
        setMessage(`❌ Недостатньо золота! Потрібно 🪙 ${costGold.toLocaleString()}`);
        return;
      }

      if (playerCrystals < costCrystals) {
        setMessage(`❌ Недостатньо кристалів! Потрібно 💎 ${costCrystals.toLocaleString()}`);
        return;
      }

      // 2. Списання ресурсів у Supabase
      const newGold = playerGold - costGold;
      const newCrystals = playerCrystals - costCrystals;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          gold: newGold,
          crystals: newCrystals,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      // 3. Додавання предмета в інвентар (таблиця inventory)
      const { error: invError } = await supabase.from("inventory").insert([
        {
          user_id: profile.id,
          item_id: item.id,
          item_name: item.name,
          slot: item.slot,
          rarity: item.rarity,
          stats: item.stats,
          is_equipped: false,
        },
      ]);

      if (invError) {
        // Повертаємо кошти, якщо інвентар не оновився
        await supabase
          .from("profiles")
          .update({ gold: playerGold, crystals: playerCrystals })
          .eq("id", profile.id);
        throw invError;
      }

      setMessage(`✅ Успішно куплено: ${item.name}!`);

      // Оновлюємо дані гравця у шапці
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (err) {
      console.error("Buy error:", err);
      setMessage(`Помилка купівлі: ${err.message || "Невідома помилка"}`);
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <div style={styles.container}>
      {/* Шапка категорії */}
      <div style={styles.header}>
        <h2 style={{ ...styles.title, color: currentRarityInfo.color }}>
          {currentRarityInfo.label}
        </h2>
        <p style={styles.subtitle}>
          Обери найкраще спорядження для підвищення характеристик
        </p>
      </div>

      {/* Повідомлення про купівлю чи помилку */}
      {message && <div style={styles.messageBox}>{message}</div>}

      {/* Список товарів */}
      {items.length === 0 ? (
        <div style={styles.empty}>
          В цій категорії товарів поки немає. Нові речі скоро з'являться!
        </div>
      ) : (
        <div style={styles.grid}>
          {items.map((item) => {
            const isBuying = buyingId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  ...styles.card,
                  background: currentRarityInfo.bgGradient,
                  borderColor: currentRarityInfo.borderColor,
                  boxShadow: currentRarityInfo.glow,
                }}
              >
                {/* Картинка товару */}
                <div style={styles.imageWrapper}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={styles.image}
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = "block";
                        }
                      }}
                    />
                  ) : null}
                  <span
                    style={{
                      ...styles.fallbackIcon,
                      display: item.image ? "none" : "block",
                    }}
                  >
                    {item.icon || "⚔️"}
                  </span>
                </div>

                {/* Назва та характеристики */}
                <div style={{ ...styles.itemName, color: currentRarityInfo.color }}>
                  {item.name}
                </div>

                <div style={styles.stats}>
                  {item.stats?.attack ? <div>⚔️ Атака: +{item.stats.attack}</div> : null}
                  {item.stats?.defense ? <div>🛡️ Захист: +{item.stats.defense}</div> : null}
                  {item.stats?.hp ? <div>❤️ Здоров'я: +{item.stats.hp}</div> : null}
                  {item.stats?.crit ? <div>💥 Крит: +{item.stats.crit}%</div> : null}
                </div>

                {/* Ціна */}
                <div style={styles.priceRow}>
                  {item.priceGold > 0 && <span>🪙 {item.priceGold.toLocaleString()}</span>}
                  {item.priceCrystals > 0 && <span>💎 {item.priceCrystals.toLocaleString()}</span>}
                </div>

                {/* Кнопка купівлі */}
                <button
                  type="button"
                  disabled={isBuying}
                  onClick={() => handleBuy(item)}
                  style={styles.buyButton}
                >
                  {isBuying ? "Зачекай..." : "Купити"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   СТИЛІ
   ========================================================= */

const styles = {
  container: {
    padding: "8px 2px",
  },
  header: {
    textAlign: "center",
    marginBottom: "14px",
  },
  title: {
    margin: "0 0 4px 0",
    fontSize: "19px",
    fontWeight: "800",
  },
  subtitle: {
    margin: 0,
    fontSize: "12px",
    opacity: 0.65,
  },
  messageBox: {
    padding: "10px",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    textAlign: "center",
    fontSize: "12px",
    marginBottom: "14px",
    lineHeight: 1.4,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },
  card: {
    padding: "12px 8px",
    borderRadius: "12px",
    border: "1px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    boxSizing: "border-box",
  },
  imageWrapper: {
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "8px",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    filter: "invert(0.9) drop-shadow(0px 3px 5px rgba(0,0,0,0.8))",
  },
  fallbackIcon: {
    fontSize: "32px",
    lineHeight: 1,
  },
  itemName: {
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "6px",
    lineHeight: 1.2,
  },
  stats: {
    fontSize: "10px",
    opacity: 0.85,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    marginBottom: "10px",
  },
  priceRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: "700",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  buyButton: {
    width: "100%",
    padding: "8px 0",
    borderRadius: "6px",
    border: "none",
    background: "linear-gradient(135deg, #e45c91, #8c315e)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "800",
    cursor: "pointer",
    marginTop: "auto",
  },
  empty: {
    textAlign: "center",
    padding: "30px 10px",
    opacity: 0.5,
    fontSize: "13px",
  },
};
          
