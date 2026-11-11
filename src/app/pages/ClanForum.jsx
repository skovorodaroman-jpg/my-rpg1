
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  MessageSquare, Send, Plus, Trash2, Pencil, X, Check,
  RefreshCw, Lock, Globe, ThumbsUp, BarChart3, Users,
  ChevronDown, ChevronUp, Clock, MessageCircle, Vote,
} from "lucide-react";

const MANAGER_ROLES = ["leader", "deputy", "general"];

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getError = (error) =>
  error?.message || "Сталася невідома помилка";

export default function ClanForum({
  clanId,
  profile,
  currentUserRole,
}) {
  const userId = profile?.id || profile?.user_id || null;
  const isManager = MANAGER_ROLES.includes(currentUserRole);

  const [topics, setTopics] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [polls, setPolls] = useState([]);
  const [options, setOptions] = useState([]);
  const [votes, setVotes] = useState([]);
  const [profiles, setProfiles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState({});

  const [topicTitle, setTopicTitle] = useState("");
  const [topicMessage, setTopicMessage] = useState("");
  const [topicVisibility, setTopicVisibility] = useState("private");
  const [showTopicForm, setShowTopicForm] = useState(false);

  const [replyText, setReplyText] = useState({});
  const [commentText, setCommentText] = useState({});
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");

  const [pollQuestion, setPollQuestion] = useState({});
  const [pollOptionsText, setPollOptionsText] = useState({});
  const [pollMultiple, setPollMultiple] = useState({});
  const [showPollForm, setShowPollForm] = useState({});

  const [selectedVotes, setSelectedVotes] = useState({});
  const [voting, setVoting] = useState(false);

  const [activeTab, setActiveTab] = useState("topics");

  const myName =
    profile?.display_name ||
    profile?.username ||
    "Гравець";

  const loadForum = useCallback(async () => {
    if (!clanId) {
      setError("Не передано ID клану.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Теми свого клану та загальнодоступні теми.
      const { data: topicData, error: topicError } = await supabase
        .from("clan_forum_topics")
        .select("*")
        .or(`clan_id.eq.${clanId},visibility.eq.public`)
        .order("updated_at", { ascending: false });

      if (topicError) throw topicError;

      const topicIds = (topicData || []).map((item) => item.id);

      let postData = [];
      if (topicIds.length) {
        const { data, error: postError } = await supabase
          .from("clan_forum_posts")
          .select("*")
          .in("topic_id", topicIds)
          .order("created_at", { ascending: true });

        if (postError) throw postError;
        postData = data || [];
      }

      const postIds = postData.map((item) => item.id);

      let commentData = [];
      let pollData = [];

      if (postIds.length) {
        const [commentResult, pollResult] = await Promise.all([
          supabase
            .from("clan_forum_comments")
            .select("*")
            .in("post_id", postIds)
            .order("created_at", { ascending: true }),
          supabase
            .from("clan_forum_polls")
            .select("*")
            .in("post_id", postIds)
            .order("created_at", { ascending: true }),
        ]);

        if (commentResult.error) throw commentResult.error;
        if (pollResult.error) throw pollResult.error;

        commentData = commentResult.data || [];
        pollData = pollResult.data || [];
      }

      const pollIds = pollData.map((item) => item.id);

      let optionData = [];
      let voteData = [];

      if (pollIds.length) {
        const [optionResult, voteResult] = await Promise.all([
          supabase
            .from("clan_forum_poll_options")
            .select("*")
            .in("poll_id", pollIds)
            .order("position", { ascending: true }),
          supabase
            .from("clan_forum_poll_votes")
            .select("*")
            .in("poll_id", pollIds),
        ]);

        if (optionResult.error) throw optionResult.error;
        if (voteResult.error) throw voteResult.error;

        optionData = optionResult.data || [];
        voteData = voteResult.data || [];
      }

      const authorIds = [
        ...new Set([
          ...(topicData || []).map((item) => item.user_id),
          ...postData.map((item) => item.user_id),
          ...commentData.map((item) => item.user_id),
        ].filter(Boolean)),
      ];

      let profileData = [];
      if (authorIds.length) {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", authorIds);

        if (profileError) {
          console.warn("Не вдалося завантажити профілі:", profileError);
        } else {
          profileData = data || [];
        }
      }

      setTopics(topicData || []);
      setPosts(postData);
      setComments(commentData);
      setPolls(pollData);
      setOptions(optionData);
      setVotes(voteData);
      setProfiles(profileData);
    } catch (err) {
      console.error("Clan forum load error:", err);
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, [clanId]);

  useEffect(() => {
    loadForum();
  }, [loadForum]);

  const profileById = useMemo(() => {
    return Object.fromEntries(
      profiles.map((item) => [item.id, item])
    );
  }, [profiles]);

  const getAuthorName = (id) => {
    if (id === userId) return myName;

    const author = profileById[id];
    return (
      author?.display_name ||
      author?.username ||
      "Гравець"
    );
  };

  const visibleTopics = useMemo(() => {
    return topics.filter((topic) => {
      if (visibilityFilter === "public") {
        return topic.visibility === "public";
      }

      if (visibilityFilter === "private") {
        return topic.visibility !== "public";
      }

      return true;
    });
  }, [topics, visibilityFilter]);

  const currentTopic = selectedTopic
    ? topics.find((item) => item.id === selectedTopic)
    : null;

  const topicPosts = useMemo(() => {
    if (!selectedTopic) return [];
    return posts.filter((post) => post.topic_id === selectedTopic);
  }, [posts, selectedTopic]);

  const canModerateTopic = (topic) =>
    isManager && topic?.clan_id === clanId;

  const canEditTopic = (topic) =>
    topic?.user_id === userId || canModerateTopic(topic);

  const canEditPost = (post) => {
    const topic = topics.find((item) => item.id === post.topic_id);
    return post.user_id === userId || canModerateTopic(topic);
  };

  const canEditComment = (comment) => {
    const post = posts.find((item) => item.id === comment.post_id);
    const topic = topics.find((item) => item.id === post?.topic_id);

    return comment.user_id === userId || canModerateTopic(topic);
  };

  const showMessage = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
  };

  // Створення теми та першого повідомлення.
  const createTopic = async (event) => {
    event.preventDefault();

    if (!userId || !clanId) {
      setError("Не вдалося визначити користувача або клан.");
      return;
    }

    if (topicTitle.trim().length < 3) {
      setError("Назва теми має містити щонайменше 3 символи.");
      return;
    }

    if (!topicMessage.trim()) {
      setError("Напиши перше повідомлення теми.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const { data: newTopic, error: createTopicError } = await supabase
        .from("clan_forum_topics")
        .insert({
          clan_id: clanId,
          user_id: userId,
          title: topicTitle.trim(),
          visibility: topicVisibility,
        })
        .select()
        .single();

      if (createTopicError) throw createTopicError;

      const { error: createPostError } = await supabase
        .from("clan_forum_posts")
        .insert({
          topic_id: newTopic.id,
          user_id: userId,
          message: topicMessage.trim(),
        });

      if (createPostError) {
        // Якщо перше повідомлення не створилося,
        // пробуємо прибрати порожню тему.
        await supabase
          .from("clan_forum_topics")
          .delete()
          .eq("id", newTopic.id);

        throw createPostError;
      }

      setTopicTitle("");
      setTopicMessage("");
      setTopicVisibility("private");
      setShowTopicForm(false);
      setSelectedTopic(newTopic.id);
      setActiveTab("topics");

      await loadForum();
      showMessage("Тему створено!");
    } catch (err) {
      setError(getError(err));
    } finally {
      setSending(false);
    }
  };

  // Відповідь у темі.
  const createPost = async (topicId) => {
    const message = replyText[topicId]?.trim();

    if (!message || !userId) return;

    setSending(true);
    setError("");

    try {
      const { error: insertError } = await supabase
        .from("clan_forum_posts")
        .insert({
          topic_id: topicId,
          user_id: userId,
          message,
        });

      if (insertError) throw insertError;

      await supabase
        .from("clan_forum_topics")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", topicId);

      setReplyText((prev) => ({ ...prev, [topicId]: "" }));
      await loadForum();
      showMessage("Повідомлення надіслано!");
    } catch (err) {
      setError(getError(err));
    } finally {
      setSending(false);
    }
  };

  // Коментар до повідомлення.
  const createComment = async (postId) => {
    const message = commentText[postId]?.trim();

    if (!message || !userId) return;

    setSending(true);
    setError("");

    try {
      const { error: insertError } = await supabase
        .from("clan_forum_comments")
        .insert({
          post_id: postId,
          user_id: userId,
          message,
        });

      if (insertError) throw insertError;

      setCommentText((prev) => ({ ...prev, [postId]: "" }));
      await loadForum();
      showMessage("Коментар додано!");
    } catch (err) {
      setError(getError(err));
    } finally {
      setSending(false);
    }
  };

  // Редагування теми, повідомлення або коментаря.
  const saveEdit = async () => {
    if (!editing || !editText.trim()) return;

    setSending(true);
    setError("");

    try {
      let result;

      if (editing.type === "topic") {
        result = await supabase
          .from("clan_forum_topics")
          .update({
            title: editText.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", editing.id);
      } else if (editing.type === "post") {
        result = await supabase
          .from("clan_forum_posts")
          .update({ message: editText.trim() })
          .eq("id", editing.id);
      } else {
        result = await supabase
          .from("clan_forum_comments")
          .update({
            message: editText.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", editing.id);
      }

      if (result.error) throw result.error;

      setEditing(null);
      setEditText("");
      await loadForum();
      showMessage("Зміни збережено!");
    } catch (err) {
      setError(getError(err));
    } finally {
      setSending(false);
    }
  };

  // Видалення.
  const deleteItem = async (type, id) => {
    const labels = {
      topic: "тему разом з усіма її повідомленнями",
      post: "повідомлення разом з його коментарями та опитуванням",
      comment: "коментар",
    };

    if (!window.confirm(`Видалити ${labels[type]}?`)) return;

    setError("");

    try {
      const table = {
        topic: "clan_forum_topics",
        post: "clan_forum_posts",
        comment: "clan_forum_comments",
      }[type];

      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      if (type === "topic" && selectedTopic === id) {
        setSelectedTopic(null);
      }

      await loadForum();
      showMessage("Видалено.");
    } catch (err) {
      setError(getError(err));
    }
  };

  // Створення опитування до власного повідомлення
  // або повідомлення, яке може модерувати керівництво.
  const createPoll = async (post) => {
    const question = pollQuestion[post.id]?.trim();
    const rawOptions = (pollOptionsText[post.id] || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!question || question.length < 3) {
      setError("Введи запитання опитування.");
      return;
    }

    if (rawOptions.length < 2) {
      setError("Для опитування потрібно щонайменше 2 варіанти.");
      return;
    }

    if (rawOptions.length > 20) {
      setError("Максимум 20 варіантів відповіді.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const { data: poll, error: pollError } = await supabase
        .from("clan_forum_polls")
        .insert({
          post_id: post.id,
          question,
          is_multiple_choice: Boolean(pollMultiple[post.id]),
        })
        .select()
        .single();

      if (pollError) throw pollError;

      const { error: optionsError } = await supabase
        .from("clan_forum_poll_options")
        .insert(
          rawOptions.map((option, index) => ({
            poll_id: poll.id,
            option_text: option,
            position: index,
          }))
        );

      if (optionsError) throw optionsError;

      setPollQuestion((prev) => ({ ...prev, [post.id]: "" }));
      setPollOptionsText((prev) => ({ ...prev, [post.id]: "" }));
      setPollMultiple((prev) => ({ ...prev, [post.id]: false }));
      setShowPollForm((prev) => ({ ...prev, [post.id]: false }));

      await loadForum();
      showMessage("Опитування створено!");
    } catch (err) {
      setError(getError(err));
    } finally {
      setSending(false);
    }
  };

  // Голосування через захищену RPC-функцію Supabase.
  const castVote = async (poll) => {
    const chosen = selectedVotes[poll.id] || [];

    if (!chosen.length) {
      setError("Спочатку вибери варіант відповіді.");
      return;
    }

    setVoting(true);
    setError("");

    try {
      for (const optionId of chosen) {
        const { error: voteError } = await supabase.rpc(
          "cast_clan_forum_poll_vote",
          {
            p_poll_id: poll.id,
            p_option_id: optionId,
          }
        );

        if (voteError) throw voteError;
      }

      await loadForum();
      showMessage("Твій голос зараховано!");
    } catch (err) {
      setError(getError(err));
    } finally {
      setVoting(false);
    }
  };

  const getPollForPost = (postId) =>
    polls.find((poll) => poll.post_id === postId);

  const getOptionsForPoll = (pollId) =>
    options.filter((option) => option.poll_id === pollId);

  const getVotesForOption = (optionId) =>
    votes.filter((vote) => vote.option_id === optionId).length;

  const getMyVotes = (pollId) =>
    votes.filter(
      (vote) => vote.poll_id === pollId && vote.user_id === userId
    );

  const toggleVoteOption = (poll, optionId) => {
    setSelectedVotes((prev) => {
      const current = prev[poll.id] || [];

      if (poll.is_multiple_choice) {
        return {
          ...prev,
          [poll.id]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      }

      return {
        ...prev,
        [poll.id]: [optionId],
      };
    });
  };

  const renderPoll = (poll) => {
    const pollOptions = getOptionsForPoll(poll.id);
    const myVotes = getMyVotes(poll.id);
    const totalVotes = votes.filter(
      (vote) => vote.poll_id === poll.id
    ).length;

    const hasVoted = myVotes.length > 0;
    const expired =
      poll.ends_at && new Date(poll.ends_at).getTime() < Date.now();

    return (
      <div className="cf-poll" key={poll.id}>
        <div className="cf-poll-heading">
          <Vote size={17} />
          <strong>Опитування</strong>
          {poll.is_multiple_choice && (
            <span className="cf-poll-tag">Можна обрати кілька</span>
          )}
        </div>

        <h4>{poll.question}</h4>

        <div className="cf-poll-options">
          {pollOptions.map((option) => {
            const count = getVotesForOption(option.id);
            const percent = totalVotes
              ? Math.round((count / totalVotes) * 100)
              : 0;

            const checked = hasVoted
              ? myVotes.some((vote) => vote.option_id === option.id)
              : (selectedVotes[poll.id] || []).includes(option.id);

            return (
              <button
                type="button"
                key={option.id}
                className={`cf-poll-option ${checked ? "selected" : ""}`}
                disabled={hasVoted || expired}
                onClick={() => toggleVoteOption(poll, option.id)}
              >
                <span className="cf-poll-option-top">
                  <span>{option.option_text}</span>
                  {(hasVoted || expired) && (
                    <strong>{percent}%</strong>
                  )}
                </span>

                {(hasVoted || expired) && (
                  <span className="cf-poll-progress">
                    <span style={{ width: `${percent}%` }} />
                  </span>
                )}

                {(hasVoted || expired) && (
                  <small>{count} голосів</small>
                )}
              </button>
            );
          })}
        </div>

        {!hasVoted && !expired && (
          <button
            type="button"
            className="cf-primary-btn cf-vote-btn"
            disabled={voting}
            onClick={() => castVote(poll)}
          >
            <Vote size={16} />
            {voting ? "Зараховуємо..." : "Проголосувати"}
          </button>
        )}

        <div className="cf-poll-footer">
          <span>{totalVotes} голосів</span>
          {hasVoted && <span>Ти вже проголосував</span>}
          {expired && <span>Опитування завершено</span>}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="cf-loading">
        <RefreshCw className="cf-spin" size={24} />
        <span>Завантажуємо форум клану...</span>
      </div>
    );
  }

  return (
    <div className="clan-forum">
      <style>{`
        .clan-forum {
          color: #eadcc4;
          width: 100%;
          font-family: inherit;
        }

        .cf-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .cf-heading {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cf-heading-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          color: #e8b86d;
          background: #33271c;
          border: 1px solid #685033;
        }

        .cf-heading h2 {
          margin: 0;
          font-size: 20px;
          color: #f1d7a6;
        
        }

        .cf-heading p {
          margin: 3px 0 0;
          color: #a99a83;
          font-size: 12px;
        }

        .cf-primary-btn, .cf-secondary-btn, .cf-icon-btn {
          border: 1px solid #76552f;
          cursor: pointer;
          transition: .2s;
          font: inherit;
        }

        .cf-primary-btn {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
          padding: 10px 14px;
          border-radius: 10px;
          background: linear-gradient(135deg,#9b672d,#68421e);
          color: #fff0d0;
          font-weight: 700;
        }

        .cf-primary-btn:hover {
          filter: brightness(1.15);
        }

        .cf-primary-btn:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .cf-secondary-btn {
          padding: 9px 12px;
          border-radius: 9px;
          color: #d9c5a5;
          background: #29221b;
        }

        .cf-icon-btn {
          display: inline-grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #2a211a;
          color: #c9ad81;
        }

        .cf-icon-btn:hover {
          color: #ffcf82;
          border-color: #c28c45;
        }

        .cf-tabs {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 10px;
          margin-bottom: 12px;
        }

        .cf-tab {
          white-space: nowrap;
          padding: 9px 13px;
          border-radius: 9px;
          border: 1px solid #463729;
          background: #211a15;
          color: #b9a88e;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
        }

        .cf-tab.active {
          color: #ffdda1;
          background: #49341e;
          border-color: #a9793e;
        }

        .cf-filters {
          display: flex;
          gap: 7px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .cf-filter {
          border: 1px solid #463729;
          background: #211a15;
          color: #ad9c82;
          border-radius: 20px;
          padding: 6px 11px;
          font-size: 12px;
          cursor: pointer;
        }

        .cf-filter.active {
          background: #49341e;
          color: #ffdda1;
          border-color: #a9793e;
        }

        .cf-panel {
          background: #1c1713;
          border: 1px solid #493a2b;
          border-radius: 13px;
          padding: 14px;
          margin-bottom: 12px;
        }

        .cf-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .cf-input, .cf-textarea, .cf-select {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px;
          border-radius: 9px;
          border: 1px solid #51402e;
          background: #110e0c;
          color: #f0dfc3;
          outline: none;
          font: inherit;
          font-size: 14px;
        }

        .cf-input:focus, .cf-textarea:focus {
          border-color: #b78343;
        }

        .cf-textarea {
          min-height: 85px;
          resize: vertical;
        }

        .cf-form-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .cf-topic {
          background: linear-gradient(145deg,#251d17,#1b1511);
          border: 1px solid #493829;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 10px;
        }

        .cf-topic-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .cf-topic-title {
          color: #f0d5a2;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          line-height: 1.4;
        }

        .cf-topic-title:hover {
          color: #ffdc9c;
        }

        .cf-topic-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 8px;
          color: #9c8b73;
          font-size: 11px;
        }

        .cf-visibility {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #c4a777;
          font-size: 11px;
        }

        .cf-actions {
          display: flex;
          gap: 5px;
          flex-shrink: 0;
        }

        .cf-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #d9b87f;
          cursor: pointer;
          background: none;
          border: 0;
          padding: 0;
          margin-bottom: 14px;
          font: inherit;
        }

        .cf-post {
          border-left: 2px solid #76552f;
          padding: 2px 0 2px 12px;
          margin: 16px 0;
        }

        .cf-post-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cf-author {
          color: #e5c58d;
          font-size: 13px;
          font-weight: 700;
        }

        .cf-date {
          color: #8e806d;
          font-size: 10px;
        }

        .cf-post-message {
          color: #d6c8b2;
          font-size: 14px;
          line-height: 1.6;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          margin: 9px 0;
        }

        .cf-post-tools {
          display: flex;
          gap: 7px;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .cf-text-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: 0;
          color: #bba27d;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          padding: 4px 0;
        }

        .cf-text-btn:hover {
          color: #ffdb9b;
        }

        .cf-comments {
          margin: 10px 0 0 8px;
          padding-left: 12px;
          border-left: 1px solid #493a2b;
        }

        .cf-comment {
          padding: 8px 0;
          border-bottom: 1px solid #33281e;
        }

        .cf-comment:last-child {
          border-bottom: 0;
        }

        .cf-comment-message {
          font-size: 12px;
          line-height: 1.5;
          color: #c8baa5;
          margin-top: 4px;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .cf-inline-form {
          display: flex;
          gap: 7px;
          margin-top: 10px;
        }

        .cf-inline-form .cf-input {
          min-width: 0;
        }

        .cf-poll {
          background: #241d16;
          border: 1px solid #6a4c2b;
          border-radius: 11px;
          padding: 13px;
          margin: 12px 0;
        }

        .cf-poll-heading {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #e5bd7d;
          font-size: 13px;
        }

        .cf-poll h4 {
          color: #f0dcb8;
          font-size: 14px;
          margin: 10px 0;
        }

        .cf-poll-tag {
          font-size: 10px;
          color: #c8a16b;
          background: #3d2c1b;
          border-radius: 20px;
          padding: 3px 7px;
        }

        .cf-poll-options {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .cf-poll-option {
          text-align: left;
          width: 100%;
          padding: 9px 10px;
          border-radius: 8px;
          border: 1px solid #59442d;
          background: #18130f;
          color: #d7c6a9;
          cursor: pointer;
          font: inherit;
        }

        .cf-poll-option.selected {
          border-color: #c18c49;
          background: #3b2b1b;
        }

        .cf-poll-option:disabled {
          cursor: default;
        }

        .cf-poll-option-top {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 12px;
        }

        .cf-poll-progress {
          display: block;
          height: 5px;
          border-radius: 5px;
          background: #3b3024;
          margin-top: 8px;
          overflow: hidden;
        }

        .cf-poll-progress span {
          display: block;
          height: 100%;
          background: #bd8744;
          border-radius: inherit;
        }

        .cf-poll-option small {
          display: block;
          margin-top: 5px;
          color: #9d8a70;
          font-size: 10px;
        }

        .cf-vote-btn {
          margin-top: 10px;
        }

        .cf-poll-footer {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 10px;
          color: #9e8b70;
          font-size: 10px;
        }

        .cf-empty {
          text-align: center;
          padding: 35px 15px;
          color: #a8977d;
          background: #1d1712;
          border: 1px dashed #51402e;
          border-radius: 12px;
        }

        .cf-empty svg {
          color: #a77b42;
          margin-bottom: 8px;
        }

        .cf-alert {
          padding: 10px 12px;
          border-radius: 9px;
          margin-bottom: 12px;
          font-size: 13px;
        }

        .cf-error {
          background: #401e1a;
          color: #ffb9a9;
          border: 1px solid #793a2e;
        }

        .cf-success {
          background: #203326;
          color: #b5e2bd;
          border: 1px solid #3b6745;
        }

        .cf-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px 10px;
          color: #c5a779;
        }

        .cf-spin {
          animation: cfspin 1s linear infinite;
        }

        @keyframes cfspin {
          to { transform: rotate(360deg); }
        }

        .cf-muted {
          color: #96866f;
          font-size: 12px;
        }

        .cf-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #cdbb9d;
          font-size: 12px;
        }

        .cf-checkbox input {
          accent-color: #b78343;
        }

        @media (max-width: 480px) {
          .cf-heading h2 { font-size: 18px; }
          .cf-header { align-items: flex-start; }
          .cf-header > .cf-primary-btn { width: 100%; }
          .cf-panel { padding: 11px; }
          .cf-topic { padding: 12px; }
        }
        <style>{`
