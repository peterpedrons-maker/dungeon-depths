import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "O Reino Esquecido — Dungeon Crawler 3D" },
      {
        name: "description",
        content:
          "Dungeon crawler 3D em primeira pessoa, estética PS1 sombria. Explore catacumbas, biblioteca e forja na Vila do Limiar.",
      },
      { property: "og:title", content: "O Reino Esquecido" },
      {
        property: "og:description",
        content:
          "Desça às masmorras esquecidas. Espada na mão, neblina pelos corredores.",
      },
    ],
  }),
  component: Title,
});

function Title() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0810] font-mono text-amber-100">
      {/* Background vignette + noise */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(80,40,20,0.25), rgba(0,0,0,0.95) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
          backgroundSize: "240px 240px",
        }}
      />
      {/* Scanlines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0 1px, transparent 1px 3px)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center">
        <h1
          className="text-5xl font-black uppercase tracking-[0.25em] text-amber-200 sm:text-7xl"
          style={{
            textShadow:
              "0 0 14px rgba(200,120,40,0.35), 0 4px 0 #1a0a00, 0 6px 24px rgba(0,0,0,0.9)",
            fontFamily: "'Times New Roman', serif",
          }}
        >
          O Reino
          <br />
          Esquecido
        </h1>

        <p className="max-w-md text-xs uppercase tracking-[0.3em] text-amber-200/60">
          Um dungeon crawler em primeira pessoa
        </p>

        <div className="flex flex-col items-center gap-3">
          <Link
            to="/play"
            className="group inline-flex items-center gap-3 border border-amber-300/40 bg-amber-100/5 px-8 py-3 text-sm uppercase tracking-[0.3em] text-amber-100 transition hover:bg-amber-200/10 hover:tracking-[0.4em]"
            style={{ textShadow: "0 1px 0 #000" }}
          >
            ▸ Entrar no portal
          </Link>
          <button
            type="button"
            disabled
            className="cursor-not-allowed border border-amber-300/15 px-8 py-3 text-sm uppercase tracking-[0.3em] text-amber-200/30"
          >
            Continuar (em breve)
          </button>
        </div>

        <div className="mt-10 max-w-sm space-y-1 text-[10px] uppercase tracking-[0.25em] text-amber-200/40">
          <p>WASD — Andar &nbsp; · &nbsp; Mouse — Olhar</p>
          <p>Shift — Correr &nbsp; · &nbsp; F — Interagir</p>
          <p>Botão Esquerdo — Atacar &nbsp; · &nbsp; Direito — Bloquear</p>
        </div>
      </div>

      <footer className="relative z-10 mt-16 text-[10px] uppercase tracking-[0.3em] text-amber-200/30">
        v0.1 · Vila do Limiar
      </footer>
    </main>
  );
}
