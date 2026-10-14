
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Shield,
  ShoppingBag,
  Check,
  Coins,
} from "lucide-react";
import "./Shop.css";

const ASSET = "/equipment/";
const SET_PRICE = 80;
const PIECE_PRICE = 10;

const WARRIOR_ITEMS = [
  {
    id: "warrior_helmet",
    name: "Шлем воина",
    image: `${ASSET}шлемвоина.jpeg`,
    stats: "Защита +2",
  },
  {
    id: "warrior_shoulders",
    name: "Наплечники воина",
    image: `${ASSET}наплечники воина.jpeg`,
    stats: "Защита +2",
  },
  {
    id: "warrior_armor",
    name: "Броня воина",
    image: `${ASSET}броня воина.jpeg`,
    stats: "Защита +4 · Здоровье +10",
  },
  {
    id: "warrior_gloves",
    name: "Рукавицы воина",
    image: `${ASSET}рукавиці воина.jpeg`,
    stats: "Атака +1",
  },
  {
    id: "warrior_shield",
    name: "Щит воина",
    image: `${ASSET}щит воина.jpeg`,
    stats: "Защита +3",
  },
  {
    id: "warrior_sword",
    name: "Меч воина",
    image: `${ASSET}меч воина.jpeg`,
    stats: "Атака +5",
  },
  {
    id: "warrior_pants",
    name: "Штаны воина",
    image: `${ASSET}штани воина.jpeg`,
    stats: "Защита +2 · Здоровье +5",
  },
  {
    id: "warrior_boots",
    name: "Сапоги воина",
    image: `${ASSET}сапоги воина.jpeg`,
    stats: "Защита +1 · Скорость +1",
  },
];

const SETS = [
  {
    id: "warrior",
    title: "Комплект воина",
    rarity: "Обычный",
    image: `${ASSET}206254753.jpeg`,
    price: SET_PRICE,
    description: "Базовый комплект для начинающего бойца.",
    items: WARRIOR_ITEMS,
  },
  {
    id: "militia",
    title: "Комплект ополченца",
    rarity: "Обычный",
    image: `${ASSET}ополченец.jpeg`,
    price: SET_PRICE,
    description: "Снаряжение для защиты родных земель.",
    items: [],
  },
  {
    id: "hunter",
    title: "Комплект охотника",
    rarity: "Обычный",
    image: `${ASSET}охотник.jpeg`,
    price: SET_PRICE,
    description: "Снаряжение для быстрого и точного бойца.",
    items: [],
  },
  {
    id: "rogue",
    title: "Комплект разбойника",
    rarity: "Обычный",
    image: `${ASSET}разбойник.jpeg`,
    price: SET_PRICE,
    description: "Лёгкое снаряжение для ловкого бойца.",
    items: [],
  },
];

function ItemImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className={`shop-item-image ${className}`}>
      {!failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Shield size={32} />
      )}
    </div>
  );
}

export default function Shop({
  profile,
  onProfileUpdate,
  subsection,
  onNavigate,
}) {
  const [selectedSet, setSelectedSet] = useState(null);
  const [gold, setGold] = useState(Number(profile?.gold ?? 0));
  const [crystals, setCrystals] = useState(
    Number(profile?.crystals ?? 0)
  );
  const [busyItem, setBusyItem] = useState(null);
  const [message, setMessage] = useState("");
  const [ownedNames, setOwnedNames] = useState([]);

  useEffect(() => {
    setGold(Number(profile?.gold ?? 0));
    setCrystals(Number(profile?.crystals ?? 0));
  }, [profile?.gold, profile?.crystals]);

  useEffect(() => {
    let cancelled = false;

    async function loadInventory() {
      if (!profile?.id) {
        setOwnedNames([]);
        return;
      }

      const { data, error } = await supabase
        .from("player_items")
        .select("item:items(name)")
        .eq("user_id", profile.id);

      if (error) {
        console.error("Не удалось загрузить инвентарь:", error);
        return;
      }

      if (!cancelled) {
        setOwnedNames(
          [...new Set((data || [])
            .map((row) => row.item?.name)
            .filter(Boolean))]
        );
      }
    }

    loadInventory();

    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  async function refreshAfterPurchase() {
    await onProfileUpdate?.();

    if (!profile?.id) return;

    const { data, error } = await supabase
      .from("player_items")
      .select("item:items(name)")
      .eq("user_id", profile.id);

    if (error) {
      console.error("Не удалось обновить инвентарь:", error);
      return;
    }

    setOwnedNames(
      [...new Set((data || [])
        .map((row) => row.item?.name)
        .filter(Boolean))]
    );
  }

  async function findDatabaseItems(items) {
    const results = [];

    for (const item of items) {
      const { data, error } = await supabase
        .from("items")
        .select("id, name")
        .ilike("name", item.name)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          `Предмет «${item.name}» отсутствует в таблице items.`
        );
      }

      results.push(data);
    }

    return results;
  }

  async function buyItems(items, price, busyKey, successText) {
    if (busyItem) return;

    if (!profile?.id) {
      setMessage("Войди в игру, чтобы покупать предметы.");
      return;
    }

    if (!items.length) {
      setMessage("В этом комплекте пока нет предметов.");
      return;
    }

    setBusyItem(busyKey);
    setMessage("");

    try {
      const databaseItems = await findDatabaseItems(items);

      const { error } = await supabase.rpc("buy_shop_items", {
        p_item_ids: databaseItems.map((item) => item.id),
        p_price: price,
      });

      if (error) throw error;

      setMessage(successText);
      await refreshAfterPurchase();
    } catch (error) {
      console.error("Ошибка покупки:", error);
      setMessage(error.message || "Не удалось совершить покупку.");
      await onProfileUpdate?.();
    } finally {
      setBusyItem(null);
    }
  }

  async function purchaseItem(item) {
    if (ownedNames.includes(item.name)) {
      setMessage("Этот предмет уже есть в твоей сумке.");
      return;
    }

    await buyItems(
      [item],
      PIECE_PRICE,
      item.id,
      `Куплено: ${item.name}`
    );
  }

  async function purchaseFullSet(set) {
    const remainingItems = set.items.filter(
      (item) => !ownedNames.includes(item.name)
    );

    if (!remainingItems.length) {
      setMessage("Все предметы комплекта уже приобретены.");
      return;
    }

    await buyItems(
      remainingItems,
      SET_PRICE,
      "full-set",
      `Комплект «${set.title}» приобретён!`
    );
  }

  return (
    <div className="titan-shop">
      <header className="titan-shop-header">
        {selectedSet ? (
          <button
            type="button"
            className="shop-back"
            onClick={() => {
              setSelectedSet(null);
              setMessage("");
            }}
          >
            <ArrowLeft size={18} /> Комплекты
          </button>
        ) : (
          <h2>
            <Shield size={22} /> Магазин снаряжения
          </h2>
        )}

        <div className="shop-wallet">
          <span>
            <Coins size={16} /> {gold.toLocaleString("ru-RU")}
          </span>
          <span>💎 {crystals.toLocaleString("ru-RU")}</span>
        </div>
      </header>

      {message && (
        <div className="shop-message" role="status">
          {message}
        </div>
      )}

      {!selectedSet ? (
        <section className="shop-sets">
          <h3>🛡 Комплекты снаряжения</h3>

          {SETS.map((set) => (
            <button
              type="button"
              className="shop-set-card"
              key={set.id}
              onClick={() => {
                setSelectedSet(set);
                setMessage("");
              }}
            >
              <ItemImage src={set.image} alt={set.title} />

              <div className="shop-set-info">
                <strong>{set.title}</strong>
                <span>{set.rarity}</span>
                <small>{set.description}</small>
                <b>
                  <Coins size={15} /> {set.price} золота
                </b>
              </div>

              <ArrowLeft size={18} className="shop-set-arrow" />
            </button>
          ))}
        </section>
      ) : (
        <section className="shop-set-detail">
          <div className="shop-hero-art">
            <ItemImage
              src={selectedSet.image}
              alt={selectedSet.title}
              className="shop-hero-image"
            />
            <h2>{selectedSet.title}</h2>
            <p>{selectedSet.description}</p>
          </div>

          <button
            type="button"
            className="shop-buy-full"
            disabled={
              busyItem !== null ||
              selectedSet.items.length === 0 ||
              selectedSet.items.every((item) =>
                ownedNames.includes(item.name)
              )
            }
            onClick={() => purchaseFullSet(selectedSet)}
          >
            <ShoppingBag size={18} />
            {busyItem === "full-set"
              ? "Покупка..."
              : `Купить комплект за 🪙 ${SET_PRICE} золота`}
          </button>

          {selectedSet.items.length === 0 ? (
            <p className="shop-empty">
              Предметы этого комплекта пока не добавлены.
            </p>
          ) : (
            <div className="shop-item-list">
              {selectedSet.items.map((item) => {
                const owned = ownedNames.includes(item.name);

                return (
                  <article className="shop-piece" key={item.id}>
                    <ItemImage src={item.image} alt={item.name} />

                    <div className="shop-piece-info">
                      <strong>{item.name}</strong>
                      <span className="shop-common">
                        ★ Обычный
                      </span>
                      <small>{item.stats}</small>
                    </div>

                    <button
                      type="button"
                      className={`shop-buy-piece ${
                        owned ? "is-owned" : ""
                      }`}
                      disabled={busyItem !== null || owned}
                      onClick={() => purchaseItem(item)}
                    >
                      {owned ? (
                        <>
                          <Check size={16} /> Куплено
                        </>
                      ) : busyItem === item.id ? (
                        "Покупка..."
                      ) : (
                        `🪙 ${PIECE_PRICE} золота`
                      )}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          <footer className="shop-footer">
            <button
              type="button"
              onClick={() => {
                setSelectedSet(null);
                setMessage("");
              }}
            >
              <Shield size={16} /> Комплекты
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.("hero")}
            >
              Мой герой
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.("clan")}
            >
              Мой клан
            </button>

            <button
              type="button"
              onClick={() => onNavigate?.("home")}
            >
              На главную
            </button>
          </footer>
        </section>
      )}
    </div>
  );
    }
              
