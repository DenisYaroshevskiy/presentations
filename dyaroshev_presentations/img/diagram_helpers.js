const ROUGHNESS = 1.2;
const ARROW_COLOR = '#999999';

function cx(b) { return b.x + b.w / 2; }
function cy(b) { return b.y + b.h / 2; }

function box(rc, ctx, b, color, text) {
  rc.rectangle(b.x, b.y, b.w, b.h, {
    fill: color, fillStyle: 'solid', stroke: color,
    roughness: ROUGHNESS, fillWeight: 2,
  });
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = '#111122';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx(b), cy(b));
}

function arrow(rc, x1, y1, x2, y2, color) {
  color = color || ARROW_COLOR;
  const dx = x2-x1, dy = y2-y1, len = Math.sqrt(dx*dx + dy*dy);
  const ex = x2 - (dx/len)*6, ey = y2 - (dy/len)*6;
  rc.line(x1, y1, ex, ey, {stroke: color, strokeWidth: 1.5, roughness: 0.8});
  const a = Math.atan2(dy, dx), h = 10;
  rc.line(x2, y2, x2-h*Math.cos(a-0.4), y2-h*Math.sin(a-0.4), {stroke: color, strokeWidth: 1.5, roughness: 0.3});
  rc.line(x2, y2, x2-h*Math.cos(a+0.4), y2-h*Math.sin(a+0.4), {stroke: color, strokeWidth: 1.5, roughness: 0.3});
}

function lbl(ctx, text, x, y, color, size, align) {
  ctx.font = (size || 13) + 'px sans-serif';
  ctx.fillStyle = color || '#dddddd';
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}
