
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Shield,
  ShoppingBag,
  Check,
  Coins,
  Sparkles,
} from "lucide-react";
import "./Shop.css";

// Ціни в магазині
const PIECE_PRICE = 10;
const SET_PRICE = 80;

const ASSET = "/equipment/";

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


const SET_PRICE = 80;
const PIECE_PRICE = 10;

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

  
const visibleSets = SETS;


  
async function purchaseItem(item) {
  if (busyItem) return;

  setBusyItem(item.id);
  setMessage("");

  try {
    // Знаходимо предмет у твоїй таблиці Supabase
    const { data: dbItem, error: findError } = await supabase
      .from("items")
      .select("id, name")
      .ilike("name", item.name)
      .limit(1)
      .maybeSingle();

    if (findError) throw findError;

    if (!dbItem) {
      throw new Error(
        `Предмет «${item.name}» відсутній у таблиці items Supabase.`
      );
    }

    // Купуємо предмет за золото
    const { error: buyError } = await supabase.rpc(
      "buy_game_item",
      {
        p_item_id: dbItem.id,
        p_quantity: 1,
        p_currency: "gold",
      }
    );

    if (buyError) throw buyError;

    // Позначаємо предмет придбаним у поточному інтерфейсі
    setOwnedNames((prev) =>
      prev.includes(item.name)
        ? prev
        : [...prev, item.name]
    );

    // Оновлюємо профіль та баланс
    await onProfileUpdate?.();

    setMessage(`Куплено: ${item.name}`);
  } catch (error) {
    setMessage(
      error.message || "Не вдалося купити предмет."
    );
  } finally {
    setBusyItem(null);
  }
}
  

  async function purchaseFullSet(set) {
    if (!set.items.length) {
      setMessage(
        "Для этого комплекта предметы ещё не настроены в базе данных."
      );
      return;
    }

    if (busyItem) return;

    const remainingItems = set.items.filter(
      (item) => !ownedNames.includes(item.name)
    );

    if (!remainingItems.length) {
      setMessage("Все предметы комплекта уже приобретены.");
      return;
    }

    /*
     * Это последовательная покупка отдельных предметов, а не одна
     * атомарная операция. Если нужна гарантированная покупка комплекта
     * за 80 золота одной транзакцией, потребуется серверная RPC-функция.
     */
    setBusyItem("full-set");
    setMessage("");

    let bought = 0;

    try {
      for (const item of remainingItems) {
        const { data: dbItem, error: findError } = await supabase
          .from("items")
          .select("id, name")
          .ilike("name", item.name)
          .limit(1)
          .maybeSingle();

        if (findError) throw findError;

        if (!dbItem) {
          throw new Error(
            `В базе нет предмета «${item.name}». Куплено до ошибки: ${bought}.`
          );
        }

        const { error: buyError } = await supabase.rpc(
          "buy_game_item",
          {
            p_item_id: dbItem.id,
            p_quantity: 1,
            p_currency: "gold",
          }
        );

        if (buyError) throw buyError;

        bought += 1;
        setOwnedNames((prev) =>
          prev.includes(item.name) ? prev : [...prev, item.name]
        );
      }

      setMessage("Комплект приобретён!");
      await onProfileUpdate?.();
    } catch (error) {
      setMessage(error.message || "Не удалось купить комплект.");
      await onProfileUpdate?.();
    } finally {
      setBusyItem(null);
    }
  }

  return (
    <div className="titan-shop">
      <header className="titan-shop-header">
        {selectedSet ? (
          <button
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

          {visibleSets.map((set) => (
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
              : "Купить все вещи за 🪙 80 золота"}
          </button>

          {!selectedSet.items.length ? (
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
  className={`shop-buy-piece ${owned ? "is-owned" : ""}`}
  disabled={busyItem !== null || owned}
  onClick={() => purchaseItem(item)}
>
  {owned ? (
    <>
      <Check size={16} />
      Куплено
    </>
  ) : busyItem === item.id ? (
    "Покупка..."
  ) : (
    `🪙 ${PIECE_PRICE} золота`
  )}
</button>

      
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

        <button type="button" onClick={() => onNavigate?.("hero")}>
          Мой герой
        </button>

        <button type="button" onClick={() => onNavigate?.("clan")}>
          Мой клан
        </button>

        <button type="button" onClick={() => onNavigate?.("home")}>
          На главную
        </button>
      </footer>
    </div>
  );
}

