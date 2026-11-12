
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft, Settings, Crown, Shield, Megaphone, Users,
  Coins, Save, RefreshCw, Send, Trash2, Pencil, Lock,
  AlertCircle, CheckCircle2
} from "lucide-react";

const ROLE_NAMES = {
  leader: "Лідер",
  deputy: "Заступник",
  general: "Генерал",
  officer: "Офіцер",
  senior: "Старшина",
  fighter: "Воїн",
  newbie: "Новачок",
  member: "Новачок",
};

const ROLE_RANK = {
  leader: 1,
  deputy: 2,
  general: 3,
  officer: 4,
  senior: 5,
  fighter: 6,
  newbie: 7,
  member: 7,
};

const ROLE_OPTIONS = [
  "general",
  "officer",
  "senior",
  "fighter",
  "newbie",
];

const ACCESS_OPTIONS = [
  { value: "deputy", label: "Заступник і вище" },
  { value: "general", label: "Генерал і вище" },
  { value: "officer", label: "Офіцер і вище" },
  { value: "senior", label: "Старшина і вище" },
];

const colors = {
  page: "#ead8b8",
  panel: "#211810",
  panel2: "#2a1e14",
  border: "#59432c",
  gold: "#e8bd78",
  muted: "#a99070",
  red: "#df8b70",
  green: "#9acb8a",
};

function Field({ label, children }) {
  return (
    <label style={s.field}>
      <span style={s.label}>{label}</span>
      {children}
    </label>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <section style={s.section}>
      <div style={s.sectionTitle}>
        <Icon size={18} />
        <h3 style={{ margin: 0, fontSize: 14 }}>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Button({ children, onClick, disabled, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...s.button,
        ...(danger ? s.dangerButton : {}),
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

export default function ClanSettings({
  clan,
  membership,
  members: initialMembers = [],
  profile,
  onBack,
  onRefresh,
}) {
  const clanId = clan?.id || membership?.clan_id;

  const [myRole, setMyRole] = useState(
    membership?.role ||
    (clan?.leader_id === profile?.id ? "leader" : "newbie")
  );

  const [myId, setMyId] = useState(
    profile?.id || membership?.user_id || null
  );

  const isLeaderOrDeputy = ["leader", "deputy"].includes(myRole);

  const canPublish = [
    "leader",
    "deputy",
    "general",
    "officer",
  ].includes(myRole);

  const canOpenSettings = [
    "leader",
    "deputy",
    "general",
    "officer",
  ].includes(myRole);

  const [description, setDescription] = useState(
    clan?.description || ""
  );

  const [savingDescription, setSavingDescription] = useState(false);

  const [inviteRole, setInviteRole] = useState("deputy");
  const [kickRole, setKickRole] = useState("deputy");
  const [savingAccess, setSavingAccess] = useState(false);

  const [members, setMembers] = useState(initialMembers || []);
  const [memberProfiles, setMemberProfiles] = useState({});
  const [changingRole, setChangingRole] = useState("");

  const [announcements, setAnnouncements] = useState([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState("");

  const [newClanName, setNewClanName] = useState(clan?.name || "");
  const [renaming, setRenaming] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const notify = (message, isError = false) => {
    setError(isError ? message : "");
    setSuccess(isError ? "" : message);
  };

  // Завантаження налаштувань і перевірка справжньої ролі
  const loadData = useCallback(async () => {
    if (!clanId) {
      setLoading(false);
      setError("Не вдалося визначити клан.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      // ID беремо тільки з активної авторизованої сесії Supabase.
      const currentUserId = authData?.user?.id;

      if (!currentUserId) {
        throw new Error("Не вдалося визначити авторизованого користувача.");
      }

      setMyId(currentUserId);

      // Спочатку окремо перевіряємо власне членство та справжню посаду.
      const { data: myMembership, error: myMembershipError } =
        await supabase
          .from("clan_members")
          .select("user_id, clan_id, role")
          .eq("clan_id", clanId)
          .eq("user_id", currentUserId)
          .maybeSingle();

      if (myMembershipError) throw myMembershipError;

      const actualRole =
        myMembership?.role ||
        (clan?.leader_id === currentUserId ? "leader" : "newbie");

      setMyRole(actualRole);

      const [
        settingsResult,
        announcementsResult,
        membersResult,
      ] = await Promise.all([
        supabase
          .from("clan_settings")
          .select("invite_min_role, kick_min_role")
          .eq("clan_id", clanId)
          .maybeSingle(),

        supabase
          .from("clan_announcements")
          .select("id, clan_id, author_id, title, message, created_at")
          .eq("clan_id", clanId)
          .order("created_at", { ascending: false })
          .limit(30),

        supabase
          .from("clan_members")
          .select("user_id, role, title, joined_at")
          .eq("clan_id", clanId),
      ]);

      if (settingsResult.error) throw settingsResult.error;
      if (announcementsResult.error) throw announcementsResult.error;
      if (membersResult.error) throw membersResult.error;

      const loadedMembers = membersResult.data || [];

      setInviteRole(
        settingsResult.data?.invite_min_role || "deputy"
      );

      setKickRole(
        settingsResult.data?.kick_min_role || "deputy"
      );

      setAnnouncements(announcementsResult.data || []);
      setMembers(loadedMembers);

      const ids = [
        ...new Set(loadedMembers.map((member) => member.user_id)),
      ];

      if (ids.length) {
        const { data: profiles, error: profilesError } =
          await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url, level")
            .in("id", ids);

        if (profilesError) throw profilesError;

        const map = {};

        (profiles || []).forEach((player) => {
          map[player.id] = player;
        });

        setMemberProfiles(map);
      } else {
        setMemberProfiles({});
      }
    } catch (err) {
      console.error("Clan settings loading error:", err);
      setError(
        err?.message || "Не вдалося завантажити налаштування."
      );
    } finally {
      setLoading(false);
    }
  }, [
    clanId,
    profile?.id,
    membership?.user_id,
    clan?.leader_id,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setDescription(clan?.description || "");
    setNewClanName(clan?.name || "");
  }, [clan?.description, clan?.name]);

  // Збереження опису
  const saveDescription = async () => {
    if (!isLeaderOrDeputy || savingDescription) return;

    setSavingDescription(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.rpc(
        "update_clan_description",
        {
          p_clan_id: clanId,
          p_description: description.trim(),
        }
      );

      if (error) throw error;

      notify("Опис клану збережено.");
      onRefresh?.();
    } catch (err) {
      notify(err?.message || "Не вдалося зберегти опис.", true);
    } finally {
      setSavingDescription(false);
    }
  };

  // Налаштування прав запрошення та виключення
  const saveAccess = async () => {
    if (!isLeaderOrDeputy || savingAccess) return;

    setSavingAccess(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.rpc(
        "update_clan_access_settings",
        {
          p_clan_id: clanId,
          p_invite_min_role: inviteRole,
          p_kick_min_role: kickRole,
        }
      );

      if (error) throw error;

      notify("Права доступу оновлено.");
    } catch (err) {
      notify(err?.message || "Не вдалося змінити права доступу.", true);
    } finally {
      setSavingAccess(false);
    }
  };

  // Публікація оголошення
  const publishAnnouncement = async (event) => {
    event.preventDefault();

    if (!canPublish || sendingAnnouncement) return;

    const title = announcementTitle.trim();
    const message = announcementMessage.trim();

    if (!title || !message) {
      notify("Заповни заголовок і текст оголошення.", true);
      return;
    }

    setSendingAnnouncement(true);
    setError("");
    setSuccess("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      if (!authData?.user?.id) {
        throw new Error("Потрібно авторизуватися.");
      }

      const { error } = await supabase
        .from("clan_announcements")
        .insert({
          clan_id: clanId,
          author_id: authData.user.id,
          title,
          message,
        });

      if (error) throw error;

      setAnnouncementTitle("");
      setAnnouncementMessage("");

      notify("Оголошення опубліковано.");
      await loadData();
    } catch (err) {
      notify(err?.message || "Не вдалося опублікувати оголошення.", true);
    } finally {
      setSendingAnnouncement(false);
    }
  };

  // Видалення оголошення
  const deleteAnnouncement = async (announcement) => {
    if (!isLeaderOrDeputy || deletingAnnouncement) return;

    if (
      !window.confirm(
        `Видалити оголошення «${announcement.title}»?`
      )
    ) {
      return;
    }

    setDeletingAnnouncement(announcement.id);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("clan_announcements")
        .delete()
        .eq("id", announcement.id)
        .eq("clan_id", clanId);

      if (error) throw error;

      setAnnouncements((previous) =>
        previous.filter((item) => item.id !== announcement.id)
      );

      notify("Оголошення видалено.");
    } catch (err) {
      notify(err?.message || "Не вдалося видалити оголошення.", true);
    } finally {
      setDeletingAnnouncement("");
    }
  };

  // Зміна посади учасника
  const changeMemberRole = async (targetId, newRole) => {
    if (!targetId || !newRole || changingRole) return;

    const target = members.find(
      (member) => member.user_id === targetId
    );

    if (!target) return;

    if (target.role === "leader") {
      notify("Посаду лідера не можна змінити тут.", true);
      return;
    }

    const actorRank = ROLE_RANK[myRole] ?? 99;
    const targetRank = ROLE_RANK[target.role] ?? 99;
    const newRank = ROLE_RANK[newRole] ?? 99;

    if (
      !["leader", "deputy", "general", "officer"].includes(myRole)
    ) {
      notify("У тебе немає прав керувати посадами.", true);
      return;
    }

    if (
      targetRank <= actorRank ||
      newRank < actorRank
    ) {
      notify("Не можна змінювати цю посаду.", true);
      return;
    }

    const player = memberProfiles[targetId];

    const playerName =
      player?.display_name ||
      player?.username ||
      "цього учасника";

    if (
      !window.confirm(
        `Змінити посаду ${playerName} на «${ROLE_NAMES[newRole]}»?`
      )
    ) {
      return;
    }

    setChangingRole(targetId);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.rpc(
        "set_clan_member_role",
        {
          p_clan_id: clanId,
          p_target_user_id: targetId,
          p_new_role: newRole,
        }
      );

      if (error) throw error;

      notify(
        `Посаду учасника змінено: ${ROLE_NAMES[newRole]}.`
      );

      await loadData();
      onRefresh?.();
    } catch (err) {
      notify(err?.message || "Не вдалося змінити посаду.", true);
    } finally {
      setChangingRole("");
    }
  };

  // Перейменування клану
  const renameClan = async () => {
    const name = newClanName.trim();

    if (!isLeaderOrDeputy || renaming) return;

    if (name.length < 3 || name.length > 40) {
      notify("Назва має містити від 3 до 40 символів.", true);
      return;
    }

    if (name === clan?.name) {
      notify("Це вже поточна назва клану.", true);
      return;
    }

    if (
      !window.confirm(
        `Перейменувати клан на «${name}» за 250 золота?`
      )
    ) {
      return;
    }

    setRenaming(true);
    setError("");
    setSuccess("");

    try {
      const { data, error } = await supabase.rpc(
        "rename_clan",
        {
          p_clan_id: clanId,
          p_new_name: name,
        }
      );

      if (error) throw error;

      if (data?.success === false) {
        throw new Error(
          data?.message || "Не вдалося перейменувати клан."
        );
      }

      setNewClanName(data?.new_name || name);

      notify(
        `Клан перейменовано. Витрачено 250 золота. Залишок: ${data?.remaining_gold ?? "—"}.`
      );

      onRefresh?.();
    } catch (err) {
      notify(err?.message || "Помилка перейменування клану.", true);
    } finally {
      setRenaming(false);
    }
  };

  // Сортування учасників за званнями
  const visibleMembers = useMemo(() => {
    return [...members].sort(
      (a, b) =>
        (ROLE_RANK[a.role] ?? 99) -
        (ROLE_RANK[b.role] ?? 99)
    );
  }, [members]);

  // Не показуємо відмову в доступі, поки роль ще завантажується.
  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.loading}>
          <RefreshCw className="clan-settings-spin" />
          Завантаження налаштувань...
        </div>
      </div>
    );
  }

  if (!canOpenSettings) {
    return (
      <div style={s.page}>
        <div style={s.denied}>
          <Lock size={30} />
          <h3 style={{ margin: 0 }}>Доступ обмежено</h3>
          <p style={s.muted}>
            Ця сторінка доступна лідеру, заступнику, генералу та офіцеру.
          </p>
          <Button onClick={onBack}>
            <ArrowLeft size={16} />
            Назад
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <button
          type="button"
          style={s.back}
          onClick={onBack}
        >
          <ArrowLeft size={18} />
        </button>

        <div style={s.headerIcon}>
          <Settings size={22} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={s.title}>Налаштування клану</h2>
          <p style={s.subtitle}>
            {clan?.name || "Клан"} · {ROLE_NAMES[myRole] || myRole}
          </p>
        </div>

        <button
          type="button"
          style={s.back}
          onClick={loadData}
          title="Оновити"
        >
          <RefreshCw size={17} />
        </button>
      </header>

      {error && (
        <div style={s.noticeError}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={s.noticeSuccess}>
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div style={s.loading}>
          <RefreshCw className="clan-settings-spin" />
          Завантаження налаштувань...
        </div>
      ) : (
        <>
          {/* ОГОЛОШЕННЯ */}
          <Section icon={Megaphone} title="Оголошення клану">
            {canPublish ? (
              <form
                onSubmit={publishAnnouncement}
                style={s.form}
              >
                <Field label="Заголовок">
                  <input
                    value={announcementTitle}
                    onChange={(event) =>
                      setAnnouncementTitle(event.target.value)
                    }
                    maxLength={100}
                    placeholder="Наприклад: Збір клану"
                    style={s.input}
                  />
                </Field>

                <Field label="Текст оголошення">
                  <textarea
                    value={announcementMessage}
                    onChange={(event) =>
                      setAnnouncementMessage(event.target.value)
                    }
                    maxLength={3000}
                    rows={4}
                    placeholder="Напиши важливу інформацію для учасників..."
                    style={s.textarea}
                  />
                </Field>

                <Button disabled={sendingAnnouncement}>
                  {sendingAnnouncement ? (
                    <RefreshCw size={15} />
                  ) : (
                    <Send size={15} />
                  )}
                  Опублікувати
                </Button>
              </form>
            ) : (
              <p style={s.muted}>
                Публікувати оголошення можуть керівні посади.
              </p>
            )}

            <div style={s.announcementList}>
              {announcements.length === 0 ? (
                <p style={s.muted}>
                  Оголошень поки немає.
                </p>
              ) : (
                announcements.map((item) => {
                  const author = memberProfiles[item.author_id];

                  return (
                    <article
                      key={item.id}
                      style={s.announcement}
                    >
                      <div style={s.rowBetween}>
                        <strong style={{ color: colors.gold }}>
                          {item.title}
                        </strong>

                        {isLeaderOrDeputy && (
                          <button
                            type="button"
                            onClick={() => deleteAnnouncement(item)}
                            disabled={
                              deletingAnnouncement === item.id
                            }
                            style={s.deleteButton}
                            title="Видалити оголошення"
                          >
                            {deletingAnnouncement === item.id ? (
                              <RefreshCw size={15} />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        )}
                      </div>

                      <p style={s.announcementText}>
                        {item.message}
                      </p>

                      <small style={s.announcementMeta}>
                        {author?.display_name ||
                          author?.username ||
                          "Керівництво"}
                        {" · "}
                        {new Date(item.created_at).toLocaleString("uk-UA")}
                      </small>
                    </article>
                  );
                })
              )}
            </div>
          </Section>

          {/* ОПИС КЛАНУ */}
          <Section icon={Pencil} title="Опис клану">
            <Field label="Опис">
              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                maxLength={2000}
                rows={4}
                disabled={!isLeaderOrDeputy}
                style={{
                  ...s.textarea,
                  opacity: isLeaderOrDeputy ? 1 : 0.65,
                }}
                placeholder="Розкажи про свій клан..."
              />
            </Field>

            <div style={s.rowBetween}>
              <small style={s.muted}>
                {description.length}/2000
              </small>

              
{isLeaderOrDeputy && (
  <Button
    onClick={saveDescription}
    disabled={savingDescription}
  >
    <Save size={15} />
    Зберегти опис
  </Button>
)}
</div>

{!isLeaderOrDeputy && (
  <p style={s.muted}>
    Редагувати опис можуть лідер і заступник.
  </p>
)}
</Section>

{/* УЧАСНИКИ ТА ПОСАДИ */}
<Section icon={Users} title="Учасники та посади">
  <p style={s.muted}>
    Ти можеш змінювати посади лише тих учасників,
    які нижчі за тебе. Максимальна посада для підвищення —
    твоя власна.
  </p>

  <div style={s.memberList}>
    {visibleMembers.map((member) => {
      const player = memberProfiles[member.user_id] || {};
      const name =
        player.display_name || player.username || "Гравець";

      const targetRank = ROLE_RANK[member.role] ?? 99;
      const actorRank = ROLE_RANK[myRole] ?? 99;

      const canManage =
        member.user_id !== myId &&
        member.role !== "leader" &&
        ["leader", "deputy", "general", "officer"].includes(myRole) &&
        targetRank > actorRank;

      const allowedRoles = ROLE_OPTIONS.filter(
        (role) => (ROLE_RANK[role] ?? 99) >= actorRank
      );

      return (
        <div key={member.user_id} style={s.memberRow}>
          <div style={s.memberInfo}>
            <strong>{name}</strong>
            <span style={s.memberMeta}>
              {ROLE_NAMES[member.role] || member.role}
              {player.level ? ` · Рівень ${player.level}` : ""}
            </span>
          </div>

          {canManage ? (
            <select
              value={member.role === "member" ? "newbie" : member.role}
              disabled={changingRole === member.user_id}
              onChange={(e) =>
                changeMemberRole(member.user_id, e.target.value)
              }
              style={s.roleSelect}
            >
              {allowedRoles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_NAMES[role]}
                </option>
              ))}
            </select>
          ) : (
            <span style={s.roleBadge}>
              {ROLE_NAMES[member.role] || member.role}
            </span>
          )}
        </div>
      );
    })}
  </div>
</Section>

{/* ПРАВА ДОСТУПУ */}
{isLeaderOrDeputy && (
  <Section icon={Shield} title="Права доступу">
    <p style={s.muted}>
      Вибери найнижчу посаду, якій дозволено
      запрошувати або виключати учасників.
    </p>

    <Field label="Хто може запрошувати">
      <select
        value={inviteRole}
        onChange={(e) => setInviteRole(e.target.value)}
        style={s.input}
      >
        {ACCESS_OPTIONS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </Field>

    <Field label="Хто може виключати">
      <select
        value={kickRole}
        onChange={(e) => setKickRole(e.target.value)}
        style={s.input}
      >
        {ACCESS_OPTIONS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </Field>

    <Button onClick={saveAccess} disabled={savingAccess}>
      <Save size={15} />
      Зберегти права
    </Button>
  </Section>
)}

{/* ПЕРЕЙМЕНУВАННЯ */}
{isLeaderOrDeputy && (
  <Section icon={Crown} title="Перейменування клану">
    <p style={s.muted}>
      Зміна назви коштує{" "}
      <strong style={{ color: colors.gold }}>250 золота</strong>
      {" "}зі скарбниці клану.
    </p>

    <Field label="Нова назва">
      <input
        value={newClanName}
        onChange={(e) => setNewClanName(e.target.value)}
        maxLength={40}
        minLength={3}
        style={s.input}
        placeholder="Назва клану"
      />
    </Field>

    <Button onClick={renameClan} disabled={renaming}>
      <Coins size={16} />
      {renaming ? "Перейменування..." : "Перейменувати за 250 золота"}
    </Button>
  </Section>
)}

{myRole === "leader" && (
  <div style={s.leaderNotice}>
    <Crown size={17} />
    <div>
      <strong>Панель лідера</strong>
      <p>
        Ти маєш найвищі права керування кланом.
        Заступник не може змінювати твою посаду.
      </p>
    </div>
  </div>
)}
</>
)}

<style>{`
  @keyframes clanSettingsSpin {
    to { transform: rotate(360deg); }
  }

  .clan-settings-spin {
    animation: clanSettingsSpin 1s linear infinite;
  }
`}</style>
</div>
);
}

const s = {
  page: {
    width: "100%",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 13,
    color: colors.page,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "4px 0 8px",
  },
  back: {
    width: 38,
    height: 38,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    border: `1px solid ${colors.border}`,
    borderRadius: 11,
    background: "#261b13",
    color: colors.gold,
    cursor: "pointer",
  },
  headerIcon: {
    width: 42,
    height: 42,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: 13,
    color: colors.gold,
    background: "linear-gradient(145deg,#49321d,#2b1e14)",
    border: "1px solid #79572f",
  },
  title: {
    margin: 0,
    fontSize: 19,
    fontWeight: 900,
    color: "#f2d6a5",
  },
  subtitle: {
    margin: "4px 0 0",
    color: colors.muted,
    fontSize: 11,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 15,
    background: `linear-gradient(160deg,${colors.panel2},${colors.panel})`,
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    color: colors.gold,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    width: "100%",
  },
  label: {
    color: "#c6aa81",
    fontSize: 11,
    fontWeight: 800,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #59432c",
    borderRadius: 10,
    background: "#17120e",
    color: "#f0dfc5",
    font: "inherit",
    fontSize: 13,
    outline: "none",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: 85,
    padding: "11px 12px",
    border: "1px solid #59432c",
    borderRadius: 10,
    background: "#17120e",
    color: "#f0dfc5",
    font: "inherit",
    fontSize: 13,
    lineHeight: 1.5,
    outline: "none",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  button: {
    minHeight: 39,
    alignSelf: "flex-start",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: "9px 13px",
    border: "1px solid #a87938",
    borderRadius: 10,
    background: "linear-gradient(145deg,#795126,#503319)",
    color: "#fff0d2",
    fontWeight: 800,
    fontSize: 12,
    cursor: "pointer",
  },
  dangerButton: {
    borderColor: "#784638",
    background: "#3b211a",
  },
  rowBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  muted: {
    margin: 0,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 1.5,
  },
  announcementList: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
  },
  announcement: {
    padding: 12,
    border: "1px solid #4b3927",
    borderRadius: 11,
    background: "#1a140f",
  },
  announcementText: {
    margin: "7px 0",
    color: "#e9d9c0",
    fontSize: 12,
    whiteSpace: "pre-wrap",
  },
  announcementMeta: {
    color: "#89765e",
    fontSize: 10,
  },
  deleteButton: {
    width: 30,
    height: 30,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    border: "1px solid #784638",
    borderRadius: 8,
    background: "#3b211a",
    color: "#e6a18c",
    cursor: "pointer",
  },
  memberList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  memberRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: 10,
    border: "1px solid #493622",
    borderRadius: 10,
    background: "#1a140f",
  },
  memberInfo: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  memberMeta: {
    color: colors.muted,
    fontSize: 10,
  },
  roleSelect: {
    maxWidth: 130,
    minWidth: 105,
    padding: "8px 6px",
    border: "1px solid #70532f",
    borderRadius: 8,
    background: "#302316",
    color: "#f0d8b1",
    fontSize: 11,
  },
  roleBadge: {
    flexShrink: 0,
    padding: "6px 8px",
    border: "1px solid #59432c",
    borderRadius: 20,
    color: colors.gold,
    fontSize: 10,
  },
  noticeError: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 10,
    border: "1px solid #784638",
    borderRadius: 9,
    background: "#3b211a",
    color: "#e6a18c",
    fontSize: 12,
  },
  noticeSuccess: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 10,
    border: "1px solid #47653d",
    borderRadius: 9,
    background: "#1d2c1a",
    color: "#b5d99e",
    fontSize: 12,
  },
  loading: {
    minHeight: 180,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    color: colors.muted,
  },
  denied: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: 30,
    border: `1px solid ${colors.border}`,
    borderRadius: 15,
    background: colors.panel,
    textAlign: "center",
    color: colors.gold,
  },
  leaderNotice: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: 13,
    border: "1px solid #79572f",
    borderRadius: 12,
    background: "linear-gradient(145deg,#392817,#211810)",
    color: colors.gold,
  },
};
