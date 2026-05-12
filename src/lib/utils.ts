export function nanoid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ")
}
