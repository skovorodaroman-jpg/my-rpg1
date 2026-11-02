import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Shield, Users, Crown, Swords, RefreshCw,
  LogOut, Settings, ChevronLeft, ChevronRight, Plus,
  Search, UserPlus, Check, X, Mail, Clock,
} from "lucide-react";

const PAGE_SIZE = 10;

// Сторінки Clan*.jsx у цій самій папці підключаються автоматично.
const CLAN_MODULES = [
  { id: "statue", icon: "🗿", title: "Статуя клану", file: "ClanStatues.jsx" },
  { id: "dungeon", icon: "⚔️", title: "Підземелля клану", file: "ClanDungeon.jsx" },
  { id: "quests", icon: "📜", title: "Класові завдання", file: "ClanQuests.jsx" },
  { id: "hall", icon: "🏆", title: "Зала слави", file: "ClanHallOfFame.jsx" },
  { id: "treasury", icon: "💰", title: "Скарбниця", file: "ClanTreasury.jsx" },
  { id: "journal", icon: "📖", title: "Журнал", file: "ClanJournal.jsx" },
  { id: "forum", icon: "💬", title: "Форум і чат", file: "ClanForum.jsx" },
];

const clanPageLoaders = import.meta.glob("./Clan*.jsx");

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

function getErrorMessage(error) {
  return error?.message || "Сталася невідома помилка.";
}

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

  const [activeClans, setActiveClans] = useState([]);
  const [incomingInvitations, setIncomingInvitations] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [clanApplications, setClanApplications] = useState([]);
  const [clanlessPlayers, setClanlessPlayers] = useState([]);

  const [clanSearch, setClanSearch] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");

  const [loadingExtra, setLoadingExtra] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const [moduleComponent, setModuleComponent] = useState(null);
  const [moduleLoading, setModuleLoading] = useState(false);

  const myRole = myMembership?.role;
  const canManage = ["leader", "deputy", "general", "officer"].includes(myRole);
  const isLeader = myRole === "leader";

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
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadExtra = useCallback(async () => {
    if (!userId) return;

    setLoadingExtra(true);

    try {
      const [
        invitationsResult,
        applicationsResult,
        clansResult,
      ] = await Promise.all([
        supabase
          .from("clan_invitations")
          .select("id, clan_id, inviter_id, status, created_at")
          .eq("invited_user_id", userId)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),

        supabase
          .from("clan_applications")
          .select("id, clan_id, user_id, status, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),

        supabase
          .from("clans")
          .select("id, name, description, level, max_members, created_at")
          .eq("is_active", true)
          .order("level", { ascending: false })
          .limit(100),
      ]);

      if (invitationsResult.error) throw invitationsResult.error;
      if (applicationsResult.error) throw applicationsResult.error;
      if (clansResult.error) throw clansResult.error;

      const invitationRows = invitationsResult.data || [];
      const applicationRows = applicationsResult.data || [];
      const clanRows = clansResult.data || [];

      const clanIds = [
        ...new Set([
          ...invitationRows.map((row) => row.clan_id),
          ...applicationRows.map((row) => row.clan_id),
        ]),
      ];

      let relatedClans = [];

      if (clanIds.length) {
        const { data, error: relatedError } = await supabase
          .from("clans")
          .select("id, name, level")
          .in("id", clanIds);

        if (relatedError) throw relatedError;
        relatedClans = data || [];
      }

      const clanMap = new Map(
        [...clanRows, ...relatedClans].map((item) => [item.id, item])
      );

      setIncomingInvitations(
        invitationRows.map((row) => ({
          ...row,
          clan: clanMap.get(row.clan_id),
        }))
      );

      setMyApplications(
        applicationRows.map((row) => ({
          ...row,
          clan: clanMap.get(row.clan_id),
        }))
      );

      setActiveClans(clanRows);
    } catch (err) {
      console.error("Clan extra load error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoadingExtra(false);
    }
  }, [userId]);

  const loadManagementData = useCallback(async () => {
    if (!clan?.id || !canManage) {
      setClanApplications([]);
      setClanlessPlayers([]);
      return;
    }

    try {
      const { data, error: applicationsError } = await supabase
        .from("clan_applications")
        .select("id, clan_id, user_id, status, created_at")
        .eq("clan_id", clan.id)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (applicationsError) throw applicationsError;

      setClanApplications(data || []);
    } catch (err) {
      console.error("Clan applications load error:", err);
      setError(getErrorMessage(err));
    }
  }, [clan?.id, canManage]);

  useEffect(() => {
    loadClan();
    loadExtra();
  }, [loadClan, loadExtra]);

  useEffect(() => {
    loadManagementData();
  }, [loadManagementData]);

  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));

  const visibleMembers = useMemo(
    () => members.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [members, page]
  );

  const totalPower = members.reduce((sum, member) => sum + member.power, 0);

  async function runAction(action, successMessage) {
    if (busy) return;

    setBusy(true);
    setNotice("");
    setError("");

    try {
      await action();
      setNotice(successMessage);

      await Promise.all([
        loadClan(),
        loadExtra(),
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function createClan(event) {
    event.preventDefault();

    if (!clanName.trim() || busy) return;

    await runAction(async () => {
      const { error: rpcError } = await supabase.rpc("create_clan", {
        p_name: clanName.trim(),
        p_description: description.trim() || null,
      });

      if (rpcError) throw rpcError;

      setClanName("");
      setDescription("");
    }, "Клан успішно створено!");
  }

  async function leaveClan() {
    if (busy || !window.confirm("Точно хочеш вийти з клану?")) return;

    await runAction(async () => {
      const { error: rpcError } = await supabase.rpc("leave_clan");
      if (rpcError) throw rpcError;
    }, "Ти залишив клан.");
  }

  async function applyToClan(clanId) {
    await runAction(async () => {
      const { error: rpcError } = await supabase.rpc("apply_to_clan", {
        p_clan_id: clanId,
      });

      if (rpcError) throw rpcError;
    }, "Заявку до клану надіслано!");
  }

  async function acceptApplication(applicationId) {
    await runAction(async () => {
      const { error: rpcError } = await supabase.rpc(
        "accept_clan_application",
        { p_application_id: applicationId }
      );

      if (rpcError) throw rpcError;
    }, "Гравця прийнято до клану!");
  }

  async function rejectApplication(applicationId) {
    await runAction(async () => {
      const { error: rpcError } = await supabase.rpc(
        "reject_clan_application",
        { p_application_id: applicationId }
      );

      if (rpcError) throw rpcError;
    }, "Заявку відхилено.");
  }

  async function acceptInvitation(invitationId) {
    await runAction(async () => {
      const { error: rpcError } = await supabase.rpc(
        "accept_clan_invitation",
        { p_invitation_id: invitationId }
      );

      if (rpcError) throw rpcError;
    }, "Ти вступив до клану!");
  }

  async function rejectInvitation(invitationId) {
    await runAction(async () => {
      const { error: rpcError } = await supabase.rpc(
        "reject_clan_invitation",
        { p_invitation_id: invitationId }
      );

      if (rpcError) throw rpcError;
    }, "Запрошення відхилено.");
  }

  async function searchPlayers() {
    if (!canManage || busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const { data, error: searchError } = await supabase.rpc(
        "search_clanless_players",
        { p_search: playerSearch.trim() || null }
      );

      if (searchError) throw searchError;

      setClanlessPlayers(data || []);

      if (!data?.length) {
        setNotice("Гравців без клану за цим запитом не знайдено.");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function invitePlayer(playerId) {
    if (!clan?.id) return;

    await runAction(async () => {
      const { error: rpcError } = await supabase.rpc("invite_to_clan", {
        p_clan_id: clan.id,
        p_invited_user_id: playerId,
      });

      if (rpcError) throw rpcError;

      setClanlessPlayers((current) =>
        current.filter((item) => item.user_id !== playerId)
      );
    }, "Запрошення гравцю надіслано!");
  }

  async function openClanModule(module) {
    setActiveModule(module);
    setModuleComponent(null);
    setModuleLoading(true);

    try {
      const loader = clanPageLoaders[`./${module.file}`];
      if (!loader) return;

      const loadedModule = await loader();
      if (typeof loadedModule.default === "function") {
        setModuleComponent(() => loadedModule.default);
      }
    } catch (err) {
      console.error(`Clan module load error (${module.file}):`, err);
      setError(`Не вдалося відкрити розділ «${module.title}».`);
    } finally {
      setModuleLoading(false);
    }
  }

  function closeClanModule() {
    setActiveModule(null);
    setModuleComponent(null);
    setError("");
    loadClan();
  }

  const filteredClans = activeClans.filter((item) =>
    item.name?.toLowerCase().includes(clanSearch.trim().toLowerCase())
  );

  if (loading) {
    return <div style={styles.center}>Завантаження клану...</div>;
  }

  if (error && !clan && !userId) {
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
          <button
            style={styles.iconButton}
            onClick={() => {
              loadExtra();
              loadClan();
            }}
            title="Оновити"
          >
            <RefreshCw size={18} />
          </button>
        </header>

        {notice && <div style={styles.notice}>{notice}</div>}
        {error && <div style={styles.noticeError}>{error}</div>}

        {incomingInvitations.length > 0 && (
          <section style={styles.panel}>
            <h2 style={styles.subheading}>
              <Mail size={18} /> Запрошення до клану
            </h2>

            {incomingInvitations.map((invitation) => (
              <article key={invitation.id} style={styles.requestCard}>
                <div style={{ flex: 1 }}>
                  <strong style={styles.itemTitle}>
                    {invitation.clan?.name || "Клан"}
                  </strong>
                  <p style={styles.muted}>
                    Рівень {invitation.clan?.level || 1}
                  </p>
                </div>

                <button
                  style={styles.acceptButton}
                  disabled={busy}
                  onClick={() => acceptInvitation(invitation.id)}
                  title="Прийняти"
                >
                  <Check size={17} />
                </button>
                <button
                  style={styles.rejectButton}
                  disabled={busy}
                  onClick={() => rejectInvitation(invitation.id)}
                  title="Відхилити"
                >
                  <X size={17} />
                </button>
              </article>
            ))}
          </section>
        )}

        {myApplications.some((item) => item.status === "pending") && (
          <section style={styles.panel}>
            <h2 style={styles.subheading}>
              <Clock size={18} /> Мої заявки
            </h2>

            {myApplications
              .filter((item) => item.status === "pending")
              .map((application) => (
                <div key={application.id} style={styles.requestCard}>
                  <div style={{ flex: 1 }}>
                    <strong style={styles.itemTitle}>
                      {application.clan?.name || "Клан"}
                    </strong>
                    <p style={styles.muted}>Очікує розгляду</p>
                  </div>
                  <span style={styles.pendingLabel}>Очікування</span>
                </div>
              ))}
          </section>
        )}

        <section style={styles.panel}>
          <h2 style={styles.subheading}>Знайти клан</h2>
          <p style={styles.muted}>
            Обери клан і надішли заявку на вступ.
          </p>

          <div style={styles.searchRow}>
            <input
              value={clanSearch}
              onChange={(event) => setClanSearch(event.target.value)}
              placeholder="Назва клану..."
              style={styles.input}
            />
            <button
              style={styles.iconButton}
              onClick={loadExtra}
              disabled={loadingExtra}
              title="Оновити список"
            >
              <Search size={17} />
            </button>
          </div>

          {loadingExtra ? (
            <p style={styles.muted}>Завантаження кланів...</p>
          ) : filteredClans.length === 0 ? (
            <div style={styles.empty}>
              <Users size={28} />
              <span>Активних кланів не знайдено.</span>
            </div>
          ) : (
            <div style={styles.list}>
              {filteredClans.map((item) => (
                <article key={item.id} style={styles.requestCard}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={styles.itemTitle}>{item.name}</strong>
                    <p style={styles.muted}>
                      Рівень {item.level} · Максимум {item.max_members || 50}
                    </p>
                  </div>
                  <button
                    style={styles.buttonSmall}
                    disabled={busy}
                    onClick={() => applyToClan(item.id)}
                  >
                    Подати заявку
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

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
          <span>Знайди клан або створи власний.</span>
        </div>
      </main>
    );
  }

  if (activeModule) {
    const ModulePage = moduleComponent;

    return (
      <main style={styles.page}>
        {moduleLoading ? (
          <div style={styles.center}>Завантаження розділу...</div>
        ) : ModulePage ? (
          <ModulePage
            clan={clan}
            membership={myMembership}
            members={members}
            profile={currentPlayer}
            player={currentPlayer}
            onBack={closeClanModule}
            onRefresh={loadClan}
          />
        ) : (
          <section style={styles.panel}>
            <button type="button" style={styles.backButton} onClick={closeClanModule}>
              <ChevronLeft size={17} /> Назад до клану
            </button>
            <div style={styles.modulePlaceholderIcon}>{activeModule.icon}</div>
            <h2 style={styles.subheading}>{activeModule.title}</h2>
            <p style={styles.muted}>
              Сторінку ще не створено. Коли додаси файл{" "}
              <strong>{activeModule.file}</strong> до цієї папки, цей розділ
              автоматично відкриватиметься звідси.
            </p>
          </section>
        )}
      </main>
    );
  }

  const experience = Number(clan.experience || 0);
  const statueLevel = Number(clan.statue_level ?? 0);
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
          onClick={() => {
            loadClan();
            loadExtra();
            loadManagementData();
          }}
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
          <span style={styles.muted}>
            {memberCount} / {clan.max_members || 50}
          </span>
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

      {canManage && (
        <>
          <section style={styles.panel}>
            <h2 style={styles.subheading}>
              <Users size={18} /> Заявки до клану
              <span style={styles.countBadge}>{clanApplications.length}</span>
            </h2>

            {clanApplications.length === 0 ? (
              <p style={styles.muted}>Нових заявок поки немає.</p>
            ) : (
              clanApplications.map((application) => (
                <article key={application.id} style={styles.requestCard}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={styles.itemTitle}>
                      Гравець {application.user_id.slice(0, 8)}
                    </strong>
                    <p style={styles.muted}>
                      Заявка від{" "}
                      {new Date(application.created_at).toLocaleDateString("uk-UA")}
                    </p>
                  </div>
                  <button
                    style={styles.acceptButton}
                    disabled={busy}
                    onClick={() => acceptApplication(application.id)}
                    title="Прийняти"
                  >
                    <Check size={17} />
                  </button>
                  <button
                    style={styles.rejectButton}
                    disabled={busy}
                    onClick={() => rejectApplication(application.id)}
                    title="Відхилити"
                  >
                    <X size={17} />
                  </button>
                </article>
              ))
            )}
          </section>

          <section style={styles.panel}>
            <h2 style={styles.subheading}>
              <UserPlus size={18} /> Запросити гравців
            </h2>
            <p style={styles.muted}>
              Знайди гравців, які ще не перебувають у клані.
            </p>

            <div style={styles.searchRow}>
              <input
                value={playerSearch}
                onChange={(event) => setPlayerSearch(event.target.value)}
                placeholder="Ім'я або нік гравця..."
                style={styles.input}
              />
              <button
                style={styles.iconButton}
                onClick={searchPlayers}
                disabled={busy}
                title="Шукати"
              >
                <Search size={17} />
              </button>
            </div>

            {clanlessPlayers.map((candidate) => (
              <article key={candidate.user_id} style={styles.requestCard}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={styles.itemTitle}>
                    {candidate.display_name || candidate.username || "Гравець"}
                  </strong>
                  <p style={styles.muted}>
                    Рівень {candidate.level} · Сила {number(candidate.power)}
                  </p>
                </div>
                <button
                  style={styles.buttonSmall}
                  disabled={busy}
                  onClick={() => invitePlayer(candidate.user_id)}
                >
                  <UserPlus size={15} /> Запросити
                </button>
              </article>
            ))}
          </section>
        </>
      )}
      <section style={styles.panel}>
        <h2 style={styles.subheading}>Розділи клану</h2>
        <div style={styles.modules}>
          {CLAN_MODULES.map((module) => (
            <button
              key={module.id}
              type="button"
              style={styles.module}
              onClick={() => openClanModule(module)}
              disabled={busy}
            >
              <span style={styles.moduleIcon}>{module.icon}</span>
              <strong>{module.title}</strong>
              <small>
                {module.id === "statue" ? "Відкрити розділ" : "Відкрити розділ"}
              </small>
            </button>
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
          </p>
          {isLeader && (
            <div style={styles.hint}>Ти є лідером клану.</div>
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
  emblemImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  eyebrow: {
    color: "#a58a67",
    fontSize: 9,
    letterSpacing: 2,
  },
  heading: {
    margin: "5px 0",
    fontSize: 19,
    color: "#f0d3a0",
  },
  muted: {
    margin: "5px 0",
    color: "#a58f72",
    fontSize: 11,
    lineHeight: 1.5,
  },
  iconButton: {
    width: 38,
    height: 38,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    border: "1px solid #60482b",
    borderRadius: 7,
    background: "#21170f",
    color: "#e8a23b",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: 8,
    margin: "12px 0",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    padding: 12,
    border: "1px solid #443222",
    borderRadius: 9,
    background: "#1b140f",
    color: "#d4b382",
  },
  panel: {
    marginTop: 12,
    padding: 14,
    border: "1px solid #443222",
    borderRadius: 10,
    background: "#1b140f",
  },
  panelTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  subheading: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    margin: "0 0 10px",
    color: "#edc98f",
    fontSize: 15,
  },
  level: {
    color: "#e8a23b",
    fontSize: 10,
    fontWeight: 700,
  },
  countBadge: {
    marginLeft: "auto",
    padding: "3px 8px",
    borderRadius: 12,
    background: "#49331d",
    color: "#f0d3a0",
    fontSize: 11,
  },
  progressTrack: {
    height: 8,
    overflow: "hidden",
    borderRadius: 8,
    background: "#33261b",
  },
  progressFill: {
    width: "0%",
    height: "100%",
    background: "#b68137",
  },
  hint: {
    marginTop: 9,
    color: "#89765e",
    fontSize: 10,
    lineHeight: 1.5,
  },
  memberList: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  member: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 9,
    border: "1px solid #392b1e",
    borderRadius: 8,
    background: "#17110d",
  },
  avatar: {
    position: "relative",
    width: 42,
    height: 42,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    border: "1px solid #59432b",
    borderRadius: 7,
    background: "#2b2016",
    fontSize: 20,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  onlineDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 8,
    height: 8,
    border: "1px solid #17110d",
    borderRadius: "50%",
  },
  memberName: {
    color: "#f0d3a0",
    fontSize: 12,
  },
  memberMeta: {
    marginTop: 3,
    color: "#a58f72",
    fontSize: 10,
  },
  memberRole: {
    marginTop: 3,
    color: "#d5a04e",
    fontSize: 10,
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    marginTop: 13,
    color: "#d4b382",
    fontSize: 12,
  },
  pageButton: {
    width: 32,
    height: 30,
    display: "grid",
    placeItems: "center",
    border: "1px solid #60482b",
    borderRadius: 6,
    background: "#21170f",
    color: "#e8a23b",
  },
  description: {
    color: "#b9a184",
    fontSize: 12,
    lineHeight: 1.6,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: "9px 0",
    borderBottom: "1px solid #38291d",
    color: "#a58f72",
    fontSize: 11,
  },
  modules: {
    display: "grid",
    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: 8,
  },
  module: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left",
    gap: 5,
    minHeight: 75,
    padding: 10,
    border: "1px solid #493622",
    borderRadius: 8,
    background: "#17110d",
    color: "#d4b382",
    cursor: "pointer",
  },
  moduleIcon: {
    fontSize: 21,
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    marginBottom: 14,
    padding: "8px 10px",
    border: "1px solid #60482b",
    borderRadius: 7,
    background: "#21170f",
    color: "#e8a23b",
  },
  modulePlaceholderIcon: {
    margin: "12px 0",
    fontSize: 42,
    textAlign: "center",
  },
  actions: {
    marginTop: 14,
  },
  leaveButton: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 12,
    border: "1px solid #754033",
    borderRadius: 8,
    background: "#321b16",
    color: "#e2a18b",
    fontWeight: 700,
  },
  notice: {
    marginTop: 10,
    padding: 11,
    border: "1px solid #557342",
    borderRadius: 7,
    background: "#1d2a19",
    color: "#b9d69d",
    fontSize: 12,
  },
  noticeError: {
    marginTop: 10,
    padding: 11,
    border: "1px solid #754033",
    borderRadius: 7,
    background: "#321b16",
    color: "#f0b1a0",
    fontSize: 12,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 9,
    padding: 25,
    color: "#a58f72",
    textAlign: "center",
    fontSize: 12,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    marginTop: 12,
  },
  input: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: 12,
    border: "1px solid #60482b",
    borderRadius: 7,
    background: "#120e0b",
    color: "#f0d3a0",
  },
  textarea: {
    width: "100%",
    minHeight: 75,
    boxSizing: "border-box",
    padding: 12,
    border: "1px solid #60482b",
    borderRadius: 7,
    background: "#120e0b",
    color: "#f0d3a0",
    resize: "vertical",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    border: "1px solid #a77b3c",
    borderRadius: 7,
    background: "#5a3c1e",
    color: "#ffe0ad",
    fontWeight: 700,
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    marginTop: 10,
  },
  requestCard: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    padding: 10,
    border: "1px solid #493622",
    borderRadius: 8,
    background: "#17110d",
  },
  itemTitle: {
    color: "#f0d3a0",
    fontSize: 12,
    overflowWrap: "anywhere",
  },
  acceptButton: {
    width: 34,
    height: 34,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    border: "1px solid #557342",
    borderRadius: 7,
    background: "#1d2a19",
    color: "#a9d18b",
  },
  rejectButton: {
    width: 34,
    height: 34,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    border: "1px solid #754033",
    borderRadius: 7,
    background: "#321b16",
    color: "#e2a18b",
  },
  buttonSmall: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    flexShrink: 0,
    padding: "8px 10px",
    border: "1px solid #a77b3c",
    borderRadius: 7,
    background: "#5a3c1e",
    color: "#ffe0ad",
    fontSize: 10,
    fontWeight: 700,
  },
  pendingLabel: {
    flexShrink: 0,
    color: "#d6b16f",
    fontSize: 10,
  },
};
