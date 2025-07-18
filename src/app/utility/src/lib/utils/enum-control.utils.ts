export function getEnumKeyFromValue<T>(
  enumObj: T,
  value: string
): string | undefined {
  return Object.keys(enumObj).find(key => enumObj[key as keyof T] === value);
}
