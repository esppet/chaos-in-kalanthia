/** Point-in-polygon, nearest walkable point, and grid A* for room floors. */

export function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const crosses = (yi > y) !== (yj > y);
    if (!crosses) continue;
    const atX = ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-6) + xi;
    if (x < atX) inside = !inside;
  }
  return inside;
}

export function polyBounds(poly) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

export function nearestOnPoly(x, y, poly, step = 4) {
  if (pointInPoly(x, y, poly)) return { x, y };
  const b = polyBounds(poly);
  let best = null;
  let bestD = Infinity;
  for (let py = b.minY; py <= b.maxY; py += step) {
    for (let px = b.minX; px <= b.maxX; px += step) {
      if (!pointInPoly(px, py, poly)) continue;
      const d = (px - x) * (px - x) + (py - y) * (py - y);
      if (d < bestD) {
        bestD = d;
        best = { x: px, y: py };
      }
    }
  }
  return best || { x, y };
}

function cellKey(cx, cy) {
  return cx + "," + cy;
}

export function findPath(x0, y0, x1, y1, poly, cell = 8) {
  const start = nearestOnPoly(x0, y0, poly, 4);
  const goal = nearestOnPoly(x1, y1, poly, 4);
  const sx = Math.round(start.x / cell);
  const sy = Math.round(start.y / cell);
  const gx = Math.round(goal.x / cell);
  const gy = Math.round(goal.y / cell);

  const walkable = (cx, cy) => pointInPoly(cx * cell, cy * cell, poly);

  if (!walkable(sx, sy) || !walkable(gx, gy)) {
    return [start, goal];
  }

  const dirs = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414],
  ];

  const h = (cx, cy) => {
    const dx = cx - gx;
    const dy = cy - gy;
    return Math.hypot(dx, dy);
  };

  const open = [{ cx: sx, cy: sy, g: 0, f: h(sx, sy) }];
  const came = new Map();
  const gScore = new Map([[cellKey(sx, sy), 0]]);
  const seen = new Set();

  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    const key = cellKey(cur.cx, cur.cy);
    if (seen.has(key)) continue;
    seen.add(key);
    if (cur.cx === gx && cur.cy === gy) {
      const pts = [{ x: goal.x, y: goal.y }];
      let k = key;
      while (came.has(k)) {
        const prev = came.get(k);
        pts.push({ x: prev.cx * cell, y: prev.cy * cell });
        k = cellKey(prev.cx, prev.cy);
      }
      pts.reverse();
      pts[0] = { x: start.x, y: start.y };
      return simplify(pts, poly);
    }
    for (const [dx, dy, cost] of dirs) {
      const nx = cur.cx + dx;
      const ny = cur.cy + dy;
      if (!walkable(nx, ny)) continue;
      // No corner-cutting through blocked diagonals.
      if (dx && dy && (!walkable(cur.cx + dx, cur.cy) || !walkable(cur.cx, cur.cy + dy))) {
        continue;
      }
      const nKey = cellKey(nx, ny);
      const tentative = cur.g + cost;
      if (tentative >= (gScore.get(nKey) ?? Infinity)) continue;
      came.set(nKey, { cx: cur.cx, cy: cur.cy });
      gScore.set(nKey, tentative);
      open.push({ cx: nx, cy: ny, g: tentative, f: tentative + h(nx, ny) });
    }
  }
  return [start, goal];
}

function lineClear(a, b, poly, samples = 8) {
  for (let i = 1; i < samples; i++) {
    const t = i / samples;
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    if (!pointInPoly(x, y, poly)) return false;
  }
  return true;
}

function simplify(pts, poly) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  let i = 0;
  while (i < pts.length - 1) {
    let best = i + 1;
    for (let j = pts.length - 1; j > i + 1; j--) {
      if (lineClear(pts[i], pts[j], poly, 12)) {
        best = j;
        break;
      }
    }
    out.push(pts[best]);
    i = best;
  }
  return out;
}

export function rectContains(rect, x, y) {
  return x >= rect[0] && y >= rect[1] && x <= rect[0] + rect[2] && y <= rect[1] + rect[3];
}

export function polyContains(shape, x, y) {
  if (!shape) return false;
  if (shape.rect) return rectContains(shape.rect, x, y);
  if (shape.poly) return pointInPoly(x, y, shape.poly);
  return false;
}

export function approachPoint(shape, poly) {
  let x, y;
  if (shape.approach) {
    x = shape.approach[0];
    y = shape.approach[1];
  } else if (shape.rect) {
    x = shape.rect[0] + shape.rect[2] / 2;
    y = shape.rect[1] + shape.rect[3];
  } else if (shape.poly) {
    const b = polyBounds(shape.poly);
    x = (b.minX + b.maxX) / 2;
    y = b.maxY;
  } else {
    return null;
  }
  return nearestOnPoly(x, y, poly, 4);
}
