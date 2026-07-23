export type DoorPoint = readonly [number, number]
export type DoorRect = readonly [number, number, number, number]

/** Visible town thresholds in the 1536x1024 Aethergate source-art coordinate space. */
export const AETHERGATE_DOOR_POINTS = {
  guild: [240, 300],
  gatehouse: [762, 300],
  hospital: [1330, 322],
  'equipment-shop': [418, 480],
  'item-shop': [1185, 628],
  library: [548, 282],
  'town-hall': [980, 302],
  'crystal-shrine': [240, 580],
  'festival-hall': [892, 480],
  tailor: [1025, 830],
  inn: [165, 810],
  stable: [440, 810],
  bank: [1300, 790],
} as const satisfies Record<string, DoorPoint>
/**
 * A doorway trigger hugs the visible threshold: 40x24 source pixels, biased just below the door.
 * The former 84x62 rectangle could activate while the hero was still far out on the street.
 */
export function townDoorTriggerRect(door: DoorPoint, scale = 1): DoorRect {
  const [x, y] = door
  return [(x - 20) * scale, (y - 6) * scale, (x + 20) * scale, (y + 18) * scale]
}

export function pointInDoorRect(x: number, y: number, rect: DoorRect): boolean {
  return x >= rect[0] && x <= rect[2] && y >= rect[1] && y <= rect[3]
}

