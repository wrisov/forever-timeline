import { useEffect, useMemo, useState } from "react";
import { Heart, Plus, Camera, CalendarDays, ImagePlus, X, UploadCloud, Clock3 } from "lucide-react";

const START_DATE = "2026-10-15";
const API_URL = import.meta.env.VITE_UPLOAD_API_URL || "";
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

function formatDate(value) {
  return new Date(value + "T12:00:00").toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });
}
function elapsedParts(start, now) {
  let seconds = Math.max(0, Math.floor((now - start) / 1000));
  return { days: Math.floor(seconds / 86400), hours: Math.floor(seconds % 86400 / 3600), minutes: Math.floor(seconds % 3600 / 60), seconds: seconds % 60 };
}

export default function App() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date:new Date().toISOString().slice(0,10), title:"", tagline:"", description:"" });
  const [photo, setPhoto] = useState(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data/memories.json", { cache:"no-store" })
      .then(r => { if (!r.ok) throw new Error("Could not load memories"); return r.json(); })
      .then(setMemories)
      .catch(() => setNotice("Couldn't load the timeline. Please refresh in a moment."))
      .finally(() => setLoading(false));
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!showForm || !TURNSTILE_SITE_KEY) return;
    window.onTurnstileSuccess = token => setCaptchaToken(token);
    if (!document.querySelector('script[data-turnstile="true"]')) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true; script.defer = true; script.dataset.turnstile = "true";
      document.body.appendChild(script);
    } else if (window.turnstile) {
      window.turnstile.render?.(".cf-turnstile", { sitekey:TURNSTILE_SITE_KEY, callback:window.onTurnstileSuccess });
    }
  }, [showForm]);

  const ordered = useMemo(() => [...memories].sort((a,b) => b.date.localeCompare(a.date)), [memories]);
  const elapsed = elapsedParts(new Date(START_DATE + "T00:00:00"), now);

  async function submit(event) {
    event.preventDefault();
    if (!API_URL) return setNotice("Public uploads are not configured yet. The site owner must configure the upload Worker.");
    if (!photo) return setNotice("Please choose a photo first.");
    if (photo.size > 5 * 1024 * 1024) return setNotice("Please choose an image smaller than 5 MB.");
    if (TURNSTILE_SITE_KEY && !captchaToken) return setNotice("Please complete the anti-spam check.");
    setBusy(true); setNotice("");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key,value]) => body.append(key,value));
      body.append("image",photo); body.append("turnstileToken",captchaToken);
      const response = await fetch(API_URL.replace(/\/$/,"") + "/submit", { method:"POST", body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Submission failed.");
      setNotice("Thank you! Your memory has been submitted for review. ♡");
      setShowForm(false); setPhoto(null); setCaptchaToken("");
      setForm({ date:new Date().toISOString().slice(0,10), title:"", tagline:"", description:"" });
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }

  return <main>
    <header className="hero">
      <div className="eyebrow">A LITTLE PLACE FOR US <Heart size={13} fill="currentColor"/></div>
      <h1>Our Forever <span>♡</span></h1>
      <p className="intro">Every love story has a thousand little moments. This is where we keep ours — the big days, the tiny things, and all the beautiful days still waiting for us.</p>
      <div className="heart-mark">♥</div>
      <div className="since">Together since <strong>15 October 2026</strong></div>
      <div className="counter">{Object.entries(elapsed).map(([label,value]) => <div key={label}><b>{String(value).padStart(2,"0")}</b><span>{label}</span></div>)}</div>
      <p className="counter-note">A tiny counter for a love that has no finish line.</p>
      <button className="primary" onClick={() => setShowForm(true)}><Plus size={16}/> Submit a memory</button>
    </header>

    <section className="section">
      <div className="section-kicker">CHAPTER BY CHAPTER</div>
      <div className="section-heading"><div><h2>Our little timeline</h2><p>From the first page to every page that comes next.</p></div><button className="outline" onClick={() => setShowForm(true)}><Plus size={16}/> Add a memory</button></div>
      {loading ? <p className="muted">Gathering your memories…</p> : <div className="timeline">{ordered.map(memory => <article className="memory" key={memory.id}>
        <div className="timeline-dot"><Heart size={12} fill="currentColor"/></div>
        <div className="memory-date"><CalendarDays size={13}/>{formatDate(memory.date)}</div>
        <h3>{memory.title}</h3>
        {memory.tagline && <p className="tagline">{memory.tagline}</p>}
        {memory.description && <p className="description">{memory.description}</p>}
        {memory.images?.length > 0 && <div className="photo-grid">{memory.images.map(src => <img key={src} src={src.startsWith("http") ? src : import.meta.env.BASE_URL + src.replace(/^\//,"")} alt={memory.title} loading="lazy"/>)}</div>}
      </article>)}</div>}
    </section>

    <section className="section gallery">
      <div className="section-kicker">SNAPSHOTS OF US</div><h2>Little moments, kept forever</h2><p>Every photo holds a little piece of our story.</p>
      <div className="gallery-grid">{ordered.flatMap(m => (m.images || []).map(src => <img key={m.id + src} src={src.startsWith("http") ? src : import.meta.env.BASE_URL + src.replace(/^\//,"")} alt={m.title} loading="lazy"/>))}</div>
      {!ordered.some(m => m.images?.length) && <div className="gallery-empty"><Camera size={27}/><span>Your favourite smiles belong here. ♡</span></div>}
    </section>

    <section className="section note"><div className="section-kicker">JUST BECAUSE</div><h2>A note for you</h2><p className="quote">“If I could choose a favourite place, it would be right beside you.”</p></section>
    <footer><div className="heart-mark">♥</div><p className="section-kicker">NO FINAL CHAPTER</p><h2>To be continued…</h2><p>More sunsets. More silly jokes. More ordinary days made special.<br/>Here's to choosing each other, again and again.</p><strong>15 October · Every year · Forever ♾</strong><small>Made with love, for my favourite person. ♡</small></footer>

    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={15}/></button></div>}
    {showForm && <div className="modal-backdrop" onMouseDown={e => { if(e.target === e.currentTarget) setShowForm(false); }}>
      <form className="modal" onSubmit={submit}>
        <button type="button" className="close" onClick={() => setShowForm(false)} aria-label="Close"><X/></button>
        <div className="section-kicker">SAVE A LITTLE MOMENT</div><h2>Submit a memory</h2>
        <p className="review-note">Anyone can submit a memory. It will be reviewed before appearing publicly on the timeline.</p>
        <label>Date<input type="date" required value={form.date} onChange={e => setForm({...form,date:e.target.value})}/></label>
        <label>A title for this memory<input required maxLength="100" placeholder="The day we couldn't stop laughing…" value={form.title} onChange={e => setForm({...form,title:e.target.value})}/></label>
        <label>A little tagline<input maxLength="140" placeholder="My favourite kind of day is one with you" value={form.tagline} onChange={e => setForm({...form,tagline:e.target.value})}/></label>
        <label>What do you want to remember?<textarea rows="3" maxLength="1200" value={form.description} onChange={e => setForm({...form,description:e.target.value})}/></label>
        <label className="file-label"><ImagePlus size={19}/>{photo ? photo.name : "Choose a photo (max 5 MB)"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => setPhoto(e.target.files?.[0] || null)}/></label>
        {TURNSTILE_SITE_KEY && <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-callback="onTurnstileSuccess"/>}
        <button className="primary submit" disabled={busy}>{busy ? "Submitting…" : <><UploadCloud size={17}/> Submit for review</>}</button>
        <p className="privacy-note"><Clock3 size={13}/> Submissions are saved in the GitHub repository and reviewed before publishing.</p>
      </form>
    </div>}
  </main>;
}