export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(target: string) {
  if (!basePath) {
    return target;
  }

  return target === "/" ? `${basePath}/` : `${basePath}${target}`;
}
