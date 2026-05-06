import type { Module } from "@/lib/types";

const laneX: Record<Module["type"], number> = {
  ui: -8,
  api: 0,
  service: 8,
  db: 14,
  external: -14,
  workflow: 0,
};

const laneZ: Record<Module["type"], number> = {
  ui: -4,
  api: 0,
  service: 4,
  db: 10,
  external: 10,
  workflow: -12,
};

const laneY: Record<Module["type"], number> = {
  ui: 1,
  api: 2,
  service: 1,
  db: -2,
  external: -1,
  workflow: 8,
};

export function assignModuleLayout(modules: Module[]): Module[] {
  const buckets = new Map<Module["type"], Module[]>();

  for (const module of modules) {
    const entry = buckets.get(module.type) ?? [];
    entry.push(module);
    buckets.set(module.type, entry);
  }

  return modules.map((module) => {
    const group = buckets.get(module.type) ?? [];
    const index = group.findIndex((item) => item.id === module.id);
    const centered = index - (group.length - 1) / 2;
    const wave = (index % 2 === 0 ? 1 : -1) * 1.5;

    return {
      ...module,
      position: [
        laneX[module.type] + centered * 3.8,
        laneY[module.type] + wave,
        laneZ[module.type] + centered * 2.4,
      ],
    };
  });
}
