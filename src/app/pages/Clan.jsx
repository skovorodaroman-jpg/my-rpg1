
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Shield, Users, Crown, RefreshCw, LogOut, Settings,
  ChevronLeft, ChevronRight, Plus, Search, UserPlus,
  Check, X, Mail, Clock, Trophy, Swords,
  Landmark, ScrollText, MessageCircle, BookOpen, User,
} from "lucide-react";

const PAGE_SIZE = 10;

const CLAN_MODULES = [
  { id: "statue", title: "Статуя клану", subtitle: "Спільне посилення", icon: Shield, file: "ClanStatues.jsx" },
  { id: "dungeon", title: "Підземелля", subtitle: "Спільні випробування", icon: Swords, file: "ClanDungeon.jsx" },
  { id: "quests", title: "Кланові завдання", subtitle: "Завдання та нагороди", icon: ScrollText, file: "ClanQuests.jsx" },
  { id: "personalHall", title: "Особисті рекорди", subtitle: "Зала слави гравців", icon: Trophy, file: "ClanPersonalHall.jsx" },
  { id: "clanHall", title: "Кланові рекорди", subtitle: "Досягнення клану", icon: Crown, file: "ClanHallOfFame.jsx" },
  { id: "treasury", title: "Казна клану", subtitle: "Спільні ресурси", icon: Landmark, file: "ClanTreasury.jsx" },
  { id: "journal", title: "Журнал", subtitle: "Історія подій клану", icon: BookOpen, file: "ClanJournal.jsx" },
  { id: "forum", title: "Форум", subtitle: "Обговорення та теми", icon: MessageCircle, file: "ClanForum.jsx" },
  { id: "chat", title: "Чат", subtitle: "Спілкування учасників", icon: MessageCircle, file: "ClanChat.jsx" },
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

// Поточна дата саме за київським часом.
function getKyivDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatDate(date) {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
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
  const [nextLevelXp, setNextLevelXp] = useState(0);
  const [levelXpLoading, setLevelXpLoading] = useState(false);

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
  const [activeView, setActiveView] = useState("home");
  const [moduleComponent, setModuleComponent] = useState(null);
  const [moduleLoading, setModuleLoading] = useState(false);

  const myRole = myMembership?.role;
  const canManage = ["leader", "deputy", "general", "officer"].includes(myRole);
  const isLeader = myRole === "leader";

  // Завантаження клану та його учасників.
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
        setDailyRows([]);
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
            username: playerProfile.username,
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
            Number(b.clan_experience || 0) - Number(a.clan_experience || 0)
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

  // Додаткові дані: запрошення, заявки, список кланів.
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

  // Заявки на вступ до нашого клану.
  const loadManagementData = useCallback(async () => {
    if (!clan?.id || !canManage) {
      setClanApplications([]);
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

      const applicationRows = data || [];
      const applicantIds = applicationRows.map((item) => item.user_id).filter(Boolean);
      let applicantProfiles = [];

      if (applicantIds.length) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, level")
          .in("id", applicantIds);
        if (profilesError) throw profilesError;
        applicantProfiles = profilesData || [];
      }

      const applicantMap = new Map(applicantProfiles.map((item) => [item.id, item]));
      setClanApplications(
        applicationRows.map((item) => ({
          ...item,
          player: applicantMap.get(item.user_id) || null,
        }))
      );
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

  // Вимога XP для наступного рівня клану.
  useEffect(() => {
    let cancelled = false;

    async function loadNextLevelRequirement() {
      const level = Number(clan?.level || 1);

      if (!clan || level >= 100) {
        setNextLevelXp(0);
        return;
      }

      setLevelXpLoading(true);

      try {
        const { data, error: xpError } = await supabase
          .from("clan_level_requirements")
          .select("required_xp")
          .eq("level", level)
          .maybeSingle();

        if (xpError) throw xpError;

        if (!cancelled) {
          setNextLevelXp(Number(data?.required_xp || 0));
        }
      } catch (err) {
        console.error("Clan level XP load error:", err);
        if (!cancelled) setNextLevelXp(0);
      } finally {
        if (!cancelled) setLevelXpLoading(false);
      }
    }

    loadNextLevelRequirement();

    return () => {
      cancelled = true;
    };
  }, [clan?.id, clan?.level]);

  const totalPages = Math.max(1, Math.ceil(Math.min(members.length, 50) / PAGE_SIZE));

  const visibleMembers = useMemo(
    () => members.slice(page * PAGE_SIZE, Math.min((page + 1) * PAGE_SIZE, 50)),
    [members, page]
  );


  const experience = Number(clan?.experience || 0);
  const currentLevel = Number(clan?.level || 1);
  const memberCount = members.length;

  const progressPercent =
    currentLevel >= 100
      ? 100
      : nextLevelXp > 0
        ? Math.min(100, (experience / nextLevelXp) * 100)
        : 0;

  const remainingXp = Math.max(0, nextLevelXp - experience);

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

  async function searchPlayers(searchValue = playerSearch) {
    if (!canManage || busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const { data, error: searchError } = await supabase.rpc(
        "search_clanless_players",
        { p_search: searchValue.trim() || null }
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

      if (!loader) {
        throw new Error(`Файл ${module.file} не знайдено.`);
      }

      const loadedModule = await loader();

      if (typeof loadedModule.default === "function") {
        setModuleComponent(() => loadedModule.default);
      } else {
        throw new Error("Компонент розділу не знайдено.");
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

  // Екран, якщо гравець ще не вступив до клану.
  if (!clan) {
    return (
      <main style={styles.page}>
        <header style={styles.hero}>
          <div style={styles.emblem}><Shield size={42} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
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
                title="Прийняти запрошення"
              >
                <Check size={17} />
              </button>

                <button
                style={styles.rejectButton}
                disabled={busy}
                onClick={() => rejectInvitation(invitation.id)}
                title="Відхилити запрошення"
              >
                <X size={17} />
                </button>
              </article>
            ))}
          </section>
        )}

      {myApplications.some((item) => item.status === "pending") && (
        <section style={styles.panel}>
          <h3 style={styles.panelTitle}>Мої заявки</h3>

          {myApplications
            .filter((item) => item.status === "pending")
            .map((application) => (
              <article key={application.id} style={styles.requestCard}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={styles.itemTitle}>
                    {application.clan?.name || "Клан"}
                  </strong>
                  <p style={styles.muted}>
                    Заявку надіслано
                  </p>
                </div>

                <span style={styles.pendingLabel}>
                  Очікує
                </span>
              </article>
            ))}
        </section>
      )}

      <section style={styles.panel}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.panelTitle}>Знайти клан</h3>
          <button
            style={styles.iconButton}
            onClick={loadExtra}
            disabled={loadingExtra}
            title="Оновити список"
          >
            <RefreshCw
              size={17}
              style={{
                animation: loadingExtra ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
        </div>

        <div style={styles.searchRow}>
          <Search size={18} />
          <input
            style={styles.searchInput}
            value={clanSearch}
            onChange={(event) => setClanSearch(event.target.value)}
            placeholder="Пошук клану..."
          />
        </div>

        <div style={styles.list}>
          {filteredClans.length === 0 ? (
            <div style={styles.empty}>
              <Users size={28} />
              <span>Кланів не знайдено</span>
            </div>
          ) : (
            filteredClans.map((candidate) => (
              <article
                key={candidate.id}
                style={styles.requestCard}
              >
                <div style={styles.clanMiniEmblem}>
                  <Shield size={21} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={styles.itemTitle}>
                    {candidate.name}
                  </strong>
                  <p style={styles.muted}>
                    Рівень {candidate.level || 1}
                    {" · "}
                    {candidate.member_count || 0} учасників
                  </p>
                  {candidate.description && (
                    <p style={styles.clanDescription}>
                      {candidate.description}
                    </p>
                  )}
                </div>

                <button
                  style={styles.buttonSmall}
                  disabled={busy}
                  onClick={() => applyToClan(candidate.id)}
                >
                  <UserPlus size={15} />
                  Подати заявку
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      <section style={styles.panel}>
        <h3 style={styles.panelTitle}>Створити власний клан</h3>

        <form onSubmit={createClan} style={styles.form}>
          <input
            style={styles.input}
            value={clanName}
            onChange={(event) => setClanName(event.target.value)}
            placeholder="Назва клану"
            maxLength={30}
            required
          />

          <textarea
            style={styles.textarea}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Опис клану (необов'язково)"
            maxLength={250}
            rows={3}
          />

          <button
            type="submit"
            disabled={busy || !clanName.trim()}
            style={styles.button}
          >
            <Plus size={17} />
            {busy ? "Створення..." : "Створити клан"}
          </button>
        </form>
      </section>
      </main>
    );
  }

  const formatCompactXp = (value) => {
    const amount = Number(value || 0);
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(".0", "")}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(1).replace(".0", "")}K`;
    return number(amount);
  };

  const clanProgressLabel = currentLevel >= 100
    ? `${formatCompactXp(experience)} XP · максимум`
    : nextLevelXp > 0
      ? `${formatCompactXp(experience)} / ${formatCompactXp(nextLevelXp)}`
      : `${formatCompactXp(experience)} XP`;

  const ClanModuleIcon = activeModule?.icon;

  return (
    <main style={styles.page}>
      {notice && <div style={styles.notice}>{notice}</div>}
      {error && <div style={styles.noticeError}>{error}</div>}

      {activeModule ? (
        <section style={styles.moduleScreen}>
          <button style={styles.backButton} onClick={closeClanModule}>
            <ChevronLeft size={18} /> До головної сторінки клану
          </button>
          <div style={styles.moduleScreenHeading}>
            <div style={styles.moduleScreenIcon}>{ClanModuleIcon && <ClanModuleIcon size={25} />}</div>
            <div>
              <h2 style={styles.moduleScreenTitle}>{activeModule.title}</h2>
              <p style={styles.muted}>{clan.name}</p>
            </div>
          </div>
          {moduleLoading ? (
            <div style={styles.center}><RefreshCw size={24} /><span>Завантаження розділу...</span></div>
          ) : moduleComponent ? (
            (() => {
              const Module = moduleComponent;
              return <Module profile={profile} player={currentPlayer} clan={clan} members={members} myMembership={myMembership} onBack={closeClanModule} onRefresh={loadClan} />;
            })()
          ) : (
            <div style={styles.empty}><Shield size={30} /><strong>Розділ ще не підключено</strong><span>Файл цього модуля потрібно додати до папки сторінок клану.</span></div>
          )}
        </section>
      ) : activeView === "management" ? (
        <>
          <button style={styles.backButton} onClick={() => setActiveView("home")}>
            <ChevronLeft size={18} /> До клану
          </button>
          <section style={styles.managementHero}>
            <div style={styles.managementHeroIcon}><Settings size={24} /></div>
            <div><h2 style={styles.moduleScreenTitle}>Керування кланом</h2><p style={styles.muted}>Доступ: лідер, заступник, генерали та офіцери</p></div>
          </section>

          <section style={styles.panel}>
            <h3 style={styles.panelTitle}>Інформація про клан</h3>
            <div style={styles.infoLine}><span>Назва</span><strong>{clan.name}</strong></div>
            <div style={styles.infoLine}><span>Дата створення</span><strong>{clan.created_at ? new Date(clan.created_at).toLocaleDateString("uk-UA") : "Не вказана"}</strong></div>
            <div style={styles.infoLine}><span>Рівень</span><strong>{currentLevel}</strong></div>
            <div style={styles.infoLine}><span>Учасники</span><strong>{Math.min(memberCount, 50)} / 50</strong></div>
            <div style={styles.infoDescription}>{clan.description || "Опис клану не додано."}</div>
          </section>

          <section style={styles.panel}>
            <div style={styles.sectionHeader}><h3 style={styles.panelTitle}>Заявки на вступ</h3><span style={styles.countBadge}>{clanApplications.length}</span></div>
            {clanApplications.length ? (
              <div style={styles.list}>
                {clanApplications.map((application) => (
                  <article key={application.id} style={styles.requestCard}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={styles.itemTitle}>{application.player?.display_name || application.player?.username || "Гравець"}</strong>
                      <p style={styles.muted}>Рівень {application.player?.level || 1}</p>
                    </div>
                    <button style={styles.acceptButton} disabled={busy} onClick={() => acceptApplication(application.id)} title="Прийняти"><Check size={17} /></button>
                    <button style={styles.rejectButton} disabled={busy} onClick={() => rejectApplication(application.id)} title="Відхилити"><X size={17} /></button>
                  </article>
                ))}
              </div>
            ) : <p style={styles.muted}>Нових заявок немає.</p>}
          </section>

          <section style={styles.panel}>
            <h3 style={styles.panelTitle}>Запросити гравця</h3>
            <div style={styles.searchRow}><Search size={18} /><input style={styles.searchInput} value={playerSearch} onChange={(event) => setPlayerSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); searchPlayers(playerSearch); } }} placeholder="Ім'я гравця..." /><button type="button" style={styles.iconButton} disabled={busy} onClick={() => searchPlayers(playerSearch)}><Search size={16} /></button></div>
            {clanlessPlayers.map((candidate) => (
              <article key={candidate.user_id} style={styles.requestCard}>
                <div style={{ flex: 1, minWidth: 0 }}><strong style={styles.itemTitle}>{candidate.display_name || candidate.username}</strong><p style={styles.muted}>Рівень {candidate.level || 1}</p></div>
                <button style={styles.buttonSmall} disabled={busy} onClick={() => invitePlayer(candidate.user_id)}><UserPlus size={15} /> Запросити</button>
              </article>
            ))}
          </section>

          <section style={styles.panel}>
            <h3 style={styles.panelTitle}>Небезпечна дія</h3>
            <p style={styles.muted}>{isLeader ? "Перед виходом передай лідерство іншому учаснику." : "Після виходу ти втратиш доступ до кланових розділів."}</p>
            <button style={{ ...styles.leaveButton, opacity: isLeader ? 0.55 : 1 }} disabled={busy || isLeader} onClick={leaveClan}>
              <LogOut size={17} /> {isLeader ? "Лідер не може залишити клан" : "Залишити клан"}
            </button>
          </section>
        </>
      ) : (
        <>
          <section style={styles.clanIdentity}>
            <div style={styles.clanCrest}>
              {clan.emblem_url || clan.crest_url ? <img src={clan.emblem_url || clan.crest_url} alt="Герб клану" style={styles.emblemImage} /> : <Shield size={43} />}
            </div>
            <div style={styles.clanIdentityText}>
              <div style={styles.eyebrow}>КЛАНОВА СПІЛЬНОТА</div>
              <h1 style={styles.clanName}>{clan.name}</h1>
              <div style={styles.clanLevel}>Рівень: <strong>{currentLevel}</strong></div>
              <div style={styles.clanXp}>Досвід: <strong>{clanProgressLabel}</strong></div>
            </div>
            <button style={styles.refreshButton} onClick={() => { loadClan(); loadExtra(); }} disabled={loading} title="Оновити"><RefreshCw size={18} /></button>
          </section>

          <section style={styles.xpPanel}>
            <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${progressPercent}%` }} /></div>
            <div style={styles.xpFooter}><span>{currentLevel >= 100 ? "Досягнуто найвищого рівня" : nextLevelXp > 0 ? `${formatCompactXp(remainingXp)} XP до наступного рівня` : "Вимогу наступного рівня не знайдено"}</span><span>{Math.min(memberCount, 50)} / 50 учасників</span></div>
          </section>

          <section style={styles.modulesSection}>
            <div style={styles.sectionHeading}><h2 style={styles.sectionTitle}>Розділи клану</h2><span style={styles.sectionHint}>Обирай, куди вирушити</span></div>
            <div style={styles.moduleGrid}>
              {CLAN_MODULES.map((module) => {
                const Icon = module.icon;
                return <button key={module.id} style={styles.moduleTile} onClick={() => openClanModule(module)}>
                  <span style={styles.moduleTileIcon}><Icon size={23} /></span>
                  <span style={styles.moduleTileTitle}>{module.title}</span>
                  <span style={styles.moduleTileSubtitle}>{module.subtitle}</span>
                  <ChevronRight size={16} style={styles.moduleArrow} />
                </button>;
              })}
            </div>
          </section>

          <section style={styles.membersSection}>
            <div style={styles.membersHeading}><div><h2 style={styles.sectionTitle}>Учасники клану</h2><span style={styles.sectionHint}>Загальний внесок кожного у розвиток клану</span></div><span style={styles.memberCount}>{Math.min(memberCount, 50)} / 50</span></div>
            <div style={styles.memberList}>
              {visibleMembers.map((member, index) => (
                <article key={member.user_id} style={styles.memberRow}>
                  <div style={styles.memberIndex}>{page * PAGE_SIZE + index + 1}</div>
                  <div style={styles.avatar}>{member.avatar ? <img src={member.avatar} alt="" style={styles.avatarImage} /> : <User size={18} />}{member.online && <span style={styles.onlineDot} />}</div>
                  <div style={styles.memberDetails}>
                    <strong style={styles.memberName}>{member.name}{member.user_id === userId ? " · Ти" : ""}</strong>
                    <span style={styles.memberRoleText}>{ROLE_NAMES[member.role] || member.role}</span>
                  </div>
                  <div style={styles.memberContribution}><strong style={styles.memberContributionValue}>{formatCompactXp(member.clan_experience)}</strong><span style={{ color: "#927b5d", fontSize: 9 }}>кланового XP</span></div>
                </article>
              ))}
              {!members.length && <div style={styles.empty}>У клані поки немає учасників.</div>}
            </div>
            <div style={styles.paginationBar}>
              <span>Сторінка {page + 1} з {totalPages}</span>
              <div style={styles.paginationControls}>
                <button style={styles.pageButton} disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft size={17} /></button>
                <button style={styles.pageButton} disabled={page >= totalPages - 1} onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}><ChevronRight size={17} /></button>
              </div>
            </div>
          </section>

          {canManage && <button style={styles.managementButton} onClick={() => setActiveView("management")}><Settings size={19} /><span><strong>Керування кланом</strong><small>Налаштування, заявки та учасники</small></span><ChevronRight size={18} /></button>}
        </>
      )}
    </main>
  );
}

const styles = {
  clanIdentity: { display: "flex", alignItems: "center", gap: 13, padding: "18px 15px", borderRadius: 17, border: "1px solid #6a4b2c", background: "linear-gradient(135deg,#302014,#19120e 80%)", boxShadow: "0 8px 25px #0005", marginBottom: 10 },
  clanCrest: { width: 76, height: 76, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 15, border: "1px solid #a77a40", background: "radial-gradient(circle,#604323,#21160e)", color: "#efbd61" },
  clanIdentityText: { minWidth: 0, flex: 1 },
  clanName: { margin: "2px 0 8px", color: "#f5dfb8", fontSize: 22, lineHeight: 1.15, fontWeight: 900, overflowWrap: "anywhere" },
  clanLevel: { color: "#c9ad84", fontSize: 12, marginTop: 3 },
  clanXp: { color: "#c9ad84", fontSize: 12, marginTop: 4 },
  refreshButton: { width: 36, height: 36, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 10, border: "1px solid #654729", background: "#21170f", color: "#e8b65e" },
  xpPanel: { padding: "12px 14px", borderRadius: 13, border: "1px solid #493522", background: "#1b140f", marginBottom: 20 },
  xpFooter: { display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 8, color: "#a99070", fontSize: 10 },
  modulesSection: { marginBottom: 22 },
  sectionHeading: { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 8, marginBottom: 12 },
  sectionTitle: { margin: 0, color: "#f0d3a0", fontSize: 17, fontWeight: 850 },
  sectionHint: { display: "block", marginTop: 4, color: "#927b5d", fontSize: 10 },
  moduleGrid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 9 },
  moduleTile: { position: "relative", minHeight: 112, padding: "13px 12px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, textAlign: "left", borderRadius: 13, border: "1px solid #574027", background: "linear-gradient(145deg,#302014,#1c140e)", color: "#e8c58b", cursor: "pointer" },
  moduleTileIcon: { width: 35, height: 35, display: "grid", placeItems: "center", borderRadius: 10, background: "#46301b", border: "1px solid #74502b", color: "#efbd61" },
  moduleTileTitle: { paddingRight: 14, fontSize: 12, fontWeight: 800, lineHeight: 1.25 },
  moduleTileSubtitle: { color: "#927b5d", fontSize: 9, lineHeight: 1.3 },
  moduleArrow: { position: "absolute", right: 9, top: 22, color: "#9a7548" },
  membersSection: { padding: 14, borderRadius: 15, border: "1px solid #493522", background: "linear-gradient(145deg,#211810,#19120e)" },
  membersHeading: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 },
  memberCount: { padding: "5px 8px", borderRadius: 20, background: "#3a2817", border: "1px solid #74502a", color: "#efbd61", fontSize: 11, fontWeight: 800 },
  memberRow: { display: "flex", alignItems: "center", gap: 9, minWidth: 0, padding: "10px 7px", borderBottom: "1px solid #38291c" },
  memberIndex: { width: 19, flexShrink: 0, color: "#8f7655", fontSize: 10, textAlign: "center" },
  memberDetails: { flex: 1, minWidth: 0 },
  memberRoleText: { display: "block", marginTop: 3, color: "#b18b57", fontSize: 10 },
  memberContribution: { flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 },
  memberContributionStrong: { color: "#e8bd75", fontSize: 12, fontWeight: 800 },
  managementButton: { width: "100%", display: "flex", alignItems: "center", gap: 11, marginTop: 15, padding: "13px 14px", borderRadius: 13, border: "1px solid #72532e", background: "linear-gradient(135deg,#382719,#24180f)", color: "#e8bd75", textAlign: "left", cursor: "pointer" },
  managementHero: { display: "flex", alignItems: "center", gap: 12, padding: 15, marginBottom: 13, borderRadius: 14, border: "1px solid #604525", background: "#241910" },
  managementHeroIcon: { width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 12, background: "#46301b", color: "#efbd61" },
  moduleScreen: { padding: 14, borderRadius: 15, border: "1px solid #493522", background: "#1b140f" },
  moduleScreenHeading: { display: "flex", alignItems: "center", gap: 11, marginBottom: 14 },
  moduleScreenIcon: { width: 45, height: 45, display: "grid", placeItems: "center", borderRadius: 12, background: "#46301b", color: "#efbd61" },
  moduleScreenTitle: { margin: 0, color: "#f0d3a0", fontSize: 18, fontWeight: 850 },
  infoLine: { display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid #38291c", color: "#a99070", fontSize: 12 },
  infoDescription: { paddingTop: 12, color: "#c5a77d", fontSize: 12, lineHeight: 1.55 },
  memberContributionValue: { color: "#e8bd75", fontSize: 12, fontWeight: 800 },
  paginationBar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, color: "#a99070", fontSize: 11 },
  paginationControls: { display: "flex", gap: 8 },
  page: {
    minHeight: "100vh",
    width: "100%",
    maxWidth: "900px",
    margin: "0 auto",
    padding: "18px 14px 100px",
    boxSizing: "border-box",
    color: "#f0d3a0",
    background: "linear-gradient(180deg, #120e0b 0%, #1d1714 100%)",
    fontFamily: "inherit",
  },

  center: {
    minHeight: "240px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    color: "#d4b382",
    textAlign: "center",
  },

  hero: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "20px 16px",
    marginBottom: "14px",
    borderRadius: "18px",
    border: "1px solid #5b4229",
    background: "linear-gradient(135deg, #2b1d13, #1b140f)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
  },

  emblem: {
    width: "62px",
    height: "62px",
    flexShrink: 0,
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f0bd62",
    background: "linear-gradient(145deg, #53391e, #24180f)",
    border: "1px solid #9a6b35",
  },

  emblemImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "inherit",
  },

  eyebrow: {
    margin: "0 0 5px",
    color: "#c08a45",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "2px",
  },

  heading: {
    margin: "0 0 5px",
    color: "#f3d8a8",
    fontSize: "23px",
    lineHeight: 1.2,
    fontWeight: 800,
    overflowWrap: "anywhere",
  },

  muted: {
    margin: "5px 0 0",
    color: "#a99070",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  iconButton: {
    width: "38px",
    height: "38px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "11px",
    border: "1px solid #5b4229",
    background: "#241910",
    color: "#e8b65e",
    cursor: "pointer",
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "9px",
    marginBottom: "14px",
  },

  stat: {
    minWidth: 0,
    minHeight: "92px",
    padding: "13px 7px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    borderRadius: "14px",
    border: "1px solid #493522",
    background: "#211810",
    color: "#d9a950",
    textAlign: "center",
  },

  panel: {
    padding: "16px",
    marginBottom: "14px",
    borderRadius: "16px",
    border: "1px solid #493522",
    background: "linear-gradient(145deg, #211810, #19120e)",
    boxShadow: "0 5px 18px rgba(0,0,0,0.16)",
  },

  panelTitle: {
    margin: 0,
    color: "#f0d3a0",
    fontSize: "16px",
    lineHeight: 1.35,
    fontWeight: 800,
  },

  subheading: {
    margin: "14px 0 10px",
    color: "#e8c58b",
    fontSize: "14px",
    fontWeight: 700,
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "13px",
  },

  level: {
    flexShrink: 0,
    padding: "6px 10px",
    borderRadius: "9px",
    border: "1px solid #76532d",
    background: "#382515",
    color: "#efbd61",
    fontSize: "12px",
    fontWeight: 800,
  },

  countBadge: {
    flexShrink: 0,
    padding: "5px 9px",
    borderRadius: "20px",
    background: "#3a2817",
    border: "1px solid #74502a",
    color: "#efbd61",
    fontSize: "11px",
    fontWeight: 800,
  },

  progressTrack: {
    width: "100%",
    height: "11px",
    overflow: "hidden",
    borderRadius: "20px",
    background: "#100c09",
    border: "1px solid #493522",
  },

  progressFill: {
    height: "100%",
    minWidth: "0",
    borderRadius: "20px",
    background: "linear-gradient(90deg, #9d6428, #f0bd62)",
    boxShadow: "0 0 10px rgba(232,162,59,0.3)",
    transition: "width 0.35s ease",
  },

  xpNumbers: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "9px",
    color: "#c5a77d",
    fontSize: "11px",
  },

  hint: {
    margin: "12px 0 0",
    color: "#907957",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  memberList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  member: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    minWidth: 0,
    padding: "11px",
    borderRadius: "12px",
    border: "1px solid #3e2d1d",
    background: "#19120e",
  },

  avatar: {
    position: "relative",
    width: "42px",
    height: "42px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: "50%",
    border: "1px solid #806039",
    background: "#352416",
    color: "#d5a75c",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  onlineDot: {
    position: "absolute",
    right: "1px",
    bottom: "1px",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#62c879",
    border: "2px solid #19120e",
  },

  memberName: {
    display: "block",
    overflow: "hidden",
    color: "#f0d9b3",
    fontSize: "13px",
    fontWeight: 700,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  memberMeta: {
    display: "block",
    marginTop: "3px",
    color: "#9f896b",
    fontSize: "10px",
    lineHeight: 1.4,
  },

  memberRole: {
    flexShrink: 0,
    maxWidth: "95px",
    padding: "5px 7px",
    borderRadius: "8px",
    border: "1px solid #604525",
    background: "#302014",
    color: "#d8ad68",
    fontSize: "10px",
    fontWeight: 700,
    textAlign: "center",
  },

  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    marginTop: "15px",
    color: "#c9a979",
    fontSize: "12px",
  },

  pageButton: {
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    border: "1px solid #604525",
    background: "#302014",
    color: "#efbd61",
    cursor: "pointer",
  },

  description: {
    color: "#a99070",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  infoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },

  modules: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
    marginTop: "13px",
  },

  module: {
    minWidth: 0,
    minHeight: "112px",
    padding: "13px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "7px",
    borderRadius: "13px",
    border: "1px solid #574027",
    background: "linear-gradient(145deg, #302014, #21170f)",
    color: "#e8c58b",
    textAlign: "left",
    cursor: "pointer",
  },

  moduleIcon: {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    border: "1px solid #74502b",
    background: "#46301b",
    color: "#efbd61",
  },

  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "9px 12px",
    marginBottom: "15px",
    borderRadius: "9px",
    border: "1px solid #5b4229",
    background: "#302014",
    color: "#e8bd75",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  modulePlaceholderIcon: {
    width: "64px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "20px auto",
    borderRadius: "18px",
    background: "#352416",
    color: "#e8b65e",
  },

  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "18px",
  },

  leaveButton: {
    width: "100%",
    minHeight: "43px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    padding: "10px 14px",
    borderRadius: "11px",
    border: "1px solid #713c32",
    background: "#301b17",
    color: "#d98b73",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  notice: {
    padding: "11px 13px",
    marginBottom: "13px",
    borderRadius: "10px",
    border: "1px solid #49613c",
    background: "#1c2919",
    color: "#acd18b",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  noticeError: {
    padding: "11px 13px",
    marginBottom: "13px",
    borderRadius: "10px",
    border: "1px solid #754137",
    background: "#321b17",
    color: "#e6a092",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  empty: {
    minHeight: "110px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    padding: "15px",
    color: "#a88d68",
    textAlign: "center",
    fontSize: "12px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "13px",
  },

  input: {
    width: "100%",
    minHeight: "43px",
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid #60472e",
    outline: "none",
    background: "#120e0b",
    color: "#f0d3a0",
    fontSize: "13px",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: "10px",
    border: "1px solid #60472e",
    outline: "none",
    resize: "vertical",
    background: "#120e0b",
    color: "#f0d3a0",
    fontFamily: "inherit",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  button: {
    width: "100%",
    minHeight: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid #bd843b",
    background: "linear-gradient(135deg, #a86a27, #70451f)",
    color: "#fff0d2",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  },

  searchRow: {
    minHeight: "42px",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "0 11px",
    margin: "10px 0 13px",
    borderRadius: "10px",
    border: "1px solid #574027",
    background: "#120e0b",
    color: "#a98a5e",
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    height: "40px",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#f0d3a0",
    fontSize: "13px",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
    marginTop: "10px",
  },

  requestCard: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    minWidth: 0,
    padding: "11px",
    borderRadius: "11px",
    border: "1px solid #493522",
    background: "#19120e",
  },

  itemTitle: {
    display: "block",
    color: "#f0d3a0",
    fontSize: "13px",
    fontWeight: 800,
    overflowWrap: "anywhere",
  },

  acceptButton: {
    width: "34px",
    height: "34px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    border: "1px solid #557342",
    background: "#26351e",
    color: "#a9d17c",
    cursor: "pointer",
  },

  rejectButton: {
    width: "34px",
    height: "34px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    border: "1px solid #754137",
    background: "#321b17",
    color: "#e69a88",
    cursor: "pointer",
  },

  buttonSmall: {
    minHeight: "34px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "7px 10px",
    borderRadius: "8px",
    border: "1px solid #87602f",
    background: "#49301a",
    color: "#f0c77f",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  pendingLabel: {
    flexShrink: 0,
    padding: "6px 9px",
    borderRadius: "8px",
    border: "1px solid #74552e",
    background: "#382817",
    color: "#d9ad67",
    fontSize: "10px",
    fontWeight: 700,
  },

  clanMiniEmblem: {
    width: "40px",
    height: "40px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    border: "1px solid #74502b",
    background: "#352416",
    color: "#e8b65e",
  },

  clanDescription: {
    margin: "5px 0 0",
    color: "#8f795c",
    fontSize: "11px",
    lineHeight: 1.4,
    overflowWrap: "anywhere",
  },

  dateSelectWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    margin: "13px 0",
  },

  dateLabel: {
    color: "#b99a70",
    fontSize: "11px",
    fontWeight: 700,
  },

  dateSelect: {
    width: "100%",
    minHeight: "42px",
    padding: "9px 11px",
    borderRadius: "9px",
    border: "1px solid #60472e",
    outline: "none",
    background: "#120e0b",
    color: "#f0d3a0",
    fontSize: "12px",
    colorScheme: "dark",
  },

  dailyList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  dailyRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
    padding: "10px",
    borderRadius: "11px",
    border: "1px solid #493522",
    background: "#19120e",
  },

  dailyPlace: {
    width: "25px",
    height: "25px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "#382817",
    color: "#e8b65e",
    fontSize: "12px",
    fontWeight: 900,
  },

  dailyMemberInfo: {
    flex: 1,
    minWidth: 0,
  },

  dailyXp: {
    flexShrink: 0,
    color: "#e8bd68",
    fontSize: "12px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  managementDivider: {
    height: "1px",
    margin: "17px 0",
    background: "#493522",
  },
};
