
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pickaxe,
  Search,
  Coins,
  Sparkles,
  Clock,
  ShieldCheck,
  Gem,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  Mountain,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const RESOURCE_INFO = {
  diamond: { name: "Алмаз", icon: "💎" },
  corundum: { name: "Корунд", icon: "🔴" },
  obsidian: { name: "Обсидіан", icon: "⚫" },
  graphite: { name: "Графіт", icon: "🪨" },
  onyx: { name: "Онікс", icon: "⬛" },
  ambrosia: { name: "Амброзія", icon: "🌺" },
  mint: { name: "М'ята", icon: "🌿" },
  calamus: { name: "Аїр", icon: "🍃" },
  rowan: { name: "Горобина", icon: "🫐" },
};

const PANEL = {
  background: "linear-gradient(145deg, #241b15, #17110e)",
  border: "1px solid #493627",
  borderRadius: 15,
  padding: 15,
};

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}г ${String(minutes).padStart(2, "0")}хв ${String(secs).padStart(2, "0")}с`;
  }

  return `${minutes}хв ${String(secs).padStart(2, "0")}с`;
}

function secondsUntil(value, now) {
  if (!value) return 0;
  return Math.max(0, (new Date(value).getTime() - now) / 1000);
}

function getAccelerationCost(level, remainingSeconds) {
  const pricePerMinute = 50 + 8 * (Math.max(1, Number(level) || 1) - 1);
  return Math.ceil(Math.max(0, remainingSeconds) / 60) * pricePerMinute;
}

function CaveButton({
  children,
  onClick,
  disabled,
  secondary = false,
  style = {},
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        minHeight: 45,
        padding: "11px 14px",
        borderRadius: 10,
        border: secondary ? "1px solid #66503a" : "1px solid #e8a23b",
        background: disabled
          ? "#332b24"
          : secondary
            ? "linear-gradient(135deg, #3b2d22, #292019)"
            : "linear-gradient(135deg, #c98428, #8c511a)",
        color: disabled ? "#897b6b" : "#fff2d7",
        fontWeight: 800,
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export default function Cave({ profile, player, onNavigate }) {
  const [state, setState] = useState(null);
  const [resources, setResources] = useState([]);
  const [balances, setBalances] = useState({
    level: 1,
    gold: 0,
    silver: 0,
  });
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [lastGained, setLastGained] = useState([]);
  const revealLock = useRef(false);

  const loadState = useCallback(async () => {
    const { data, error } = await supabase.rpc("cave_get_state");

    if (error) throw error;

    setState(data?.state ?? null);
    setResources(data?.resources ?? []);
    setBalances({
      level: Number(data?.profile?.level ?? profile?.level ?? player?.level ?? 1),
      gold: Number(data?.profile?.gold ?? profile?.gold ?? player?.gold ?? 0),
      silver: Number(data?.profile?.silver ?? profile?.silver ?? player?.silver ?? 0),
    });
  }, [profile, player]);

  const showError = (error) => {
    setMessage(error?.message || "Сталася невідома помилка.");
    setMessageType("error");
  };

  const perform = async (action, successText) => {
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const result = await action();

      if (successText) {
        setMessage(successText);
        setMessageType("success");
      }

      await loadState();
      return result;
    } catch (error) {
      showError(error);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const startSearch = () =>
    perform(
      async () => {
        const { error } = await supabase.rpc("cave_start_search");
        if (error) throw error;
      },
      "Пошук розпочато. За 15 секунд ти знайдеш три ресурси."
    );

  const activateGuarantee = () =>
    perform(
      async () => {
        const { error } = await supabase.rpc("cave_guarantee_resources");
        if (error) throw error;
      },
      "Гарантію активовано! Шанси всіх трьох ресурсів — 100%."
    );

  const startMining = () =>
    perform(
      async () => {
        const { error } = await supabase.rpc("cave_start_mining");
        if (error) throw error;
        setLastGained([]);
      },
      "Видобуток розпочато. Час роботи — 50 хвилин."
    );

  const speedUpMining = () =>
    perform(
      async () => {
        const { error } = await supabase.rpc("cave_speed_up_mining");
        if (error) throw error;
      },
      "Видобуток прискорено! Можна забирати ресурси."
    );

  const claimMining = () =>
    perform(
      async () => {
        const { data, error } = await supabase.rpc("cave_claim_mining");
        if (error) throw error;
        setLastGained(data?.gained ?? []);
        return data;
      }
    ).then((result) => {
      if (result) {
        const gained = result?.gained ?? [];
        setMessage(
          gained.length
            ? `Видобуток завершено! Отримано ресурсів: ${gained.length}.`
            : "Видобуток завершено, але ресурси цього разу не випали."
        );
        setMessageType(gained.length ? "success" : "info");
      }
    });

  useEffect(() => {
    let active = true;

    loadState().catch((error) => {
      if (active) showError(error);
    });

    return () => {
      active = false;
    };
  }, [loadState]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const phase = state?.phase ?? "idle";
  const offers = Array.isArray(state?.offers) ? state.offers : [];

  const searchSeconds = secondsUntil(state?.search_ready_at, now);
  const miningSeconds = secondsUntil(state?.mine_ready_at, now);

  const miningCost = useMemo(
    () => getAccelerationCost(balances.level, miningSeconds),
    [balances.level, miningSeconds]
  );

  // Коли таймер пошуку закінчується, сервер відкриває три ресурси.
  useEffect(() => {
    if (phase !== "searching" || searchSeconds > 0 || revealLock.current) {
      if (phase !== "searching") revealLock.current = false;
      return;
    }

    revealLock.current = true;

    (async () => {
      try {
        setBusy(true);
        const { error } = await supabase.rpc("cave_reveal_resources");
        if (error) throw error;

        await loadState();
        setMessage("Пошук завершено! Три ресурси знайдено.");
        setMessageType("success");
      } catch (error) {
        showError(error);
      } finally {
        setBusy(false);
        revealLock.current = false;
      }
    })();
  }, [phase, searchSeconds, loadState]);

  const resourceMap = useMemo(() => {
    const map = {};
    resources.forEach((item) => {
      map[item.resource_key] = Number(item.quantity ?? 0);
    });
    return map;
  }, [resources]);

  const pricePerMinute = 50 + 8 * (Math.max(1, balances.level) - 1);

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#120e0b",
        color: "#f1e2cd",
        padding: "14px 12px 30px",
        fontFamily: "inherit",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          ...PANEL,
          padding: 0,
          overflow: "hidden",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            padding: "22px 17px",
            background:
              "radial-gradient(ellipse at 50% 0%, #604024 0%, #2a1c13 48%, #17110d 100%)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              margin: "0 auto 10px",
              width: 70,
              height: 70,
              borderRadius: 20,
              display: "grid",
              placeItems: "center",
              background: "#21170f",
              border: "1px solid #78532e",
              color: "#e8a23b",
            }}
          >
            <Mountain size={40} />
          </div>
          <div
            style={{
              fontSize: 25,
              fontWeight: 900,
              color: "#f0c37c",
              letterSpacing: 1,
            }}
          >
            ПЕЧЕРА
          </div>
          <div style={{ fontSize: 12, color: "#bba68d", marginTop: 6 }}>
            Шукай рідкісні ресурси в глибинах Ельдари
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 8,
            padding: 12,
          }}
        >
          <div style={statStyle}>
            <div style={{ color: "#c2aa8e", fontSize: 11 }}>РІВЕНЬ</div>
            <div style={{ fontWeight: 900, fontSize: 19 }}>
              {balances.level}
            </div>
          </div>
          <div style={statStyle}>
            <div style={{ color: "#e8b348", fontSize: 11 }}>
              <Coins size={12} style={{ verticalAlign: "middle" }} /> ЗОЛОТО
            </div>
            <div style={{ fontWeight: 900, fontSize: 19 }}>
              {balances.gold.toLocaleString("uk-UA")}
            </div>
          </div>
          <div style={statStyle}>
            <div style={{ color: "#c6cbd0", fontSize: 11 }}>
              <Gem size={12} style={{ verticalAlign: "middle" }} /> СРІБЛО
            </div>
            <div style={{ fontWeight: 900, fontSize: 19 }}>
              {balances.silver.toLocaleString("uk-UA")}
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            marginBottom: 12,
            padding: 12,
            borderRadius: 10,
            border:
              messageType === "error"
                ? "1px solid #8d4439"
                : "1px solid #665038",
            background: messageType === "error" ? "#351b17" : "#292016",
            color: messageType === "error" ? "#ffb8a9" : "#e8d0a9",
            fontSize: 13,
            lineHeight: 1.45,
          }}
        >
          {messageType === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{message}</span>
        </div>
      )}

      <section style={{ ...PANEL, marginBottom: 14 }}>
        <div style={sectionTitle}>
          <Search size={19} color="#e8a23b" />
          Пошук ресурсів
        </div>

        {phase === "idle" && (
          <>
            <p style={mutedText}>
              Розпочни пошук. Через 15 секунд печера відкриє три випадкові
              ресурси з шансами від 16% до 25%.
            </p>
            <CaveButton onClick={startSearch} disabled={busy}>
              <Search size={17} />
              {busy ? "Зачекай..." : "Почати пошук"}
            </CaveButton>
          </>
        )}

        {phase === "searching" && (
          <div style={timerBox}>
            <Clock size={23} color="#e8a23b" />
            <div>
              <div style={{ fontWeight: 800 }}>Печера шукає ресурси</div>
              <div style={{ fontSize: 22, color: "#f0bd69", fontWeight: 900 }}>
                {formatTime(searchSeconds)}
              </div>
            </div>
          </div>
        )}

        {(phase === "ready" || phase === "mining") && (
          <div style={mutedText}>
            {phase === "ready"
              ? "Ресурси знайдено. Перевір шанси та починай видобуток."
              : "Ресурси вже вибрано. Видобуток триває."}
          </div>
        )}
      </section>

      {(phase === "ready" || phase === "mining") && (
        <section style={{ ...PANEL, marginBottom: 14 }}>
          <div style={sectionTitle}>
            <Sparkles size={19} color="#e8a23b" />
            Знайдені ресурси
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 8,
              marginTop: 13,
            }}
          >
            {offers.map((offer) => {
              const info = RESOURCE_INFO[offer.resource_key] ?? {
                name: offer.resource_key,
                icon: "📦",
              };
              const chance = state?.guaranteed
                ? 100
                : Number(offer.chance ?? 16);

              return (
                <div
                  key={offer.resource_key}
                  style={{
                    background: "#19130f",
                    border: `1px solid ${chance === 100 ? "#b68a42" : "#493627"}`,
                    borderRadius: 12,
                    padding: "13px 5px",
                    textAlign: "center",
                    minWidth: 0,
                  }}
                >
                  <div style={{ fontSize: 29 }}>{info.icon}</div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      marginTop: 7,
                      minHeight: 30,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {info.name}
                  </div>
                  <div
                    style={{
                      color: chance === 100 ? "#8fe0a2" : "#e8b45e",
                      fontWeight: 900,
                      fontSize: 18,
                      marginTop: 5,
                    }}
                  >
                    {chance}%
                  </div>
                  <div style={{ color: "#a99680", fontSize: 10 }}>шанс</div>
                </div>
              );
            })}
          </div>

          {phase === "ready" && (
            <div style={{ marginTop: 14 }}>
              {!state?.guaranteed && (
                <CaveButton
                  secondary
                  onClick={activateGuarantee}
                  disabled={busy}
                >
                  <ShieldCheck size={17} />
                  Підвищити всі шанси до 100% · 20 золота
                </CaveButton>
              )}

              {state?.guaranteed && (
                <div
                  style={{
                    color: "#8fe0a2",
                    fontWeight: 800,
                    fontSize: 13,
                    textAlign: "center",
                    padding: "7px 0 12px",
                  }}
                >
                  <ShieldCheck
                    size={17}
                    style={{ verticalAlign: "middle", marginRight: 6 }}
                  />
                  Гарантію активовано — усі ресурси випадуть
                </div>
              )}

              <div style={{ height: 9 }} />

              <CaveButton onClick={startMining} disabled={busy}>
                <Pickaxe size={18} />
                {busy ? "Зачекай..." : "Добути · 50 хвилин"}
              </CaveButton>
            </div>
          )}

          {phase === "mining" && (
            <div style={{ marginTop: 15 }}>
              <div style={timerBox}>
                <Pickaxe size={24} color="#e8a23b" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800 }}>Триває видобуток</div>
                  <div
                    style={{
                      color: "#f0bd69",
                      fontSize: 21,
                      fontWeight: 900,
                    }}
                  >
                    {miningSeconds > 0 ? formatTime(miningSeconds) : "Готово!"}
                  </div>
                </div>
              </div>

              {miningSeconds > 0 ? (
                <>
                  <div style={{ ...mutedText, marginTop: 12 }}>
                    Ціна за хвилину на твоєму рівні:{" "}
                    <strong style={{ color: "#e8c17e" }}>
                      {pricePerMinute.toLocaleString("uk-UA")} срібла
                    </strong>
                    . Прискорення списує срібло за весь час, що залишився,
                    округлений до повних хвилин.
                  </div>
                  <CaveButton
                    secondary
                    onClick={speedUpMining}
                    disabled={busy || balances.silver < miningCost}
                  >
                    <Zap size={17} />
                    Прискорити за {miningCost.toLocaleString("uk-UA")} срібла
                  </CaveButton>
                  {balances.silver < miningCost && (
                    <div
                      style={{
                        color: "#e49a83",
                        fontSize: 12,
                        marginTop: 7,
                        textAlign: "center",
                      }}
                    >
                      Недостатньо срібла для прискорення.
                    </div>
                  )}
                </>
              ) : (
                <CaveButton onClick={claimMining} disabled={busy}>
                  <Pickaxe size={18} />
                  {busy ? "Забираємо..." : "Забрати ресурси"}
                </CaveButton>
              )}
            </div>
          )}
        </section>
      )}

      {lastGained.length > 0 && (
        <section style={{ ...PANEL, marginBottom: 14 }}>
          <div style={sectionTitle}>
            <CheckCircle2 size={19} color="#8fe0a2" />
            Останній видобуток
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {lastGained.map((item, index) => {
              const info = RESOURCE_INFO[item.resource_key] ?? {
                name: item.resource_key,
                icon: "📦",
              };
              return (
                <div key={`${item.resource_key}-${index}`} style={lootRow}>
                  <span style={{ fontSize: 22 }}>{info.icon}</span>
                  <span style={{ flex: 1, fontWeight: 700 }}>{info.name}</span>
                  <span style={{ color: "#8fe0a2", fontWeight: 900 }}>
                    +{item.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section style={PANEL}>
        <div style={sectionTitle}>
          <Gem size={19} color="#e8a23b" />
          Мої ресурси
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 8,
            marginTop: 12,
          }}
        >
          {Object.entries(RESOURCE_INFO).map(([key, info]) => (
            <div key={key} style={inventoryCell}>
              <span style={{ fontSize: 23 }}>{info.icon}</span>
              <span
                style={{
                  fontSize: 11,
                  color: "#cbb69b",
                  overflowWrap: "anywhere",
                }}
              >
                {info.name}
              </span>
              <strong style={{ color: "#f0d7ad", fontSize: 16 }}>
                {(resourceMap[key] ?? 0).toLocaleString("uk-UA")}
              </strong>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => perform(loadState)}
          disabled={busy}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 7,
            width: "100%",
            marginTop: 13,
            padding: 10,
            border: "1px solid #493627",
            borderRadius: 9,
            background: "#211810",
            color: "#cbb69b",
            
            fontWeight: 700,
          }}
        >
          <RefreshCw size={15} />
          Оновити ресурси
        </button>
      </section>
    </div>
  );
}

const statStyle = {
  padding: "10px 5px",
  textAlign: "center",
  background: "#19130f",
  border: "1px solid #493627",
  borderRadius: 10,
  minWidth: 0,
  overflowWrap: "anywhere",
};

const sectionTitle = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  fontSize: 16,
  fontWeight: 900,
  color: "#f0d7b4",
};

const mutedText = {
  color: "#b8a48d",
  fontSize: 12,
  lineHeight: 1.6,
  margin: "11px 0 14px",
};

const timerBox = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 13,
  marginTop: 12,
  borderRadius: 11,
  border: "1px solid #57402b",
  background: "#1a130e",
};

const inventoryCell = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 5,
  padding: "10px 4px",
  background: "#19130f",
  border: "1px solid #493627",
  borderRadius: 10,
  textAlign: "center",
  minWidth: 0,
};

const lootRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: 10,
  background: "#19130f",
  border: "1px solid #493627",
  borderRadius: 9,
};

           
