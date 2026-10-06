import React from "react";

export default function Battle({ navigateTo }) {
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button
          style={styles.backButton}
          onClick={() => navigateTo("hero")}
        >
          ←
        </button>

        <div>
          <div style={styles.eyebrow}>
            ХРОНІКИ ЗГАСЛОГО СВІТАНКУ
          </div>

          <h1 style={styles.title}>⚔️ Бій</h1>
        </div>
      </header>

      {/* АРЕНА */}
      <section style={styles.arena}>
        <div style={styles.enemy}>
          <div style={styles.enemyAvatar}>👹</div>

          <div style={styles.name}>Темний Вартовий</div>
          <div style={styles.level}>Рівень 5</div>

          <div style={styles.hpBar}>
            <div
              style={{
                ...styles.hpFill,
                width: "100%",
              }}
            />
          </div>

          <div style={styles.hpText}>500 / 500 HP</div>
        </div>

        <div style={styles.vs}>VS</div>

        <div style={styles.hero}>
          <div style={styles.heroAvatar}>⚔️</div>

          <div style={styles.name}>Аріан</div>
          <div style={styles.level}>Рівень 1</div>

          <div style={styles.hpBar}>
            <div
              style={{
                ...styles.hpFill,
                width: "86%",
                background:
                  "linear-gradient(90deg, #2ecc71, #8affb0)",
              }}
            />
          </div>

          <div style={styles.hpText}>860 / 1000 HP</div>
        </div>
      </section>

      {/* КЕРУВАННЯ */}
      <section style={styles.controls}>
        <div style={styles.status}>Готовий до бою</div>

        <button style={styles.mainButton}>
          ⚔️ ПОЧАТИ БІЙ
        </button>

        <div style={styles.speedRow}>
          <button style={styles.smallButton}>AUTO</button>
          <button style={styles.smallButton}>×2</button>
        </div>
      </section>

      {/* ЗДІБНОСТІ */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>ЗДІБНОСТІ</div>

        <div style={styles.skills}>
          {[
            ["🔥", "Ярість"],
            ["🌀", "Вихор критів"],
            ["🛡️", "Стійкість"],
            ["💚", "Вампіризм"],
            ["🍀", "Удача"],
            ["⚡", "Крапка броня"],
          ].map(([icon, title]) => (
            <button key={title} style={styles.skill}>
              <span style={styles.skillIcon}>{icon}</span>
              <span>{title}</span>
            </button>
          ))}
        </div>
      </section>

      {/* КОМАНДА */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>КОМАНДА</div>

        <div style={styles.team}>
          {[
            ["⚔️", "Аріан"],
            ["🌙", "Луна"],
            ["🔥", "Рей"],
          ].map(([icon, name]) => (
            <div key={name} style={styles.teamHero}>
              <div style={styles.teamAvatar}>{icon}</div>

              <strong style={styles.teamName}>{name}</strong>

              <span style={styles.teamLevel}>
                Рівень 1
              </span>
            </div>
          ))}
        </div>
      </section>

      <button
        style={styles.backToHome}
        onClick={() => navigateTo("hero")}
      >
        ← Повернутися до героя
      </button>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "14px",
    boxSizing: "border-box",
    color: "#fff",
    background:
      "radial-gradient(circle at 50% 20%, #45152f 0%, #1a0b17 45%, #0d070d 100%)",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },

  backButton: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #63304f",
    background: "#21101d",
    color: "#fff",
    fontSize: "22px",
    cursor: "pointer",
  },

  eyebrow: {
    fontSize: "8px",
    letterSpacing: "1.5px",
    opacity: 0.45,
  },

  title: {
    margin: "3px 0 0",
    fontSize: "24px",
  },

  arena: {
    minHeight: "350px",
    borderRadius: "18px",
    border: "1px solid #54253f",
    background:
      "linear-gradient(180deg, rgba(82,30,61,.55), rgba(18,10,18,.95))",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-around",
    padding: "18px 12px",
    boxSizing: "border-box",
  },

  enemy: {
    textAlign: "center",
  },

  enemyAvatar: {
    width: "92px",
    height: "92px",
    borderRadius: "50%",
    margin: "0 auto 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "52px",
    background: "#2a101d",
    border: "2px solid #7a3157",
    boxShadow: "0 0 25px rgba(232,76,130,.2)",
  },

  hero: {
    textAlign: "center",
  },

  heroAvatar: {
    width: "92px",
    height: "92px",
    borderRadius: "50%",
    margin: "0 auto 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "52px",
    background: "#17252a",
    border: "2px solid #477a72",
  },

  name: {
    fontSize: "15px",
    fontWeight: 800,
  },

  level: {
    fontSize: "10px",
    opacity: 0.5,
    marginTop: "3px",
  },

  vs: {
    fontSize: "20px",
    fontWeight: 900,
    color: "#e84c82",
    textShadow: "0 0 15px rgba(232,76,130,.5)",
  },

  hpBar: {
    width: "130px",
    height: "7px",
    borderRadius: "99px",
    background: "#2b1826",
    overflow: "hidden",
    margin: "8px auto 3px",
  },

  hpFill: {
    height: "100%",
    borderRadius: "99px",
    background:
      "linear-gradient(90deg, #c92e58, #ff668c)",
  },

  hpText: {
    fontSize: "9px",
    opacity: 0.55,
  },

  controls: {
    marginTop: "12px",
    textAlign: "center",
  },

  status: {
    fontSize: "10px",
    opacity: 0.5,
    marginBottom: "8px",
  },

  mainButton: {
    width: "100%",
    border: "0",
    borderRadius: "12px",
    padding: "14px",
    background:
      "linear-gradient(135deg, #e84c82, #9d2455)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  speedRow: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginTop: "8px",
  },

  smallButton: {
    border: "1px solid #63304f",
    borderRadius: "8px",
    background: "#21101d",
    color: "#fff",
    padding: "7px 18px",
    fontSize: "10px",
    cursor: "pointer",
  },

  section: {
    marginTop: "14px",
  },

  sectionTitle: {
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "1.5px",
    opacity: 0.5,
    marginBottom: "7px",
  },

  skills: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "7px",
  },

  skill: {
    minHeight: "72px",
    borderRadius: "11px",
    border: "1px solid #42243e",
    background: "#170d1a",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    fontSize: "9px",
    cursor: "pointer",
  },

  skillIcon: {
    fontSize: "23px",
  },

  team: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "7px",
  },

  teamHero: {
    padding: "9px 5px",
    borderRadius: "11px",
    border: "1px solid #42243e",
    background: "#170d1a",
    textAlign: "center",
  },

  teamAvatar: {
    width: "42px",
    height: "42px",
    margin: "0 auto 5px",
    borderRadius: "50%",
    background: "#291321",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },

  teamName: {
    display: "block",
    fontSize: "10px",
  },

  teamLevel: {
    display: "block",
    fontSize: "8px",
    opacity: 0.45,
    marginTop: "2px",
  },

  backToHome: {
    width: "100%",
    marginTop: "14px",
    padding: "11px",
    borderRadius: "10px",
    border: "1px solid #42243e",
    background: "#170d1a",
    color: "#fff",
    cursor: "pointer",
  },
};

