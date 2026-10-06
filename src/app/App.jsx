import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("Failed to load session:", error);
      }

      setSession(data?.session ?? null);
      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__logo">⚔️</div>
        <h1>MY RPG</h1>
        <p>Завантаження...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app">
        <main className="auth-screen">
          <div className="auth-screen__card">
            <div className="auth-screen__icon">⚔️</div>

            <h1>MY RPG</h1>

            <p>
              Світ героїв, битв та пригод.
            </p>

            <button type="button">
              Увійти в гру
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <main>
        <h1>MY RPG</h1>

        <p>
          Вітаємо у грі!
        </p>

        <p>
          ID користувача: {session.user.id}
        </p>
      </main>
    </div>
  );
        }
