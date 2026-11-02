"use client";

import Link from "next/link";
import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { getDesigns, saveDesign as storeDesign, savePost, type LocalPost, type MediaFormat, type SavedDesign } from "@/app/lib/local-content";
import "./studio.css";
import "./post-workflow.css";

const dimensions: Record<MediaFormat, { width: number; height: number; label: string }> = {
  post: { width: 1080, height: 1080, label: "Post · Quadrat" },
  story: { width: 1080, height: 1920, label: "Story · Hochformat" },
  cover: { width: 1080, height: 1350, label: "Feed · Hochformat" },
};

const clientOptions = [
  { name: "Samin Consulting", handle: "@samin.consulting" },
  { name: "Maison Élan", handle: "@maisonelan.studio" },
  { name: "Studio Noura", handle: "@studionoura.de" },
];

export default function StudioWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageVersion, setImageVersion] = useState(0);
  const [format, setFormat] = useState<MediaFormat>("post");
  const [title, setTitle] = useState("Deine Geschichte\nbeginnt hier.");
  const [subtitle, setSubtitle] = useState("EIN IMPULS VON SAMIN CONSULTING");
  const [background, setBackground] = useState("#c6b38f");
  const [textColor, setTextColor] = useState("#ffffff");
  const [layout, setLayout] = useState<"editorial" | "minimal">("editorial");
  const [client, setClient] = useState(clientOptions[0].name);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [wishDate, setWishDate] = useState("");
  const [saved, setSaved] = useState<SavedDesign[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [createdPost, setCreatedPost] = useState(false);

  const refreshSaved = useCallback(async () => {
    try { setSaved(await getDesigns()); } catch { setSaved([]); }
  }, []);

  useEffect(() => { void refreshSaved(); }, [refreshSaved]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = dimensions[format];
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const cropWidth = width / scale;
      const cropHeight = height / scale;
      context.drawImage(image, (image.naturalWidth - cropWidth) / 2, (image.naturalHeight - cropHeight) / 2, cropWidth, cropHeight, 0, 0, width, height);
      const shade = context.createLinearGradient(0, height * 0.35, 0, height);
      shade.addColorStop(0, "rgba(25, 22, 18, 0.04)");
      shade.addColorStop(1, layout === "editorial" ? "rgba(25, 22, 18, 0.68)" : "rgba(25, 22, 18, 0.35)");
      context.fillStyle = shade;
      context.fillRect(0, 0, width, height);
    } else {
      const wash = context.createLinearGradient(0, 0, width, height);
      wash.addColorStop(0, background);
      wash.addColorStop(1, "#78694e");
      context.fillStyle = wash;
      context.fillRect(0, 0, width, height);
      context.strokeStyle = "rgba(255,255,255,.3)";
      context.lineWidth = 2;
      context.strokeRect(54, 54, width - 108, height - 108);
      context.strokeRect(68, 68, width - 136, height - 136);
    }
    const margin = width * 0.105;
    const titleLines = title.split("\n").slice(0, 4);
    const fontSize = width * (format === "story" ? 0.105 : 0.09);
    context.fillStyle = textColor;
    context.textBaseline = "alphabetic";
    if (layout === "editorial") {
      context.font = `600 ${Math.round(width * 0.018)}px Arial, sans-serif`;
      context.letterSpacing = `${Math.round(width * 0.004)}px`;
      context.fillText("SAMIN  /  SOCIAL NOTES", margin, height * 0.68);
      context.letterSpacing = "0px";
      context.font = `500 ${fontSize}px Georgia, serif`;
      titleLines.forEach((line, index) => context.fillText(line, margin, height * 0.77 + index * fontSize * 1.08, width - margin * 2));
      context.font = `500 ${Math.round(width * 0.018)}px Arial, sans-serif`;
      context.globalAlpha = 0.88;
      context.fillText(subtitle.toUpperCase(), margin, height * 0.93, width - margin * 2);
      context.globalAlpha = 1;
    } else {
      context.textAlign = "center";
      context.font = `500 ${Math.round(width * 0.016)}px Arial, sans-serif`;
      context.letterSpacing = `${Math.round(width * 0.005)}px`;
      context.fillText(subtitle.toUpperCase(), width / 2, height * 0.33, width * 0.78);
      context.letterSpacing = "0px";
      context.font = `500 ${fontSize}px Georgia, serif`;
      titleLines.forEach((line, index) => context.fillText(line, width / 2, height * 0.48 + index * fontSize * 1.12, width * 0.8));
      context.textAlign = "start";
    }
  }, [background, format, imageUrl, imageVersion, layout, subtitle, textColor, title]);

  useEffect(() => {
    if (!imageUrl) { imageRef.current = null; return; }
    const image = new Image();
    image.onload = () => { imageRef.current = image; setImageVersion((current) => current + 1); };
    image.src = imageUrl;
    return () => { image.onload = null; URL.revokeObjectURL(imageUrl); };
  }, [imageUrl]);

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage("Bitte wähle eine Bilddatei aus."); return; }
    setImageUrl(URL.createObjectURL(file));
    setMessage("Bild geladen. Der Zuschnitt passt sich automatisch an das gewählte Format an.");
    event.target.value = "";
  }

  function canvasBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) return reject(new Error("Die Vorschau ist noch nicht bereit."));
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Das Bild konnte nicht exportiert werden.")), "image/png");
    });
  }

  async function saveDesign() {
    setBusy(true);
    try {
      const blob = await canvasBlob();
      const design: SavedDesign = { id: crypto.randomUUID(), title: title.split("\n")[0] || "Neuer Entwurf", format, createdAt: Date.now(), image: blob };
      await storeDesign(design);
      await refreshSaved();
      setMessage("Entwurf wurde in deiner lokalen Medienablage gespeichert.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Speichern nicht möglich."); }
    finally { setBusy(false); }
  }

  async function createPostDraft() {
    setBusy(true);
    try {
      const image = await canvasBlob();
      const selectedClient = clientOptions.find((option) => option.name === client) ?? clientOptions[0];
      const designId = crypto.randomUUID();
      const titleLine = title.split("\n")[0] || "Neuer Beitragsentwurf";
      const createdAt = Date.now();
      const design: SavedDesign = { id: designId, title: titleLine, format, createdAt, image };
      const post: LocalPost = {
        id: crypto.randomUUID(), designId, title: titleLine, client: selectedClient.name,
        handle: selectedClient.handle, format, caption, hashtags, wishDate, status: "Entwurf", createdAt, image,
      };
      await savePost(post, design);
      await refreshSaved();
      setCreatedPost(true);
      setMessage("Beitragsentwurf mit Grafik wurde gespeichert und erscheint in der Redaktionsübersicht.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Der Beitragsentwurf konnte nicht gespeichert werden."); }
    finally { setBusy(false); }
  }

  async function exportDesign() {
    setBusy(true);
    try {
      const blob = await canvasBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `samin-${format}-${new Date().toISOString().slice(0, 10)}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("PNG wurde heruntergeladen.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Export nicht möglich."); }
    finally { setBusy(false); }
  }

  async function loadSaved(design: SavedDesign) {
    setFormat(design.format);
    setTitle(design.title);
    const url = URL.createObjectURL(design.image);
    setImageUrl(url);
    setLayout("editorial");
    setMessage("Gespeicherte Grafik als Bildvorlage geladen.");
  }

  return <main className="studio-page">
    <header className="studio-topbar"><Link href="/" className="studio-brand"><span className="studio-brand-mark">S</span><span><strong>SAMIN</strong><small>SOCIAL HUB</small></span></Link><div className="studio-breadcrumb"><Link href="/">Übersicht</Link><span>/</span><b>Medien-Studio</b></div><span className="studio-demo">DEMO-WORKSPACE</span></header>
    <div className="studio-shell"><div className="studio-heading"><div><span className="studio-kicker">KREATION & CONTENT</span><h1>Medien-Studio</h1><p>Gestalte deine Social-Media-Grafiken direkt in deinem Workflow.</p></div><Link href="/" className="back-link">← Zur Übersicht</Link></div>
      <div className="studio-disclaimer"><span>✦</span><p><b>Dein kreativer Arbeitsbereich.</b> Hier entstehen Instagram-Grafiken im Samin-Look. Gespeicherte Entwürfe bleiben zunächst nur in diesem Browser.</p></div>
      <div className="studio-layout"><section className="editor-panel"><div className="editor-toolbar"><div><span className="studio-kicker">VORSCHAU</span><strong>{dimensions[format].label}</strong></div><label className="upload-button">↑ Bild hinzufügen<input type="file" accept="image/*" onChange={handleUpload} /></label></div><div className="canvas-stage"><canvas ref={canvasRef} aria-label="Vorschau deiner Social-Media-Grafik" /></div><div className="canvas-foot"><span>Vorschau · Export in hoher Auflösung</span><span>{dimensions[format].width} × {dimensions[format].height} px</span></div></section>
        <aside className="editor-controls"><div className="control-section"><span className="studio-kicker">1 · FORMAT</span><div className="format-options">{(["post", "cover", "story"] as MediaFormat[]).map((item) => <button key={item} className={format === item ? "format-option chosen" : "format-option"} onClick={() => setFormat(item)}><span className={`format-preview ${item}`} /><span><b>{item === "post" ? "Quadrat" : item === "cover" ? "Feed hoch" : "Story"}</b><small>{dimensions[item].width} × {dimensions[item].height}</small></span>{format === item && <i>✓</i>}</button>)}</div></div>
          <div className="control-section"><span className="studio-kicker">2 · VORLAGE</span><div className="template-options"><button className={layout === "editorial" ? "template chosen" : "template"} onClick={() => setLayout("editorial")}><span className="template-swatch editorial-swatch"><i>Deine<br />Geschichte</i><small>SAMIN / NOTES</small></span><b>Editorial</b></button><button className={layout === "minimal" ? "template chosen" : "template"} onClick={() => setLayout("minimal")}><span className="template-swatch minimal-swatch"><small>DEIN IMPULS</small><i>Deine<br />Geschichte</i></span><b>Minimal</b></button></div></div>
          <div className="control-section"><span className="studio-kicker">3 · DEIN TEXT</span><label className="field-label">Überschrift <small>Zeilenumbruch mit Enter</small></label><textarea rows={2} maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} /><label className="field-label">Kleine Zeile</label><input className="text-field" maxLength={42} value={subtitle} onChange={(event) => setSubtitle(event.target.value)} /></div>
          <div className="control-section color-section"><span className="studio-kicker">4 · FARBEN</span><label className="color-control"><span>Hintergrund</span><input type="color" value={background} onChange={(event) => setBackground(event.target.value)} /></label><label className="color-control"><span>Schrift</span><input type="color" value={textColor} onChange={(event) => setTextColor(event.target.value)} /></label></div>
          <div className="control-section post-section"><span className="studio-kicker">5 · BEITRAG VORBEREITEN</span><label className="field-label">Kunde</label><select className="text-field" value={client} onChange={(event) => setClient(event.target.value)}>{clientOptions.map((option) => <option key={option.name}>{option.name}</option>)}</select><label className="field-label">Caption</label><textarea rows={3} maxLength={2200} placeholder="Schreibe den Text zu deinem Beitrag …" value={caption} onChange={(event) => setCaption(event.target.value)} /><label className="field-label">Hashtags <small>optional</small></label><input className="text-field" maxLength={500} placeholder="#samin #socialmedia" value={hashtags} onChange={(event) => setHashtags(event.target.value)} /><label className="field-label">Veröffentlichungswunsch <small>nur vorgemerkt, nicht geplant</small></label><input className="text-field" type="datetime-local" value={wishDate} onChange={(event) => setWishDate(event.target.value)} /></div>
          <div className="editor-actions editor-actions-stack"><button className="save-design" disabled={busy} onClick={createPostDraft}>{busy ? "Wird gespeichert …" : "Als Beitragsentwurf speichern"}</button><div className="editor-actions"><button className="export-design" disabled={busy} onClick={saveDesign}>In Medienablage sichern</button><button className="export-design" disabled={busy} onClick={exportDesign}>↓ PNG exportieren</button></div></div>{message && <div className="studio-message" role="status">{message} {createdPost && <Link href="/" className="studio-queue-link">Redaktionsübersicht öffnen →</Link>}</div>}
        </aside></div>
      <section className="saved-library"><div className="library-heading"><div><span className="studio-kicker">DEINE MEDIENABLAGE</span><h2>Gespeicherte Entwürfe <span>{saved.length}</span></h2></div><span className="local-label">Nur in diesem Browser</span></div>{saved.length ? <div className="saved-grid">{saved.slice(0, 6).map((design) => <SavedCard key={design.id} design={design} onOpen={() => void loadSaved(design)} />)}</div> : <div className="library-empty"><span>▧</span><p>Deine Entwürfe erscheinen hier, sobald du etwas speicherst.</p></div>}</section>
      <footer className="studio-footer">MEDIEN-STUDIO · PHASE 1 <span>Video-Bearbeitung und gemeinsame Teamablage folgen in weiteren Ausbauschritten.</span></footer>
    </div>
  </main>;
}

function SavedCard({ design, onOpen }: { design: SavedDesign; onOpen: () => void }) {
  const [preview, setPreview] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(design.image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [design.image]);
  return <button className="saved-card" onClick={onOpen}><span className="saved-thumb">{preview && <img src={preview} alt="" />}</span><span className="saved-copy"><b>{design.title}</b><small>{dimensions[design.format].label} · {new Date(design.createdAt).toLocaleDateString("de-DE")}</small></span><span className="saved-open">↗</span></button>;
}
