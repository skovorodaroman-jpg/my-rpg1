import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import RuneMerchant from "./RuneMerchant";
import Sharpening from "./Sharpening";
import Bonuses from "./Bonuses";
import Stars from "./Stars";
import Rings from "./Rings";
import Amulet from "./Amulet";

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
    title: "Торговець рунами",
    description: "Покращення за допомогою рун",
    icon: Gem,
    open: true,
  },
  {
    id: "sharpening",
    title: "Заточка",
    description: "Покращення спорядження до +35",
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
    description: "Магічна властивість збільшує отримуваний досвід",
    icon: Shield,
    open: true,
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
    title: "Кільця",
    description: "Магічні властивості та бойові вміння",
    icon: CircleDot,
    open: true,
  },
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

  const returnToForge = () => {
    setSection("home");
    setNotice("");
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
          <h1>Кузня</h1>
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
              <h2>Покращуй своє спорядження</h2>
              <p>
                У кузні можна розвивати силу спорядження та магічні
                властивості артефактів.
              </p>
            </div>
          </section>

          <section className="forge-mastery">
            <div className="forge-mastery-icon">
              <Sparkles size={22} />
            </div>

            <div className="forge-mastery-info">
              <span>Майстерність</span>
              <strong>
                {loading ? "…" : formatNumber(mastery)}
              </strong>
              <small>
                Отримано після прокачування у тренуванні
              </small>
            </div>
          </section>

          <div className="forge-menu-title">РОЗДІЛИ КУЗНІ</div>

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
                        "Цей розділ поки закритий. Він буде доступний у наступних оновленнях."
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
              <strong>Де знайти ресурси?</strong>
              <p>
                Ресурси для покращення спорядження можна добути в Печері.
              </p>
              <button onClick={() => onNavigate("cave")}>
                Перейти до Печери →
              </button>
            </div>
          </section>
        </>
      )}

      {section === "runes" && (
        <RuneMerchant
          gold={profile?.gold ?? 0}
          onBack={returnToForge}
        />
      )}

      {section === "sharpening" && (
        <Sharpening onBack={returnToForge} />
      )}

      {section === "bonus" && (
        <Bonuses onBack={returnToForge} />
      )}

      {section === "amulet" && (
        <Amulet
          onBack={returnToForge}
        />
      )}

      {section === "stars" && (
        <Stars
          profile={profile}
          onBack={returnToForge}
        />
      )}

      {section === "rings" && (
        <Rings
          profile={profile}
          onBack={returnToForge}
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
          Головна
        </button>

        <button onClick={() => onNavigate("clan")}>
          Клан
        </button>
      </footer>
    </main>
  );
    }
