"use client";

import { useMemo, useState } from "react";
import type { Module, System } from "@/lib/types";
import { EvidencePanel } from "./EvidencePanel";
import { glyphForCheck, getConnectionStroke, getModulePalette } from "@/lib/viewer/visualState";

type ThreeSystemMapProps = {
  system: System;
};

function project(position?: [number, number, number]) {
  const [x = 0, y = 0, z = 0] = position ?? [0, 0, 0];
  return {
    left: 480 + x * 26,
    top: 300 + z * 18 - y * 14,
    depth: Math.max(0.88, Math.min(1.14, 1 + y * 0.03)),
  };
}

export function ThreeSystemMap({ system }: ThreeSystemMapProps) {
  const [selected, setSelected] = useState<Module | null>(system.modules[0] ?? null);

  const modulesById = useMemo(
    () => new Map(system.modules.map((module) => [module.id, module])),
    [system.modules],
  );

  const projected = useMemo(
    () =>
      new Map(
        system.modules.map((module) => {
          const point = project(module.position);
          return [module.id, point];
        }),
      ),
    [system.modules],
  );

  return (
    <div className="viewer-layout">
      <section className="panel scene-panel">
        <div className="scene-header">
          <div>
            <p className="eyebrow">{system.mode === "mapped" ? "Live Mapped View" : "Live Repo View"}</p>
            <h1 style={{ margin: 0 }}>{system.name}</h1>
          </div>
          <div className="pill-row">
            <span className="pill">{system.repoSnapshots.length} repos</span>
            <span className="pill">{system.modules.length} nodes</span>
            <span className="pill">{system.connections.length} links</span>
            <span className="pill">{system.overallStatus.updatedAt}</span>
          </div>
        </div>

        <div className="system-repo-list">
          {system.repoSnapshots.map((repo) => (
            <a
              className="system-repo-item"
              href={repo.url}
              key={repo.name}
              rel="noreferrer"
              target="_blank"
            >
              <strong>{repo.owner}/{repo.name}</strong>
              <span className="micro-label">
                PR {repo.openPullRequests} / Issue {repo.openIssues} / Workflow{" "}
                {repo.latestWorkflow?.status === "pass"
                  ? "●"
                  : repo.latestWorkflow?.status === "fail"
                    ? "×"
                    : "—"}
              </span>
            </a>
          ))}
        </div>

        <div className="scene-wrap" style={{ marginTop: 16 }}>
          <div className="diagram-board">
            <div className="diagram-stage">
              <svg className="diagram-svg" viewBox="0 0 1200 760" preserveAspectRatio="none">
                <defs>
                  <marker
                    id="arrow-active"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="5"
                    orient="auto"
                  >
                    <path d="M0,0 L10,5 L0,10 z" fill="#17915a" />
                  </marker>
                  <marker
                    id="arrow-broken"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="5"
                    orient="auto"
                  >
                    <path d="M0,0 L10,5 L0,10 z" fill="#d94841" />
                  </marker>
                  <marker
                    id="arrow-muted"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="5"
                    orient="auto"
                  >
                    <path d="M0,0 L10,5 L0,10 z" fill="#97a294" />
                  </marker>
                </defs>

                {system.connections.map((connection) => {
                  const from = projected.get(connection.from);
                  const to = projected.get(connection.to);
                  if (!from || !to) return null;

                  const stroke = getConnectionStroke(connection.status);
                  const marker =
                    connection.status === "active"
                      ? "url(#arrow-active)"
                      : connection.status === "broken"
                        ? "url(#arrow-broken)"
                        : "url(#arrow-muted)";

                  return (
                    <line
                      key={connection.id}
                      stroke={stroke.color}
                      strokeDasharray={stroke.dash ? "10 7" : undefined}
                      strokeOpacity={stroke.opacity}
                      strokeWidth={Math.max(2, connection.strength * 4)}
                      x1={from.left + 85}
                      x2={to.left + 85}
                      y1={from.top + 56}
                      y2={to.top + 56}
                      markerEnd={marker}
                    />
                  );
                })}
              </svg>

              {system.modules.map((module) => {
                const point = projected.get(module.id) ?? { left: 0, top: 0, depth: 1 };
                const palette = getModulePalette(module.status);

                return (
                  <button
                    className={`module-card${selected?.id === module.id ? " selected" : ""}`}
                    key={module.id}
                    onClick={() => setSelected(module)}
                    style={{
                      left: point.left,
                      top: point.top,
                      transform: `translate(-50%, -50%) scale(${point.depth})`,
                      borderColor: palette.edge,
                      background:
                        module.status === "broken"
                          ? "rgba(255,242,240,0.98)"
                          : "rgba(255,255,255,0.96)",
                    }}
                    type="button"
                  >
                    <div className="module-card-head">
                      <div>
                        <h3 className="module-card-title">{module.name}</h3>
                        <div className="module-card-repo">{module.repo}</div>
                      </div>
                      <strong>{module.progress}%</strong>
                    </div>

                    <div className="module-card-strip">
                      <span>{module.type}</span>
                      <span>{module.path}</span>
                    </div>

                    <div className="module-card-checks">
                      <span>B {glyphForCheck(module.checks.build)}</span>
                      <span>T {glyphForCheck(module.checks.test)}</span>
                      <span>D {glyphForCheck(module.checks.deploy)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="legend-list">
          <div className="legend-item">
            <span>Active</span>
            <span className="legend-line" style={{ borderTopColor: "#17915a" }} />
          </div>
          <div className="legend-item">
            <span>Untested</span>
            <span className="legend-line" style={{ borderTopColor: "#d8a126", borderTopStyle: "dashed" }} />
          </div>
          <div className="legend-item">
            <span>Planned</span>
            <span className="legend-line" style={{ borderTopColor: "#97a294", borderTopStyle: "dashed" }} />
          </div>
          <div className="legend-item">
            <span>Broken</span>
            <span className="legend-line" style={{ borderTopColor: "#d94841" }} />
          </div>
        </div>
      </section>

      <EvidencePanel module={selected} />
    </div>
  );
}
