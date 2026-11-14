"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

type Row = {
  id: number;
  agent_name: string;
  status: string;
  message: string | null;
  created_at: string;
};

const STYLE: Record<string, { couleur: string; emoji: string; label: string }> = {
  en_cours: { couleur: "#f97316", emoji: "🔥", label: "En cours" },
  termine: { couleur: "#22c55e", emoji: "✅", label: "Terminé" },
  erreur: { couleur: "#ef4444", emoji: "💥", label: "Erreur" },
  en_attente: { couleur: "#a78bfa", emoji: "⏳", label: "En attente" },
};

/* ---------- Réglages des sprites ----------
   Les deux planches font 256x256 : 4 colonnes x 4 lignes d'images de 64 px.
   Change ces valeurs si une pose ou un objet ne te plaît pas. */
const FRAME = 64;
// Chaque ligne de diable.png est une direction (4 images de marche par ligne)
const DIR = { face: 0, dos: 1, droite: 2, gauche: 3 };
// Case de bureau.png utilisée comme poste de travail : [colonne, ligne]
const BUREAU: [number, number] = [3, 0];
// Case de bureau.png utilisée pour la machine à boissons
const MACHINE: [number, number] = [2, 3];

function Sprite({
  src,
  col,
  row,
  taille,
  x,
  y,
  vitesse,
}: {
  src: string;
  col: number;
  row: number;
  taille: number;
  x: number;
  y: number;
  vitesse?: number;
}) {
  return (
    <svg x={x} y={y} width={taille} height={taille} viewBox={`0 0 ${FRAME} ${FRAME}`}>
      <image
        href={src}
        x={-col * FRAME}
        y={-row * FRAME}
        width={FRAME * 4}
        height={FRAME * 4}
        style={{
          imageRendering: "pixelated",
          animation: vitesse ? `defile ${vitesse}s steps(4) infinite` : undefined,
        }}
      />
    </svg>
  );
}

/* ---------- Surnoms et messages ---------- */

// Surnom de chaque agent (ajoute les tiens ici)
const SURNOMS: Record<string, string> = {
  agent_videos: "🎬 Belzé-Bobine",
};
// Surnoms piochés automatiquement pour les agents qui n'en ont pas encore
const NOMS_INFERNAUX = ["😈 Lucifichier", "🔥 Asmo-Script", "💀 Méphisto-Log", "🦇 Mammon-Data", "🌋 Astaro-Tâche"];

function surnom(nom: string) {
  if (SURNOMS[nom]) return SURNOMS[nom];
  let h = 0;
  for (const ch of nom) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return NOMS_INFERNAUX[h % NOMS_INFERNAUX.length];
}

// Remplace les chemins de fichiers par leur simple nom
function nettoyer(message: string) {
  return message.replace(/(?:[A-Za-z]:)?[\\/][^\s"']*[\\/][^\s"']+/g, (chemin) => {
    const fichier = chemin.split(/[\\/]/).pop();
    return fichier ? `📄 ${fichier}` : chemin;
  });
}

/* ---------- Le petit diable ---------- */

// Petit circuit devant le bureau quand il n'a rien à faire
const CHEMIN: [number, number][] = [[-64, 18], [0, 46], [64, 18], [0, 46]];
const DUREE_MARCHE = 1600;
const DUREE_PAUSE = 1400;
const VITESSE_PAS = 70; // pixels par seconde pour aller à la machine

type Etat = { x: number; y: number; row: number; marche: boolean };

function useBalade(actif: boolean) {
  const [etat, setEtat] = useState<Etat>({ x: 0, y: 46, row: DIR.face, marche: false });
  useEffect(() => {
    if (!actif) return;
    const debut = performance.now();
    const cycle = DUREE_MARCHE + DUREE_PAUSE;
    let raf = 0;
    const tick = (t: number) => {
      const e = (t - debut) % (cycle * CHEMIN.length);
      const k = Math.floor(e / cycle);
      const loc = e - k * cycle;
      const [x0, y0] = CHEMIN[k];
      const [x1, y1] = CHEMIN[(k + 1) % CHEMIN.length];
      if (loc < DUREE_PAUSE) {
        setEtat({ x: x0, y: y0, row: DIR.face, marche: false });
      } else {
        const q = (loc - DUREE_PAUSE) / DUREE_MARCHE;
        setEtat({
          x: x0 + (x1 - x0) * q,
          y: y0 + (y1 - y0) * q,
          row: x1 > x0 ? DIR.droite : DIR.gauche,
          marche: true,
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [actif]);
  return etat;
}

// Trajet du bureau jusqu'à la machine à boissons
function useTrajet(actif: boolean, cible: [number, number]) {
  const [etat, setEtat] = useState<Etat>({ x: cible[0], y: cible[1], row: DIR.face, marche: false });
  const [premier] = useState(() => ({ rendu: true }));
  const [cx, cy] = cible;

  useEffect(() => {
    const dejaFini = premier.rendu;
    premier.rendu = false;
    if (!actif) return;
    // Déjà terminé au chargement de la page : il est directement à la machine
    if (dejaFini) {
      setEtat({ x: cx, y: cy, row: DIR.face, marche: false });
      return;
    }
    const x0 = 0, y0 = 14;
    const duree = (Math.hypot(cx - x0, cy - y0) / VITESSE_PAS) * 1000;
    const debut = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const q = Math.min(1, (t - debut) / duree);
      if (q >= 1) {
        setEtat({ x: cx, y: cy, row: DIR.face, marche: false });
        return;
      }
      setEtat({
        x: x0 + (cx - x0) * q,
        y: y0 + (cy - y0) * q,
        row: Math.abs(cx - x0) >= Math.abs(cy - y0)
          ? (cx > x0 ? DIR.droite : DIR.gauche)
          : (cy > y0 ? DIR.face : DIR.dos),
        marche: true,
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [actif, cx, cy, premier]);
  return etat;
}

function Diable({ status, machine, nom }: { status: string; machine: [number, number]; nom: string }) {
  const balade = useBalade(status === "en_attente");
  const trajet = useTrajet(status === "termine", machine);

  // Position (ses pieds), direction, animation
  let x = 0, y = 14, row = DIR.dos, vitesse: number | undefined, effet = "tape";
  let bulle: string | null = null;
  if (status === "en_attente") {
    ({ x, y, row } = balade);
    vitesse = balade.marche ? 0.5 : undefined;
    effet = "";
  } else if (status === "termine") {
    ({ x, y, row } = trajet);
    vitesse = trajet.marche ? 0.5 : undefined;
    effet = trajet.marche ? "" : "respire";
    bulle = trajet.marche ? "🎉" : "🥤";
  } else if (status === "erreur") {
    row = DIR.face; effet = "tremble"; y = 20;
    bulle = "💢";
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <g className={effet}>
        <Sprite src="/sprites/diable.png" col={0} row={row} taille={80} x={-40} y={-78} vitesse={vitesse} />
      </g>
      <text
        x={0}
        y={-82}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill="white"
        stroke="#1c0505"
        strokeWidth={4}
        paintOrder="stroke"
      >
        {nom}
      </text>
      {bulle && (
        <text className={status === "erreur" ? "clignote" : undefined} x={14} y={-60} fontSize={18}>
          {bulle}
        </text>
      )}
    </g>
  );
}

/* ---------- L'open space infernal ---------- */

const TW = 200; // largeur d'une dalle
const TH = 100; // hauteur d'une dalle
const COLS = 4;
const MARGE = 40;
const HAUT = 200;
const MUR = 110;

function OpenSpace({ agents, flash }: { agents: Row[]; flash: string | null }) {
  // Un bureau sur deux (en damier), la dernière case garde la machine
  const calculer = (places: number) =>
    Array.from({ length: places }, (_, i) => ({ i, c: i % COLS, r: Math.floor(i / COLS) }));
  let places = 12;
  const postesDe = (p: number) =>
    calculer(p).filter(({ i, c, r }) => (c + r) % 2 === 0 && i !== p - 1);
  while (postesDe(places).length < agents.length) places += COLS;
  const cases = calculer(places).sort((a, b) => a.c + a.r - (b.c + b.r));
  const postes = postesDe(places);
  const indexMachine = places - 1;

  const rangs = places / COLS;
  const ox = (rangs * TW) / 2 + MARGE;
  const centre = (c: number, r: number) => ({
    x: ox + ((c - r) * TW) / 2,
    y: HAUT + ((c + r) * TH) / 2,
  });
  const largeur = ((COLS + rangs) * TW) / 2 + 2 * MARGE;
  const hauteur = HAUT + ((COLS + rangs) * TH) / 2 + MARGE;

  const haut = { x: ox, y: HAUT - TH / 2 };
  const gauche = { x: ox - (rangs * TW) / 2, y: HAUT - TH / 2 + (rangs * TH) / 2 };
  const droite = { x: ox + (COLS * TW) / 2, y: HAUT - TH / 2 + (COLS * TH) / 2 };
  const m = centre(indexMachine % COLS, Math.floor(indexMachine / COLS));
  const estPoste = new Set(postes.map((p) => p.i));

  // Agents placés sur les postes, du fond vers l'avant
  const places_agents = agents
    .map((a, j) => ({ a, j, p: postes[j] }))
    .sort((u, v) => u.p.c + u.p.r - (v.p.c + v.p.r));

  return (
    <svg
      viewBox={`0 0 ${largeur} ${hauteur}`}
      style={{ width: "100%", maxWidth: largeur, display: "block", margin: "0 auto" }}
    >
      {/* Murs */}
      <polygon
        points={`${gauche.x},${gauche.y} ${haut.x},${haut.y} ${haut.x},${haut.y - MUR} ${gauche.x},${gauche.y - MUR}`}
        fill="#3b0a0a"
      />
      <polygon
        points={`${haut.x},${haut.y} ${droite.x},${droite.y} ${droite.x},${droite.y - MUR} ${haut.x},${haut.y - MUR}`}
        fill="#5c1010"
      />
      <polyline
        className="lave"
        points={`${gauche.x},${gauche.y} ${haut.x},${haut.y} ${droite.x},${droite.y}`}
        fill="none"
        stroke="#f97316"
        strokeWidth={3}
      />

      {/* Sol d'obsidienne fissurée de lave */}
      {cases.map(({ i, c, r }) => {
        const { x, y } = centre(c, r);
        return (
          <polygon
            key={`sol-${i}`}
            className="lave"
            points={`${x},${y - TH / 2} ${x + TW / 2},${y} ${x},${y + TH / 2} ${x - TW / 2},${y}`}
            fill={(c + r) % 2 ? "#1c1917" : "#292524"}
            stroke="#ea580c"
            strokeWidth={1.5}
          />
        );
      })}

      {/* Mobilier : bureaux et machine à boissons */}
      {cases.map(({ i, c, r }) => {
        const { x, y } = centre(c, r);
        if (i === indexMachine)
          return (
            <g key={`meuble-${i}`} transform={`translate(${x},${y})`}>
              <Sprite src="/sprites/bureau.png" col={MACHINE[0]} row={MACHINE[1]} taille={80} x={-40} y={-64} />
            </g>
          );
        if (!estPoste.has(i)) return null;
        return (
          <g key={`meuble-${i}`} transform={`translate(${x},${y})`}>
            <Sprite src="/sprites/bureau.png" col={BUREAU[0]} row={BUREAU[1]} taille={104} x={-52} y={-78} />
          </g>
        );
      })}

      {/* Les diables, par-dessus le mobilier */}
      {places_agents.map(({ a, j, p }) => {
        const { x, y } = centre(p.c, p.r);
        const decalage = ((j % 3) - 1) * 28; // pour ne pas s'empiler devant la machine
        return (
          <g key={`diable-${a.agent_name}`} transform={`translate(${x},${y})`}>
            <g className={flash === a.agent_name ? "pop" : undefined}>
              <Diable status={a.status} nom={surnom(a.agent_name)} machine={[m.x - x + decalage, m.y - y + 34]} />
            </g>
          </g>
        );
      })}

    </svg>
  );
}

/* ---------- Planche de choix (ajoute ?planche à l'adresse) ---------- */

function Planche() {
  return (
    <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginBottom: 32 }}>
      {["bureau", "diable"].map((nom) => (
        <div key={nom}>
          <h2 style={{ margin: "0 0 8px" }}>{nom}.png</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 96px)", gap: 6 }}>
            {Array.from({ length: 16 }, (_, k) => {
              const col = k % 4, row = Math.floor(k / 4);
              return (
                <div key={k} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, textAlign: "center", fontSize: 12 }}>
                  <svg width={96} height={96} viewBox={`0 0 ${FRAME} ${FRAME}`}>
                    <image href={`/sprites/${nom}.png`} x={-col * FRAME} y={-row * FRAME}
                      width={FRAME * 4} height={FRAME * 4} style={{ imageRendering: "pixelated" }} />
                  </svg>
                  <div>[{col}, {row}]</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Page ---------- */

export default function Home() {
  const [agents, setAgents] = useState<Record<string, Row>>({});
  const [flash, setFlash] = useState<string | null>(null);
  const [planche, setPlanche] = useState(false);

  useEffect(() => {
    setPlanche(new URLSearchParams(window.location.search).has("planche"));
    supabase
      .from("agent_status")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        const m: Record<string, Row> = {};
        for (const r of data ?? []) if (!m[r.agent_name]) m[r.agent_name] = r;
        setAgents(m);
      });

    const canal = supabase
      .channel("statuts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agent_status" },
        (p) => {
          const r = p.new as Row;
          setAgents((a) => ({ ...a, [r.agent_name]: r }));
          setFlash(r.agent_name);
          setTimeout(() => setFlash(null), 1200);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const liste = Object.values(agents).sort((a, b) =>
    a.agent_name.localeCompare(b.agent_name)
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 16px",
        background: "linear-gradient(160deg, #0c0a09 0%, #3b0a0a 55%, #9a3412 100%)",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes defile { to { transform: translateX(-${FRAME * 4}px); } }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249,115,22,0.7); }
          50% { box-shadow: 0 0 0 14px rgba(249,115,22,0); }
        }
        @keyframes pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .carte { transition: transform 0.2s; }
        .carte:hover { transform: translateY(-4px); }

        .pop { animation: pop 0.6s; transform-box: fill-box; transform-origin: center; }
        .tape { animation: tape 0.35s steps(2) infinite; }
        @keyframes tape { 50% { transform: translateY(-2px); } }
        .saute { animation: saute 0.8s ease-in-out infinite; }
        @keyframes saute { 50% { transform: translateY(-12px); } }
        .tremble { animation: tremble 0.1s steps(2) infinite; }
        @keyframes tremble { 50% { transform: translateX(3px); } }
        .respire { animation: respire 3s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
        @keyframes respire { 50% { transform: scaleY(0.96); } }
        .zzz { animation: zzz 2s ease-out infinite; }
        @keyframes zzz {
          from { opacity: 0; transform: translate(0, 0); }
          30% { opacity: 1; }
          to { opacity: 0; transform: translate(10px, -20px); }
        }
        .clignote { animation: clignote 0.6s steps(2) infinite; }
        @keyframes clignote { 50% { opacity: 0.3; } }
        .lave { animation: lave 2.5s ease-in-out infinite; }
        @keyframes lave { 50% { stroke-opacity: 0.35; } }
      `}</style>

      <h1 style={{ fontSize: 40, fontWeight: 800, margin: "0 0 8px" }}>😈 Le bureau des enfers</h1>
      <p style={{ opacity: 0.8, margin: "0 0 24px" }}>
        {liste.length} agent{liste.length > 1 ? "s" : ""} · mise à jour en direct
      </p>

      {planche && <Planche />}

      <div
        style={{
          background: "rgba(0,0,0,0.35)",
          borderRadius: 24,
          padding: 16,
          marginBottom: 32,
        }}
      >
        <OpenSpace agents={liste} flash={flash} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        {liste.map((a) => {
          const s = STYLE[a.status] ?? STYLE.en_attente;
          const anims = [
            a.status === "en_cours" ? "pulse 1.6s infinite" : "",
            flash === a.agent_name ? "pop 0.6s" : "",
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <div
              key={a.agent_name}
              className="carte"
              style={{
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
                borderRadius: 20,
                padding: 20,
                borderLeft: `6px solid ${s.couleur}`,
                animation: anims || undefined,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700 }}>{surnom(a.agent_name)}</div>
              <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 12 }}>{a.agent_name}</div>
              <span
                style={{
                  display: "inline-block",
                  background: s.couleur,
                  borderRadius: 999,
                  padding: "4px 12px",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {s.emoji} {s.label}
              </span>
              {a.message && (
                <p style={{ margin: "12px 0 0", opacity: 0.9 }}>{nettoyer(a.message)}</p>
              )}
              <p style={{ margin: "12px 0 0", fontSize: 12, opacity: 0.6 }}>
                {new Date(a.created_at).toLocaleString("fr-FR")}
              </p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
