import type { Module } from "@/lib/types";
import { glyphForCheck } from "@/lib/viewer/visualState";

type EvidencePanelProps = {
  module: Module | null;
};

export function EvidencePanel({ module }: EvidencePanelProps) {
  if (!module) {
    return (
      <aside className="panel side-panel">
        <p className="eyebrow">Evidence</p>
        <h2 style={{ marginTop: 0 }}>Select A Module</h2>
        <p className="subtitle" style={{ marginTop: 0 }}>
          右側にはクリックした箱の証拠だけを出します。文章は増やさず、GitHub の現物リンクを中心に見せます。
        </p>
      </aside>
    );
  }

  return (
    <aside className="panel side-panel">
      <p className="eyebrow">Evidence</p>
      <h2 style={{ marginTop: 0 }}>{module.name}</h2>

      <div style={{ marginBottom: 18 }}>
        <div className="meta-label">Path</div>
        <div className="meta-value">{module.path}</div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div className="meta-label">Progress</div>
        <div className="meta-value">{module.progress}%</div>
      </div>

      <div className="evidence-grid">
        <div className="evidence-cell">
          <div className="micro-label">Build</div>
          <div className="meta-value">{glyphForCheck(module.checks.build)}</div>
        </div>
        <div className="evidence-cell">
          <div className="micro-label">Type</div>
          <div className="meta-value">{glyphForCheck(module.checks.typecheck)}</div>
        </div>
        <div className="evidence-cell">
          <div className="micro-label">Test</div>
          <div className="meta-value">{glyphForCheck(module.checks.test)}</div>
        </div>
        <div className="evidence-cell">
          <div className="micro-label">Deploy</div>
          <div className="meta-value">{glyphForCheck(module.checks.deploy)}</div>
        </div>
        <div className="evidence-cell">
          <div className="micro-label">Runtime</div>
          <div className="meta-value">{glyphForCheck(module.checks.runtime)}</div>
        </div>
        <div className="evidence-cell">
          <div className="micro-label">Updated</div>
          <div className="meta-value">{module.checks.lastUpdatedAt ?? "—"}</div>
        </div>
      </div>

      <div className="evidence-links">
        {module.evidence.map((evidence) => (
          <a
            className="evidence-link"
            href={evidence.url}
            key={`${evidence.type}-${evidence.url}`}
            rel="noreferrer"
            target="_blank"
          >
            <div className="micro-label">{evidence.type}</div>
            <div className="meta-value" style={{ fontSize: "0.96rem" }}>
              {evidence.title}
            </div>
          </a>
        ))}
      </div>
    </aside>
  );
}
