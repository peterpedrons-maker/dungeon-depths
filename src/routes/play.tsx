import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { Game } from "../game/Game";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Vila do Limiar — Dungeon Crawler" },
      {
        name: "description",
        content:
          "Explore a Vila do Limiar e desça às catacumbas neste dungeon crawler 3D em primeira pessoa estilo King's Field.",
      },
      { property: "og:title", content: "Vila do Limiar — Dungeon Crawler" },
      {
        property: "og:description",
        content:
          "Dungeon crawler 3D em primeira pessoa, estética PS1 sombria.",
      },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  return (
    <ClientOnly fallback={<LoadingScreen />}>
      <Game levelId="catacombs_1" />
    </ClientOnly>
  );
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black font-mono text-amber-200">
      <div className="animate-pulse">Carregando o portal…</div>
    </div>
  );
}
