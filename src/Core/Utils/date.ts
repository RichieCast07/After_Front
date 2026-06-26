export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

export function formatDateOnly(value: string): string {
  return new Date(value).toLocaleDateString("es-MX", {
    timeZone: "UTC",
  });
}

export function formatTimeOnly(value: string): string {
  return new Date(value).toLocaleTimeString("es-MX", {
    timeZone: "UTC",
  });
}
