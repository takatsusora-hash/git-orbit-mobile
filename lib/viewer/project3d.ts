type Vec3 = [number, number, number];

export type ProjectedNode = {
  id: string;
  x: number;
  y: number;
  scale: number;
  depth: number;
  visible: boolean;
};

export type CameraState = {
  pitch: number;
  yaw: number;
  zoom: number;
};

export function rotatePoint([x, y, z]: Vec3, camera: CameraState): Vec3 {
  const cosYaw = Math.cos(camera.yaw);
  const sinYaw = Math.sin(camera.yaw);
  const cosPitch = Math.cos(camera.pitch);
  const sinPitch = Math.sin(camera.pitch);

  const yawX = x * cosYaw - z * sinYaw;
  const yawZ = x * sinYaw + z * cosYaw;
  const pitchY = y * cosPitch - yawZ * sinPitch;
  const pitchZ = y * sinPitch + yawZ * cosPitch;

  return [yawX, pitchY, pitchZ];
}

export function projectPoint(
  id: string,
  point: Vec3,
  camera: CameraState,
  width: number,
  height: number,
): ProjectedNode {
  const [rotatedX, rotatedY, rotatedZ] = rotatePoint(point, camera);
  const distance = 48;
  const perspective = Math.max(0.28, distance / (distance - rotatedZ * 1.35));
  const scale = Math.max(0.42, Math.min(1.85, perspective * camera.zoom));
  const x = width / 2 + rotatedX * 34 * scale;
  const y = height / 2 - rotatedY * 30 * scale;

  return {
    id,
    x,
    y,
    scale,
    depth: rotatedZ,
    visible: rotatedZ < distance,
  };
}
