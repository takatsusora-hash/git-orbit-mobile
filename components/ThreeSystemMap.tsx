"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import type { Module, System } from "@/lib/types";
import { EvidencePanel } from "./EvidencePanel";
import {
  glyphForCheck,
  getConnectionStroke,
  getModulePalette,
} from "@/lib/viewer/visualState";
import {
  projectPoint,
  type CameraState,
  type ProjectedNode,
} from "@/lib/viewer/project3d";

type ThreeSystemMapProps = {
  system: System;
};

const sceneWidth = 1080;
const sceneHeight = 760;

const presetViews: Record<string, CameraState> = {
  orbit: { pitch: -0.46, yaw: 0.72, zoom: 1 },
  front: { pitch: 0, yaw: 0, zoom: 0.94 },
  top: { pitch: -1.18, yaw: 0.18, zoom: 0.88 },
};

function CubeNode({
  module,
  projected,
  selected,
  onSelect,
}: {
  module: Module;
  projected: ProjectedNode;
  selected: boolean;
  onSelect: (module: Module) => void;
}) {
  const palette = getModulePalette(module.status);
  const fillHeight = `${Math.max(8, Math.min(100, module.progress))}%`;

  return (
    <button
      className={`cube-node${selected ? " selected" : ""}`}
      onClick={() => onSelect(module)}
      style={{
        left: projected.x,
        top: projected.y,
        transform: `translate(-50%, -50%) scale(${projected.scale})`,
        zIndex: Math.round(projected.depth * 10 + 500),
      }}
      type="button"
    >
      <div
        className="cube-node-box"
        style={
          {
            "--cube-edge": palette.edge,
            "--cube-body": palette.body,
            "--cube-glow": palette.glow,
            "--cube-fill": fillHeight,
          } as CSSProperties
        }
      >
        <div className="cube-node-face cube-node-top" />
        <div className="cube-node-face cube-node-side" />
        <div className="cube-node-front">
          <div className="cube-node-fill" />
          <div className="cube-node-content">
            <div className="cube-node-head">
              <div>
                <h3 className="cube-node-title">{module.name}</h3>
                <div className="cube-node-repo">{module.repo}</div>
              </div>
              <strong>{module.progress}%</strong>
            </div>

            <div className="cube-node-strip">
              <span>{module.type}</span>
              <span>{module.path}</span>
            </div>

            <div className="cube-node-checks">
              <span>B {glyphForCheck(module.checks.build)}</span>
              <span>T {glyphForCheck(module.checks.test)}</span>
              <span>D {glyphForCheck(module.checks.deploy)}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export function ThreeSystemMap({ system }: ThreeSystemMapProps) {
  const [selected, setSelected] = useState<Module | null>(system.modules[0] ?? null);
  const [camera, setCamera] = useState<CameraState>(presetViews.orbit);
  const dragState = useRef<{
    pointerId: number;
    x: number;
    y: number;
    camera: CameraState;
  } | null>(null);

  const projectedMap = useMemo(() => {
    return new Map(
      system.modules.map((module) => [
        module.id,
        projectPoint(module.id, module.position ?? [0, 0, 0], camera, sceneWidth, sceneHeight),
      ]),
    );
  }, [camera, system.modules]);

  const orderedModules = useMemo(() => {
    return [...system.modules].sort((left, right) => {
      const leftDepth = projectedMap.get(left.id)?.depth ?? 0;
      const rightDepth = projectedMap.get(right.id)?.depth ?? 0;
      return leftDepth - rightDepth;
    });
  }, [projectedMap, system.modules]);

  function setPreset(view: keyof typeof presetViews) {
    setCamera(presetViews[view]);
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    dragState.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      camera,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    if (!dragState.current || dragState.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.current.x;
    const deltaY = event.clientY - dragState.current.y;

    setCamera({
      ...dragState.current.camera,
      yaw: dragState.current.camera.yaw + deltaX * 0.008,
      pitch: Math.max(
        -1.35,
        Math.min(0.55, dragState.current.camera.pitch + deltaY * 0.006),
      ),
    });
  }

  function clearPointer(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    if (dragState.current?.pointerId === event.pointerId) {
      dragState.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setCamera((current) => ({
      ...current,
      zoom: Math.max(0.72, Math.min(1.48, current.zoom - event.deltaY * 0.0012)),
    }));
  }

  return (
    <div className="viewer-layout">
      <section className="panel scene-panel">
        <div className="scene-header">
          <div>
            <p className="eyebrow">
              {system.mode === "mapped" ? "3D System View" : "3D Repo View"}
            </p>
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
              <strong>
                {repo.owner}/{repo.name}
              </strong>
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

        <div className="scene-toolbar">
          <div className="pill-row">
            <button className="scene-tool" onClick={() => setPreset("orbit")} type="button">
              Orbit
            </button>
            <button className="scene-tool" onClick={() => setPreset("front")} type="button">
              Front
            </button>
            <button className="scene-tool" onClick={() => setPreset("top")} type="button">
              Top
            </button>
          </div>
          <div className="micro-label">Drag to rotate. Wheel or pinch-like zoom with two-finger browser zoom.</div>
        </div>

        <div className="scene-wrap scene-wrap-3d" style={{ marginTop: 16 }}>
          <div
            className="diagram-board diagram-board-3d"
            onPointerCancel={clearPointer}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={clearPointer}
            onWheel={handleWheel}
          >
            <div
              className="diagram-stage diagram-stage-3d"
              style={{ width: sceneWidth, height: sceneHeight }}
            >
              <div className="scene-grid-floor" />

              <svg className="diagram-svg" viewBox={`0 0 ${sceneWidth} ${sceneHeight}`}>
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
                  const from = projectedMap.get(connection.from);
                  const to = projectedMap.get(connection.to);
                  if (!from || !to || !from.visible || !to.visible) {
                    return null;
                  }

                  const stroke = getConnectionStroke(connection.status);
                  const marker =
                    connection.status === "active"
                      ? "url(#arrow-active)"
                      : connection.status === "broken"
                        ? "url(#arrow-broken)"
                        : "url(#arrow-muted)";

                  const midX = (from.x + to.x) / 2;
                  const lift = Math.max(30, Math.abs(from.depth - to.depth) * 3 + 40);
                  const path = `M ${from.x} ${from.y} Q ${midX} ${Math.min(from.y, to.y) - lift} ${to.x} ${to.y}`;

                  return (
                    <path
                      d={path}
                      fill="none"
                      key={connection.id}
                      markerEnd={marker}
                      stroke={stroke.color}
                      strokeDasharray={stroke.dash ? "10 7" : undefined}
                      strokeOpacity={stroke.opacity}
                      strokeWidth={Math.max(2, connection.strength * 4)}
                    />
                  );
                })}
              </svg>

              {orderedModules.map((module) => {
                const projected = projectedMap.get(module.id);
                if (!projected || !projected.visible) {
                  return null;
                }

                return (
                  <CubeNode
                    key={module.id}
                    module={module}
                    onSelect={setSelected}
                    projected={projected}
                    selected={selected?.id === module.id}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <p className="mobile-help">
          立体空間はドラッグで回転します。箱名は常時表示し、右側は選択中モジュールの証拠だけを出します。
        </p>

        <div className="module-list">
          {system.modules.map((module) => (
            <button
              className="module-list-item"
              key={`list-${module.id}`}
              onClick={() => setSelected(module)}
              type="button"
            >
              <div className="module-card-head">
                <div>
                  <h3 className="module-card-title">{module.name}</h3>
                  <div className="module-card-repo">{module.repo}</div>
                </div>
                <strong>{module.progress}%</strong>
              </div>
              <div className="module-card-checks">
                <span>B {glyphForCheck(module.checks.build)}</span>
                <span>T {glyphForCheck(module.checks.test)}</span>
                <span>D {glyphForCheck(module.checks.deploy)}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="legend-list">
          <div className="legend-item">
            <span>Active</span>
            <span className="legend-line" style={{ borderTopColor: "#17915a" }} />
          </div>
          <div className="legend-item">
            <span>Untested</span>
            <span
              className="legend-line"
              style={{ borderTopColor: "#d8a126", borderTopStyle: "dashed" }}
            />
          </div>
          <div className="legend-item">
            <span>Planned</span>
            <span
              className="legend-line"
              style={{ borderTopColor: "#97a294", borderTopStyle: "dashed" }}
            />
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
