
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Shield, Users, Crown, Swords, Coins, RefreshCw,
  LogOut, Settings, ChevronLeft, ChevronRight, Plus,
} from "lucide-react";

const PAGE_SIZE = 10;

const ROLE_NAMES = {
  leader: "Лідер",
  deputy: "Заступник",
  general: "Генерал",
  officer: "Офіцер",
  fighter: "Воїн",
  newbie: "Новачок",
};

const ROLE_ORDER = {
  leader: 0,
  deputy: 1,
  general: 2,
  officer: 3,
  fighter: 4,
  newbie: 5,
};

const number = (value) =>
  Math.floor(Number(value) || 0).toLocaleString("uk-UA");

export default function Clan({ profile, player }) {
  const currentPlayer = player || profile || {};
  const userId = currentPlayer.id;

  const [clan, setClan] = useState(null);
  const [members, setMembers] = useState([]);
  const [myMembership, setMyMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(0);
  const [clanName, setClanName] = useState("");
  const [description, setDescription] = useState("");

  const loadClan = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setError("Не вдалося визначити гравця. Перезайди в гру.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: membership, error: membershipError } =
        await supabase
          .from("clan_members")
          .select("id, clan_id, user_id, role, title, joined_at, clan_experience")
          .eq("user_id", userId)
          .maybeSingle();

      if (membershipError) throw membershipError;

      setMyMembership(membership);

      if (!membership) {
        setClan(null);
        setMembers([]);
        return;
      }

      const { data: clanData, error: clanError } = await supabase
        .from("clans")
        .select("*")
        .eq("id", membership.clan_id)
        .maybeSingle();

      if (clanError) throw clanError;
      if (!clanData) throw new Error("Клан не знайдено.");

      setClan(clanData);

      const { data: memberRows, error: membersError } = await supabase
        .from("clan_members")
        .select("id, user_id, role, title, joined_at, clan_experience, last_activity_at")
        .eq("clan_id", clanData.id);

      if (membersError) throw membersError;

      const ids = (memberRows || []).map((row) => row.user_id);

      if (!ids.length) {
        setMembers([]);
        return;
      }

      const [
        { data: profiles, error: profilesError },
        { data: stats, error: statsError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, level, last_seen_at")
          .in("id", ids),

        supabase
          .from("player_stats")
          .select("user_id, power")
          .in("user_id", ids),
      ]);

      if (profilesError) throw profilesError;
      if (statsError) throw statsError;

      const profileMap = new Map(
        (profiles || []).map((item) => [item.id, item])
      );

      const statsMap = new Map(
        (stats || []).map((item) => [item.user_id, item])
      );

      const normalized = (memberRows || [])
        .map((row) => {
          const playerProfile = profileMap.get(row.user_id) || {};
          const playerStats = statsMap.get(row.user_id) || {};

          return {
            ...row,
            name:
              playerProfile.display_name ||
              playerProfile.username ||
              "Гравець",
            avatar: playerProfile.avatar_url,
            level: Number(playerProfile.level || 1),
            power: Number(playerStats.power || 0),
            lastSeen: playerProfile.last_seen_at,
            online:
              playerProfile.last_seen_at &&
              Date.now() - new Date(playerProfile.last_seen_at).getTime() <
                5 * 60 * 1000,
          };
        })
        .sort(
          (a, b) =>
            (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99) ||
            b.power - a.power
        );

      setMembers(normalized);
      setPage(0);
    } catch (err) {
      console.error("Clan load error:", err);
      setError(err.message || "Не вдалося завантажити клан.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadClan();
  }, [loadClan]);

  const myRole = myMembership?.role;
  const canManage = ["leader", "deputy", "general", "officer"].includes(myRole);
  const isLeader = myRole === "leader";

  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  const visibleMembers = useMemo(
    () => members.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [members, page]
  );

  const totalPower = members.reduce((sum, member) => sum + member.power, 0);

  async function createClan(event) {
    event.preventDefault();

    if (!clanName.trim() || busy) return;

    setBusy(true);
    setNotice("");
    setError("");

    try {
      const { error: rpcError } = await supabase.rpc("create_clan", {
        p_name: clanName.trim(),
        p_description: description.trim() || null,
      });

      if (rpcError) throw rpcError;

      setClanName("");
      setDescription("");
      setNotice("Клан успішно створено!");
      await loadClan();
    } catch (err) {
      setError(err.message || "Не вдалося створити клан.");
    } finally {
      setBusy(false);
    }
  }

  async function leaveClan() {
    if (busy || !window.confirm("Точно хочеш вийти з клану?")) return;

    setBusy(true);
    setNotice("");
    setError("");

    try {
      const { error: rpcError } = await supabase.rpc("leave_clan");

      if (rpcError) throw rpcError;

      setNotice("Ти залишив клан.");
      await loadClan();
    } catch (err) {
      setError(err.message || "Не вдалося вийти з клану.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div style={styles.center}>Завантаження клану...</div>;
  }

  if (error && !clan) {
    return (
      <div style={styles.page}>
        <div style={styles.noticeError}>{error}</div>
        <button style={styles.button} onClick={loadClan}>
          <RefreshCw size={16} /> Повторити
        </button>
      </div>
    );
  }

  if (!clan) {
    return (
      <main style={styles.page}>
        <header style={styles.hero}>
          <div style={styles.emblem}><Shield size={42} /></div>
          <div>
            <div style={styles.eyebrow}>ХРОНІКИ ЗГАСЛОГО СВІТАНКУ</div>
            <h1 style={styles.heading}>Клани</h1>
            <p style={styles.muted}>Твоя сила — у єдності.</p>
          </div>
        </header>

        {notice && <div style={styles.notice}>{notice}</div>}
        {error && <div style={styles.noticeError}>{error}</div>}

        <section style={styles.panel}>
          <h2 style={styles.subheading}>Створити власний клан</h2>
          <p style={styles.muted}>
            Вартість створення — 2 500 золота. Максимум — 50 учасників.
          </p>

          <form onSubmit={createClan} style={styles.form}>
            <input
              value={clanName}
              onChange={(event) => setClanName(event.target.value)}
              placeholder="Назва клану"
              minLength={3}
              maxLength={30}
              required
              style={styles.input}
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Короткий опис клану"
              maxLength={500}
              style={styles.textarea}
            />
            <button
              type="submit"
              disabled={busy}
              style={styles.button}
            >
              <Plus size={17} />
              {busy ? "Створення..." : "Створити клан"}
            </button>
          </form>
        </section>

        <div style={styles.empty}>
          <Users size={30} />
          <strong>Ти ще не вступив до клану</strong>
          <span>Пошук кланів та заявки додамо наступним етапом.</span>
        </div>
      </main>
    );
  }

  const experience = Number(clan.experience || 0);
  const statueLevel = Number(clan.statue_level || 1);
  const memberCount = members.length;

  return (
    <main style={styles.page}>
      <header style={styles.hero}>
        <div style={styles.emblem}>
          {clan.image_url ? (
            <img src={clan.image_url} alt="Герб клану" style={styles.emblemImage} />
          ) : (
            <Shield size={42} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.eyebrow}>ТВОЯ ГІЛЬДІЯ</div>
          <h1 style={styles.heading}>{clan.name}</h1>
          <p style={styles.muted}>
            Рівень {clan.level} · {memberCount}/{clan.max_members || 50} учасників
          </p>
        </div>

        <button
          style={styles.iconButton}
          title="Оновити"
          onClick={loadClan}
          disabled={busy}
        >
          <RefreshCw size={18} />
        </button>
      </header>

      {notice && <div style={styles.notice}>{notice}</div>}
      {error && <div style={styles.noticeError}>{error}</div>}

      <section style={styles.stats}>
        <div style={styles.stat}>
          <Swords size={20} />
          <strong>{number(totalPower)}</strong>
          <small>Сила учасників</small>
        </div>
        <div style={styles.stat}>
          <Crown size={20} />
          <strong>{number(experience)}</strong>
          <small>Досвід клану</small>
        </div>
        <div style={styles.stat}>
          <Shield size={20} />
          <strong>{statueLevel}</strong>
          <small>Рівень статуї</small>
        </div>
        <div style={styles.stat}>
          <Users size={20} />
          <strong>{memberCount}</strong>
          <small>Учасники</small>
        </div>
      </section>

      <section style={styles.panel}>
        <div style={styles.panelTitle}>
          <h2 style={styles.subheading}>Розвиток клану</h2>
          <span style={styles.level}>РІВЕНЬ {clan.level}</span>
        </div>
        <p style={styles.muted}>
          Загальний досвід: {number(experience)} XP
        </p>
        <div style={styles.progressTrack}>
          <div style={styles.progressFill} />
        </div>
        <p style={styles.hint}>
          Вимоги до наступного рівня будуть підключені після визначення таблиці досвіду кланів.
        </p>
      </section>

      <section style={styles.panel}>
        <div style={styles.panelTitle}>
          <h2 style={styles.subheading}>Учасники клану</h2>
          <span style={styles.muted}>{memberCount} / {clan.max_members || 50}</span>
        </div>

        {visibleMembers.length === 0 ? (
          <div style={styles.empty}>У клані поки немає учасників.</div>
        ) : (
          <div style={styles.memberList}>
            {visibleMembers.map((member) => (
              <article key={member.id} style={styles.member}>
                <div style={styles.avatar}>
                  {member.avatar ? (
                    <img src={member.avatar} alt="" style={styles.avatarImage} />
                  ) : (
                    "⚔️"
                  )}
                  <span
                    style={{
                      ...styles.onlineDot,
                      background: member.online ? "#65bd70" : "#75685b",
                    }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={styles.memberName}>{member.name}</strong>
                  <div style={styles.memberMeta}>
                    Рівень {member.level} · Сила {number(member.power)}
                  </div>
                  <div style={styles.memberRole}>
                    {member.title || ROLE_NAMES[member.role] || member.role}
                  </div>
                </div>

                {member.role === "leader" && (
                  <Crown size={19} color="#e8a23b" />
                )}
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={styles.pagination}>
            <button
              style={styles.pageButton}
              disabled={page === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              <ChevronLeft size={18} />
            </button>
            <span>{page + 1} / {totalPages}</span>
            <button
              style={styles.pageButton}
              disabled={page >= totalPages - 1}
              onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </section>

      <section style={styles.panel}>
        <h2 style={styles.subheading}>Інформація про клан</h2>
        <p style={styles.description}>
          {clan.description || "Опис клану ще не додано."}
        </p>
        <div style={styles.infoRow}>
          <span>Дата заснування</span>
          <strong>
            {clan.created_at
              ? new Date(clan.created_at).toLocaleDateString("uk-UA")
              : "—"}
          </strong>
        </div>
        <div style={styles.infoRow}>
          <span>Твоя роль</span>
          <strong>{myMembership?.title || ROLE_NAMES[myRole] || myRole}</strong>
        </div>
        <div style={styles.infoRow}>
          <span>Твій внесок у досвід</span>
          <strong>{number(myMembership?.clan_experience)} XP</strong>
        </div>
      </section>

      <section style={styles.panel}>
        <h2 style={styles.subheading}>Розділи клану</h2>
        <div style={styles.modules}>
          {[
            ["🗿", "Статуя клану"],
            ["⚔️", "Підземелля клану"],
            ["📜", "Класові завдання"],
            ["🏆", "Зала слави"],
            ["💰", "Скарбниця"],
            ["📖", "Журнал"],
            ["💬", "Форум і чат"],
          ].map(([icon, title]) => (
            <div key={title} style={styles.module}>
              <span>{icon}</span>
              <strong>{title}</strong>
              <small>Наступний етап розробки</small>
            </div>
          ))}
        </div>
      </section>

      {canManage && (
        <section style={styles.panel}>
          <h2 style={styles.subheading}>
            <Settings size={17} /> Керування кланом
          </h2>
          <p style={styles.muted}>
            Твоя роль дозволяє керувати учасниками та налаштуваннями клану.
            Інструменти керування підключимо окремо.
          </p>
          {isLeader && (
            <div style={styles.hint}>
              Ти є лідером клану.
            </div>
          )}
        </section>
      )}

      <section style={styles.actions}>
        <button
          style={styles.leaveButton}
          onClick={leaveClan}
          disabled={busy}
        >
          <LogOut size={17} />
          {busy ? "Обробка..." : "Вийти з клану"}
        </button>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "12px 12px 100px",
    boxSizing: "border-box",
    color: "#d4b382",
    background: "linear-gradient(180deg,#120e0b,#1d1714)",
    fontFamily: "Arial,sans-serif",
  },
  center: {
    padding: 35,
    textAlign: "center",
    color: "#d4b382",
  },
  hero: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 15,
    border: "1px solid #60482b",
    borderRadius: 12,
    background: "linear-gradient(135deg,#302115,#17110d)",
  },
  emblem: {
    width: 66,
    height: 66,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    border: "1px solid #a77b3c",
    borderRadius: 9,
    color: "#e8a23b",
    background: "#21170f",
  },
  emblemImage: { width: "100%", height: "100%", objectFit: "cover" },
  eyebrow: { color: "#a58a67", fontSize: 9, letterSpacing: 2 },
  heading: { margin: "5px 0", fontSize: 19, color: "#f0d3a0" },
  muted: { margin: "5px 0", color: "#a58f72", fontSize: 11, lineHeight: 1.5 },
  iconButton: {
    width: 36, height: 36, display: "grid", placeItems: "center",
    border: "1px solid #60482b", borderRadius: 7,
    background: "#21170f", color: "#e8a23b",
  },
  stats: {
    display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: 8, margin: "12px 0",
  },
  stat: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 5, padding: 12, border: "1px solid #443222",
    borderRadius: 9, background: "#1b140f", color: "#d4b382",
  },
  stat strong: { fontSize: 15, color: "#f0d3a0" },
  stat small: { fontSize: 10, color: "#a58f72" },
  panel: {
    marginTop: 12, padding: 14, border: "1px solid #443222",
    borderRadius: 10, background: "#1b140f",
  },
  panelTitle: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 8,
  },
  subheading: {
    display: "flex", alignItems: "center", gap: 7,
    margin: "0 0 10px", color: "#edc98f", fontSize: 15,
  },
  level: { color: "#e8a23b", fontSize: 10, fontWeight: 700 },
  progressTrack: {
    height: 8, overflow: "hidden", borderRadius: 8,
    background: "#33261b",
  },
  progressFill: {
    width: "0%", height: "100%", background: "#b68137",
  },
  hint: { marginTop: 9, color: "#89765e", fontSize: 10, lineHeight: 1.5 },
  memberList: { display: "flex", flexDirection: "column", gap: 7 },
  member: {
    display: "flex", alignItems: "center", gap: 10,
    padding: 9, border: "1px solid #392b1e",
    borderRadius: 8, background: "#17110d",
  },
  avatar: {
    position: "relative", width: 42, height: 42, flexShrink: 0,
    display: "grid", placeItems: "center", overflow: "hidden",
    border: "1px solid #59432b", borderRadius: 7,
    background: "#2b2016", fontSize: 20,
  },
  avatarImage: { width: "100%", height: "100%", objectFit: "cover" },
  onlineDot: {
    position: "absolute", right: 2, bottom: 2, width: 8, height: 8,
    border: "1px solid #17110d", borderRadius: "50%",
  },
  memberName: { color: "#f0d3a0", fontSize: 12 },
  memberMeta: { marginTop: 3, color: "#a58f72", fontSize: 10 },
  memberRole: { marginTop: 3, color: "#d5a04e", fontSize: 10 },
  pagination: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 18, marginTop: 13, color: "#d4b382", fontSize: 12,
  },
  pageButton: {
    width: 32, height: 30, display: "grid", placeItems: "center",
    border: "1px solid #60482b", borderRadius: 6,
    background: "#21170f", color: "#e8a23b",
  },
  description: { color: "#b9a184", fontSize: 12, lineHeight: 1.6 },
  infoRow: {
    display: "flex", justifyContent: "space-between", gap: 10,
    padding: "9px 0", borderBottom: "1px solid #38291d",
    color: "#a58f72", fontSize: 11,
  },
  modules: {
    display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: 8,
  },
  module: {
    display: "flex", flexDirection: "column", gap: 5,
    minHeight: 75, padding: 10, border: "1px solid #493622",
    borderRadius: 8, background: "#17110d",
  },
  module span: { fontSize: 21 },
  module strong: { color: "#e0bd88", fontSize: 11 },
  module small: { color: "#88745b", fontSize: 9 },
  actions: { marginTop: 14 },
  leaveButton: {
    width: "100%", display: "flex", justifyContent: "center",
    alignItems: "center", gap: 8, padding: 12,
    border: "1px solid #754033", borderRadius: 8,
    background: "#321b16", color: "#e2a18b", fontWeight: 700,
  },
  notice: {
    marginTop: 10, padding: 11, border: "1px solid #557342",
    borderRadius: 7, background: "#1d2a19", color: "#b9d69d",
    fontSize: 12,
  },
  noticeError: {
    marginTop: 10, padding: 11, border: "1px solid #754033",
    borderRadius: 7, background: "#321b16", color: "#f0b1a0",
    fontSize: 12,
  },
  empty: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 9, padding: 25, color: "#a58f72", textAlign: "center",
    fontSize: 12,
  },
  form: { display: "flex", flexDirection: "column", gap: 9, marginTop: 12 },
  input: {
    width: "100%", boxSizing: "border-box", padding: 12,
    border: "1px solid #60482b", borderRadius: 7,
    background: "#120e0b", color: "#f0d3a0",
  },
  textarea: {
    width: "100%", minHeight: 75, boxSizing: "border-box", padding: 12,
    border: "1px solid #60482b", borderRadius: 7,
    background: "#120e0b", color: "#f0d3a0", resize: "vertical",
  },
  button: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 8, padding: 12, border: "1px solid #a77b3c",
    borderRadius: 7, background: "#5a3c1e", color: "#ffe0ad",
    fontWeight: 700,
  },
};
