export function formatOvers(oversCompleted: number, ballsThisOver: number) {
  return `${oversCompleted}.${ballsThisOver}`;
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
