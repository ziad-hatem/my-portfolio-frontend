export function checkIfExist(value: any, fallback: any = null) {
  return value !== undefined && value !== null ? value : fallback;
}
