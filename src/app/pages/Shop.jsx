import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { EQUIPMENT_DATABASE, EQUIPMENT_RARITIES } from "../game/items";

export default function Shop({ profile, subsection, onProfileUpdate }) {
  const [buyingId, setBuyingId] = useState(null);
  const [message, setMessage] = useState("");

  // Визначаємо поточний раритет із вкладеного меню (якщо subsection не вибрано — показуємо звичайні)
  const currentRarityKey = subsection || "common";
  const currentRarityInfo =
    EQUIPMENT_RARITIES[currentRarityKey] || EQUIPMENT_RARITIES.common;

  // Фільтруємо предмети під вибрану категорію
  const items = EQUIPMENT_DATABASE.filter(
    (item) => item.rarity === currentRarityKey
  );

  // Функція купівлі предмета
  async function handleBuy(item) {
    if (!profile) return;

    setMessage("");
    setBuyingId(item.id);

    try {
      // 1. Перевірка балансу
      const playerGold = Number(profile.gold || 0);
      const playerCrystals = Number(profile.crystals || 0);

      const costGold = item.priceGold || 0;
      const costCrystals = item.priceCrystals || 0;

      if (playerGold < costGold) {
        setMessage(`❌ Недостатньо золота! Потрібно 🪙 ${costGold}`);
        return;
      }

      if (playerCrystals < costCrystals) {
        setMessage(`❌ Недостатньо кристалів! Потрібно 💎 ${costCrystals}`);
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

      // Оновлюємо дані гравця в шапці (золото/кристали)
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
      <div style={styles.header}>
        <h2 style={{ ...styles.title, color: currentRarityInfo.color }}>
          {currentRarityInfo.label}
        </h2>
        <p style={styles.subtitle}>
          Обери найкраще спорядження для підвищення характеристик
        </p>
      </div>

      {message && <div style={styles.messageBox}>{message}</div>}

      {items.length === 0 ? (
        <div style={styles.empty}>
          В цій категорії товарів поки немає. Ми додаємо нові речі!
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
                  <img
                    src={item.image}
                    alt={item.name}
                    style={styles.image}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <span style={styles.fallbackIcon}>{item.icon}</span>
                </div>

                {/* Назва та характеристики */}
                <div style={{ ...styles.itemName, color: currentRarityInfo.color }}>
                  {item.name}
                </div>

                <div style={styles.stats}>
                  {item.stats.attack && <div>⚔️ Атака: +{item.stats.attack}</div>}
                  {item.stats.defense && <div>🛡️ Захист: +{item.stats.defense}</div>}
                  {item.stats.hp && <div>❤️ Здоров'я: +{item.stats.hp}</div>}
                  {item.stats.crit && <div>💥 Крит: +{item.stats.crit}%</div>}
                </div>

                {/* Ціна та кнопка */}
                <div style={styles.priceRow}>
                  {item.priceGold > 0 && <span>🪙 {item.priceGold.toLocaleString()}</span>}
                  {item.priceCrystals > 0 && <span>💎 {item.priceCrystals.toLocaleString()}</span>}
                </div>

                <button
                  type="button"
                  disabled={isBuying}
                  onClick={() => handleBuy(item)}
                  style={styles.buyButton}
                >
                  {isBuying ? "Купівля..." : "Купити"}
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
   СТИЛІ МАГАЗИНУ
   ========================================================= */

const styles = {
  container: {
    padding: "10px 4px",
  },
  header: {
    textAlign: "center",
    marginBottom: "16px",
  },
  title: {
    margin: "0 0 4px 0",
    fontSize: "20px",
    fontWeight: "800",
  },
  subtitle: {
    margin: 0,
    fontSize: "12px",
    opacity: 0.6,
  },
  messageBox: {
    padding: "10px",
    borderRadius: "8px",
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    textAlign: "center",
    fontSize: "12px",
    marginBottom: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },
  card: {
    padding: "12px 10px",
    borderRadius: "12px",
    border: "1px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    position: "relative",
  },
  imageWrapper: {
    width: "54px",
    height: "54px",
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
    zIndex: 2,
  },
  fallbackIcon: {
    position: "absolute",
    fontSize: "30px",
    zIndex: 1,
    opacity: 0.5,
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
    gap: "8px",
    fontSize: "11px",
    fontWeight: "700",
    marginBottom: "8px",
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
    
