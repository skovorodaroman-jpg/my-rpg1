
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const categories = [
  { id: "all", label: "Все", icon: "🛒" },
  { id: "heroes", label: "Герої", icon: "🦸" },
  { id: "equipment", label: "Спорядження", icon: "⚔️" },
  { id: "pets", label: "Пети", icon: "🐾" },
  { id: "resources", label: "Ресурси", icon: "💎" },
  { id: "potions", label: "Зілля", icon: "🧪" },
];

const rarityNames = {
  common: "Звичайний",
  rare: "Рідкісний",
  epic: "Епічний",
  legendary: "Легендарний",
};

function getCategory(item) {
  const type = String(item.item_type || "").toLowerCase();

  if (/hero|геро/.test(type)) return "heroes";
  if (/pet|пет|питом/.test(type)) return "pets";
  if (/potion|consumable|зіл|elixir/.test(type)) return "potions";
  if (/resource|material|ресурс|матеріал/.test(type)) return "resources";

  return "equipment";
}

function getIcon(item) {
  const type = String(item.item_type || "").toLowerCase();

  if (/sword|weapon|меч|збро/.test(type)) return "⚔️";
  if (/shield|armor|щит|брон/.test(type)) return "🛡️";
  if (/pet|пет/.test(type)) return "🐾";
  if (/potion|consumable|зіл/.test(type)) return "🧪";
  if (/resource|material|ресурс/.test(type)) return "💎";

  return "🎁";
}

function normalizeRarity(rarity) {
  const value = String(rarity || "common").toLowerCase();

  if (value.includes("legendary") || value.includes("легендар")) {
    return "legendary";
  }
  if (value.includes("epic") || value.includes("епіч")) return "epic";
  if (value.includes("rare") || value.includes("рідкіс")) return "rare";

  return "common";
}

export default function Shop() {
  const [category, setCategory] = useState("all");
  const [gold, setGold] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  const loadShop = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Увійди в гру, щоб користуватися магазином.");

      const [profileResult, itemsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("gold, crystals")
          .eq("id", user.id)
          .single(),

        supabase
          .from("items")
          .select(
            "id, name, description, image_url, item_type, rarity, level, buy_price, sell_price, is_active"
          )
          .eq("is_active", true)
          .order("buy_price", { ascending: true }),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (itemsResult.error) throw itemsResult.error;

      setGold(Number(profileResult.data.gold) || 0);
      setCrystals(Number(profileResult.data.crystals) || 0);

      setProducts(
        (itemsResult.data || []).map((item) => ({
          ...item,
          price: Number(item.buy_price) || 0,
          currency: "gold",
          category: getCategory(item),
          icon: getIcon(item),
          rarity: normalizeRarity(item.rarity),
          stock: null,
        }))
      );
    } catch (error) {
      setMessage(`❌ ${error.message || "Не вдалося завантажити магазин"}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  const filteredProducts = useMemo(
    () =>
      category === "all"
        ? products
        : products.filter((product) => product.category === category),
    [category, products]
  );

  const buyProduct = async (product) => {
    if (buying) return;

    setBuying(true);
    setMessage("");

    try {
      const { data, error } = await supabase.rpc("buy_game_item", {
        p_item_id: product.id,
        p_quantity: 1,
        p_currency: "gold",
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error("Покупка не підтверджена сервером");
      }

      setMessage(`✅ Придбано: ${product.name}`);
      setSelectedProduct(null);

      // Оновлюємо справжній баланс і каталог після покупки
      await loadShop();
    } catch (error) {
      setMessage(`❌ ${error.message || "Помилка покупки"}`);
    } finally {
      setBuying(false);
    }
  };

  // Використай ці змінні у своєму наявному JSX:
  // gold, crystals, filteredProducts, categories,
  // selectedProduct, setSelectedProduct, message,
  // loading, buying, buyProduct.

  return (
    <div className="page shop-page">
      <header className="shop-header">
        <div>
          <h1>🛒 Магазин</h1>
          <p>Все необхідне для твого героя</p>
        </div>
        <div className="wallet">
          <div>💰 {gold.toLocaleString()}</div>
          <div>💎 {crystals.toLocaleString()}</div>
        </div>
      </header>

      {message && <div className="shop-message">{message}</div>}

      {loading ? (
        <p>Завантаження магазину...</p>
      ) : (
        <>
          <div className="categories">
            {categories.map((item) => (
              <button
                key={item.id}
                className={category === item.id ? "active" : ""}
                onClick={() => setCategory(item.id)}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          <section className="products-section">
            <div className="section-title">
              <h2>🛍️ Товари</h2>
              <span>{filteredProducts.length} доступно</span>
            </div>

            <div className="products-grid">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  className={`product-card rarity-${product.rarity}`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="product-image">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <span>{product.icon}</span>
                    )}
                  </div>

                  <div className="product-info">
                    <span className="product-rarity">
                      {rarityNames[product.rarity]}
                    </span>
                    <strong>{product.name}</strong>
                    <p>{product.description || "Предмет для твого героя"}</p>
                    <div className="product-price">
                      💰 {product.price.toLocaleString()}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <p>У цій категорії поки немає товарів.</p>
            )}
          </section>
        </>
      )}

      {selectedProduct && (
        <div
          className="modal-overlay"
          onClick={() => !buying && setSelectedProduct(null)}
        >
          <div
            className="product-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              disabled={buying}
              onClick={() => setSelectedProduct(null)}
            >
              ✕
            </button>

            <div className="modal-icon">{selectedProduct.icon}</div>
            <span className={`modal-rarity ${selectedProduct.rarity}`}>
              {rarityNames[selectedProduct.rarity]}
            </span>
            <h2>{selectedProduct.name}</h2>
            <p>{selectedProduct.description || "Предмет для твого героя"}</p>

            <div className="modal-price">
              💰 {selectedProduct.price.toLocaleString()} золота
            </div>

            <button
              className="buy-button"
              disabled={buying || gold < selectedProduct.price}
              onClick={() => buyProduct(selectedProduct)}
            >
              {buying
                ? "Обробка покупки..."
                : gold < selectedProduct.price
                  ? "Недостатньо золота"
                  : "🛒 КУПИТИ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
