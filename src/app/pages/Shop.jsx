import { useState } from "react";

const categories = [
  { id: "all", label: "Все", icon: "🛒" },
  { id: "heroes", label: "Герої", icon: "🦸" },
  { id: "equipment", label: "Спорядження", icon: "⚔️" },
  { id: "pets", label: "Пети", icon: "🐾" },
  { id: "resources", label: "Ресурси", icon: "💎" },
  { id: "potions", label: "Зілля", icon: "🧪" },
];

const products = [
  {
    id: 1,
    name: "Скриня героя",
    description: "Випадковий герой або фрагменти героя",
    icon: "📦",
    category: "heroes",
    price: 300,
    currency: "gold",
    rarity: "epic",
    stock: 5,
  },
  {
    id: 2,
    name: "Кристальна скриня",
    description: "Містить цінні ресурси та кристали",
    icon: "💎",
    category: "resources",
    price: 100,
    currency: "crystals",
    rarity: "legendary",
    stock: 3,
  },
  {
    id: 3,
    name: "Меч воїна",
    description: "+25 до атаки",
    icon: "⚔️",
    category: "equipment",
    price: 750,
    currency: "gold",
    rarity: "rare",
    stock: 8,
  },
  {
    id: 4,
    name: "Зілля здоров'я",
    description: "Відновлює 30% HP героя",
    icon: "🧪",
    category: "potions",
    price: 80,
    currency: "gold",
    rarity: "common",
    stock: 20,
  },
  {
    id: 5,
    name: "Яйце пета",
    description: "Може вилупитися випадковий пет",
    icon: "🥚",
    category: "pets",
    price: 500,
    currency: "gold",
    rarity: "epic",
    stock: 4,
  },
  {
    id: 6,
    name: "Рунний камінь",
    description: "Матеріал для покращення спорядження",
    icon: "🔮",
    category: "resources",
    price: 50,
    currency: "crystals",
    rarity: "rare",
    stock: 15,
  },
  {
    id: 7,
    name: "Щит Світла",
    description: "+35 до захисту",
    icon: "🛡️",
    category: "equipment",
    price: 950,
    currency: "gold",
    rarity: "epic",
    stock: 6,
  },
  {
    id: 8,
    name: "Велике зілля",
    description: "Повністю відновлює HP героя",
    icon: "🧴",
    category: "potions",
    price: 150,
    currency: "gold",
    rarity: "rare",
    stock: 10,
  },
];

const rarityNames = {
  common: "Звичайний",
  rare: "Рідкісний",
  epic: "Епічний",
  legendary: "Легендарний",
};

export default function Shop() {
  const [category, setCategory] = useState("all");
  const [gold, setGold] = useState(2450);
  const [crystals, setCrystals] = useState(120);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [message, setMessage] = useState("");

  const filteredProducts =
    category === "all"
      ? products
      : products.filter((product) => product.category === category);

  const buyProduct = (product) => {
    const hasEnough =
      product.currency === "gold"
        ? gold >= product.price
        : crystals >= product.price;

    if (!hasEnough) {
      setMessage("❌ Недостатньо валюти для покупки");
      return;
    }

    if (product.currency === "gold") {
      setGold((value) => value - product.price);
    } else {
      setCrystals((value) => value - product.price);
    }

    setMessage(`✅ Ти придбав: ${product.name}`);
    setSelectedProduct(null);
  };

  return (
    <div className="page shop-page">
      <header className="shop-header">
        <div>
          <h1>🛒 Магазин</h1>
          <p>Все необхідне для твого героя</p>
        </div>

        <div className="wallet">
          <div>💰 {gold.toLocaleString()}</div>
          <div>💎 {crystals}</div>
        </div>
      </header>

      {/* Daily offer */}
      <section className="daily-offer">
        <div className="offer-badge">🔥 ПРОПОЗИЦІЯ ДНЯ</div>

        <div className="offer-content">
          <div className="offer-icon">🎁</div>

          <div className="offer-info">
            <h2>Велика скриня Eldara</h2>
            <p>
              Гарантована нагорода + шанс отримати рідкісний предмет
            </p>

            <div className="offer-price">
              <span className="old-price">500 💎</span>
              <strong>299 💎</strong>
            </div>
          </div>

          <button
            onClick={() => {
              if (crystals >= 299) {
                setCrystals((value) => value - 299);
                setMessage("🎁 Скриню придбано!");
              } else {
                setMessage("❌ Недостатньо кристалів");
              }
            }}
          >
            Купити
          </button>
        </div>
      </section>

      {message && (
        <div className="shop-message">
          {message}
        </div>
      )}

      {/* Categories */}
      <div className="categories">
        {categories.map((item) => (
          <button
            key={item.id}
            className={category === item.id ? "active" : ""}
            onClick={() => setCategory(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Products */}
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
                <span>{product.icon}</span>
                <small>{product.stock} шт.</small>
              </div>

              <div className="product-info">
                <span className="product-rarity">
                  {rarityNames[product.rarity]}
                </span>

                <strong>{product.name}</strong>

                <p>{product.description}</p>

                <div className="product-price">
                  {product.currency === "gold" ? "💰" : "💎"}{" "}
                  {product.price.toLocaleString()}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recommended */}
      <section className="recommended">
        <div className="section-title">
          <h2>⭐ Рекомендуємо</h2>
        </div>

        <div className="recommended-row">
          <div>
            <span>⚔️</span>
            <strong>Спорядження</strong>
            <small>Підсиль героя</small>
          </div>

          <div>
            <span>🐾</span>
            <strong>Пети</strong>
            <small>Отримай бонуси</small>
          </div>

          <div>
            <span>🧪</span>
            <strong>Зілля</strong>
            <small>Для бою</small>
          </div>
        </div>
      </section>

      {/* Product modal */}
      {selectedProduct && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="product-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={() => setSelectedProduct(null)}
            >
              ✕
            </button>

            <div className="modal-icon">
              {selectedProduct.icon}
            </div>

            <span className={`modal-rarity ${selectedProduct.rarity}`}>
              {rarityNames[selectedProduct.rarity]}
            </span>

            <h2>{selectedProduct.name}</h2>

            <p>{selectedProduct.description}</p>

            <div className="modal-stock">
              📦 Залишилось: {selectedProduct.stock}
            </div>

            <div className="modal-price">
              {selectedProduct.currency === "gold" ? "💰" : "💎"}{" "}
              {selectedProduct.price.toLocaleString()}
            </div>

            <button
              className="buy-button"
              onClick={() => buyProduct(selectedProduct)}
            >
              🛒 КУПИТИ
            </button>
          </div>
        </div>
      )}

      <style>{`
        .shop-page {
          padding-bottom: 90px;
        }

        .shop-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 20px;
        }

        .shop-header h1 {
          margin: 0 0 5px;
        }

        .shop-header p {
          margin: 0;
          font-size: 12px;
          opacity: .6;
        }

        .wallet {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(255,255,255,.06);
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .daily-offer {
          padding: 17px;
          margin-bottom: 16px;
          border-radius: 23px;
          background:
            linear-gradient(
              135deg,
              rgba(150,70,40,.35),
              rgba(80,40,100,.4)
            );
          border: 1px solid rgba(255,255,255,.1);
        }

        .offer-badge {
          display: inline-block;
          margin-bottom: 12px;
          padding: 5px 9px;
          border-radius: 8px;
          background: rgba(255,255,255,.1);
          font-size: 10px;
          font-weight: 800;
        }

        .offer-content {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .offer-icon {
          width: 70px;
          height: 70px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 20px;
          background: rgba(255,255,255,.08);
          font-size: 38px;
        }

        .offer-info {
          flex: 1;
        }

        .offer-info h2 {
          margin: 0 0 5px;
          font-size: 17px;
        }

        .offer-info p {
          margin: 0 0 8px;
          font-size: 11px;
          opacity: .65;
        }

        .offer-price {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .old-price {
          font-size: 11px;
          text-decoration: line-through;
          opacity: .45;
        }

        .offer-price strong {
          font-size: 18px;
        }

        .offer-content button {
          padding: 11px 14px;
          border: 0;
          border-radius: 12px;
          background: rgba(255,255,255,.14);
          color: white;
          font-weight: 800;
          cursor: pointer;
        }

        .shop-message {
          margin-bottom: 14px;
          padding: 11px;
          border-radius: 12px;
          background: rgba(255,255,255,.07);
          text-align: center;
          font-size: 12px;
        }

        .categories {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 5px;
          margin-bottom: 20px;
        }

        .categories button {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
          padding: 9px 12px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          background: rgba(255,255,255,.04);
          color: inherit;
          font-size: 11px;
          cursor: pointer;
        }

        .categories button.active {
          background: rgba(140,70,230,.25);
          border-color: rgba(170,100,255,.6);
        }

        .section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .section-title h2 {
          margin: 0;
          font-size: 18px;
        }

        .section-title span {
          font-size: 11px;
          opacity: .5;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .product-card {
          min-width: 0;
          padding: 10px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 18px;
          background: rgba(255,255,255,.04);
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .product-card.rarity-rare {
          border-color: rgba(80,150,255,.25);
        }

        .product-card.rarity-epic {
          border-color: rgba(170,80,255,.3);
        }

        .product-card.rarity-legendary {
          border-color: rgba(255,190,50,.35);
        }

        .product-image {
          position: relative;
          height: 100px;
          display: grid;
          place-items: center;
          margin-bottom: 9px;
          border-radius: 14px;
          background: rgba(255,255,255,.06);
        }

        .product-image span {
          font-size: 45px;
        }

        .product-image small {
          position: absolute;
          right: 6px;
          bottom: 6px;
          padding: 3px 5px;
          border-radius: 6px;
          background: rgba(0,0,0,.3);
          font-size: 9px;
          opacity: .8;
        }

        .product-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .product-rarity {
          font-size: 9px;
          opacity: .55;
        }

        .product-info strong {
          font-size: 13px;
        }

        .product-info p {
          height: 28px;
          margin: 0;
          overflow: hidden;
          font-size: 10px;
          line-height: 14px;
          opacity: .55;
        }

        .product-price {
          margin-top: 5px;
          font-size: 13px;
          font-weight: 800;
        }

        .recommended {
          margin-top: 25px;
        }

        .recommended-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .recommended-row div {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 13px 6px;
          border-radius: 15px;
          background: rgba(255,255,255,.04);
          text-align: center;
        }

        .recommended-row span {
          font-size: 25px;
        }

        .recommended-row strong {
          font-size: 10px;
        }

        .recommended-row small {
          font-size: 8px;
          opacity: .5;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0,0,0,.72);
          backdrop-filter: blur(5px);
        }

        .product-modal {
          position: relative;
          width: min(400px, 100%);
          padding: 25px;
          border-radius: 25px;
          background: #191622;
          border: 1px solid rgba(255,255,255,.1);
          text-align: center;
        }

        .close-button {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 50%;
          background: rgba(255,255,255,.08);
          color: white;
          cursor: pointer;
        }

        .modal-icon {
          width: 100px;
          height: 100px;
          display: grid;
          place-items: center;
          margin: 10px auto 12px;
          border-radius: 25px;
          background: rgba(255,255,255,.07);
          font-size: 55px;
        }

        .modal-rarity {
          font-size: 11px;
          opacity: .65;
        }

        .modal-rarity.epic {
          color: #c084fc;
        }

        .modal-rarity.legendary {
          color: #fbbf24;
        }

        .product-modal h2 {
          margin: 8px 0;
        }

        .product-modal p {
          margin: 0 auto 15px;
          max-width: 280px;
          font-size: 12px;
          opacity: .6;
        }

        .modal-stock {
          font-size: 11px;
          opacity: .55;
        }

        .modal-price {
          margin: 15px 0;
          font-size: 23px;
          font-weight: 800;
        }

        .buy-button {
          width: 100%;
          padding: 14px;
          border: 0;
          border-radius: 15px;
          background: linear-gradient(135deg, #8d42e8, #db3c91);
          color: white;
          font-weight: 800;
          cursor: pointer;
        }

        @media (max-width: 500px) {
          .offer-content {
            align-items: flex-start;
          }

          .offer-icon {
            width: 55px;
            height: 55px;
            font-size: 30px;
          }

          .offer-content button {
            padding: 9px;
          }
        }
      `}</style>
    </div>
  );
                        }
