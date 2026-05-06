import type { ModuleConnection, StatusFile, SystemMapFile } from "@/lib/types";

export function resolveConnections(
  mapConnections: SystemMapFile["connections"],
  statusConnections: StatusFile["connections"] = [],
): ModuleConnection[] {
  return mapConnections.map((connection, index) => {
    const live =
      statusConnections.find(
        (item) => item.from === connection.from && item.to === connection.to,
      ) ?? null;

    return {
      id: `${connection.from}-${connection.to}-${index}`,
      from: connection.from,
      to: connection.to,
      kind: connection.kind,
      status: live?.status ?? connection.status ?? "planned",
      strength: connection.strength ?? 0.5,
      evidence: [...(connection.evidence ?? []), ...(live?.evidence ?? [])],
    };
  });
}
