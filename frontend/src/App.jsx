import { Bell, Check, ChevronDown, ChevronRight, Info, Menu, Play, Plus, Search, Volume2, X } from "lucide-react";
import React from "react";
import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "/api";
const PROFILE = "learner";

function Logo() {
  return <div className="logo"><span className="logo-mark">L</span><span>LUMA</span></div>;
}

function Art({ item, tall = false }) {
  return (
    <div className={`art ${tall ? "tall" : ""}`} style={{ "--c1": item.color[0], "--c2": item.color[1] }}>
      <div className="art-orb" />
      <div className="art-lines" />
      <span className="art-genre">{item.genre}</span>
      <strong>{item.title}</strong>
    </div>
  );
}

function Card({ item, state, onToggle, onOpen }) {
  return (
    <article className="card">
      <button className="card-art" onClick={() => onOpen(item)} aria-label={`View ${item.title}`}><Art item={item} /></button>
      <div className="card-hover">
        <div className="card-actions">
          <button className="round primary" onClick={() => onOpen(item)} aria-label="Play"><Play size={17} fill="currentColor" /></button>
          <button className="round" onClick={() => onToggle(item.id)} aria-label="Toggle watchlist">{state?.inWatchlist ? <Check size={18} /> : <Plus size={18} />}</button>
          <button className="round push" onClick={() => onOpen(item)} aria-label="More information"><ChevronDown size={18} /></button>
        </div>
        <div><b className="match">{item.match}% Match</b> <span className="rating">{item.maturity}</span> <span>{item.runtime}</span></div>
        <small>{item.genre} · Immersive · Atmospheric</small>
      </div>
      {state?.progress > 0 && <div className="progress"><span style={{ width: `${state.progress}%` }} /></div>}
    </article>
  );
}

function Row({ title, items, library, onToggle, onOpen }) {
  if (!items.length) return null;
  return (
    <section className="row">
      <div className="row-heading"><h2>{title}</h2><button>Explore all <ChevronRight size={15} /></button></div>
      <div className="rail">{items.map((item) => <Card key={item.id} item={item} state={library[item.id]} onToggle={onToggle} onOpen={onOpen} />)}</div>
    </section>
  );
}

function Detail({ item, state, onClose, onToggle, onPlay }) {
  if (!item) return null;
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}><X /></button>
        <div className="modal-art" style={{ "--c1": item.color[0], "--c2": item.color[1] }} />
        <div className="modal-content">
          <p className="eyebrow">A LUMA ORIGINAL</p>
          <h2>{item.title}</h2>
          <div className="modal-actions">
            <button className="button light" onClick={onPlay}><Play fill="currentColor" /> Play</button>
            <button className="round" onClick={() => onToggle(item.id)}>{state?.inWatchlist ? <Check /> : <Plus />}</button>
          </div>
          <div className="meta"><b className="match">{item.match}% Match</b><span>{item.year}</span><span className="rating">{item.maturity}</span><span>{item.runtime}</span></div>
          <p>{item.description}</p>
          <small><span>Genre:</span> {item.genre}<br /><span>This title is:</span> Visionary, Emotional, Cinematic</small>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [titles, setTitles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [library, setLibrary] = useState({});
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/titles`).then((r) => r.json()),
      fetch(`${API}/profiles/${PROFILE}/library`).then((r) => r.json())
    ]).then(([catalog, saved]) => {
      setTitles(catalog.titles); setCategories(catalog.categories);
      setLibrary(Object.fromEntries(saved.items.map((item) => [item.titleId, item])));
    }).catch(() => setNotice("The API is waking up. Try refreshing in a moment."));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? titles.filter((item) => `${item.title} ${item.genre} ${item.description}`.toLowerCase().includes(q)) : titles;
  }, [query, titles]);

  async function toggleWatchlist(id) {
    const next = !library[id]?.inWatchlist;
    setLibrary((old) => ({ ...old, [id]: { ...old[id], titleId: id, inWatchlist: next, progress: old[id]?.progress || 0 } }));
    await fetch(`${API}/profiles/${PROFILE}/library/${id}`, {
      method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ inWatchlist: next })
    }).catch(() => setNotice("Could not save that change."));
  }

  async function play(item) {
    const progress = Math.max(library[item.id]?.progress || 0, 12);
    setSelected(null); setNotice(`Now playing ${item.title} · Demo playback started`);
    setLibrary((old) => ({ ...old, [item.id]: { ...old[item.id], titleId: item.id, progress } }));
    await fetch(`${API}/profiles/${PROFILE}/library/${item.id}`, {
      method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ progress })
    });
  }

  const featured = titles.find((item) => item.featured);
  const myList = visible.filter((item) => library[item.id]?.inWatchlist);
  const continueWatching = visible.filter((item) => library[item.id]?.progress > 0);

  return (
    <div>
      <header>
        <Logo />
        <nav className={menuOpen ? "open" : ""}>
          <a className="active" href="#home">Home</a><a href="#series">Series</a><a href="#films">Films</a><a href="#new">New & Popular</a><a href="#my-list">My List</a>
        </nav>
        <div className="header-actions">
          <div className={`search ${searchOpen ? "open" : ""}`}>
            <button onClick={() => setSearchOpen(!searchOpen)}><Search size={20} /></button>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Titles, genres" autoFocus={searchOpen} />
          </div>
          <button className="icon-button"><Bell size={20} /></button>
          <button className="avatar">V</button><ChevronDown size={15} className="chevron" />
          <button className="menu" onClick={() => setMenuOpen(!menuOpen)}><Menu /></button>
        </div>
      </header>

      {!query && featured && <section className="hero" id="home">
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow">A LUMA ORIGINAL</p>
          <h1>ORBIT<br /><em>FALL</em></h1>
          <p className="hero-meta"><b>#1 in Films Today</b></p>
          <p className="synopsis">{featured.description} What waits beyond the horizon will change humanity forever.</p>
          <div className="hero-actions">
            <button className="button light" onClick={() => play(featured)}><Play fill="currentColor" /> Play</button>
            <button className="button glass" onClick={() => setSelected(featured)}><Info /> More Info</button>
          </div>
        </div>
        <button className="sound" onClick={() => setMuted(!muted)}><Volume2 size={18} /> <span>{muted ? "Sound off" : "Sound on"}</span></button>
        <div className="maturity">13+</div>
      </section>}

      <main className={query ? "search-results" : ""}>
        {query && <div className="results-title"><p>Search results for</p><h1>“{query}”</h1><span>{visible.length} titles found</span></div>}
        <Row title="Continue Watching" items={continueWatching} library={library} onToggle={toggleWatchlist} onOpen={setSelected} />
        <Row title="My List" items={myList} library={library} onToggle={toggleWatchlist} onOpen={setSelected} />
        {categories.map((category) => <Row key={category} title={category} items={visible.filter((item) => item.category === category)} library={library} onToggle={toggleWatchlist} onOpen={setSelected} />)}
        {query && !visible.length && <div className="empty"><Search /><h2>No stories found</h2><p>Try another title or genre.</p></div>}
      </main>

      <footer><Logo /><p>Built as an original AWS learning project.</p><div><a href="#">Audio & Subtitles</a><a href="#">Help Center</a><a href="#">Privacy</a><a href="#">Terms</a></div><small>© 2026 Luma Entertainment</small></footer>
      {notice && <button className="toast" onClick={() => setNotice("")}>{notice}<X size={15} /></button>}
      <Detail item={selected} state={selected && library[selected.id]} onClose={() => setSelected(null)} onToggle={toggleWatchlist} onPlay={() => play(selected)} />
    </div>
  );
}
