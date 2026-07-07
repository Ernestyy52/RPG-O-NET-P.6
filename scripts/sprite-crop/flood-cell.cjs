// เธซเธฒ bounding box เธ—เธตเนเนเธ—เนเธเธฃเธดเธ‡เธ‚เธญเธ‡ sprite เธ เธฒเธขเนเธ 1 cell เธ”เนเธงเธข flood-fill (BFS) เธ—เธตเนเธ–เธนเธเธเธณเธเธฑเธ”เธ‚เธญเธเน€เธ‚เธ•เนเธงเนเนเธเน cellX0..cellY1
// เธเนเธญเธเธฑเธเธเธฒเธฃเธฃเธฑเนเธง sprite เธ‚เนเธฒเธ‡เน€เธเธตเธขเธเธเธฒเธ cell/row เธญเธทเนเธ (เธ•เนเธฒเธ‡เธเธฒเธ cell เธ—เธตเนเธ•เธดเธ”เธเธฑเธเนเธ”เนเธเธดเธ”)
const sharp = require('sharp');

const BG_THRESH = 18;

async function loadRaw(file) {
  return sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

function makeIsBg(data, w, ch) {
  return (x, y) => {
    const idx = (y * w + x) * ch;
    return data[idx] < BG_THRESH && data[idx + 1] < BG_THRESH && data[idx + 2] < BG_THRESH;
  };
}

function floodFillCell(isBg, cellX0, cellY0, cellX1, cellY1) {
  let seed = null;
  const seedYCandidates = [];
  for (let f = 0.3; f <= 0.8 && !seed; f += 0.05) seedYCandidates.push(Math.round(cellY0 + (cellY1 - cellY0) * f));
  for (const sy of seedYCandidates) {
    const cx = Math.round((cellX0 + cellX1) / 2);
    for (let dx = 0; dx < (cellX1 - cellX0) / 2; dx++) {
      for (const x of [cx - dx, cx + dx]) {
        if (x >= cellX0 && x < cellX1 && !isBg(x, sy)) { seed = [x, sy]; break; }
      }
      if (seed) break;
    }
    if (seed) break;
  }
  if (!seed) {
    outer: for (let y = cellY0; y < cellY1; y++) {
      for (let x = cellX0; x < cellX1; x++) {
        if (!isBg(x, y)) { seed = [x, y]; break outer; }
      }
    }
  }

  let minX = cellX1, maxX = cellX0, minY = cellY1, maxY = cellY0, count = 0;
  if (seed) {
    const cw = cellX1 - cellX0;
    const visited = new Uint8Array(cw * (cellY1 - cellY0));
    const key = (x, y) => (y - cellY0) * cw + (x - cellX0);
    const stack = [seed];
    visited[key(seed[0], seed[1])] = 1;
    while (stack.length) {
      const [x, y] = stack.pop();
      count++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1], [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]];
      for (const [nx, ny] of neighbors) {
        if (nx < cellX0 || nx >= cellX1 || ny < cellY0 || ny >= cellY1) continue;
        const k = key(nx, ny);
        if (visited[k]) continue;
        if (isBg(nx, ny)) continue;
        visited[k] = 1;
        stack.push([nx, ny]);
      }
    }
  }
  return { cellX0, cellY0, cellX1, cellY1, minX, minY, maxX, maxY, count, empty: count === 0, seed };
}

module.exports = { loadRaw, makeIsBg, floodFillCell };
