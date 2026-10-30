
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Anvil,
  Shield,
  Sword,
  Gem,
  Coins,
  Check,
  Lock,
  Sparkles,
  TrendingUp,
  Hammer,
  Package,
  Crown,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Sharpening.css";

const MAX_LEVEL = 35;

const MATERIALS = [
  { id: "diamond", name: "Алмаз", icon: "💎", goldPrice: 100 },
  { id: "corundum", name: "Корунд", icon: "🔹", goldPrice: 60 },
  { id: "obsidian", name: "Обсидіан", icon: "⬛", goldPrice: 45 },
  { id: "graphite", name: "Графіт", icon: "◾", goldPrice: 25 },
  { id: "onyx", name: "Онікс", icon: "🟤", goldPrice: 35 },
  { id: "silver", name: "Срібло", icon: "⚪" },
];

const EQUIPMENT_TYPES = new Set([
  "weapon",
  "armor",
  "helmet",
  "shoulders",
  "gloves",
  "shield",
  "pants",
  "boots",
  "amulet",
  "ring",
  "ring_armor",
  "ring_life",
  "offhand",
]);

function getSilverCost(level) {
  if (level <= 14) return level * 1000;
  if (level <= 20) return 50000;
  if (level <= 22) return 100000;
  if (level === 23) return 200000;
  if (level === 24) return 300000;
  if (level === 25) return 400000;
  if (level <= 27) return 450000;
  if (level <= 30) return 500000;
  if (level <= 32) return 550000;
  if (level <= 34) return 600000;
  return 650000;
}

function getMaterialCost(level) {
  if (level <= 14) {
    return {
      diamond: level,
      corundum: level * 2,
      obsidian: level * 2,
      graphite: level * 2,
      onyx: level * 2,
      silver: getSilverCost(level),
    };
  }

  if (level <= 20) {
    return {
      diamond: 25,
      corundum: 30,
      obsidian: 30,
      graphite: 30,
      onyx: 30,
      silver: getSilverCost(level),
    };
  }

  let amount;

  if (level <= 22) amount = 50;
  else if (level <= 24) amount = 75;
  else if (level <= 26) amount = 100;
  else if (level <= 28) amount = 120;
  else if (level <= 30) amount = 135;
  else if (level <= 32) amount = 150;
  else if (level <= 34) amount = 165;
  else amount = 180;

  return {
    diamond: amount,
    corundum: amount,
    obsidian: amount,
    graphite: amount,
    onyx: amount,
    silver: getSilverCost(level),
  };
}

function getBonus(level) {
  return level === 0 ? 0 : 20 + level * 4;
}

function getSuccessChance(level, pityBonus = 0) {
  return Math.min(100, Math.max(5, 100 - level * 3) + pityBonus);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("uk-UA");
}

function getItemIcon(itemType) {
  switch (String(itemType || "").toLowerCase()) {
    case "weapon":
      return Sword;
    case "amulet":
    case "ring":
    case "ring_armor":
    case "ring_life":
      return Gem;
    default:
      return Shield;
  }
}

function getRarityName(rarity) {
  const names = {
    common: "Звичайний",
    uncommon: "Незвичайний",
    rare: "Рідкісний",
    epic: "Епічний",
    legendary: "Легендарний",
    titanic: "Титанічний",
  };

  return names[String(rarity || "").toLowerCase()] || rarity || "Спорядження героя";
}

export default function Sharpening({ onBack }) {
  const [equipment, setEquipment] = useState([]);
  const [materials, setMaterials] = useState({});
  const [silver, setSilver] = useState(0);
  const [gold, setGold] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");

  const selectedItem = equipment.find(
    (item) => item.id === selectedItemId
  );

  const level = selectedItem?.sharpenLevel ?? 0;
  const pityBonus = selectedItem?.failedAttemptBonus ?? 0;
  const nextLevel = level + 1;

  const requirements = useMemo(
    () => getMaterialCost(nextLevel),
    [nextLevel]
  );

  const chance = getSuccessChance(level, pityBonus);
  const bonus = getBonus(nextLevel);
  const isMaxLevel = level >= MAX_LEVEL;

  // Розрахунок доплати золотом за відсутні мінерали.
  const substitution = useMemo(() => {
    const missing = {};
    let totalGold = 0;

    for (const material of MATERIALS) {
      if (material.id === "silver") continue;

      const required = Number(requirements[material.id] || 0);
      const available = Number(materials[material.id] || 0);
      const shortage = Math.max(0, required - available);
      const cost = shortage * material.goldPrice;

      missing[material.id] = {
        required,
        available,
        shortage,
        goldPrice: material.goldPrice,
        goldCost: cost,
      };

      totalGold += cost;
    }

    return { missing, totalGold };
  }, [requirements, materials]);

  const silverEnough = Number(silver) >= requirements.silver;
  const goldEnough = Number(gold) >= substitution.totalGold;

  const hasResources = silverEnough && goldEnough;

  const notify = useCallback((message, type = "info") => {
    setNotice(message);
    setNoticeType(type);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const user = authData?.user;

      if (!user) {
        throw new Error("Увійди в гру, щоб користуватися заточкою.");
      }

      const [
        { data: profile, error: profileError },
        { data: playerItems, error: itemsError },
        { data: resourceRows, error: resourcesError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("silver, gold")
          .eq("id", user.id)
          .single(),

        supabase
          .from("player_items")
          .select(`
            id,
            item_id,
            is_equipped,
            storage_location,
            items (*)
          `)
          .eq("user_id", user.id),

        supabase
          .from("player_cave_resources")
          .select("resource_key, quantity")
          .eq("user_id", user.id),
      ]);

      if (profileError) throw profileError;
      if (itemsError) throw itemsError;
      if (resourcesError) throw resourcesError;

      const validItems = (playerItems || []).filter((row) => {
        const item = Array.isArray(row.items) ? row.items[0] : row.items;

        return (
          item &&
          item.is_active !== false &&
          EQUIPMENT_TYPES.has(String(item.item_type || "").toLowerCase())
        );
      });

      const playerItemIds = validItems.map((item) => item.id);

      let sharpeningRows = [];

      if (playerItemIds.length > 0) {
        const { data, error } = await supabase
          .from("player_item_sharpening")
          .select("player_item_id, sharpen_level, failed_attempt_bonus")
          .in("player_item_id", playerItemIds);

        if (error) throw error;
        sharpeningRows = data || [];
      }

      const sharpeningByItem = new Map(
        sharpeningRows.map((row) => [row.player_item_id, row])
      );

      const normalizedEquipment = validItems.map((row) => {
        const item = Array.isArray(row.items) ? row.items[0] : row.items;
        const sharpening = sharpeningByItem.get(row.id);

        return {
          id: row.id,
          itemId: row.item_id,
          name: item.name || "Предмет спорядження",
          icon: getItemIcon(item.item_type),
          rarity: getRarityName(item.rarity),
          itemType: item.item_type,
          imageUrl: item.image_url || null,
          sharpenLevel: Number(sharpening?.sharpen_level || 0),
          failedAttemptBonus: Number(
            sharpening?.failed_attempt_bonus || 0
          ),
          isEquipped: Boolean(row.is_equipped),
          storageLocation: row.storage_location || "bag",
        };
      });

      const resourceTotals = {
        diamond: 0,
        corundum: 0,
        obsidian: 0,
        graphite: 0,
        onyx: 0,
      };

      for (const row of resourceRows || []) {
        if (
          Object.prototype.hasOwnProperty.call(
            resourceTotals,
            row.resource_key
          )
        ) {
          resourceTotals[row.resource_key] = Number(row.quantity || 0);
        }
      }

      setEquipment(normalizedEquipment);
      setMaterials(resourceTotals);
      setSilver(Number(profile?.silver || 0));
      setGold(Number(profile?.gold || 0));

      setSelectedItemId((currentId) => {
        if (
          currentId &&
          normalizedEquipment.some((item) => item.id === currentId)
        ) {
          return currentId;
        }
        return null;
      });
    } catch (error) {
      notify(error.message || "Не вдалося завантажити дані заточки.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSharpen() {
    if (!selectedItem || busy || loading || isMaxLevel) return;

    if (!hasResources) {
      if (!silverEnough) {
        notify("Не вистачає срібла для заточування.", "error");
      } else {
        notify(
          `Не вистачає золота. Потрібно ще ${formatNumber(
            substitution.totalGold - gold
          )} золота.`,
          "error"
        );
      }
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      const { data, error } = await supabase.rpc("sharpen_player_item", {
        p_player_item_id: selectedItem.id,
      });

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result || typeof result.success !== "boolean") {
        throw new Error("Сервер повернув невідому відповідь.");
      }

      await loadData();

      const goldSpent = Number(result.gold_spent || 0);

      if (result.success) {
        notify(
          `Успіх! ${selectedItem.name} заточено до +${
            result.sharpen_level ?? nextLevel
          }.${goldSpent > 0 ? ` Доплата: ${formatNumber(goldSpent)} золота.` : ""}`,
          "success"
        );
      } else {
        notify(
          `Заточка не вдалася. Наступний шанс для цього предмета: ${
            result.chance ?? chance
          }% + бонус невдалих спроб.${
            goldSpent > 0
              ? ` Витрачено ${formatNumber(goldSpent)} золота на заміну ресурсів.`
              : ""
          }`,
          "error"
        );
      }
    } catch (error) {
      notify(error.message || "Помилка заточки.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="sharpening-page">
      <div className="sharpening-container">
        <header className="sharpening-header">
          <button
            className="sharpening-back"
            type="button"
            onClick={selectedItem ? () => setSelectedItemId(null) : onBack}
            aria-label="Назад"
          >
            <ArrowLeft size={21} />
          </button>

          <div>
            <span className="sharpening-eyebrow">МАЙСТЕРНЯ</span>
            <h1>Заточка</h1>
            <p>Зміцнюй спорядження свого героя</p>
          </div>

          <div className="sharpening-level-badge">
            <Anvil size={23} />
          </div>
        </header>

        <div className="sharpening-wallet">
          <span>
            ⚪ Срібло: <strong>{formatNumber(silver)}</strong>
          </span>
          <span>
            🪙 Золото: <strong>{formatNumber(gold)}</strong>
          </span>

          <button
            type="button"
            onClick={loadData}
            disabled={loading || busy}
            aria-label="Оновити дані"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {notice && (
          <div className={`sharpening-notice ${noticeType}`} role="status">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="sharpening-loading">
            Завантаження спорядження та ресурсів...
          </div>
        ) : !selectedItem ? (
          <section className="sharpening-list-section">
            <div className="sharpening-section-title">
              <div>
                <h2>Твоє спорядження</h2>
                <p>Обери предмет для заточки</p>
              </div>
              <span>{equipment.length} предметів</span>
            </div>

            {equipment.length === 0 ? (
              <div className="sharpening-empty">
                <Package size={32} />
                <h3>Спорядження не знайдено</h3>
                <p>
                  У сумці немає предметів, які можна заточити.
                  Спочатку отримай спорядження в грі.
                </p>
              </div>
            ) : (
              <div className="sharpening-equipment-list">
                {equipment.map((item) => {
                  const ItemIcon = item.icon || Shield;

                  return (
                    <article
                      className="sharpening-equipment-card"
                      key={item.id}
                    >
                      <div className="sharpening-item-icon">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} />
                        ) : (
                          <ItemIcon size={29} />
                        )}
                        <span>+{item.sharpenLevel}</span>
                      </div>

                      <div className="sharpening-item-info">
                        <strong>{item.name}</strong>
                        <span>{item.rarity}</span>
                        <small>
                          Заточка +{item.sharpenLevel}/{MAX_LEVEL}
                        </small>
                      </div>

                      <button
                        type="button"
                        className="sharpening-select-button"
                        onClick={() => {
                          setSelectedItemId(item.id);
                          setNotice("");
                        }}
                      >
                        Заточити
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section className="sharpening-detail">
            <button
              type="button"
              className="sharpening-change-item"
              onClick={() => {
                setSelectedItemId(null);
                setNotice("");
              }}
            >
              <ArrowLeft size={17} />
              До вибору речей
            </button>

            <div className="sharpening-item-preview">
              <div className="sharpening-preview-icon">
                {selectedItem.imageUrl ? (
                  <img src={selectedItem.imageUrl} alt={selectedItem.name} />
                ) : (
                  React.createElement(selectedItem.icon || Shield, { size: 43 })
                )}
                <span>+{level}</span>
              </div>

              <div className="sharpening-preview-info">
                <h2>{selectedItem.name}</h2>
                <span>{selectedItem.rarity}</span>
                <strong>
                  Рівень заточки: +{level}/{MAX_LEVEL}
                </strong>
              </div>
            </div>

            {isMaxLevel ? (
              <div className="sharpening-max-level">
                <Crown size={30} />
                <h3>Максимальна заточка!</h3>
                <p>Цей предмет уже має рівень +{MAX_LEVEL}.</p>
              </div>
            ) : (
              <>
                <div className="sharpening-chance-panel">
                  <span>Шанс заточити до +{nextLevel}</span>
                  <strong>{chance}%</strong>

                  <div className="sharpening-progress">
                    <span style={{ width: `${chance}%` }} />
                  </div>

                  <p>
                    <TrendingUp size={16} />
                    +{bonus} до параметрів предмета
                  </p>

                  {pityBonus > 0 && (
                    <small>
                      Бонус невдалих спроб: +{pityBonus}%
                    </small>
                  )}
                </div>

                <div className="sharpening-cost-panel">
                  <h3>
                    <Package size={19} />
                    Ресурси для заточки +{nextLevel}
                  </h3>

                  <div className="sharpening-material-list">
                    {MATERIALS.map((material) => {
                      const required = requirements[material.id];

                      const available =
                        material.id === "silver"
                          ? silver
                          : materials[material.id] || 0;

                      const enough = Number(available) >= required;
                      const shortage = Math.max(
                        0,
                        required - Number(available)
                      );

                      const goldCost =
                        material.goldPrice
                          ? shortage * material.goldPrice
                          : 0;

                      const canCoverShortage =
                        goldCost <= gold;

                      return (
                        <div
                          className={`sharpening-material-row ${
                            enough || (material.goldPrice && canCoverShortage)
                              ? "enough"
                              : "missing"
                          }`}
                          key={material.id}
                        >
                          <span className="sharpening-material-name">
                            <span>{material.icon}</span>
                            {material.name}
                          </span>

                          <span className="sharpening-material-count">
                            {formatNumber(available)} / {formatNumber(required)}
                          </span>

                          <span className="sharpening-material-status">
                            {enough ? (
                              <Check size={17} />
                            ) : material.goldPrice && canCoverShortage ? (
                              <Coins size={17} />
                            ) : (
                              <Lock size={16} />
                            )}
                          </span>

                          {shortage > 0 && material.goldPrice > 0 && (
                            <div className="sharpening-material-substitution">
                              Бракує {formatNumber(shortage)} шт. · доплата{" "}
                              {formatNumber(goldCost)} золота
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="sharpening-silver-cost">
                    <Coins size={20} />
                    <span>Потрібно срібла</span>
                    <strong>{formatNumber(requirements.silver)}</strong>
                  </div>

                  {substitution.totalGold > 0 && (
                    <div className="sharpening-silver-cost">
                      <Coins size={20} />
                      <span>Доплата золотом</span>
                      <strong>
                        {formatNumber(substitution.totalGold)}
                      </strong>
                    </div>
                  )}

                  <div className="sharpening-silver-cost">
                    <Sparkles size={20} />
                    <span>Твоє золото</span>
                    <strong>{formatNumber(gold)}</strong>
                  </div>

                  {!silverEnough && (
  <p className="sharpening-missing-note">
    Не вистачає {formatNumber(requirements.silver - silver)} срібла.
  </p>
)}

                  {!goldEnough && substitution.totalGold > 0 && (
                    <p className="sharpening-missing-note">
                      Не вистачає{" "}
                      {formatNumber(substitution.totalGold - gold)} золота
                      для заміни відсутніх мінералів.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className="sharpening-button"
                  onClick={handleSharpen}
                  disabled={!hasResources || busy || loading}
                >
                  {busy ? "Заточування..." : "Заточити"}
                </button>

                <p className="sharpening-warning">
                  У разі невдачі ресурси та срібло витрачаються.
                  Золото також списується за заміну відсутніх мінералів.
                </p>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
