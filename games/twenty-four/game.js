import {
  fraction,
  calculate,
  display,
  is24,
  solve,
  puzzles,
} from "./engine.js";
let index = 0,
  score = 0,
  won = false,
  selected = null,
  operator = null,
  history = [],
  cards = [];
const cardList = document.querySelector("#cards"),
  feedback = document.querySelector("#feedback");
const symbols = { "+": "+", "-": "−", "*": "×", "/": "÷" };
function message(text, kind = "") {
  feedback.textContent = text;
  feedback.className = kind;
}
function render() {
  cardList.replaceChildren();
  cards.forEach((card, i) => {
    const button = document.createElement("button");
    button.className = "number-card" + (selected === i ? " selected" : "");
    button.setAttribute("aria-label", `数字 ${display(card.value)}`);
    button.setAttribute("aria-pressed", String(selected === i));
    button.textContent = display(card.value);
    if (card.expression !== display(card.value)) {
      const small = document.createElement("small");
      small.textContent = card.expression;
      button.append(small);
    }
    button.disabled = cards.length === 1;
    button.addEventListener("click", () => pick(i));
    cardList.append(button);
  });
  document.querySelectorAll("[data-op]").forEach((b) => {
    b.classList.toggle("selected", b.dataset.op === operator);
    b.setAttribute("aria-pressed", String(b.dataset.op === operator));
    b.disabled = selected === null || cards.length === 1;
  });
  document.querySelector("#undo").disabled = history.length === 0;
  document.querySelector("#score").textContent = `已解锁 ${score} 题`;
  document.querySelector("#instruction").textContent =
    cards.length === 1
      ? "每一步都算数，再挑战一题吧。"
      : selected === null
        ? "先选一张数字卡，再选运算符，最后选另一张卡。"
        : operator
          ? `已选择 ${display(cards[selected].value)} ${symbols[operator]} …，请选择第二张卡。`
          : "现在选择运算符，也可以点另一张卡重新选择。";
}
function pick(i) {
  if (selected === i) {
    selected = null;
    operator = null;
    render();
    return;
  }
  if (selected === null || operator === null) {
    selected = i;
    render();
    return;
  }
  try {
    const a = cards[selected],
      b = cards[i],
      value = calculate(a.value, b.value, operator);
    history.push(cards.map((c) => ({ ...c, value: { ...c.value } })));
    cards = [
      ...cards.filter((_, j) => j !== selected && j !== i),
      {
        value,
        expression: `(${a.expression} ${symbols[operator]} ${b.expression})`,
      },
    ];
    selected = null;
    operator = null;
    if (cards.length === 1) {
      if (is24(value)) {
        if (!won) {
          won = true;
          score++;
          celebrate();
        }
        message("太棒了！你让四个数字刚好变成了 24 ✨", "success");
      } else
        message(
          `最后得到 ${display(value)}，离 24 还差一点。撤销一步，再试条新路线吧。`,
          "failure",
        );
    } else message("合并成功！继续让数字发生魔法。");
    render();
  } catch (error) {
    message(error.message + "，换个运算或数字试试。", "failure");
  }
}
function start(next = false) {
  if (next) {
    index = (index + 1) % puzzles.length;
    won = false;
  }
  cards = puzzles[index].map((n) => ({
    value: fraction(n),
    expression: String(n),
  }));
  history = [];
  selected = null;
  operator = null;
  document.querySelector("#round").textContent = `第 ${index + 1} 题`;
  document.querySelector("details").open = false;
  document.querySelector("#hint").textContent =
    solve(puzzles[index]).replaceAll("*", "×").replaceAll("/", "÷") + " = 24";
  message("准备好了？让数字碰个面吧。");
  render();
}
function celebrate() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = document.querySelector("#celebration");
  for (let i = 0; i < 35; i++) {
    const piece = document.createElement("i");
    piece.className = "confetti";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = ["#d3e1b5", "#efbd90", "#c6addd"][i % 3];
    piece.style.animationDelay = Math.random() * 0.3 + "s";
    box.append(piece);
    setTimeout(() => piece.remove(), 2300);
  }
}
document.querySelectorAll("[data-op]").forEach((b) =>
  b.addEventListener("click", () => {
    operator = b.dataset.op;
    render();
  }),
);
document.querySelector("#restart").addEventListener("click", () => start());
document.querySelector("#next").addEventListener("click", () => start(true));
document.querySelector("#undo").addEventListener("click", () => {
  if (!history.length) return;
  cards = history.pop();
  selected = null;
  operator = null;
  message("已撤销上一步。换个思路，再来一次。");
  render();
});
start();
