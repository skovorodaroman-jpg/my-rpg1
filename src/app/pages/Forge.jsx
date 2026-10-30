import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import RuneMerchant from "./RuneMerchant";
import Sharpening from "./Sharpening";
import Bonuses from "./Bonuses";
import Stars from "./Stars";

import {
  ArrowLeft,
  LockKeyhole,
  Pickaxe,
  Sparkles,
  Shield,
  Gem,
  Star,
  CircleDot,
  X,
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
    description: "Улучшение снаряжения до +35",
    icon: Pickaxe,
    open: true,
  },
{
  id: "bonus",
  title: "Бонуси",
  description: "Покращення параметрів спорядження до 90 рівня",
  icon: Sparkles,
  open: true,
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
  title: "Зірки",
  description: "Покращення спорядження до 5 зірок",
  icon: Star,
  open: true,
},
  {
    id: "rings",
    title: "Кольца",
    description: "Магические умения",
    icon: CircleDot,
    open: false,
  },
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
  { id: "rune_luck_l", name: "Легендарная руна судьбы", stat: "Удача", value: 40, rarity: "Legendary", price: 7000 },

  { id: "rune_strength_t", name: "Титаническая руна силы", stat: "Сила", value: 200, rarity: "Titanic", price: 20000 },
  { id: "rune_health_t", name: "Титаническая руна жизни", stat: "Здоровье", value: 2000, rarity: "Titanic", price: 20000 },
  { id: "rune_armor_t", name: "Титаническая руна защиты", stat: "Броня", value: 200, rarity: "Titanic", price: 20000 },
  { id: "rune_luck_t", name: "Титаническая руна удачи", stat: "Удача", value: 80, rarity: "Titanic", price: 20000 },
];

const formatNumber = (value) =>
  Math.round(Number(value) || 0).toLocaleString("uk-UA");

export default function Forge({ onNavigate = () => {} }) {
  const [section, setSection] = useState("home");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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
        if (!authData?.user) throw new Error("Увійди в гру.");

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (error) throw error;

        if (active) setProfile(data);
      } catch (error) {
        if (active) {
          setNotice(error.message || "Не вдалося завантажити профіль.");
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

  const showNotice = (message, type = "info") => {
    setNotice(message);
    setNoticeType(type);
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
        <button
          className="forge-back"
          onClick={goBack}
          aria-label="Назад"
        >
          <ArrowLeft size={21} />
        </button>

        <div className="forge-heading">
          <div className="forge-eyebrow">
            ХРОНІКИ ЗГАСЛОГО СВІТАНКУ
          </div>
          <h1>Кузница</h1>
        </div>

        <div className="forge-header-icon">
          <Pickaxe size={25} />
        </div>
      </header>

      {notice && (
        <div className={`forge-notice ${noticeType}`} role="status">
          <span>{notice}</span>
          <button
            onClick={() => setNotice("")}
            aria-label="Закрити"
          >
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
              <div className="forge-section-label">МАЙСТЕРНЯ</div>
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
              <small>
                Получено после прокачки в тренировке
              </small>
            </div>
          </section>

          <div className="forge-menu-title">РАЗДЕЛЫ КУЗНИ</div>

          <section className="forge-menu">
            {SECTIONS.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  className={`forge-menu-item ${
                    item.open ? "" : "locked"
                  }`}
                  onClick={() => {
                    if (item.open) {
                      setSection(item.id);
                      setNotice("");
                    } else {
                      showNotice(
                        "Этот раздел пока закрыт. Он будет доступен в следующих обновлениях."
                      );
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

                  {item.open && (
                    <span className="forge-chevron">›</span>
                  )}
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
        <RuneMerchant
          gold={profile?.gold ?? 0}
          onBack={() => {
            setSection("home");
            setNotice("");
          }}
        />
      )}

      {section === "sharpening" && (
        <Sharpening
          onBack={() => {
            setSection("home");
            setNotice("");
          }}
        />
      )}
      {section === "bonus" && (
  <Bonuses
    onBack={() => {
      setSection("home");
      setNotice("");
    }}
  />
)}
      {section === "stars" && (
  <Stars
    profile={profile}
    onBack={() => {
      setSection("home");
      setNotice("");
    }}
  />
)}

      <footer className="forge-footer">
        <button onClick={() => onNavigate("hero")}>
          Герой
        </button>
        <button
          className="active"
          onClick={() => onNavigate("home")}
        >
          Главная
        </button>
        <button onClick={() => onNavigate("clan")}>
          Клан
        </button>
      </footer>
    </main>
  );
    }
