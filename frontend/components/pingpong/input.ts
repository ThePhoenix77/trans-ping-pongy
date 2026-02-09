export function updateKeysFromKeyboardEvent(keys: Record<string, boolean>, e: KeyboardEvent) {
  const active = e.type === "keydown";
  keys[e.key] = active;
}
