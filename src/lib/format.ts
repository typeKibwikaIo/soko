export const money = (n: number) => `$${n.toFixed(2)}`;

export const date = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
