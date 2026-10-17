
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Backpack,
  Box,
  Coins,
  Shield,
  Sword,
  Trash2,
  ArrowLeftRight,
  RefreshCw,
  Check,
  AlertCircle,
  FlaskConical,
} from "lucide-react";
import "./Inventory.css";

const BAG_LIMIT = 40;

const RARITY_LABELS = {
  common: "Звичайний",
  uncommon: "Незвичайний",
  rare: "Рідкісний",
  epic: "Епічний",
  legendary: "Легендарний",
  mythic: "Міфічний",
};

const RARITY_CLASSES = {
  common: "common",
  uncommon: "uncommon",
  rare: "rare",
  epic: "epic",
  legendary: "legendary",
  mythic: "mythic",
};

function getType(item) {
  return String(item?.item_type || "").toLowerCase();
}

function isChestItem(item) {
  const type = getType(item);
  const name = String(item?.name || "").toLowerCase();

  return (
    type.includes("potion") ||
    type.includes("elixir") ||
    type.includes("resource") ||
    type.includes("material") ||
    type.includes("consumable") ||
    type.includes("ingredient") ||
    name.includes("еліксир") ||
    name.includes("зілля")
  );
}

function getItemIcon(item) {
  const name = String(item?.name || "").toLowerCase();
  const type = getType(item);

  if (name.includes("меч") || name.includes("клинок")) return "⚔️";
  if (name.includes("щит")) return "🛡️";
  if (
    name.includes("шолом") ||
    name.includes("шлем") ||
    name.includes("корона") ||
    type === "helmet"
  ) return "👑";
  if (name.includes("чоб") || name.includes("сапог") || type === "boots") {
    return "🥾";
  }
  if (name.includes("рукав") || name.includes("перчат") || type === "gloves") {
    return "🧤";
  }
  if (name.includes("перстень") || name.includes("кільц")) return "💍";
  if (name.includes("амулет")) return "📿";
  if (name.includes("посох")) return "🪄";
  if (isChestItem(item)) {
    return type.includes("potion") || type.includes("elixir") ||
      name.includes("еліксир") || name.includes("зілля")
      ? "🧪"
      : "🌿";
  }
  if (name.includes("кристал")) return "💎";
  if (type.includes("weapon")) return "⚔️";
  if (type.includes("armor") || type === "shield") return "🛡️";

  return "📦";
}

function getItemTypeLabel(item) {
  const type = getType(item);

  if (type.includes("weapon")) return "Зброя";
  if (type.includes("armor")) return "Обладунок";
  if (type === "helmet") return "Шолом";
  if (type === "shield") return "Щит";
  if (type === "shoulders") return "Наплічники";
  if (type === "gloves") return "Рукавиці";
  if (type === "pants") return "Штани";
  if (type === "boots") return "Чоботи";
  if (type.includes("accessory")) return "Аксесуар";
  if (type.includes("potion") || type.includes("elixir")) return "Еліксир";
  if (type.includes("resource") || type.includes("material")) return "Ресурс";
  if (type.includes("consumable")) return "Витратний предмет";

  return "Спорядження";
}

function getRarity(item) {
  return RARITY_CLASSES[item?.rarity] || "common";
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("uk-UA");
}

function getQuantity(row) {
  return Math.max(1, Number(row?.quantity || 1));
}

// Кожна одиниця неекіпірованого спорядження займає 1 місце.
// Еліксири й ресурси зберігаються лише в сундуку.
function getBagSlots(rows) {
  return rows.reduce((total, row) => {
    if (
      row.storage_location !== "bag" ||
      row.is_equipped ||
      isChestItem(row.item)
    ) {
      return total;
    }

    return total + getQuantity(row);
  }, 0);
}

export default function Inventory({
  profile,
  player,
  onProfileUpdate,
}) {
  const currentPlayer = profile || player;
  const userId = currentPlayer?.id;

  const [activeTab, setActiveTab] = useState("bag");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const gold = Number(currentPlayer?.gold || 0);
  const isAdmin = currentPlayer?.role === "admin";

  const bag = useMemo(
    () => items.filter((row) =>
      row.storage_location === "bag" && !isChestItem(row.item)
    ),
    [items]
  );

  const chest = useMemo(
    () => items.filter((row) =>
      row.storage_location === "chest" || isChestItem(row.item)
    ),
    [items]
  );

  const bagSlots = useMemo(() => getBagSlots(bag), [bag]);

  const equippedCount = useMemo(
    () => bag.filter((row) => row.is_equipped).length,
    [bag]
  );

  const showMessage = useCallback((text, isError = false) => {
    setMessage(isError ? "" : text);
    setError(isError ? text : "");
  }, []);

  const loadInventory = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      showMessage("Не знайдено акаунт гравця. Увійди в гру.", true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: queryError } = await supabase
        .from("player_items")
        .select("*, item:items(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (queryError) throw queryError;

      setItems(
        (data || []).map((row) => ({
          ...row,
          storage_location: row.storage_location || "bag",
        }))
      );
    } catch (err) {
      console.error("Помилка завантаження інвентаря:", err);
      showMessage(
        err?.message || "Не вдалося завантажити інвентар.",
        true
      );
    } finally {
      setLoading(false);
    }
  }, [userId, showMessage]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  async function moveItem(row, destination) {
    if (!userId || !row?.id) return;

    if (row.is_equipped) {
      showMessage("Спочатку зніми спорядження з героя.", true);
      return;
    }

    if (isChestItem(row.item) && destination === "bag") {
      showMessage(
        "Еліксири та ресурси зберігаються тільки в сундуку.",
        true
      );
      return;
    }

    if (destination === "bag") {
      const incoming = getQuantity(row);

      if (bagSlots + incoming > BAG_LIMIT) {
        showMessage(
          `Недостатньо місця! Вільно: ${BAG_LIMIT - bagSlots}.`,
          true
        );
        return;
      }
    }

    setBusyId(row.id);
    setError("");
    setMessage("");

    try {
      const { error: updateError } = await supabase
        .from("player_items")
        .update({ storage_location: destination })
        .eq("id", row.id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      await loadInventory();

      showMessage(
        destination === "chest"
          ? "Предмет переміщено до сундука."
          : "Предмет повернуто до сумки."
      );
    } catch (err) {
      console.error("Помилка переміщення предмета:", err);
      showMessage(err?.message || "Не вдалося перемістити предмет.", true);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleEquip(row) {
    if (!userId || !row?.id) return;

    if (isChestItem(row.item)) {
      showMessage("Еліксири та ресурси не можна екіпірувати.", true);
      return;
    }

    if (row.storage_location !== "bag") {
      showMessage("Спочатку поверни предмет до сумки.", true);
      return;
    }

    setBusyId(row.id);
    setError("");
    setMessage("");

    try {
      const { error: updateError } = await supabase
        .from("player_items")
        .update({ is_equipped: !row.is_equipped })
        .eq("id", row.id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      await loadInventory();

      showMessage(
        row.is_equipped
          ? `Знято: ${row.item?.name || "предмет"}`
          : `Надіто: ${row.item?.name || "предмет"}`
      );

      if (onProfileUpdate) await onProfileUpdate();
    } catch (err) {
      console.error("Помилка екіпірування:", err);
      showMessage(err?.message || "Не вдалося змінити екіпірування.", true);
    } finally {
      setBusyId(null);
    }
  }

  async function sellItem(row, quantity = 1) {
    if (!userId || !row?.id) return;

    if (row.storage_location !== "bag" || isChestItem(row.item)) {
      showMessage("Продаж доступний лише для речей у сумці.", true);
      return;
    }

    if (row.is_equipped) {
      showMessage("Спочатку зніми предмет, щоб продати його.", true);
      return;
    }

    const amount = Math.min(
      Math.max(1, Number(quantity)),
      getQuantity(row)
    );

    if (
      !window.confirm(
        `Продати «${row.item?.name || "предмет"}» у кількості ${amount}?`
      )
    ) return;

    setBusyId(row.id);
    setError("");
    setMessage("");

    try {
      const { error: rpcError } = await supabase.rpc(
        "sell_inventory_item",
        {
          p_player_item_id: row.id,
          p_quantity: amount,
        }
      );

      if (rpcError) throw rpcError;

      await loadInventory();
      if (onProfileUpdate) await onProfileUpdate();
      showMessage("Предмет продано. Баланс оновлено.");
    } catch (err) {
      console.error("Помилка продажу:", err);
      showMessage(err?.message || "Не вдалося продати предмет.", true);
    } finally {
      setBusyId(null);
    }
  }

  async function sellSelected(selected, description) {
    if (!selected.length) {
      showMessage("Немає доступних предметів для продажу.", true);
      return;
    }

    const total = selected.reduce(
      (sum, row) =>
        sum +
        Number(row.item?.sell_price || 0) * getQuantity(row),
      0
    );

    if (
      !window.confirm(
        `${description}\nКількість позицій: ${selected.length}.\n` +
        `Орієнтовна вартість: ${formatNumber(total)} монет.`
      )
    ) return;

    setBusyId("bulk");
    setError("");
    setMessage("");

    try {
      for (const row of selected) {
        const { error: rpcError } = await supabase.rpc(
          "sell_inventory_item",
          {
            p_player_item_id: row.id,
            p_quantity: getQuantity(row),
          }
        );

        if (rpcError) throw rpcError;
      }

      await loadInventory();
      if (onProfileUpdate) await onProfileUpdate();

      showMessage(`Продаж завершено. Позицій: ${selected.length}.`);
    } catch (err) {
      console.error("Помилка масового продажу:", err);
      await loadInventory();
      showMessage(err?.message || "Масовий продаж перервано.", true);
    } finally {
      setBusyId(null);
    }
  }

  async function sellByRarity(rarity) {
    const selected = bag.filter(
      (row) =>
        row.item?.rarity === rarity &&
        !row.is_equipped &&
        row.item?.is_active !== false
    );

    await sellSelected(
      selected,
      `Продати всі неекіпіровані речі рідкості «${RARITY_LABELS[rarity] || rarity}»?`
    );
  }

  async function sellAll() {
    const selected = bag.filter(
      (row) => !row.is_equipped && row.item?.is_active !== false
    );

    await sellSelected(
      selected,
      "Продати всі неекіпіровані речі із сумки?"
    );
  }

  async function addTestItem(itemType = "equipment") {
    if (!isAdmin || !userId) return;

    if (itemType === "equipment" && bagSlots >= BAG_LIMIT) {
      showMessage("Сумка заповнена. Максимум — 40 місць.", true);
      return;
    }

    setBusyId("test");
    setError("");
    setMessage("");

    try {
      let query = supabase
        .from("items")
        .select("id, name, item_type, is_active")
        .eq("is_active", true);

      if (itemType === "potion") {
        query = query.eq("item_type", "potion");
      } else if (itemType === "resource") {
        query = query.in("item_type", ["resource", "material"]);
      } else {
        query = query.not("item_type", "in", '("potion","resource","material")');
      }

      const { data: availableItems, error: itemsError } = await query;

      if (itemsError) throw itemsError;

      if (!availableItems?.length) {
        showMessage("Немає активних предметів потрібного типу.", true);
        return;
      }

      const chosen =
        availableItems[Math.floor(Math.random() * availableItems.length)];

      const { error: insertError } = await supabase
        .from("player_items")
        .insert({
          user_id: userId,
          item_id: chosen.id,
          quantity: 1,
          is_equipped: false,
          storage_location: itemType === "equipment" ? "bag" : "chest",
        });

      if (insertError) throw insertError;

      await loadInventory();
      showMessage(`Тестовий предмет додано: ${chosen.name}`);
    } catch (err) {
      console.error("Помилка тестового предмета:", err);
      showMessage(err?.message || "Не вдалося додати тестовий предмет.", true);
    } finally {
      setBusyId(null);
    }
  }

  function renderItem(row, location) {
    const item = row.item || {};
    const rarity = getRarity(item);
    const quantity = getQuantity(row);
    const isBusy = busyId === row.id || busyId === "bulk";
    const isChest = location === "chest";
    const chestOnly = isChestItem(item);

    return (
      <article className={`inventory-item ${rarity}`} key={row.id}>
        <div className="inventory-item-top">
          <div className="inventory-item-image">
            {item.image_url && (
              <img
                className="inventory-item-img"
                src={item.image_url}
                alt={item.name || "Предмет"}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  const fallback =
                    event.currentTarget.parentElement?.querySelector(
                      ".inventory-item-image-fallback"
                    );
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            )}

            <span
              className="inventory-item-image-fallback"
              aria-hidden="true"
              style={{ display: item.image_url ? "none" : "flex" }}
            >
              {getItemIcon(item)}
            </span>
          </div>

          <div className="inventory-item-details">
            <div className="inventory-item-name">
              {item.name || "Невідомий предмет"}
            </div>
            <span className={`inventory-rarity ${rarity}`}>
              {RARITY_LABELS[item.rarity] || getItemTypeLabel(item)}
            </span>
            <span className="inventory-item-type">
              {getItemTypeLabel(item)}
            </span>
            <span className="inventory-item-level">
              Рівень {item.level || 1}
            </span>
          </div>
        </div>

        {row.is_equipped && (
          <div className="inventory-equipped">
            <Check size={12} /> НАДІТО · НЕ ЗАЙМАЄ МІСЦЯ
          </div>
        )}

        {(Number(item.attack_bonus) !== 0 ||
          Number(item.defense_bonus) !== 0 ||
          Number(item.hp_bonus) !== 0 ||
          Number(item.speed_bonus) !== 0) && (
          <div className="inventory-stats">
            {Number(item.attack_bonus) !== 0 && (
              <span>⚔ +{item.attack_bonus}</span>
            )}
            {Number(item.defense_bonus) !== 0 && (
              <span>🛡 +{item.defense_bonus}</span>
            )}
            {Number(item.hp_bonus) !== 0 && (
              <span>♥ +{item.hp_bonus}</span>
            )}
            {Number(item.speed_bonus) !== 0 && (
              <span>⚡ +{item.speed_bonus}</span>
            )}
          </div>
        )}

        {item.description && (
          <p className="inventory-item-description">{item.description}</p>
        )}

        <div className="inventory-item-footer">
          <div className="inventory-price">
            {isChest || chestOnly ? (
              <span>Кількість: {quantity}</span>
            ) : row.is_equipped ? (
              <span>Місць: 0</span>
            ) : (
              <span>
                <Coins size={13} />
                {formatNumber(item.sell_price)} × {quantity}
              </span>
            )}
          </div>

          <div className="inventory-actions">
            {isChest ? (
              <button
                className="inventory-btn"
                onClick={() => moveItem(row, "bag")}
                disabled={isBusy || chestOnly || row.is_equipped}
                title={
                  chestOnly
                    ? "Еліксири й ресурси залишаються в сундуку"
                    : "Повернути до сумки"
                }
              >
                <ArrowLeftRight size={14} />
                До сумки
              </button>
            ) : chestOnly ? (
              <span className="inventory-item-type">
                Зберігається в сундуку
              </span>
            ) : (
              <>
                <button
                  className="inventory-btn green"
                  onClick={() => toggleEquip(row)}
                  disabled={isBusy || item.is_active === false}
                  title={row.is_equipped ? "Зняти предмет" : "Надіти предмет"}
                >
                  {row.is_equipped ? "Зняти" : "Надіти"}
                </button>

                <button
                  className="inventory-btn red"
                  onClick={() => sellItem(row, quantity)}
                  disabled={
                    isBusy ||
                    row.is_equipped ||
                    Number(item.sell_price || 0) <= 0 ||
                    item.is_active === false
                  }
                  title="Продати предмет"
                >
                  Продати
                </button>

                <button
                  className="inventory-btn icon-only"
                  onClick={() => moveItem(row, "chest")}
                  disabled={isBusy || row.is_equipped}
                  title="Перемістити до сундука"
                  aria-label="Перемістити до сундука"
                >
                  <Box size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <main className="inventory-page">
      <header className="inventory-header">
        <div className="inventory-brand-block">
          <div className="inventory-brand">
            <Sword size={19} />
            Хроніки Згаслого Світанку
          </div>
          <div className="inventory-subtitle">Сховище мандрівника</div>
        </div>

        <div className="inventory-gold">
          <Coins size={17} />
          {formatNumber(gold)}
        </div>
      </header>

      <section className="inventory-hero">
        <div className="inventory-avatar">
          <Shield size={27} />
        </div>

        <div className="inventory-hero-details">
          <div className="inventory-hero-name">
            {currentPlayer?.display_name ||
              currentPlayer?.username ||
              "Мій герой"}
          </div>

          <div className="inventory-hero-info">
            Рівень {currentPlayer?.level || 1} · Шукач пригод
          </div>

          <div className="inventory-hero-info">
            Екіпірування: {equippedCount} предметів
          </div>
        </div>

        <button
          className="inventory-refresh"
          onClick={loadInventory}
          disabled={loading}
          title="Оновити інвентар"
          aria-label="Оновити інвентар"
        >
          <RefreshCw
            size={16}
            className={loading ? "inventory-spinning" : ""}
          />
        </button>
      </section>

      <nav className="inventory-tabs">
        <button
          className={`inventory-tab ${activeTab === "bag" ? "active" : ""}`}
          onClick={() => setActiveTab("bag")}
        >
          <Backpack size={17} />
          Сумка
          <span>{bagSlots}/{BAG_LIMIT}</span>
        </button>

              <button
          className={`inventory-tab ${activeTab === "chest" ? "active" : ""}`}
          onClick={() => setActiveTab("chest")}
        >
          <Box size={17} />
          Сундук
          <span>{chest.length}</span>
        </button>
      </nav>

      {(message || error) && (
        <div
          className={`inventory-notice ${error ? "error" : ""}`}
          role="status"
        >
          {error ? <AlertCircle size={16} /> : <Check size={16} />}
          <span>{error || message}</span>
          <button
            onClick={() => {
              setMessage("");
              setError("");
            }}
            aria-label="Закрити повідомлення"
          >
            ×
          </button>
        </div>
      )}
        {loading ? (
        <div className="inventory-empty">
          <RefreshCw className="inventory-spinning" size={28} />
          <div className="inventory-empty-title">
            Завантажуємо інвентар…
          </div>
        </div>
      ) : activeTab === "bag" ? (
        <section className="inventory-section">
          <div className="inventory-heading">
            <div>
              <h1>
                <Backpack size={22} /> Сумка
              </h1>
              <p>
                Кожна неекіпірована одиниця спорядження займає одне місце.
                Надіті речі місця не займають.
              </p>
            </div>

            <div className="inventory-capacity">
              Місткість
              <strong>{bagSlots} / {BAG_LIMIT}</strong>
            </div>
          </div>

          <div
            className="inventory-progress"
            role="progressbar"
            aria-valuenow={Math.min(BAG_LIMIT, bagSlots)}
            aria-valuemin={0}
            aria-valuemax={BAG_LIMIT}
            aria-label="Заповненість сумки"
          >
            <div
              className="inventory-progress-fill"
              style={{
                width: `${Math.min(100, (bagSlots / BAG_LIMIT) * 100)}%`,
              }}
            />
          </div>

          {isAdmin && (
            <div className="inventory-actions">
              <button
                className="inventory-btn"
                onClick={() => addTestItem("equipment")}
                disabled={busyId !== null}
              >
                + Тестове спорядження
              </button>
              <button
                className="inventory-btn"
                onClick={() => addTestItem("potion")}
                disabled={busyId !== null}
              >
                <FlaskConical size={14} /> Тестовий еліксир
              </button>
              <button
                className="inventory-btn"
                onClick={() => addTestItem("resource")}
                disabled={busyId !== null}
              >
                + Тестовий ресурс
              </button>
            </div>
          )}
            {bag.length ? (
            <>
              <div className="inventory-actions">
                <button
                  className="inventory-btn red"
                  onClick={sellAll}
                  disabled={busyId !== null}
                >
                  <Trash2 size={14} /> Продати все
                </button>

                {Object.keys(RARITY_LABELS).map((rarity) => (
                  <button
                    className="inventory-btn"
                    key={rarity}
                    onClick={() => sellByRarity(rarity)}
                    disabled={busyId !== null}
                    title={`Продати речі: ${RARITY_LABELS[rarity]}`}
                  >
                    {RARITY_LABELS[rarity]}
                  </button>
                ))}
              </div>

              <div className="inventory-grid">
                {bag.map((row) => renderItem(row, "bag"))}
              </div>
            </>
          ) : (
            <div className="inventory-empty">
              <Backpack size={35} />
              <div className="inventory-empty-title">Сумка порожня</div>
              <p>Знайди спорядження, щоб підготувати героя до пригод.</p>
            </div>
          )}
        </section>
      ) : (
        <section className="inventory-section">
          <div className="inventory-heading">
            <div>
              <h1>
                <Box size={22} /> Сундук
              </h1>
              <p>
                Еліксири, ресурси та спорядження, яке ти відклав на потім.
              </p>
            </div>

            <div className="inventory-capacity">
              Позицій
              <strong>{chest.length}</strong>
            </div>
          </div>

          {chest.length ? (
            <div className="inventory-grid">
              {chest.map((row) => renderItem(row, "chest"))}
            </div>
          ) : (
            <div className="inventory-empty">
              <Box size={35} />
              <div className="inventory-empty-title">Сундук порожній</div>
              <p>
                Переміщуй сюди спорядження, яке поки не потрібне.
                Еліксири та ресурси зберігаються тут автоматично під час видачі.
              </p>
            </div>
          )}
        </section>
      )}

        <footer className="inventory-footer">
        Хроніки Згаслого Світанку · Інвентар мандрівника
      </footer>
    </main>
  );
}
