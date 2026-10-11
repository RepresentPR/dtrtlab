/**
 * CS2 / CS:GO crosshair share codes.
 * Byte layout follows the public codec used by current CS2 clients
 * (legacy CSGO- codes, and the CS-prefixed codes from the 30 Sep 2026 update).
 * Drawing and rotation live here so the page and the tests share one decoder.
 */

const DICTIONARY = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789";
const BASE = 57n;
const SLOT_MS = 4 * 60 * 60 * 1000;

const PRESET = {
  0: [255, 0, 0],
  1: [0, 255, 0],
  2: [255, 255, 0],
  3: [0, 0, 255],
  4: [0, 255, 255],
};

export function slotMs() {
  return SLOT_MS;
}

export function rotationIndex(count, now = Date.now()) {
  if (!count) return 0;
  const slot = Math.floor(now / SLOT_MS);
  return ((slot % count) + count) % count;
}

export function nextRotationAt(now = Date.now()) {
  return (Math.floor(now / SLOT_MS) + 1) * SLOT_MS;
}

export function decodeShareCode(shareCode) {
  const code = String(shareCode || "").trim();
  if (/^CS[ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789]{44}$/.test(code)) {
    return decodeCs2(code);
  }
  if (/^CSGO(-[ABCDEFGHJKLMNOPQRSTUVWXYZabcdefhijkmnopqrstuvwxyz23456789]{5}){5}$/.test(code)) {
    return decodeLegacy(code);
  }
  throw new Error("That is not a CS2 crosshair code.");
}

export function encodeCs2(spec) {
  const bytes = new Array(32).fill(0);
  const screenHeight = clamp(spec.screenHeight ?? 1080, 240, 65535);
  const inner = Math.round(clamp(spec.innerSplitAlpha ?? 1, 0, 1) * 100);
  const outer = Math.round(clamp(spec.outerSplitAlpha ?? 1, 0.3, 1) * 100) - 30;
  const ratio = Math.round(clamp(spec.splitSizeRatio ?? 1, 0, 1) * 100);
  const bits =
    clamp(spec.splitDistance ?? 7, 0, 127) |
    (clamp(inner, 0, 100) << 7) |
    (clamp(outer, 0, 70) << 14) |
    (clamp(ratio, 0, 100) << 21) |
    ((spec.scopeDotUseCrosshairColor ? 1 : 0) << 28);
  const gap = clamp(Math.round(spec.gap), -3840, 3840);
  const scope = Math.round(clamp(spec.scopeDotScale ?? 1, 0.1, 2) * 100) - 10;
  bytes[1] = 1;
  bytes[2] = screenHeight & 0xff;
  bytes[3] = (screenHeight >> 8) & 0xff;
  bytes[4] =
    clamp(spec.style ?? 4, 0, 9) |
    ((spec.followRecoil ? 1 : 0) << 5) |
    ((spec.centerDotEnabled ? 1 : 0) << 6) |
    ((spec.tStyleEnabled ? 1 : 0) << 7);
  bytes[5] = clamp(spec.red ?? 0, 0, 255);
  bytes[6] = clamp(spec.green ?? 255, 0, 255);
  bytes[7] = clamp(spec.blue ?? 255, 0, 255);
  bytes[8] = clamp(spec.alpha ?? 255, 0, 255);
  bytes[9] = clamp(spec.outlineRed ?? 0, 0, 255);
  bytes[10] = clamp(spec.outlineGreen ?? 0, 0, 255);
  bytes[11] = clamp(spec.outlineBlue ?? 0, 0, 255);
  bytes[12] = clamp(spec.outlineAlpha ?? 255, 0, 255);
  bytes[13] = clamp(spec.thickness ?? 1, 0, 32) | (clamp(spec.outlineMode ?? 1, 0, 2) << 6);
  bytes[14] = gap & 0xff;
  bytes[15] = (gap >> 8) & 0xff;
  bytes[16] = clamp(spec.length ?? 4, 0, 255);
  bytes[17] = clamp(spec.dynamicSpreadLimit ?? 0, 0, 255);
  bytes[18] = bits & 0xff;
  bytes[19] = (bits >> 8) & 0xff;
  bytes[20] = (bits >> 16) & 0xff;
  bytes[21] = (bits >>> 24) & 0xff;
  bytes[22] = scope & 0xff;
  bytes[0] = sum(bytes) & 0xff;
  return "CS" + bytesToChars(bytes, 44);
}

export function paintCrosshair(canvas, crosshair) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth || 280;
  const cssH = canvas.clientHeight || 280;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#1a2420";
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let x = 20; x < cssW; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, cssH);
    ctx.stroke();
  }
  for (let y = 20; y < cssH; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cssW, y);
    ctx.stroke();
  }
  const model = visualModel(crosshair);
  const cx = cssW / 2;
  const cy = cssH / 2;
  const color = `rgba(${model.red},${model.green},${model.blue},${model.alpha / 255})`;
  const outline = model.outline
    ? `rgba(${model.outlineRed},${model.outlineGreen},${model.outlineBlue},${model.outlineAlpha / 255})`
    : null;
  const arms = [
    ["left", -1, 0],
    ["right", 1, 0],
    ["up", 0, -1],
    ["down", 0, 1],
  ];
  const shapes = [];
  arms.forEach(function (arm) {
    if (crosshair.style === 6 && crosshair.format !== "legacy-v1") return;
    if (model.tStyle && arm[0] === "down") return;
    const dx = arm[1];
    const dy = arm[2];
    const start = model.gap;
    const len = model.length;
    const thick = model.thickness;
    let x = cx + dx * start;
    let y = cy + dy * start;
    let w = thick;
    let h = thick;
    if (dx !== 0) {
      w = len;
      x = dx > 0 ? cx + start : cx - start - len;
      y = cy - thick / 2;
    } else {
      h = len;
      y = dy > 0 ? cy + start : cy - start - len;
      x = cx - thick / 2;
    }
    shapes.push([x, y, w, h]);
  });
  if (model.dot || (crosshair.style === 6 && crosshair.format !== "legacy-v1")) {
    const s = Math.max(2, model.thickness);
    shapes.push([cx - s / 2, cy - s / 2, s, s]);
  }
  // Outlines must not overwrite the colored fill of intersecting arms.
  if (outline) shapes.forEach(function ([x, y, w, h]) {
      const pad = model.outlinePad;
      ctx.fillStyle = outline;
      ctx.fillRect(x - pad, y - pad, w + pad * 2, h + pad * 2);
  });
  shapes.forEach(function ([x, y, w, h]) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  });
}

export function describeCrosshair(crosshair) {
  const color = rgbLabel(crosshair);
  const bits = [];
  bits.push(styleLabel(crosshair));
  if (crosshair.length != null) bits.push("length " + crosshair.length);
  if (crosshair.gap != null) bits.push("gap " + crosshair.gap);
  if (crosshair.thickness != null) bits.push("thick " + crosshair.thickness);
  if (crosshair.centerDotEnabled) bits.push("dot");
  if (crosshair.tStyleEnabled) bits.push("T");
  return color + " · " + bits.join(" · ");
}

export function commandsFor(crosshair) {
  if (crosshair.format === "cs2-v1") {
    return [
      'cl_crosshairstyle "' + crosshair.style + '"',
      'cl_crosshair_length "' + crosshair.length + '"',
      'cl_crosshair_thickness "' + crosshair.thickness + '"',
      'cl_crosshair_gap "' + crosshair.gap + '"',
      'cl_crosshaircolor_r "' + crosshair.red + '"',
      'cl_crosshaircolor_g "' + crosshair.green + '"',
      'cl_crosshaircolor_b "' + crosshair.blue + '"',
      'cl_crosshaircolor_a "' + crosshair.alpha + '"',
      'cl_crosshairdot "' + (crosshair.centerDotEnabled ? 1 : 0) + '"',
      'cl_crosshair_t "' + (crosshair.tStyleEnabled ? 1 : 0) + '"',
      'cl_crosshair_drawoutline "' + crosshair.outlineMode + '"',
      'cl_crosshair_recoil "' + (crosshair.followRecoil ? 1 : 0) + '"',
    ].join("\n");
  }
  return [
    'cl_crosshairstyle "' + crosshair.style + '"',
    'cl_crosshairsize "' + crosshair.length + '"',
    'cl_crosshairthickness "' + crosshair.thickness + '"',
    'cl_crosshairgap "' + crosshair.gap + '"',
    'cl_crosshaircolor_r "' + crosshair.red + '"',
    'cl_crosshaircolor_g "' + crosshair.green + '"',
    'cl_crosshaircolor_b "' + crosshair.blue + '"',
    'cl_crosshairdot "' + (crosshair.centerDotEnabled ? 1 : 0) + '"',
    'cl_crosshair_t "' + (crosshair.tStyleEnabled ? 1 : 0) + '"',
  ].join("\n");
}

function decodeCs2(code) {
  const bytes = charsToBytes(code.slice(2), 32);
  assertChecksum(bytes);
  if (bytes[1] !== 1) throw new Error("This CS2 code version is not supported.");
  const screenHeight = bytes[2] | (bytes[3] << 8);
  if (!screenHeight) throw new Error("That crosshair code is empty.");
  const bits = bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24);
  const gap = ((bytes[14] | (bytes[15] << 8)) << 16) >> 16;
  return {
    format: "cs2-v1",
    style: Math.min(bytes[4] & 0x1f, 9),
    followRecoil: (bytes[4] & 0x20) === 0x20,
    centerDotEnabled: (bytes[4] & 0x40) === 0x40,
    tStyleEnabled: (bytes[4] & 0x80) === 0x80,
    red: bytes[5],
    green: bytes[6],
    blue: bytes[7],
    alpha: bytes[8],
    outlineRed: bytes[9],
    outlineGreen: bytes[10],
    outlineBlue: bytes[11],
    outlineAlpha: bytes[12],
    outlineMode: Math.min(bytes[13] >>> 6, 2),
    thickness: Math.min(bytes[13] & 0x3f, 32),
    gap: clamp(gap, -3840, 3840),
    length: bytes[16],
    dynamicSpreadLimit: bytes[17],
    splitDistance: bits & 0x7f,
    innerSplitAlpha: Math.min((bits >> 7) & 0x7f, 100) / 100,
    outerSplitAlpha: (Math.min((bits >> 14) & 0x7f, 70) + 30) / 100,
    splitSizeRatio: Math.min((bits >> 21) & 0x7f, 100) / 100,
    screenHeight: Math.max(screenHeight, 240),
    scopeDotScale: Math.min((bytes[22] + 10) / 100, 2),
    scopeDotUseCrosshairColor: ((bits >>> 28) & 1) === 1,
  };
}

function decodeLegacy(code) {
  const bytes = charsToBytes(code.replace(/CSGO|-/g, ""), 18);
  assertChecksum(bytes);
  if (bytes[1] === 1) return decodeLegacyV1(bytes);
  if (bytes[1] === 3) return decodePixel(bytes, "legacy-v3");
  if (bytes[1] === 4) return decodePixel(bytes, "legacy-v4");
  throw new Error("This older crosshair code is not a version CS2 still publishes.");
}

function decodeLegacyV1(bytes) {
  const color = bytes[10] & 7;
  const rgb = color === 5 ? [bytes[4], bytes[5], bytes[6]] : PRESET[color] || PRESET[1];
  return {
    format: "legacy-v1",
    gap: int8(bytes[2]) / 10,
    outline: bytes[3] / 2,
    outlineMode: (bytes[10] & 8) === 8 ? 1 : 0,
    red: rgb[0],
    green: rgb[1],
    blue: rgb[2],
    alpha: bytes[7],
    thickness: bytes[12] / 10,
    centerDotEnabled: ((bytes[13] >> 4) & 1) === 1,
    tStyleEnabled: ((bytes[13] >> 4) & 8) === 8,
    style: (bytes[13] & 0xf) >> 1,
    length: bytes[14] / 10,
    outlineRed: 0,
    outlineGreen: 0,
    outlineBlue: 0,
    outlineAlpha: 255,
  };
}

function decodePixel(bytes, format) {
  const bits = bytes[10] | (bytes[11] << 8) | (bytes[12] << 16) | (bytes[13] << 24);
  const outlineMode = format === "legacy-v4" ? (bytes[13] >> 4) & 3 : (bytes[2] & 0x20) === 0x20 ? 1 : 0;
  return {
    format: format,
    style: bytes[2] & 0xf,
    followRecoil: (bytes[2] & 0x10) === 0x10,
    centerDotEnabled: (bytes[2] & 0x40) === 0x40,
    tStyleEnabled: (bytes[2] & 0x80) === 0x80,
    red: bytes[3],
    green: bytes[4],
    blue: bytes[5],
    alpha: bytes[6],
    gap: bytes[7],
    length: bytes[8],
    thickness: (bits >> 23) & 0x1f,
    outlineMode: outlineMode,
    outlineRed: 0,
    outlineGreen: 0,
    outlineBlue: 0,
    outlineAlpha: 255,
  };
}

function visualModel(crosshair) {
  const pixelFormat = crosshair.format !== "legacy-v1";
  const scale = pixelFormat ? 4 : 10;
  const gap = crosshair.format === "legacy-v1" ? crosshair.gap * scale : Math.max(-40, crosshair.gap) * (crosshair.gap < 0 ? 4 : scale);
  const length = Math.max(4, (pixelFormat ? crosshair.length : crosshair.length) * scale);
  const thickness = Math.max(2, (pixelFormat ? crosshair.thickness : crosshair.thickness) * (pixelFormat ? 4 : 8));
  return {
    gap: gap,
    length: length,
    thickness: thickness,
    dot: !!crosshair.centerDotEnabled,
    tStyle: !!crosshair.tStyleEnabled,
    red: crosshair.red,
    green: crosshair.green,
    blue: crosshair.blue,
    alpha: crosshair.alpha == null ? 255 : crosshair.alpha,
    outline: (crosshair.outlineMode || 0) > 0,
    outlinePad: crosshair.outlineMode === 2 ? 1 : 2,
    outlineRed: crosshair.outlineRed || 0,
    outlineGreen: crosshair.outlineGreen || 0,
    outlineBlue: crosshair.outlineBlue || 0,
    outlineAlpha: crosshair.outlineAlpha == null ? 255 : crosshair.outlineAlpha,
  };
}

function styleLabel(crosshair) {
  if (crosshair.format === "cs2-v1" || crosshair.format === "legacy-v3" || crosshair.format === "legacy-v4") {
    return ["Dynamic cross", "Dynamic circle", "Dynamic cross (legacy)", "Static circle", "Static cross", "Static cross, shot feedback", "Dot only", "Dynamic quad", "Static square", "Static quad"][crosshair.style] || "Crosshair";
  }
  return ["Default", "Default static", "Classic", "Classic dynamic", "Classic static"][crosshair.style] || "Classic";
}

function rgbLabel(crosshair) {
  const hex = [crosshair.red, crosshair.green, crosshair.blue]
    .map(function (n) {
      return clamp(n | 0, 0, 255).toString(16).padStart(2, "0");
    })
    .join("");
  return "#" + hex;
}

function charsToBytes(chars, byteLength) {
  let big = 0n;
  const reversed = Array.from(chars).reverse();
  for (let i = 0; i < reversed.length; i++) {
    const idx = DICTIONARY.indexOf(reversed[i]);
    if (idx < 0) throw new Error("That crosshair code has a character CS2 does not use.");
    big = big * BASE + BigInt(idx);
  }
  const out = new Array(byteLength).fill(0);
  for (let i = byteLength - 1; i >= 0; i--) {
    out[i] = Number(big & 0xffn);
    big >>= 8n;
  }
  return out;
}

function bytesToChars(bytes, charCount) {
  let total = 0n;
  for (let i = 0; i < bytes.length; i++) total = (total << 8n) + BigInt(bytes[i] & 0xff);
  let chars = "";
  for (let i = 0; i < charCount; i++) {
    const rem = total % BASE;
    chars += DICTIONARY[Number(rem)];
    total = total / BASE;
  }
  return chars;
}

function assertChecksum(bytes) {
  if ((sum(bytes.slice(1)) & 0xff) !== bytes[0]) throw new Error("That crosshair code does not check out.");
}

function sum(list) {
  return list.reduce(function (a, b) {
    return a + b;
  }, 0);
}

function int8(n) {
  return (n << 24) >> 24;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
