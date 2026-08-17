/**
 * Grid pathfinding, written as pure functions so the UI can replay them.
 *
 * Every algorithm returns the order in which it *settled* nodes, not just the
 * final path — that visit order is the interesting part, because it shows how
 * much of the grid each one had to look at to get the same answer.
 */

export const EMPTY = 0;
export const WALL = 1;
export const WEIGHT = 2;

/** Cost of stepping onto a weighted cell. Plain cells cost 1. */
export const WEIGHT_COST = 5;

const costOf = (cell) => (cell === WEIGHT ? WEIGHT_COST : 1);

/* ------------------------------------------------------------------ *
 * Binary min-heap — enough for Dijkstra and A* without a dependency.
 * ------------------------------------------------------------------ */
class MinHeap {
    constructor() {
        this.keys = [];
        this.values = [];
    }

    get size() {
        return this.keys.length;
    }

    push(value, key) {
        this.keys.push(key);
        this.values.push(value);
        let i = this.keys.length - 1;
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.keys[parent] <= this.keys[i]) break;
            this.#swap(i, parent);
            i = parent;
        }
    }

    pop() {
        const top = this.values[0];
        const lastKey = this.keys.pop();
        const lastValue = this.values.pop();
        if (this.keys.length > 0) {
            this.keys[0] = lastKey;
            this.values[0] = lastValue;
            let i = 0;
            for (;;) {
                const left = 2 * i + 1;
                const right = left + 1;
                let smallest = i;
                if (left < this.keys.length && this.keys[left] < this.keys[smallest]) {
                    smallest = left;
                }
                if (right < this.keys.length && this.keys[right] < this.keys[smallest]) {
                    smallest = right;
                }
                if (smallest === i) break;
                this.#swap(i, smallest);
                i = smallest;
            }
        }
        return top;
    }

    #swap(a, b) {
        [this.keys[a], this.keys[b]] = [this.keys[b], this.keys[a]];
        [this.values[a], this.values[b]] = [this.values[b], this.values[a]];
    }
}

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

/** Four-directional neighbours, written into `out` to avoid allocating. */
function neighbors(index, cols, rows, out) {
    const x = index % cols;
    const y = (index / cols) | 0;
    let n = 0;
    if (y > 0) out[n++] = index - cols;
    if (y < rows - 1) out[n++] = index + cols;
    if (x > 0) out[n++] = index - 1;
    if (x < cols - 1) out[n++] = index + 1;
    return n;
}

function tracePath(cameFrom, start, goal) {
    if (cameFrom[goal] === -1 && goal !== start) return [];
    const path = [];
    let node = goal;
    while (node !== -1) {
        path.push(node);
        if (node === start) break;
        node = cameFrom[node];
    }
    return path.reverse();
}

function pathCost(grid, path) {
    // The starting cell is free; you only pay to step onto a cell.
    return path.slice(1).reduce((total, index) => total + costOf(grid[index]), 0);
}

/** Manhattan distance — admissible for 4-directional movement. */
function manhattan(a, b, cols) {
    const ax = a % cols;
    const ay = (a / cols) | 0;
    const bx = b % cols;
    const by = (b / cols) | 0;
    return Math.abs(ax - bx) + Math.abs(ay - by);
}

function result(grid, cameFrom, visited, start, goal) {
    const path = tracePath(cameFrom, start, goal);
    return {
        visited,
        path,
        cost: pathCost(grid, path),
        explored: visited.length,
        found: path.length > 0,
    };
}

/* ------------------------------------------------------------------ *
 * Breadth-first search
 *
 * Uninformed and unweighted: it finds the route with the fewest *cells*,
 * which is not the cheapest route once weighted cells exist. That gap is
 * the whole point of showing it next to the other two.
 * ------------------------------------------------------------------ */
export function bfs(grid, cols, rows, start, goal) {
    const total = cols * rows;
    const cameFrom = new Int32Array(total).fill(-1);
    const seen = new Uint8Array(total);
    const visited = [];
    const buffer = new Int32Array(4);

    const queue = [start];
    seen[start] = 1;
    let head = 0;

    while (head < queue.length) {
        const current = queue[head++];
        visited.push(current);
        if (current === goal) break;

        const count = neighbors(current, cols, rows, buffer);
        for (let i = 0; i < count; i += 1) {
            const next = buffer[i];
            if (seen[next] || grid[next] === WALL) continue;
            seen[next] = 1;
            cameFrom[next] = current;
            queue.push(next);
        }
    }

    return result(grid, cameFrom, visited, start, goal);
}

/* ------------------------------------------------------------------ *
 * Dijkstra
 *
 * Respects weights, but expands outward in every direction equally
 * because it has no idea where the goal is.
 * ------------------------------------------------------------------ */
export function dijkstra(grid, cols, rows, start, goal) {
    const total = cols * rows;
    const cameFrom = new Int32Array(total).fill(-1);
    const dist = new Float64Array(total).fill(Infinity);
    const settled = new Uint8Array(total);
    const visited = [];
    const buffer = new Int32Array(4);

    const heap = new MinHeap();
    dist[start] = 0;
    heap.push(start, 0);

    while (heap.size > 0) {
        const current = heap.pop();
        if (settled[current]) continue;
        settled[current] = 1;
        visited.push(current);
        if (current === goal) break;

        const count = neighbors(current, cols, rows, buffer);
        for (let i = 0; i < count; i += 1) {
            const next = buffer[i];
            if (settled[next] || grid[next] === WALL) continue;
            const candidate = dist[current] + costOf(grid[next]);
            if (candidate < dist[next]) {
                dist[next] = candidate;
                cameFrom[next] = current;
                heap.push(next, candidate);
            }
        }
    }

    return result(grid, cameFrom, visited, start, goal);
}

/* ------------------------------------------------------------------ *
 * A*
 *
 * Dijkstra plus a heuristic that biases expansion toward the goal. Same
 * optimal answer, a fraction of the nodes.
 * ------------------------------------------------------------------ */
export function astar(grid, cols, rows, start, goal) {
    const total = cols * rows;
    const cameFrom = new Int32Array(total).fill(-1);
    const gScore = new Float64Array(total).fill(Infinity);
    const settled = new Uint8Array(total);
    const visited = [];
    const buffer = new Int32Array(4);

    const heap = new MinHeap();
    gScore[start] = 0;
    heap.push(start, manhattan(start, goal, cols));

    while (heap.size > 0) {
        const current = heap.pop();
        if (settled[current]) continue;
        settled[current] = 1;
        visited.push(current);
        if (current === goal) break;

        const count = neighbors(current, cols, rows, buffer);
        for (let i = 0; i < count; i += 1) {
            const next = buffer[i];
            if (settled[next] || grid[next] === WALL) continue;
            const candidate = gScore[current] + costOf(grid[next]);
            if (candidate < gScore[next]) {
                gScore[next] = candidate;
                cameFrom[next] = current;
                heap.push(next, candidate + manhattan(next, goal, cols));
            }
        }
    }

    return result(grid, cameFrom, visited, start, goal);
}

export const ALGORITHMS = [
    {
        id: "bfs",
        name: "BFS",
        run: bfs,
        tone: "#5eead4",
        note: "Uninformed, ignores weights — fewest cells, not cheapest.",
    },
    {
        id: "dijkstra",
        name: "Dijkstra",
        run: dijkstra,
        tone: "#fbbf24",
        note: "Weighted and optimal, but expands in every direction.",
    },
    {
        id: "astar",
        name: "A*",
        run: astar,
        tone: "#e45dff",
        note: "Same optimal path, guided by a Manhattan heuristic.",
    },
];

/* ------------------------------------------------------------------ *
 * Open terrain — scattered obstacles and patches of costly ground.
 *
 * This is the default because it is the layout that actually separates the
 * three algorithms. A perfect maze has one viable corridor, so a heuristic
 * has nothing to exploit and A* degenerates to Dijkstra; in open ground A*
 * expands a narrow cone toward the goal while Dijkstra expands a disc.
 * ------------------------------------------------------------------ */
export function generateField(cols, rows) {
    const grid = new Uint8Array(cols * rows);
    const at = (x, y) => y * cols + x;
    const randInt = (n) => (Math.random() * n) | 0;

    const paintRect = (cx, cy, w, h, value) => {
        for (let y = cy; y < cy + h; y += 1) {
            for (let x = cx; x < cx + w; x += 1) {
                if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
                grid[at(x, y)] = value;
            }
        }
    };

    // Blocks of wall, biased away from the vertical centre band so there is
    // always a route without the grid feeling empty.
    const blocks = Math.max(6, Math.round((cols * rows) / 78));
    for (let i = 0; i < blocks; i += 1) {
        const w = 1 + randInt(3);
        const h = 2 + randInt(5);
        paintRect(2 + randInt(cols - 5), randInt(rows - h), w, h, WALL);
    }

    // Broad patches of costly terrain — this is what makes Dijkstra and BFS
    // disagree, since BFS cannot see the cost at all.
    const patches = Math.max(4, Math.round((cols * rows) / 130));
    for (let i = 0; i < patches; i += 1) {
        const w = 3 + randInt(5);
        const h = 2 + randInt(4);
        const px = randInt(cols - w);
        const py = randInt(rows - h);
        for (let y = py; y < py + h; y += 1) {
            for (let x = px; x < px + w; x += 1) {
                if (grid[at(x, y)] === EMPTY && Math.random() < 0.78) {
                    grid[at(x, y)] = WEIGHT;
                }
            }
        }
    }

    return grid;
}

/* ------------------------------------------------------------------ *
 * Maze generation — randomised depth-first carve on odd cells.
 * ------------------------------------------------------------------ */
export function generateMaze(cols, rows) {
    const grid = new Uint8Array(cols * rows).fill(WALL);
    const at = (x, y) => y * cols + x;

    const startX = 1;
    const startY = 1;
    grid[at(startX, startY)] = EMPTY;
    const stack = [[startX, startY]];

    while (stack.length > 0) {
        const [x, y] = stack[stack.length - 1];
        const options = [];
        if (y > 2 && grid[at(x, y - 2)] === WALL) options.push([x, y - 2, x, y - 1]);
        if (y < rows - 3 && grid[at(x, y + 2)] === WALL) options.push([x, y + 2, x, y + 1]);
        if (x > 2 && grid[at(x - 2, y)] === WALL) options.push([x - 2, y, x - 1, y]);
        if (x < cols - 3 && grid[at(x + 2, y)] === WALL) options.push([x + 2, y, x + 1, y]);

        if (options.length === 0) {
            stack.pop();
            continue;
        }

        const [nx, ny, wx, wy] = options[(Math.random() * options.length) | 0];
        grid[at(wx, wy)] = EMPTY;
        grid[at(nx, ny)] = EMPTY;
        stack.push([nx, ny]);
    }

    // Knock out a few walls so there is more than one viable route, which
    // makes the three algorithms diverge in interesting ways.
    for (let i = 0; i < (cols * rows) / 18; i += 1) {
        const x = 1 + ((Math.random() * (cols - 2)) | 0);
        const y = 1 + ((Math.random() * (rows - 2)) | 0);
        grid[at(x, y)] = EMPTY;
    }

    // Scatter weighted terrain across open ground.
    for (let i = 0; i < (cols * rows) / 9; i += 1) {
        const index = (Math.random() * grid.length) | 0;
        if (grid[index] === EMPTY) grid[index] = WEIGHT;
    }

    return grid;
}
