import { useEffect, useMemo, useState } from "react";
import { Heart, CalendarDays, Camera } from "lucide-react";

const START_DATE = "2026-10-15";

function formatDate(value) {
  return new Date(value + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
}

function elapsedParts(start, now) {
  let seconds = Math.max(0, Math.floor((now - start) / 1000));
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds % 86400 / 3600),
    minutes: Math.floor(seconds % 3600 / 60),
    seconds: seconds % 60
  };
}

export default function App() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data/memories.json", { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("Could not load memories");
        return response.json();
      })
      .then(data => setMemories(Array.isArray(data) ? data : []))
      .catch(() => setNotice("Couldn't load the timeline. Please refresh in a moment."))
      .finally(() => setLoading(false));

    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ordered = useMemo(
    () => [...memories].sort((a, b) => b.date.localeCompare(a.date)),
    [memories]
  );
  const elapsed = elapsedParts(new Date(START_DATE + "T00:00:00"), now);

  function imageUrl(src) {
    return src.startsWith("http")
      ? src
      : import.meta.env.BASE_URL + src.replace(/^\//, "");
  }

  return <main>
    <header className="hero">
      <div className="eyebrow">A LITTLE PLACE FOR US <Heart size={13} fill="currentColor" /></div>
      <h1>Our Forever <span>♡</span></h1>
      <p className="intro">Every love story has a thousand little moments. This is where we keep ours — the big days, the tiny things, and all the beautiful days still waiting for us.</p>
      <div className="heart-mark">♥</div>
      <div className="since">Together since <strong>15 October 2026</strong></div>
      <div className="counter">
        {Object.entries(elapsed).map(([label, value]) =>
          <div key={label}><b>{String(value).padStart(2, "0")}</b><span>{label}</span></div>
        )}
      </div>
      <p className="counter-note">A tiny counter for a love that has no finish line.</p>
    </header>

    <section className="section">
      <div className="section-kicker">CHAPTER BY CHAPTER</div>
      <div className="section-heading">
        <div><h2>Our little timeline</h2><p>From the first page to every page that comes next.</p></div>
      </div>
      {loading ? <p className="muted">Gathering your memories…</p> : <div className="timeline">
        {ordered.map(memory => <article className="memory" key={memory.id}>
          <div className="timeline-dot"><Heart size={12} fill="currentColor" /></div>
          <div className="memory-date"><CalendarDays size={13} />{formatDate(memory.date)}</div>
          <h3>{memory.title}</h3>
          {memory.tagline && <p className="tagline">{memory.tagline}</p>}
          {memory.description && <p className="description">{memory.description}</p>}
          {memory.images?.length > 0 && <div className="photo-grid">
            {memory.images.map(src => <img key={src} src={imageUrl(src)} alt={memory.title} loading="lazy" />)}
          </div>}
        </article>)}
      </div>}
    </section>

    <section className="section gallery">
      <div className="section-kicker">SNAPSHOTS OF US</div>
      <h2>Little moments, kept forever</h2>
      <p>Every photo holds a little piece of our story.</p>
      <div className="gallery-grid">
        {ordered.flatMap(memory => (memory.images || []).map(src =>
          <img key={memory.id + src} src={imageUrl(src)} alt={memory.title} loading="lazy" />
        ))}
      </div>
      {!ordered.some(memory => memory.images?.length) &&
        <div className="gallery-empty"><Camera size={27} /><span>Your favourite smiles belong here. ♡</span></div>}
    </section>

    <section className="section note">
      <div className="section-kicker">JUST BECAUSE</div>
      <h2>A note for you</h2>
      <p className="quote">“If I could choose a favourite place, it would be right beside you.”</p>
    </section>

    <footer>
      <div className="heart-mark">♥</div>
      <p className="section-kicker">NO FINAL CHAPTER</p>
      <h2>To be continued…</h2>
      <p>More sunsets. More silly jokes. More ordinary days made special.<br />Here's to choosing each other, again and again.</p>
      <strong>15 October · Every year · Forever ♾</strong>
      <small>Made with love, for my favourite person. ♡</small>
    </footer>

    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
  </main>;
}
