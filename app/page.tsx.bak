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
  en_cours: { couleur: "#3b82f6", emoji: "⚡", label: "En cours" },
  termine: { couleur: "#22c55e", emoji: "✅", label: "Terminé" },
  erreur: { couleur: "#ef4444", emoji: "💥", label: "Erreur" },
  en_attente: { couleur: "#f59e0b", emoji: "⏳", label: "En attente" },
};

/* ---------- Petit diable en pixel art ---------- */

const SPRITE = [
  "H..........H",
  "HH........HH",
  ".HRRRRRRRRH.",
  ".RRRRRRRRRR.",
  ".RRKRRRRKRR.",
  ".RRKRRRRKRR.",
  ".RRRRRRRRRR.",
  ".RRRKKKKRRR.",
  "..RRRRRRRR..",
  "...DDDDDD...",
  "..DDDDDDDD..",
  "..DDDDDDDD..",
  "...D....D...",
  "...K....K...",
];
const QUEUE = [
  [10, 10], [11, 10], [12, 9], [13, 8], [14, 7], [14, 6],
  [13, 5], [14, 5], [15, 5], [14, 4],
];
const COULEURS: Record<string, string> = {
  H: "#fde047",
  R: "#dc2626",
  D: "#991b1b",
  K: "#111111",
};
const P = 4;

function Diable({ status }: { status: string }) {
  const dort = status === "en_attente";
  const anim =
    { en_cours: "tape", termine: "saute", erreur: "tremble", en_attente: "respire" }[status] ??
    "respire";

  return (
    <g className={anim} shapeRendering="crispEdges">
      <g className="queue">
        {QUEUE.map(([x, y], i) => (
          <rect
            key={i}
            x={x * P}
            y={y * P}
            width={P}
            height={P}
            fill={i >= 6 ? "#7f1d1d" : "#991b1b"}
          />
        ))}
      </g>
      {SPRITE.flatMap((ligne, y) =>
        ligne.split("").map((ch, x) => {
          if (ch === ".") return null;
          // Quand il dort, on ferme les yeux
          const c = dort && y === 4 && ch === "K" ? "R" : ch;
          return (
            <rect
              key={`${x}-${y}`}
              x={x * P}
              y={y * P}
              width={P}
              height={P}
              fill={COULEURS[c]}
            />
          );
        })
      )}
    </g>
  );
}

function Bulle({ status }: { status: string }) {
  if (status === "en_attente")
    return (
      <text className="zzz" x={50} y={4} fontSize={16} fontWeight={700} fill="#c4b5fd">
        z
      </text>
    );
  if (status === "termine")
    return (
      <text x={46} y={6} fontSize={18}>
        🎉
      </text>
    );
  if (status === "erreur")
    return (
      <text className="clignote" x={46} y={6} fontSize={18}>
        💢
      </text>
    );
  return null;
}

/* ---------- Mobilier ---------- */

function Bureau({ status }: { status: string }) {
  const ecran =
    { en_cours: "#60a5fa", termine: "#4ade80", erreur: "#f87171" }[status] ?? "#334155";
  return (
    <g>
      <polygon points="-40,-10 0,10 0,30 -40,10" fill="#78350f" />
      <polygon points="0,10 40,-10 40,10 0,30" fill="#92400e" />
      <polygon points="0,-30 40,-10 0,10 -40,-10" fill="#b45309" />
      <rect x={-3} y={-30} width={6} height={8} fill="#1f2937" />
      <rect x={-18} y={-54} width={36} height={26} rx={2} fill="#1f2937" />
      <rect
        x={-15}
        y={-51}
        width={30}
        height={20}
        fill={ecran}
        className={status === "en_cours" ? "clignote-doux" : undefined}
      />
    </g>
  );
}

function Plante() {
  return (
    <g>
      <polygon points="-12,-6 12,-6 9,10 -9,10" fill="#9a3412" />
      <circle cx={-6} cy={-16} r={9} fill="#16a34a" />
      <circle cx={6} cy={-18} r={9} fill="#22c55e" />
      <circle cx={0} cy={-28} r={9} fill="#15803d" />
    </g>
  );
}

/* ---------- L'open space isométrique ---------- */

const TW = 160; // largeur d'une dalle
const TH = 80; // hauteur d'une dalle
const COLS = 3;
const MARGE = 40;
const HAUT = 140;
const MUR = 70;

function OpenSpace({ agents, flash }: { agents: Row[]; flash: string | null }) {
  const places = Math.max(6, Math.ceil(agents.length / COLS) * COLS);
  const rangs = places / COLS;
  const ox = (rangs * TW) / 2 + MARGE;
  const centre = (c: number, r: number) => ({
    x: ox + ((c - r) * TW) / 2,
    y: HAUT + ((c + r) * TH) / 2,
  });
  const largeur = ((COLS + rangs) * TW) / 2 + 2 * MARGE;
  const hauteur = HAUT + ((COLS + rangs) * TH) / 2 + MARGE;

  // Coins du sol
  const haut = { x: ox, y: HAUT - TH / 2 };
  const gauche = { x: ox - (rangs * TW) / 2, y: HAUT - TH / 2 + (rangs * TH) / 2 };
  const droite = { x: ox + (COLS * TW) / 2, y: HAUT - TH / 2 + (COLS * TH) / 2 };

  const cases = Array.from({ length: places }, (_, i) => ({
    i,
    c: i % COLS,
    r: Math.floor(i / COLS),
  })).sort((a, b) => a.c + a.r - (b.c + b.r));

  return (
    <svg
      viewBox={`0 0 ${largeur} ${hauteur}`}
      style={{ width: "100%", maxWidth: largeur, display: "block", margin: "0 auto" }}
    >
      {/* Murs */}
      <polygon
        points={`${gauche.x},${gauche.y} ${haut.x},${haut.y} ${haut.x},${haut.y - MUR} ${gauche.x},${gauche.y - MUR}`}
        fill="#312e81"
      />
      <polygon
        points={`${haut.x},${haut.y} ${droite.x},${droite.y} ${droite.x},${droite.y - MUR} ${haut.x},${haut.y - MUR}`}
        fill="#3730a3"
      />

      {/* Sol en damier */}
      {cases.map(({ i, c, r }) => {
        const { x, y } = centre(c, r);
        return (
          <polygon
            key={`sol-${i}`}
            points={`${x},${y - TH / 2} ${x + TW / 2},${y} ${x},${y + TH / 2} ${x - TW / 2},${y}`}
            fill={(c + r) % 2 ? "#6d28d9" : "#7c3aed"}
          />
        );
      })}

      {/* Postes de travail */}
      {cases.map(({ i, c, r }) => {
        const { x, y } = centre(c, r);
        const a = agents[i];
        return (
          <g key={`poste-${i}`} transform={`translate(${x},${y})`}>
            <g className={a && flash === a.agent_name ? "pop" : undefined}>
              {a ? (
                <>
                  <g transform="translate(-24,-88)">
                    <Diable status={a.status} />
                  </g>
                  <Bureau status={a.status} />
                  <g transform="translate(-24,-88)">
                    <Bulle status={a.status} />
                  </g>
                  <text
                    x={0}
                    y={50}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={700}
                    fill="white"
                    stroke="#1e1b4b"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    {a.agent_name}
                  </text>
                </>
              ) : (
                <Plante />
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Page ---------- */

export default function Home() {
  const [agents, setAgents] = useState<Record<string, Row>>({});
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
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
        background: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #be185d 100%)",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.7); }
          50% { box-shadow: 0 0 0 14px rgba(59,130,246,0); }
        }
        @keyframes pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .carte { transition: transform 0.2s; }
        .carte:hover { transform: translateY(-4px); }

        .pop { animation: pop 0.6s; transform-box: fill-box; transform-origin: center; }
        .tape { animation: tape 0.3s steps(2) infinite; }
        @keyframes tape { 50% { transform: translateY(-2px); } }
        .saute { animation: saute 0.8s ease-in-out infinite; }
        @keyframes saute { 50% { transform: translateY(-14px); } }
        .tremble { animation: tremble 0.1s steps(2) infinite; }
        @keyframes tremble { 50% { transform: translateX(3px); } }
        .respire { animation: respire 3s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100%; }
        @keyframes respire { 50% { transform: scaleY(0.94); } }
        .queue { animation: queue 1s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 0% 100%; }
        @keyframes queue { from { transform: rotate(-12deg); } to { transform: rotate(12deg); } }
        .zzz { animation: zzz 2s ease-out infinite; }
        @keyframes zzz {
          from { opacity: 0; transform: translate(0, 0); }
          30% { opacity: 1; }
          to { opacity: 0; transform: translate(10px, -20px); }
        }
        .clignote { animation: clignote 0.6s steps(2) infinite; }
        @keyframes clignote { 50% { opacity: 0.3; } }
        .clignote-doux { animation: clignote-doux 1.2s ease-in-out infinite; }
        @keyframes clignote-doux { 50% { opacity: 0.6; } }
      `}</style>

      <h1 style={{ fontSize: 40, fontWeight: 800, margin: "0 0 8px" }}>😈 Mes agents</h1>
      <p style={{ opacity: 0.8, margin: "0 0 24px" }}>
        {liste.length} agent{liste.length > 1 ? "s" : ""} · mise à jour en direct
      </p>

      <div
        style={{
          background: "rgba(0,0,0,0.25)",
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
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
                borderRadius: 20,
                padding: 20,
                borderLeft: `6px solid ${s.couleur}`,
                animation: anims || undefined,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
                {a.agent_name}
              </div>
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
                <p style={{ margin: "12px 0 0", opacity: 0.9 }}>{a.message}</p>
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