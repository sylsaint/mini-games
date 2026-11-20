export const CELL_COUNT = 600;
export const DEADLINE_MS = 20 * 60 * 1000;
export const MAX_ACTIVE = 8;
export const MAX_WORKERS = 16;
export const LEVEL_MS = Object.freeze([10000, 7000, 5000, 3000, 1000]);

// An integer work scale keeps checkpointing/differently sized ticks deterministic.
export const MAX_ENERGY = 60;
export const TOOL_COST = Object.freeze([0, 3, 5]);
export const TOOL_MULTIPLIER = Object.freeze([1, 1.25, 1.5]);
const CELL_WORK = 840000;
export function getDuration(worker) {
  return LEVEL_MS[worker.level - 1] / TOOL_MULTIPLIER[worker.tool];
}
const rate = worker => Math.round(CELL_WORK / getDuration(worker));

function assign(state) {
  state.workers.sort((a, b) => Number(b.energy > 0) - Number(a.energy > 0) || getDuration(a) - getDuration(b) || a.id - b.id);
  const occupied = new Set();
  state.workers.forEach((worker, index) => {
    if (index >= MAX_ACTIVE || worker.energy === 0 || (worker.cell !== null && state.cells[worker.cell] === 1)) worker.cell = null;
    if (worker.cell !== null) occupied.add(worker.cell);
  });
  for (const worker of state.workers.slice(0, MAX_ACTIVE)) {
    if (worker.cell !== null || worker.energy === 0) continue;
    const cell = state.cells.findIndex((work, index) => work < 1 && !occupied.has(index));
    if (cell !== -1) {
      worker.cell = cell;
      occupied.add(cell);
    }
  }
}

export function createGame(now = Date.now()) {
  now = Math.floor(now);
  const state = {
    status: 'running', startedAt: now, now, deadlineAt: now + DEADLINE_MS,
    coins: 0, food: 0, recruitCost: 1, completed: 0, cells: Array(CELL_COUNT).fill(0),
    workers: Array.from({ length: 4 }, (_, id) => ({ id: id + 1, level: 1, tool: 0, energy: MAX_ENERGY, cell: null })),
    nextWorkerId: 5,
  };
  assign(state);
  return state;
}

export function tick(state, now = Date.now()) {
  if (state.status !== 'running' || !Number.isFinite(now) || now <= state.now) return state;
  const target = Math.min(Math.floor(now), state.deadlineAt);
  while (state.now < target) {
    let step = target - state.now;
    for (const worker of state.workers) {
      if (worker.cell === null) continue;
      const work = Math.round(state.cells[worker.cell] * CELL_WORK);
      step = Math.min(step, Math.ceil((CELL_WORK - work) / rate(worker)));
    }
    let finished = false;
    state.now += step;
    for (const worker of state.workers) {
      if (worker.cell === null) continue;
      const work = Math.round(state.cells[worker.cell] * CELL_WORK) + step * rate(worker);
      if (work >= CELL_WORK) {
        state.cells[worker.cell] = 1;
        state.completed++;
        worker.energy--;
        state.coins++;
        worker.cell = null;
        finished = true;
      } else {
        state.cells[worker.cell] = work / CELL_WORK;
      }
    }
    if (state.completed === CELL_COUNT && state.now < state.deadlineAt) {
      state.status = 'won';
      break;
    }
    if (finished && state.now < state.deadlineAt) assign(state);
  }
  if (state.status === 'running' && state.now >= state.deadlineAt) state.status = 'lost';
  return state;
}

// Call tick with the current timestamp before performing a user action.
export function recruit(state) {
  if (state.status !== 'running' || state.workers.length >= MAX_WORKERS || state.coins < state.recruitCost) return false;
  state.coins -= state.recruitCost++;
  state.workers.push({ id: state.nextWorkerId++, level: 1, tool: 0, energy: MAX_ENERGY, cell: null });
  assign(state);
  return true;
}

export function merge(state, level) {
  if (state.status !== 'running' || !Number.isInteger(level) || level < 1 || level >= LEVEL_MS.length) return false;
  // Use reserves first where possible, so an ongoing assignment can continue.
  const pair = state.workers.filter(worker => worker.level === level)
    .sort((a, b) => Number(a.cell !== null) - Number(b.cell !== null) || a.id - b.id)
    .slice(0, 2);
  if (pair.length < 2) return false;
  state.workers = state.workers.filter(worker => !pair.includes(worker));
  const cell = pair.find(worker => worker.cell !== null)?.cell ?? null;
  state.workers.push({
    id: state.nextWorkerId++, level: level + 1, cell,
    tool: Math.max(...pair.map(worker => worker.tool)),
    energy: Math.max(...pair.map(worker => worker.energy)),
  });
  assign(state);
  return true;
}

export function buyTool(state, workerId, size) {
  if (state.status !== 'running' || (size !== 1 && size !== 2) || state.coins < TOOL_COST[size]) return false;
  const worker = state.workers.find(worker => worker.id === workerId);
  if (!worker || worker.tool >= size) return false;
  state.coins -= TOOL_COST[size];
  worker.tool = size;
  assign(state);
  return true;
}

export const FOOD_COST = 2;
export const FOOD_PER_PACK = 3;
export function buyFood(state) {
  if (state.status !== 'running' || state.coins < FOOD_COST) return false;
  state.coins -= FOOD_COST;
  state.food += FOOD_PER_PACK;
  return true;
}

export function rescueAndFeed(state) {
  if (state.status !== 'running' || state.food <= 0) return 0;
  const workers = state.workers.filter(worker => worker.energy < MAX_ENERGY)
    .sort((a, b) => a.energy - b.energy || a.id - b.id).slice(0, Math.min(FOOD_PER_PACK, state.food));
  state.food -= workers.length;
  for (const worker of workers) worker.energy = MAX_ENERGY;
  assign(state);
  return workers.length;
}
