const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export function fraction(n, d = 1) {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d === 0)
    throw new Error("不能除以 0");
  const sign = d < 0 ? -1 : 1,
    g = gcd(n, d);
  return { n: (n / g) * sign, d: (d / g) * sign };
}
export function calculate(a, b, op) {
  switch (op) {
    case "+":
      return fraction(a.n * b.d + b.n * a.d, a.d * b.d);
    case "-":
      return fraction(a.n * b.d - b.n * a.d, a.d * b.d);
    case "*":
      return fraction(a.n * b.n, a.d * b.d);
    case "/":
      return fraction(a.n * b.d, a.d * b.n);
    default:
      throw new Error("未知运算符");
  }
}
export const display = (v) => (v.d === 1 ? String(v.n) : `${v.n}/${v.d}`);
export const is24 = (v) => v.n === 24 * v.d;
export function solve(numbers) {
  const search = (cards) => {
    if (cards.length === 1)
      return is24(cards[0].value) ? cards[0].expression : null;
    for (let i = 0; i < cards.length; i++)
      for (let j = 0; j < cards.length; j++) {
        if (i === j) continue;
        for (const op of ["+", "-", "*", "/"]) {
          if ((op === "+" || op === "*") && i > j) continue;
          try {
            const value = calculate(cards[i].value, cards[j].value, op);
            const result = search([
              ...cards.filter((_, k) => k !== i && k !== j),
              {
                value,
                expression: `(${cards[i].expression} ${op} ${cards[j].expression})`,
              },
            ]);
            if (result) return result;
          } catch {
            /* division by zero is not a move */
          }
        }
      }
    return null;
  };
  return search(
    numbers.map((n) => ({ value: fraction(n), expression: String(n) })),
  );
}
export const puzzles = [
  [1, 2, 3, 4],
  [3, 3, 8, 8],
  [2, 3, 4, 6],
  [1, 5, 5, 5],
  [4, 4, 7, 7],
  [1, 3, 4, 6],
  [2, 2, 6, 6],
  [1, 4, 6, 8],
  [2, 4, 4, 8],
  [3, 4, 5, 6],
  [2, 3, 7, 8],
  [1, 6, 6, 8],
  [4, 5, 6, 7],
  [2, 5, 7, 9],
  [1, 2, 7, 8],
  [3, 3, 6, 6],
  [2, 2, 3, 9],
  [1, 4, 5, 6],
  [1, 1, 4, 6],
  [2, 4, 6, 8],
];
