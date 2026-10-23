
import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Gem, Leaf, RefreshCw, AlertCircle } from "lucide-react";

const RESOURCES = [
  { key: "diamond", name: "Алмаз", icon: "💎", group: "Мінерали" },
  { key: "corundum", name: "Корунд", icon: "🔴", group: "Мінерали" },
  { key: "obsidian", name: "Обсидіан", icon: "⚫", group: "Мінерали" },
  { key: "graphite", name: "Графіт", icon: "🪨", group: "Мінерали" },
  { key: "onyx", name: "Онікс", icon: "⬛", group: "Мінерали" },
  { key: "ambrosia", name: "Амброзія", icon: "🌺", group: "Рослини" },
  { key: "mint", name: "М’ята", icon: "🌿", group: "Рослини" },
  { key: "calamus", name: "Аїр", icon: "🍃", group: "Рослини" },
  { key: "rowan", name: "Горобина", icon: "🫐", group: "Рослини" },
];

export default function CaveResources() {
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadResources = useCallback(async () => {
    setErrorMessage("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData?.user) {
      setErrorMessage("Увійди в гру, щоб переглянути свої ресурси.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("player_cave_resources")
      .select("resource_key, quantity")
      .eq("user_id", authData.user.id);

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    const next = {};
    for (const resource of RESOURCES) {
      next[resource.key] = 0;
    }
    for (const row of data || []) {
      next[row.resource_key] = Number(row.quantity || 0);
    }

    setQuantities(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const mineralResources = RESOURCES.filter(
    (resource) => resource.group === "Мінерали"
  );
  const plantResources = RESOURCES.filter(
    (resource) => resource.group === "Рослини"
  );

  function renderGroup(title, icon, resources) {
    return (
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>
          {icon} {title}
        </h3>

        <div style={styles.grid}>
          {resources.map((resource) => (
            <div key={resource.key} style={styles.card}>
              <div style={styles.icon}>{resource.icon}</div>
              <div style={styles.name}>{resource.name}</div>
              <div style={styles.quantity}>
                {Number(quantities[resource.key] || 0).toLocaleString("uk-UA")}
              </div>
              <div style={styles.label}>у запасі</div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Ресурси печери</h2>
          <p style={styles.subtitle}>
            Зібрані ресурси зберігаються за твоїм обліковим записом.
          </p>
        </div>

        <button
          type="button"
          onClick={loadResources}
          disabled={loading}
          style={styles.refresh}
          aria-label="Оновити ресурси"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {errorMessage && (
        <div style={styles.error}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>
          <RefreshCw size={20} />
          Завантаження ресурсів…
        </div>
      ) : (
        <>
          {renderGroup("Мінерали", <Gem size={17} />, mineralResources)}
          {renderGroup("Рослини та природні ресурси", <Leaf size={17} />, plantResources)}
        </>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    color: "#F0DFCA",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  title: {
    margin: "0 0 6px",
    fontSize: 21,
  },
  subtitle: {
    margin: 0,
    color: "#A99A89",
    fontSize: 12,
    lineHeight: 1.5,
  },
  refresh: {
    width: 42,
    height: 42,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    border: "1px solid #493729",
    borderRadius: 10,
    background: "#211811",
    color: "#E8A23B",
    cursor: "pointer",
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "0 0 11px",
    color: "#D4B382",
    fontSize: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },
  card: {
    minWidth: 0,
    padding: "13px 5px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    border: "1px solid #493729",
    borderRadius: 12,
    background: "#1D1714",
    textAlign: "center",
  },
  icon: {
    fontSize: 25,
    lineHeight: 1.3,
  },
  name: {
    fontSize: 11,
    color: "#D9C7AE",
    fontWeight: 700,
    overflowWrap: "anywhere",
  },
  quantity: {
    fontSize: 20,
    fontWeight: 900,
    color: "#E8A23B",
  },
  label: {
    fontSize: 9,
    color: "#A99A89",
  },
  error: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    padding: 12,
    border: "1px solid #75443A",
    borderRadius: 10,
    color: "#E78C78",
    background: "#211811",
    overflowWrap: "anywhere",
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    padding: 24,
    color: "#A99A89",
  },
};
      
