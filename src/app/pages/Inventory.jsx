import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Backpack,
  Box,
  Coins,
  Shield,
  Sword,
  FlaskConical,
  Sparkles,
  Trash2,
  ArrowLeftRight,
  RefreshCw,
  Package,
  Check,
  AlertCircle,
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

function getItemIcon(item) {
  const name = (item?.name || "").toLowerCase();
  const type = (item?.item_type || "").toLowerCase();

  if (name.includes("меч") || name.includes("клинок")) return "⚔️";
  if (name.includes("щит")) return "🛡️";
  if (name.includes("шолом") || name.includes("корона")) return "👑";
  if (name.includes("чоб")) return "🥾";
  if (name.includes("рукав") || name.includes("перчат")) return "🧤";
  if (name.includes("перстень") || name.includes("кільц")) return "💍";
  if (name.includes("амулет")) return "📿";
  if (name.includes("посох")) return "🪄";
  if (name.includes("еліксир") || name.includes("зілля")) return "🧪";
  if (name.includes("руда") || name.includes("камін")) return "🪨";
  if (name.includes("трава") || name.includes("гриб")) return "🌿";
  if (name.includes("кристал")) return "💎";
  if (type.includes("potion")) return "🧪";
  if (type.includes("resource") || type.includes("material")) return "🌿";
  if (type.includes("weapon")) return "⚔️";
  if (type.includes("armor")) return "🛡️";

  return "📦";
}

function getItemTypeLabel(item) {
  const type = (item?.item_type || "").toLowerCase();

  if (type.includes("weapon")) return "Зброя";
  if (type.includes("armor")) return "Обладунок";
  if (type.includes("accessory")) return "Аксесуар";
  if (type.includes("potion")) return "Еліксир";
  if (type.includes("resource") || type.includes("material")) return "Ресурс";

  return "Предмет";
}

function getRarity(item) {
  return RARITY_CLASSES[item?.rarity] || "common";
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("uk-UA");
}

export default function Inventory({ profile, player, onProfileUpdate }) {
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
    () => items.filter((row) => row.storage_location === "bag"),
    [items]
  );

  const chest = useMemo(
    () => items.filter((row) => row.storage_location === "chest"),
    [items]
  );

  const equippedCount = useMemo(
    () => bag.filter((row) => row.is_equipped).length,
    [bag]
  );

  const showMessage = (text, isError = false) => {
    setMessage(isError ? "" : text);
    setError(isError ? text : "");
  };

  const loadInventory = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      showMessage("Не знайдено акаунт гравця. Увійди в гру.");
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
  }, [userId]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  async function moveItem(row, destination) {
    if (!userId || !row?.id) return;

    if (destination === "bag" && bag.length >= BAG_LIMIT) {
      showMessage("Сумка заповнена. Максимум — 40 слотів.", true);
      return;
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
      showMessage(
        err?.message || "Не вдалося перемістити предмет.",
        true
      );
    } finally {
      setBusyId(null);
    }
  }

  async function toggleEquip(row) {
    if (!userId || !row?.id) return;

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
    } catch (err) {
      console.error("Помилка екіпірування:", err);
      showMessage(
        err?.message || "Не вдалося змінити екіпірування.",
        true
      );
    } finally {
      setBusyId(null);
    }
  }

  async function sellItem(row, quantity = 1) {
    if (!userId || !row?.id) return;

    if (row.storage_location !== "bag") {
      showMessage("Предмети із сундука спочатку потрібно повернути до сумки.", true);
      return;
    }

    if (row.is_equipped) {
      showMessage("Спочатку зніми предмет, щоб продати його.", true);
      return;
    }

    const available = Number(row.quantity || 1);
    const amount = Math.min(Math.max(1, quantity), available);

    if (
      !window.confirm(
        `Продати «${row.item?.name || "предмет"}» у кількості ${amount}?`
      )
    ) {
      return;
    }

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
      showMessage(
        err?.message ||
          "Продаж не вдався. Перевір назви параметрів функції sell_inventory_item у Supabase.",
        true
      );
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

    if (!selected.length) {
      showMessage("Немає доступних неекіпірованих предметів цієї рідкості.", true);
      return;
    }

    const total = selected.reduce(
      (sum, row) =>
        sum +
        Number(row.item?.sell_price || 0) *
          Math.max(1, Number(row.quantity || 1)),
      0
    );

    if (
      !window.confirm(
        `Продати ${selected.length} позицій рідкості «${RARITY_LABELS[rarity]}»? Орієнтовна вартість: ${formatNumber(total)} монет.`
      )
    ) {
      return;
    }

    setBusyId("bulk");
    setError("");
    setMessage("");

    try {
      for (const row of selected) {
        const { error: rpcError } = await supabase.rpc(
          "sell_inventory_item",
          {
            p_player_item_id: row.id,
            p_quantity: Math.max(1, Number(row.quantity || 1)),
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
      showMessage(
        err?.message ||
          "Не вдалося завершити масовий продаж. Перевір функцію продажу в Supabase.",
        true
      );
    } finally {
      setBusyId(null);
    }
  }

  async function sellAll() {
    const selected = bag.filter(
      (row) => !row.is_equipped && row.item?.is_active !== false
    );

    if (!selected.length) {
      showMessage("Немає неекіпірованих речей для продажу.", true);
      return;
    }

    if (
      !window.confirm(
        `Продати всі ${selected.length} позицій сумки? Екіпіровані предмети залишаться.`
      )
    ) {
      return;
    }

    setBusyId("bulk");
    setError("");
    setMessage("");

    try {
      for (const row of selected) {
        const { error: rpcError } = await supabase.rpc(
          "sell_inventory_item",
          {
            p_player_item_id: row.id,
            p_quantity: Math.max(1, Number(row.quantity || 1)),
          }
        );

        if (rpcError) throw rpcError;
      }

      await loadInventory();
      if (onProfileUpdate) await onProfileUpdate();
      showMessage(`Продано позицій: ${selected.length}.`);
    } catch (err) {
      console.error("Помилка продажу речей:", err);
      await loadInventory();
      showMessage(
        err?.message ||
          "Масовий продаж перервано. Перевір стан інвентаря та баланс.",
        true
      );
    } finally {
      setBusyId(null);
    }
  }

  async function addTestItem(itemType = "equipment") {
    if (!isAdmin) return;

    setBusyId("test");
    setError("");
    setMessage("");

    try {
      if (bag.length >= BAG_LIMIT) {
        showMessage("Сумка заповнена. Максимум — 40 слотів.", true);
        return;
      }

      let query = supabase
        .from("items")
        .select("id, name, item_type, is_active")
        .eq("is_active", true);

      if (itemType === "potion") {
        query = query.eq("item_type", "potion");
      } else if (itemType === "resource") {
        query = query.in("item_type", ["resource", "material"]);
      }

      const { data: availableItems, error: itemsError } = await query;

      if (itemsError) throw itemsError;

      if (!availableItems?.length) {
        showMessage(
          "У таблиці items немає активних предметів потрібного типу.",
          true
        );
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
      showMessage(
        err?.message || "Не вдалося додати тестовий предмет.",
        true
      );
    } finally {
      setBusyId(null);
    }
  }

  function renderItem(row, location) {
    const item = row.item || {};
    const rarity = getRarity(item);
    const quantity = Math.max(1, Number(row.quantity || 1));
    const isBusy = busyId === row.id || busyId === "bulk";
    const isChest = location === "chest";

    return (
      <article
        className={`inventory-item ${rarity}`}
        key={row.id}
      >
        <div className="inventory-item-top">
          <div className="inventory-item-icon" aria-hidden="true">
            {getItemIcon(item)}
          </div>

          <div className="inventory-item-details">
            <div className="inventory-item-name">
              {item.name || "Невідомий предмет"}
            </div>
            <span className="inventory-rarity">
              {RARITY_LABELS[item.rarity] || getItemTypeLabel(item)}
            </span>
            <span className="inventory-item-type">
              {getItemTypeLabel(item)}
            </span>
          </div>
        </div>

        {row.is_equipped && (
          <div className="inventory-equipped">
            <Check size={12} /> НАДІТО
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
            {isChest ? (
              <span>Кількість: {quantity}</span>
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
                disabled={isBusy}
                title="Повернути до сумки"
              >
                <ArrowLeftRight size={14} />
                До сумки
              </button>
            ) : (
              <>
                <button
                  className="inventory-btn green"
                  onClick={() => toggleEquip(row)}
                  disabled={isBusy || !item.is_active}
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
                    !item.is_active
                  }
                  title="Продати предмет"
                >
                  Продати
                </button>

                <button
                  className="inventory-btn icon-only"
                  onClick={() => moveItem(row, "chest")}
                  disabled={isBusy}
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
          <RefreshCw size={16} className={loading ? "inventory-spinning" : ""} />
        </button>
      </section>

      <nav className="inventory-tabs">
        <button
          className={`inventory-tab ${activeTab === "bag" ? "active" : ""}`}
          onClick={() => setActiveTab("bag")}
        >
          <Backpack size={17} />
          Сумка
          <span>{bag.length}/{BAG_LIMIT}</span>
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

      {activeTab === "bag" ? (
        <section className="inventory-section">
          <div className="inventory-heading">
            <div>
              <h1><Backpack size={22} /> Сумка</h1>
              <p>Екіпірування та знайдені речі мандрівника.</p>
            </div>
            <div className="inventory-capacity">
              Місткість
              <strong>{bag.length} / {BAG_LIMIT}</strong>
            </div>
          </div>

          <div
            className="inventory-progress"
            role="progressbar"
            aria-valuenow={bag.length}
            aria-valuemin={0}
            aria-valuemax={BAG_LIMIT}
            aria-label="Заповненість сумки"
          >
            <div
              className="inventory-progress-fill"
              style={{ width: `${Math.min(100, (bag.length / BAG_LIMIT) * 100)}%` }}
            />
          </div>

          {loading ? (
            <div className="inventory-empty">
              <RefreshCw className="inventory-spinning" size={28} />
              <div className="inventory-empty-title">Завантажуємо інвентар…</div>
            </div>
          ) : bag.length ? (
            <div className="inventory-grid">
              {bag.map((row) => renderItem(row, "bag"))}
            </div>
          ) : (
            <div className="inventory-empty">
              <Backpack size={35} />
              <div className="inventory-empty-title">Сумка порожня</div>
              <p>
                Тут зберігатимуться знайдені предмети та екіпірування.
              </p>
            </div>
          )}

          <div className="inventory-toolbar">
  <button
    className="inventory-btn"
    onClick={sellAll}
    disabled={!!busyId || loading || bag.length === 0}
  >
    <Coins size={14} />
    Продати все
  </button>

  <button
    className="inventory-btn"
    onClick={loadInventory}
    disabled={!!busyId || loading}
  >
    <RefreshCw size={14} />
    Оновити
  </button>
</div>

<div className="inventory-rarity-toolbar">
  {Object.entries(RARITY_LABELS).map(([rarity, label]) => (
    <button
      key={rarity}
      className={`inventory-btn ${RARITY_CLASSES[rarity]}`}
      onClick={() => sellByRarity(rarity)}
      disabled={!!busyId || loading}
    >
      Продати: {label}
    </button>
  ))}
</div>
</section>
) : (
<section className="inventory-section">
  <div className="inventory-heading">
    <div>
      <h1>
        <Box size={22} /> Сундук
      </h1>
      <p>Речі, які ти зберіг для майбутніх пригод.</p>
    </div>
  </div>

  {loading ? (
    <div className="inventory-empty">
      <RefreshCw className="inventory-spinning" size={28} />
      <div className="inventory-empty-title">
        Завантажуємо сундук…
      </div>
    </div>
  ) : chest.length ? (
    <div className="inventory-grid">
      {chest.map((row) => renderItem(row, "chest"))}
    </div>
  ) : (
    <div className="inventory-empty">
      <Box size={35} />
      <div className="inventory-empty-title">Сундук порожній</div>
      <p>Перемісти сюди предмети із сумки, щоб зберегти їх.</p>
    </div>
  )}
</section>
)}

{isAdmin && (
  <section className="inventory-admin">
    <h2>
      <Sparkles size={19} />
      Панель тестування інвентаря
    </h2>

    <p>
      Ці кнопки додають випадкові активні предмети з таблиці items
      до інвентаря поточного гравця.
    </p>

    <div className="inventory-toolbar">
      <button
        className="inventory-btn"
        onClick={() => addTestItem("equipment")}
        disabled={!!busyId || loading}
      >
        <Sword size={14} />
        Додати спорядження
      </button>

      <button
        className="inventory-btn"
        onClick={() => addTestItem("resource")}
        disabled={!!busyId || loading}
      >
        <Package size={14} />
        Додати ресурс
      </button>

      <button
        className="inventory-btn"
        onClick={() => addTestItem("potion")}
        disabled={!!busyId || loading}
      >
        <FlaskConical size={14} />
        Додати еліксир
      </button>
    </div>

    <div className="inventory-admin-note">
      <AlertCircle size={14} />
      Очищення інвентаря вимкнено, щоб уникнути випадкової втрати речей.
    </div>
  </section>
)}

<footer className="inventory-footer">
  Хроніки Згаслого Світанку · Інвентар мандрівника
</footer>
</main>
);
}
