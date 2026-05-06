import Link from "next/link";
import { notFound } from "next/navigation";
import { ThreeSystemMap } from "@/components/ThreeSystemMap";
import { loadSystem } from "@/lib/analyzer/statusGenerator";
import { ProgressGlyph } from "@/components/ProgressGlyph";

type SystemViewerPageProps = {
  params: Promise<{
    systemId: string;
  }>;
};

export default async function SystemViewerPage({
  params,
}: SystemViewerPageProps) {
  const { systemId } = await params;
  const system = await loadSystem(systemId);

  if (!system) {
    notFound();
  }

  return (
    <main className="shell">
      <div className="shell-inner">
        <header className="page-header">
          <div>
            <p className="eyebrow">System Viewer</p>
            <h1 className="title" style={{ fontSize: "clamp(2rem, 3.2vw, 3.2rem)" }}>
              {system.name}
            </h1>
            <p className="subtitle">{system.summary}</p>
          </div>
          <div className="details-stack" style={{ minWidth: 280 }}>
            <ProgressGlyph progress={system.overallStatus.progress} />
            <div className="pill-row">
              {system.tags.map((tag) => (
                <span className="pill" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <Link className="ghost-link" href="/">
              ← Back to systems
            </Link>
          </div>
        </header>

        <ThreeSystemMap system={system} />
      </div>
    </main>
  );
}
