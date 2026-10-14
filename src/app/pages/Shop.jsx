
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  EQUIPMENT_DATABASE,
  EQUIPMENT_RARITIES,
} from "./src/app/game/items.js";
import {
  ShoppingCart,
  Coins,
  Shield,
  Sword,
  Heart,
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Package,
} from "lucide-react";

export default function Shop({
  profile,
  subsection,
  onProfileUpdate,
}) {
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("success");

  const currentRarityKey = subsection || "common";

  const currentRarityInfo =
    EQUIPMENT_RARITIES?.[currentRarityKey] ||
    EQUIPMENT_RARITIES?.common ||
    {};

  const rarityLabel =
    currentRarityInfo.label ||
    currentRarityInfo.name ||
    currentRarityInfo.title ||
    currentRarityKey;

  const rarityColor =
    currentRarityInfo.color ||
    currentRarityInfo.textColor ||
    "#D4B382";

  const localItems = useMemo(
    () =>
      (EQUIPMENT_DATABASE || []).filter(
        (item) => item.rarity === currentRarityKey
      ),
    [currentRarityKey]
  );

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase
        .from("items")
        .select(
          "id, name, description, buy_price, sell_price, rarity, item_type, image_url, is_active, attack_bonus, defense_bonus, hp_bonus, speed_bonus, crit_bonus"
        )
        .eq("is_active", true);

      if (error) throw error;

      setCatalogItems(data || []);
    } catch (error) {
      console.error("Помилка завантаження каталогу:", error);
      setCatalogItems([]);
      setMessage(
        `Не вдалося завантажити магазин: ${error.message || "помилка бази даних"}`
      );
      setMessageType("error");
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Шукаємо справжній UUID предмета в базі за назвою.
  const getDatabaseItem = useCallback(
    (localItem) => {
      const localName = String(localItem.name || "")
        .trim()
        .toLocaleLowerCase("uk");

      return catalogItems.find(
        (dbItem) =>
          String(dbItem.name || "")
            .trim()
            .toLocaleLowerCase("uk") === localName
      );
    },
    [catalogItems]
  );

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString("uk-UA");

  async function handleBuy(item) {
    if (buyingId !== null) return;

    if (!profile?.id) {
      setMessage("Не знайдено профіль гравця. Перезайди в гру.");
      setMessageType("error");
      return;
    }

    const dbItem = getDatabaseItem(item);

    if (!dbItem) {
      setMessage(
        `Предмет «${item.name}» відсутній у таблиці items. Додай його до каталогу Supabase.`
      );
      setMessageType("error");
      return;
    }

    if (dbItem.buy_price == null || Number(dbItem.buy_price) < 0) {
      setMessage(
        `Для предмета «${item.name}» не встановлена коректна ціна buy_price.`
      );
      setMessageType("error");
      return;
    }

    const costGold = Number(dbItem.buy_price);
    const playerGold = Number(profile.gold || 0);

    if (!Number.isSafeInteger(costGold)) {
      setMessage("Ціна предмета має бути цілим числом.");
      setMessageType("error");
      return;
    }

    if (playerGold < costGold) {
      setMessage(
        `Недостатньо золота! Потрібно ${formatNumber(costGold)} 🪙, у тебе ${formatNumber(playerGold)} 🪙.`
      );
      setMessageType("error");
      return;
    }

    setBuyingId(item.id);
    setMessage(null);

    try {
      const { data, error } = await supabase.rpc("buy_game_item", {
        p_item_id: dbItem.id,
        p_quantity: 1,
        p_currency: "gold",
      });

      if (error) throw error;

      if (!data || data.success !== true) {
        throw new Error(
          data?.message || "Сервер не підтвердив купівлю предмета."
        );
      }

      setMessage(
        `Предмет «${data.item_name || item.name}» успішно придбано за ${formatNumber(data.total_price ?? costGold)} 🪙!`
      );
      setMessageType("success");

      // Оновлюємо профіль і баланс у батьківському компоненті.
      if (typeof onProfileUpdate === "function") {
        await onProfileUpdate();
      }
    } catch (error) {
      console.error("Помилка купівлі:", error);

      const errorText = String(error.message || "");

      if (/not enough gold/i.test(errorText)) {
        setMessage("Недостатньо золота для цієї покупки.");
      } else if (/not authenticated/i.test(errorText)) {
        setMessage("Сесія завершилася. Увійди в гру повторно.");
      } else {
        setMessage(`Не вдалося купити предмет: ${error.message || "невідома помилка"}`);
      }

      setMessageType("error");
    } finally {
      setBuyingId(null);
    }
  }

  function getStatRows(item) {
    const dbItem = getDatabaseItem(item);
    const stats = item.stats || {};

    const values = [
      {
        label: "Атака",
        value: dbItem?.attack_bonus ?? stats.attack ?? stats.attack_bonus,
        icon: <Sword size={14} />,
      },
      {
        label: "Захист",
        value: dbItem?.defense_bonus ?? stats.defense ?? stats.defense_bonus,
        icon: <Shield size={14} />,
      },
      {
        label: "Здоров'я",
        value: dbItem?.hp_bonus ?? stats.hp ?? stats.hp_bonus,
        icon: <Heart size={14} />,
      },
      {
        label: "Швидкість",
        value: dbItem?.speed_bonus ?? stats.speed ?? stats.speed_bonus,
        icon: <Zap size={14} />,
      },
    ];

    return values.filter(
      (stat) => stat.value !== undefined && stat.value !== null && Number(stat.value) !== 0
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <ShoppingCart size={25} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.title}>МАГАЗИН СНАРЯЖЕННЯ</div>
          <div style={styles.subtitle}>
            Спорядження для твого героя
          </div>
        </div>

        <button
          type="button"
          onClick={loadCatalog}
          disabled={catalogLoading || buyingId !== null}
          title="Оновити каталог"
          style={styles.refreshButton}
        >
          <RefreshCw
            size={18}
            style={{
              animation: catalogLoading ? "shopSpin 1s linear infinite" : "none",
            }}
          />
        </button>
      </div>

      <div
        style={{
          ...styles.rarityBanner,
          borderColor: rarityColor,
        }}
      >
        <div style={{ ...styles.rarityDot, background: rarityColor }} />
        <div>
          <div style={{ ...styles.rarityTitle, color: rarityColor }}>
            {String(rarityLabel).toLocaleUpperCase("uk")}
          </div>
          <div style={styles.raritySubtitle}>
            {localItems.length} предметів у цій категорії
          </div>
        </div>

        <div style={styles.balance}>
          <Coins size={16} color="#E8A23B" />
          <span>{formatNumber(profile?.gold)} </span>
        </div>
      </div>

      {message && (
        <div
          role="status"
          style={{
            ...styles.message,
            ...(messageType === "error"
              ? styles.errorMessage
              : styles.successMessage),
          }}
        >
          {messageType === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{message}</span>
        </div>
      )}

      {catalogLoading ? (
        <div style={styles.emptyState}>
          <RefreshCw size={26} />
          <div>Завантажуємо спорядження...</div>
        </div>
      ) : localItems.length === 0 ? (
        <div style={styles.emptyState}>
          <Package size={30} />
          <div>У цій категорії поки немає предметів.</div>
        </div>
      ) : (
        <div style={styles.itemsGrid}>
          {localItems.map((item) => {
            const dbItem = getDatabaseItem(item);
            const price = Number(dbItem?.buy_price ?? 0);
            const canBuy =
              Boolean(dbItem) &&
              dbItem.buy_price != null &&
              Number(dbItem.buy_price) >= 0 &&
              Number(profile?.gold || 0) >= price &&
              buyingId === null;

            const stats = getStatRows(item);
            const imageUrl = dbItem?.image_url || item.image;
            const isBuying = buyingId === item.id;

            return (
              <div key={item.id} style={styles.itemCard}>
                <div
                  style={{
                    ...styles.itemImage,
                    borderColor: rarityColor,
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                      style={styles.image}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : item.icon ? (
                    <span style={styles.itemEmoji}>{item.icon}</span>
                  ) : (
                    <Package size={38} color={rarityColor} />
                  )}

                  <div
                    style={{
                      ...styles.rarityIndicator,
                      background: rarityColor,
                    }}
                  />
                </div>

                <div style={styles.itemContent}>
                  <div style={styles.itemName}>{item.name}</div>

                  <div style={styles.itemType}>
                    {item.slot || dbItem?.item_type || "Спорядження"}
                  </div>

                  {(item.description || dbItem?.description) && (
                    <div style={styles.description}>
                      {item.description || dbItem?.description}
                    </div>
                  )}

                  {stats.length > 0 && (
                    <div style={styles.stats}>
                      {stats.map((stat) => (
                        <div key={stat.label} style={styles.statRow}>
                          <span style={styles.statLabel}>
                            {stat.icon}
                            {stat.label}
                          </span>
                          <span style={styles.statValue}>
                            +{stat.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={styles.priceRow}>
                    <Coins size={17} color="#E8A23B" />
                    <span style={styles.price}>
                      {dbItem?.buy_price != null
                        ? formatNumber(price)
                        : "Немає ціни"}
                    </span>
                    <span style={styles.currency}>золота</span>
                  </div>

                  {!dbItem && (
                    <div style={styles.missingItem}>
                      Немає в каталозі
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleBuy(item)}
                    disabled={!canBuy}
                    style={{
                      ...styles.buyButton,
                      ...(!canBuy ? styles.buyButtonDisabled : {}),
                    }}
                  >
                    {isBuying ? (
                      <>
                        <RefreshCw size={16} />
                        Купуємо...
                      </>
                    ) : !dbItem ? (
                      "Недоступно"
                    ) : dbItem.buy_price == null ? (
                      "Немає ціни"
                    ) : Number(profile?.gold || 0) < price ? (
                      "Недостатньо золота"
                    ) : (
                      <>
                        <ShoppingCart size={16} />
                        Купити
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={styles.footerNote}>
        <Shield size={14} />
        Покупки перевіряються сервером. Предмети додаються до інвентарю.
      </div>

      <style>{`
        @keyframes shopSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    minWidth: 0,
    color: "#E8D8C0",
    fontFamily: "inherit",
    paddingBottom: 20,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "15px 12px",
    marginBottom: 14,
    background: "#1D1714",
    border: "1px solid #403025",
    borderRadius: 12,
  },
  headerIcon: {
    width: 45,
    height: 45,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#E8A23B",
    background: "#302219",
    border: "1px solid #59412B",
    borderRadius: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: 0.5,
    color: "#F0D5A8",
  },
  subtitle: {
    marginTop: 5,
    fontSize: 12,
    color: "#9D8A74",
  },
  refreshButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    flexShrink: 0,
    borderRadius: 8,
    border: "1px solid #51402F",
    background: "#292019",
    color: "#D4B382",
    cursor: "pointer",
  },
  rarityBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px",
    marginBottom: 14,
    background: "#1D1714",
    border: "1px solid",
    borderRadius: 10,
  },
  rarityDot: {
    width: 10,
    height: 10,
    flexShrink: 0,
    borderRadius: "50%",
  },
  rarityTitle: {
    fontSize: 13,
    fontWeight: 900,
  },
  raritySubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: "#95816C",
  },
  balance: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#F0D5A8",
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  message: {
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    padding: 12,
    marginBottom: 14,
    borderRadius: 9,
    fontSize: 12,
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },
  errorMessage: {
    color: "#FFB1A8",
    background: "#351B18",
    border: "1px solid #70342D",
  },
  successMessage: {
    color: "#A9E4B5",
    background: "#172A20",
    border: "1px solid #315B3B",
  },
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
    gap: 12,
  },
  itemCard: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    overflow: "hidden",
    background: "#1D1714",
    border: "1px solid #403025",
    borderRadius: 12,
  },
  itemImage: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 130,
    margin: 10,
    overflow: "hidden",
    border: "1px solid",
    borderRadius: 9,
    background:
      "radial-gradient(circle at center, #38291D 0%, #17110E 75%)",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    padding: 8,
  },
  itemEmoji: {
    fontSize: 48,
  },
  rarityIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  itemContent: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
    padding: "2px 12px 12px",
  },
  itemName: {
    color: "#F1D8B0",
    fontSize: 14,
    fontWeight: 900,
    overflowWrap: "anywhere",
  },
  itemType: {
    marginTop: 5,
    color: "#C19A6B",
    fontSize: 11,
    textTransform: "capitalize",
  },
  description: {
    marginTop: 8,
    color: "#9D8A74",
    fontSize: 11,
    lineHeight: 1.5,
  },
  stats: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 12,
    padding: 9,
    background: "#17110E",
    borderRadius: 8,
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
  },
  statLabel: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    color: "#A99781",
  },
  statValue: {
    color: "#DDB579",
    fontWeight: 800,
  },
  priceRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: "auto",
    paddingTop: 14,
    paddingBottom: 10,
  },
  price: {
    color: "#F0C578",
    fontSize: 16,
    fontWeight: 900,
  },
  currency: {
    color: "#9D8A74",
    fontSize: 11,
  },
  missingItem: {
    marginBottom: 8,
    color: "#FFB1A8",
    fontSize: 11,
  },
  buyButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    minHeight: 40,
    padding: "9px 10px",
    border: "1px solid #B8792C",
    borderRadius: 8,
    background: "linear-gradient(180deg, #B8792C, #86501D)",
    color: "#FFF1D8",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  buyButtonDisabled: {
    border: "1px solid #493A2D",
    background: "#30251D",
    color: "#796A59",
    cursor: "not-allowed",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 170,
    padding: 20,
    color: "#A99781",
    textAlign: "center",
    background: "#1D1714",
    border: "1px solid #403025",
    borderRadius: 12,
    fontSize: 13,
  },
  footerNote: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    marginTop: 16,
    color: "#84735F",
    fontSize: 10,
    lineHeight: 1.5,
  },
};
                 
