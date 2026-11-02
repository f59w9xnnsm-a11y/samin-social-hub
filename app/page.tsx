"use client";

import { useEffect, useMemo, useState } from "react";
import { getLocalPosts, type LocalPost } from "@/app/lib/local-content";

type Draft = { id: number | string; client: string; handle: string; type: string; title: string; date: string; status: "Freigabe ausstehend" | "Entwurf" | "Freigegeben"; tone: string; initials: string; previewUrl?: string; captionSummary?: string };

const initialDrafts: Draft[] = [
  { id: 1, client: "Maison Élan", handle: "@maisonelan.studio", type: "REEL", title: "Ein Morgen im Atelier", date: "Heute · 16:30", status: "Freigabe ausstehend", tone: "rose", initials: "M" },
  { id: 2, client: "Samin Consulting", handle: "@samin.consulting", type: "CAROUSEL", title: "5 Impulse für deine Marke", date: "Morgen · 10:00", status: "Entwurf", tone: "gold", initials: "S" },
  { id: 3, client: "Studio Noura", handle: "@studionoura.de", type: "POST", title: "Kleine Rituale, große Wirkung", date: "Do, 5. Nov · 12:00", status: "Freigegeben", tone: "sage", initials: "N" },
  { id: 4, client: "Maison Élan", handle: "@maisonelan.studio", type: "STORY", title: "Neu im Showroom ✨", date: "Fr, 6. Nov · 09:30", status: "Entwurf", tone: "sand", initials: "M" },
];

const nav = [
  { icon: "◫", label: "Übersicht" }, { icon: "♙", label: "Kunden" }, { icon: "▤", label: "Content" }, { icon: "✧", label: "Medien-Studio" }, { icon: "▦", label: "Redaktionsplan" },
];

function Badge({ children, kind = "neutral" }: { children: React.ReactNode; kind?: string }) {
  return <span className={`badge badge-${kind}`}><i />{children}</span>;
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Übersicht");
  const [filter, setFilter] = useState("Alle Inhalte");
  const [drafts, setDrafts] = useState(initialDrafts);
  const [localPosts, setLocalPosts] = useState<LocalPost[]>([]);
  const [postPreviews, setPostPreviews] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let current = true;
    void getLocalPosts().then((posts) => { if (current) setLocalPosts(posts); }).catch(() => undefined);
    return () => { current = false; };
  }, []);
  useEffect(() => {
    const previews = Object.fromEntries(localPosts.map((post) => [post.id, URL.createObjectURL(post.image)]));
    setPostPreviews(previews);
    return () => Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
  }, [localPosts]);
  const allDrafts = useMemo(() => [
    ...localPosts.map((post) => {
      const style = post.client === "Maison Élan" ? { tone: "rose", initials: "M" } : post.client === "Studio Noura" ? { tone: "sage", initials: "N" } : { tone: "gold", initials: "S" };
      const date = post.wishDate ? `Wunsch: ${new Date(post.wishDate).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}` : "Noch nicht geplant";
      return { id: post.id, client: post.client, handle: post.handle, type: post.format === "story" ? "STORY" : post.format === "cover" ? "FEED" : "POST", title: post.title, date, status: "Entwurf" as const, ...style, previewUrl: postPreviews[post.id], captionSummary: [post.caption, post.hashtags].filter(Boolean).join("  ") };
    }),
    ...drafts,
  ], [localPosts, postPreviews, drafts]);
  const visibleDrafts = useMemo(() => filter === "Alle Inhalte" ? allDrafts : allDrafts.filter((draft) => draft.status === filter), [allDrafts, filter]);

  function addDraft() {
    const draft: Draft = { id: Date.now(), client: "Samin Consulting", handle: "@samin.consulting", type: "POST", title: "Neuer Content-Entwurf", date: "Noch nicht geplant", status: "Entwurf", tone: "gold", initials: "S" };
    setDrafts((current) => [draft, ...current]);
    setFilter("Alle Inhalte");
    setNotice("Neuer Entwurf wurde angelegt.");
    window.setTimeout(() => setNotice(""), 3000);
  }

  return <main className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#start" aria-label="Samin Social Hub Startseite"><span className="brand-mark">S</span><span className="brand-copy"><strong>SAMIN</strong><small>SOCIAL HUB</small></span></a>
      <div className="workspace-label">WORKSPACE</div>
      <button className="workspace-switch"><span className="workspace-dot">S</span><span><b>Samin Studio</b><small>Mein Workspace</small></span><span className="chevron">⌄</span></button>
      <div className="nav-label">MENÜ</div>
      <nav className="main-nav" aria-label="Hauptnavigation">
        {nav.map((item) => <button key={item.label} className={`nav-item ${activeNav === item.label ? "active" : ""}`} onClick={() => item.label === "Medien-Studio" ? window.location.assign("/studio") : setActiveNav(item.label)}><span className="nav-icon">{item.icon}</span>{item.label}{item.label === "Content" && <span className="nav-count">8</span>}</button>)}
      </nav>
      <div className="sidebar-section-title">DEINE KUNDEN <button aria-label="Kunden hinzufügen" onClick={() => setNotice("Die Kundenverwaltung folgt im nächsten Ausbauschritt.")}>＋</button></div>
      <div className="client-links"><button onClick={() => setNotice("Kundenansicht für Samin Consulting (Demo). ")}><span className="client-avatar gold">S</span><span>Samin Consulting</span></button><button onClick={() => setNotice("Kundenansicht für Maison Élan (Demo). ")}><span className="client-avatar rose">M</span><span>Maison Élan</span></button><button onClick={() => setNotice("Kundenansicht für Studio Noura (Demo). ")}><span className="client-avatar sage">N</span><span>Studio Noura</span></button></div>
      <div className="sidebar-bottom"><div className="help-card"><span className="help-star">✳</span><b>Fragen zum Hub?</b><p>Dein persönlicher Bereich für alles rund um Social Media.</p><button onClick={() => setNotice("Der Hilfe-Bereich wird später ergänzt.")}>Mehr erfahren <span>↗</span></button></div><button className="profile"><span className="profile-avatar">S</span><span><b>Samin Team</b><small>Administratorin</small></span><span className="more">···</span></button></div>
    </aside>

    <section className="main-area" id="start">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>{activeNav}</b></div><div className="top-actions"><span className="demo-pill"><i /> DEMO-ANSICHT</span><button className="icon-button" aria-label="Benachrichtigungen" onClick={() => setNotice("Du bist auf dem neuesten Stand.")}>♧<span className="notification-dot" /></button><span className="top-avatar">S</span></div></header>
      <div className="page-content">
        <div className="welcome-row"><div><div className="eyebrow">MONTAG, 2. NOVEMBER 2026 <span>✦</span></div><h1>Guten Morgen, Samin <span className="wave">✳</span></h1><p className="welcome-subtitle">Hier ist, was in deinem Social Hub gerade passiert.</p></div><button className="primary-button" onClick={addDraft}><span>＋</span> Neuer Beitrag</button></div>
        <div className="demo-notice"><span className="demo-notice-icon">i</span><span><strong>Vorschau mit Demodaten</strong> · Alle Kundennamen, Beiträge und Kennzahlen auf dieser Seite sind beispielhaft. Es ist noch kein Instagram-Konto verbunden.</span><button aria-label="Hinweis schließen" onClick={(event) => event.currentTarget.parentElement?.remove()}>×</button></div>

        <div className="stats-grid">
          <article className="stat-card"><div className="stat-top"><span>AKTIVE KUNDEN</span><span className="stat-icon blush">♙</span></div><div className="stat-value">03 <span className="stat-change">+1 <small>diesen Monat</small></span></div><div className="stat-foot"><span className="mini-avatars"><i>S</i><i>M</i><i>N</i></span><span>Alle im Überblick</span><span className="stat-arrow">↗</span></div></article>
          <article className="stat-card"><div className="stat-top"><span>GEPLANTE INHALTE</span><span className="stat-icon cream">▤</span></div><div className="stat-value">12 <span className="stat-change positive">↗ 8,2% <small>vs. Vormonat</small></span></div><div className="stat-foot"><div className="progress-track"><i /></div><span>4 von 12 freigegeben</span><span className="stat-arrow">↗</span></div></article>
          <article className="stat-card"><div className="stat-top"><span>OFFENE FREIGABEN</span><span className="stat-icon pale-gold">◷</span></div><div className="stat-value">04 <span className="urgent-label"><i /> 2 bald fällig</span></div><div className="stat-foot"><span>Nächste: Heute, 16:30</span><span className="stat-arrow">↗</span></div></article>
          <article className="stat-card"><div className="stat-top"><span>VERÖFFENTLICHT</span><span className="stat-icon pale-sage">↗</span></div><div className="stat-value">28 <span className="stat-change positive">↗ 12,5% <small>vs. Vormonat</small></span></div><div className="stat-foot"><span>Über alle Kunden</span><span className="stat-arrow">↗</span></div></article>
        </div>

        <div className="content-grid">
          <section className="panel editorial-panel"><div className="panel-heading"><div><div className="section-kicker">DEIN WORKFLOW</div><h2>Redaktionsübersicht <span className="count-chip">{allDrafts.length.toString().padStart(2, "0")}</span></h2></div><button className="text-link" onClick={() => setActiveNav("Redaktionsplan")}>Zum Redaktionsplan <span>↗</span></button></div>
            <div className="filter-row"><div className="filters">{["Alle Inhalte", "Freigabe ausstehend", "Entwurf"].map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}{item === "Freigabe ausstehend" && <span className="filter-count">2</span>}</button>)}</div><button className="filter-more" aria-label="Weitere Filter" onClick={() => setNotice("Weitere Filter kommen mit der vollständigen Contentverwaltung.")}>☷</button></div>
            <div className="draft-list">{visibleDrafts.map((draft) => <article className="draft-row" key={draft.id}><div className={`draft-thumb ${draft.tone}`}>{draft.previewUrl ? <img src={draft.previewUrl} alt="" /> : <span>{draft.initials}</span>}<i>{draft.type === "REEL" ? "▶" : draft.type === "CAROUSEL" ? "▧" : draft.type === "STORY" ? "◉" : "✳"}</i></div><div className="draft-info"><div className="draft-meta"><span className="content-type">{draft.type}</span><span className="meta-divider">·</span><span>{draft.client}</span></div><h3>{draft.title}</h3>{draft.captionSummary && <span className="draft-caption">{draft.captionSummary}</span>}<span className="draft-handle">{draft.handle}</span></div><div className="draft-right"><Badge kind={draft.status === "Freigabe ausstehend" ? "pending" : draft.status === "Freigegeben" ? "approved" : "draft"}>{draft.status}</Badge><span className="draft-date">◷ &nbsp;{draft.date}</span></div><button className="row-more" aria-label={`Aktionen für ${draft.title}`} onClick={() => setNotice("Beitragsaktionen werden im nächsten Ausbauschritt ergänzt.")}>···</button></article>)}{visibleDrafts.length === 0 && <div className="empty-state">Keine Inhalte in dieser Kategorie.</div>}</div>
            <button className="load-more" onClick={() => setNotice("Alle Demo-Inhalte werden bereits angezeigt.")}>Alle Inhalte ansehen <span>→</span></button>
          </section>

          <aside className="right-column"><section className="panel calendar-panel"><div className="panel-heading compact"><div><div className="section-kicker">DEINE WOCHE</div><h2>November <span className="year">2026</span></h2></div><div className="calendar-arrows"><button aria-label="Vorheriger Monat">‹</button><button aria-label="Nächster Monat">›</button></div></div><div className="week-grid">{["MO", "DI", "MI", "DO", "FR", "SA", "SO"].map((day, i) => <div className="day-col" key={day}><span>{day}</span><b className={i === 0 ? "today" : ""}>{[2, 3, 4, 5, 6, 7, 8][i]}</b><i className={i < 5 ? "has-event" : ""} /></div>)}</div><div className="calendar-divider" /><div className="upcoming-title">ALS NÄCHSTES <button onClick={() => setActiveNav("Redaktionsplan")}>Alles <span>→</span></button></div><div className="upcoming-item"><span className="time-block"><b>16:30</b><small>HEUTE</small></span><span className="upcoming-avatar rose">M</span><span className="upcoming-copy"><b>Ein Morgen im Atelier</b><small>Maison Élan · Reel</small></span><span className="upcoming-dot pending-dot" /></div><div className="upcoming-item"><span className="time-block"><b>10:00</b><small>MORGEN</small></span><span className="upcoming-avatar gold">S</span><span className="upcoming-copy"><b>5 Impulse für deine Marke</b><small>Samin Consulting · Carousel</small></span><span className="upcoming-dot draft-dot" /></div><button className="calendar-link" onClick={() => setActiveNav("Redaktionsplan")}>Kalender öffnen <span>↗</span></button></section>
            <section className="connection-card"><div className="connection-top"><span className="connection-icon">◎</span><Badge kind="offline">Nicht verbunden</Badge></div><h3>Instagram verbinden</h3><p>Verbinde später dein professionelles Instagram-Konto, um Kennzahlen zu importieren und Inhalte direkt zu veröffentlichen.</p><button onClick={() => setNotice("Die Meta-Verbindung wird erst nach Einrichtung der offiziellen Schnittstelle aktiviert.")}>Mehr zur Verbindung <span>→</span></button><small>Die Meta-Schnittstelle ist noch nicht eingerichtet.</small></section></aside>
        </div>
        <footer className="footer"><span>© 2025 SAMIN SOCIAL HUB</span><span>MIT SORGFALT FÜR DEINEN AUFTRITT <i>✦</i></span></footer>
      </div>
      {notice && <div className="toast" role="status"><span>✦</span>{notice}<button onClick={() => setNotice("")}>×</button></div>}
    </section>
  </main>;
}
