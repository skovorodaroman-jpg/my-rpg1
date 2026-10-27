
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  LockKeyhole,
  Pickaxe,
  Sparkles,
  Shield,
  Gem,
  Star,
  CircleDot,
  ShoppingBag,
  Coins,
  Search,
  X,
  Check,
} from "lucide-react";
import "./Forge.css";

const SECTIONS = [
  {
    id: "runes",
    title: "Торговец рунами",
    description: "Улучшения с помощью рун",
    icon: Gem,
    open: true,
  },
  {
    id: "sharpening",
    title: "Заточка",
    description: "Требуются ресурсы",
    icon: Pickaxe,
    open: false,
  },
  {
    id: "bonus",
    title: "Бонус",
    description: "Улучшение бонуса",
    icon: Sparkles,
    open: false,
  },
  {
    id: "amulet",
    title: "Амулет",
    description: "Бонус к опыту",
    icon: Shield,
    open: false,
  },
  {
    id: "stars",
    title: "Звезды",
    description: "Прокачка звезд",
    icon: Star,
    open: false,
  },
  {
    id: "rings",
    title: "Кольца",
    description: "Магические умения",
    icon: CircleDot,
    open: false,
  },
];

const RARITIES = [
  { id: "all", label: "Все" },
  { id: "Common", label: "Common" },
  { id: "Uncommon", label: "Uncommon" },
  { id: "Rare", label: "Rare" },
  { id: "Epic", label: "Epic" },
  { id: "Legendary", label: "Legendary" },
  { id: "Titanic", label: "Titanic" },
];

const RUNE_CATALOG = [
  { id: "rune_strength", name: "Руна силы", stat: "Сила", value: 5, rarity: "Common", price: 100 },
  { id: "rune_health", name: "Руна жизни", stat: "Здоровье", value: 50, rarity: "Common", price: 100 },
  { id: "rune_armor", name: "Руна защиты", stat: "Броня", value: 5, rarity: "Common", price: 100 },
  { id: "rune_luck", name: "Руна удачи", stat: "Удача", value: 2, rarity: "Common", price: 100 },

  { id: "rune_strength_u", name: "Усиленная руна силы", stat: "Сила", value: 12, rarity: "Uncommon", price: 350 },
  { id: "rune_health_u", name: "Усиленная руна жизни", stat: "Здоровье", value: 120, rarity: "Uncommon", price: 350 },
  { id: "rune_armor_u", name: "Усиленная руна защиты", stat: "Броня", value: 12, rarity: "Uncommon", price: 350 },
  { id: "rune_luck_u", name: "Усиленная руна удачи", stat: "Удача", value: 5, rarity: "Uncommon", price: 350 },

  { id: "rune_strength_r", name: "Руна могущества", stat: "Сила", value: 25, rarity: "Rare", price: 900 },
  { id: "rune_health_r", name: "Руна жизненной силы", stat: "Здоровье", value: 250, rarity: "Rare", price: 900 },
  { id: "rune_armor_r", name: "Руна крепости", stat: "Броня", value: 25, rarity: "Rare", price: 900 },
  { id: "rune_luck_r", name: "Руна судьбы", stat: "Удача", value: 10, rarity: "Rare", price: 900 },

  { id: "rune_strength_e", name: "Руна разрушения", stat: "Сила", value: 50, rarity: "Epic", price: 2500 },
  { id: "rune_health_e", name: "Руна бессмертия", stat: "Здоровье", value: 500, rarity: "Epic", price: 2500 },
  { id: "rune_armor_e", name: "Руна бастиона", stat: "Броня", value: 50, rarity: "Epic", price: 2500 },
  { id: "rune_luck_e", name: "Руна рока", stat: "Удача", value: 20, rarity: "Epic", price: 2500 },

  { id: "rune_strength_l", name: "Легендарная руна силы", stat: "Сила", value: 100, rarity: "Legendary", price: 7000 },
  { id: "rune_health_l", name: "Легендарная руна жизни", stat: "Здоровье", value: 1000, rarity: "Legendary", price: 7000 },
  { id: "rune_armor_l", name: "Легендарная руна защиты", stat: "Броня", value: 100, rarity: "Legendary", price: 7000 },
  { id: "rune_luck_l", name: "Легендарная руна удачи", stat: "Удача", value: 40, rarity: "Legendary", price: 7000 },

  { id: "rune_strength_t", name: "Титаническая руна силы", stat: "Сила", value: 200, rarity: "Titanic", price: 20000 },
  { id: "rune_health_t", name: "Титаническая руна жизни", stat: "Здоровье", value: 2000, rarity: "Titanic", price: 20000 },
  { id: "rune_armor_t", name: "Титаническая руна защиты", stat: "Броня", value: 200, rarity: "Titanic", price: 20000 },
  { id: "rune_luck_t", name: "Титаническая руна удачи", stat: "Удача", value: 80, rarity: "Titanic", price: 20000 },
];

const rarityClass = (rarity) =>
  `forge-rarity forge-rarity-${rarity.toLowerCase()}`;

const formatNumber = (value) =>
  Math.round(Number(value) || 0).toLocaleString("uk-UA");

export default function Forge({ onNavigate = () => {} }) {
  const [section, setSection] = useState("home");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;
        if (!authData?.user) throw new Error("Войди в игру.");

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (error) throw error;

        if (active) setProfile(data);
      } catch (error) {
        if (active) {
          setNotice(error.message || "Не удалось загрузить профиль.");
          setNoticeType("error");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const mastery = Number(
    profile?.mastery ??
    profile?.mastery_points ??
    profile?.training_mastery ??
    0
  );

  const runes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return RUNE_CATALOG.filter((rune) => {
      const rarityMatches = filter === "all" || rune.rarity === filter;
      const searchMatches =
        !query ||
        rune.name.toLowerCase().includes(query) ||
        rune.stat.toLowerCase().includes(query);

      return rarityMatches && searchMatches;
    });
  }, [filter, search]);

  const showNotice = (message, type = "info") => {
    setNotice(message);
    setNoticeType(type);
  };

  const buyRune = (rune) => {
    showNotice(
      `«${rune.name}» пока доступна только в макете. Для покупки нужно подключить серверную функцию, которая проверяет серебро и записывает руну в инвентарь.`,
      "info"
    );
  };

  const sellRune = () => {
    showNotice(
      "Продажа станет доступной после подключения рун из реального инвентаря.",
      "info"
    );
  };

  const goBack = () => {
    if (section !== "home") {
      setSection("home");
      setNotice("");
    } else {
      onNavigate("home");
    }
  };

  return (
    <main className="forge-page">
      <header className="forge-header">
        <button className="forge-back" onClick={goBack} aria-label="Назад">
          <ArrowLeft size={21} />
        </button>

        <div className="forge-heading">
          <div className="forge-eyebrow">ХРОНИКИ ЗГАСЛОГО СВІТАНКУ</div>
          <h1>Кузница</h1>
        </div>

        <div className="forge-header-icon">
          <Pickaxe size={25} />
        </div>
      </header>

      {notice && (
        <div className={`forge-notice ${noticeType}`} role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Закрыть">
            <X size={17} />
          </button>
        </div>
      )}

      {section === "home" && (
        <>
          <section className="forge-intro">
            <div className="forge-intro-art">
              <div className="forge-fire">🔥</div>
              <div className="forge-anvil">⚒</div>
              <div className="forge-sparks">✦　·　✧</div>
            </div>

            <div className="forge-intro-copy">
              <div className="forge-section-label">МАСТЕРСКАЯ</div>
              <h2>Улучши своё снаряжение</h2>
              <p>В кузнице можно улучшить своё снаряжение.</p>
            </div>
          </section>

          <section className="forge-mastery">
            <div className="forge-mastery-icon">
              <Sparkles size={22} />
            </div>
            <div className="forge-mastery-info">
              <span>Мастерство</span>
              <strong>
                {loading ? "…" : formatNumber(mastery)}
              </strong>
              <small>Получено после прокачки в тренировке</small>
            </div>
          </section>

          <div className="forge-menu-title">РАЗДЕЛЫ КУЗНИ</div>

          <section className="forge-menu">
            {SECTIONS.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  className={`forge-menu-item ${item.open ? "" : "locked"}`}
                  onClick={() => {
                    if (item.open) {
                      setSection(item.id);
                      setNotice("");
                    } else {
                      showNotice("Этот раздел пока закрыт. Он будет доступен в следующих обновлениях.");
                    }
                  }}
                >
                  <div className={`forge-menu-icon ${item.id}`}>
                    <Icon size={25} />
                  </div>

                  <div className="forge-menu-copy">
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </div>

                  {!item.open && (
                    <LockKeyhole
                      className="forge-lock"
                      size={19}
                    />
                  )}

                  {item.open && <span className="forge-chevron">›</span>}
                </button>
              );
            })}
          </section>

          <section className="forge-cave-note">
            <div className="forge-cave-icon">
              <Pickaxe size={23} />
            </div>
            <div>
              <strong>Где найти ресурсы?</strong>
              <p>
                Ресурсы для улучшения снаряжения можно добыть в Пещере.
              </p>
              <button onClick={() => onNavigate("cave")}>
                Перейти в Пещеру →
              </button>
            </div>
          </section>
        </>
      )}

      {section === "runes" && (
        <>
          <div className="forge-subheading">
            <button
              className="forge-small-back"
              onClick={() => {
                setSection("home");
                setNotice("");
              }}
            >
              <ArrowLeft size={17} /> Кузница
            </button>
            <h2>Торговец рунами</h2>
            <p>Улучшения с помощью магических рун</p>
          </div>

          <section className="forge-wallet">
            <div className="forge-wallet-icon">
              <Coins size={23} />
            </div>
            <div>
              <span>Твоё серебро</span>
              <strong>
                {loading ? "…" : formatNumber(profile?.silver)}
              </strong>
            </div>
            <ShoppingBag size={22} className="forge-wallet-bag" />
          </section>

          <div className="forge-rune-toolbar">
            <label className="forge-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск рун..."
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Очистить">
                  <X size={15} />
                </button>
              )}
            </label>

            <div className="forge-rarity-filters">
              {RARITIES.map((rarity) => (
                <button
                  key={rarity.id}
                  className={filter === rarity.id ? "selected" : ""}
                  onClick={() => setFilter(rarity.id)}
                >
                  {rarity.label}
                </button>
              ))}
            </div>
          </div>

          <div className="forge-rune-count">
            Ассортимент торговца <span>{runes.length}</span>
          </div>

          <section className="forge-rune-list">
            {runes.map((rune) => (
              <article className="forge-rune-card" key={rune.id}>
                <div className={`forge-rune-art ${rune.rarity.toLowerCase()}`}>
                  <Gem size={29} />
                  <span>✦</span>
                </div>

                <div className="forge-rune-info">
                  <strong>{rune.name}</strong>
                  <span className={rarityClass(rune.rarity)}>
                    {rune.rarity}
                  </span>
                  <small>
                    {rune.stat} +{formatNumber(rune.value)}
                  </small>
                  <div className="forge-rune-price">
                    <Coins size={14} />
                    {formatNumber(rune.price)} серебра
                  </div>
                </div>

                <button
                  className="forge-buy"
                  onClick={() => buyRune(rune)}
                  disabled={loading || !profile}
                >
                  Купить
                </button>
              </article>
            ))}
          </section>

          {runes.length === 0 && (
            <div className="forge-empty">
              По твоему запросу руны не найдены.
            </div>
          )}

          <section className="forge-sell-panel">
            <div>
              <strong>Продать руны</strong>
              <p>Продажа рун из твоего инвентаря.</p>
            </div>
            <button onClick={sellRune}>Продать</button>
          </section>

          <div className="forge-footnote">
            Ассортимент и цены сейчас демонстрационные. Покупки и продажа
            не изменяют баланс или инвентарь до подключения серверной логики.
          </div>
        </>
      )}

      <footer className="forge-footer">
        <button onClick={() => onNavigate("hero")}>Герой</button>
        <button className="active" onClick={() => onNavigate("home")}>
          Главная
        </button>
        <button onClick={() => onNavigate("clan")}>Клан</button>
      </footer>
    </main>
  );
    }
        
