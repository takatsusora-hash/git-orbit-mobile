import Link from "next/link";
import type { System } from "@/lib/types";
import { glyphForCheck } from "@/lib/viewer/visualState";
import { ProgressGlyph } from "./ProgressGlyph";

type SystemCardProps = {
  system: System;
};

export function SystemCard({ system }: SystemCardProps) {
  const representative = system.modules[0];

  return (
    <Link className="card" href={`/systems/${system.id}`}>
      <p className="eyebrow">{system.mode === "mapped" ? "Mapped System" : "Live System"}</p>
      <h2 style={{ margin: "0 0 6px", fontSize: "1.5rem" }}>{system.name}</h2>
      <p className="subtitle" style={{ marginTop: 0 }}>
        {system.summary}
      </p>

      <div className="pill-row" style={{ marginTop: 14 }}>
        {system.tags.map((tag) => (
          <span className="pill" key={tag}>
            {tag}
          </span>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        <ProgressGlyph progress={system.overallStatus.progress} />
      </div>

      <div className="system-meta">
        <div>
          <div className="meta-label">Repos</div>
          <div className="meta-value">{system.repoSnapshots.length}</div>
        </div>
        <div>
          <div className="meta-label">Nodes</div>
          <div className="meta-value">{system.modules.length}</div>
        </div>
        <div>
          <div className="meta-label">Open PR</div>
          <div className="meta-value">
            {system.repoSnapshots.reduce((sum, repo) => sum + repo.openPullRequests, 0)}
          </div>
        </div>
        <div>
          <div className="meta-label">Updated</div>
          <div className="meta-value">{system.overallStatus.updatedAt}</div>
        </div>
      </div>

      {representative ? (
        <div className="status-dots" style={{ marginTop: 18 }}>
          <span className="status-dot" style={{ color: "#198754" }}>
            Build {glyphForCheck(representative.checks.build)}
          </span>
          <span className="status-dot" style={{ color: "#198754" }}>
            Test {glyphForCheck(representative.checks.test)}
          </span>
          <span className="status-dot" style={{ color: "#667365" }}>
            Links {system.connections.length}
          </span>
        </div>
      ) : null}
    </Link>
  );
}
