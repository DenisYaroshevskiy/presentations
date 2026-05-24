const _onReady = [];

document.addEventListener('DOMContentLoaded', () => {
  try {
    const init = () => {
      for (const cb of _onReady) cb();
      Reveal.sync();
      Reveal.layout();
    };
    if (Reveal.isReady()) init();
    else Reveal.on('ready', init);
  } catch(e) {
    console.error('[diagram]', e);
  }
});

class SlideDiagram {
  static COLORS = {
    blue:   '#a8c9e8',
    yellow: '#f5c518',
    gray:   '#d0d0d0',
    green:  '#b8e8b8',
    red:    '#e8a0a0',
  };

  static #W = 880;
  static #H = 460;
  static #STROKE = '#1e1e1e';
  static #FONT = 'Excalifont, cursive';
  static #DURATION = 500;

  #section;
  #title;
  #steps = [[]];
  #subSections = [];

  constructor(opts) {
    this.#section = document.currentScript.closest('section');
    this.#title = opts.title;
    _onReady.push(() => this.#init());
  }

  step() {
    this.#steps.push([]);
    return this;
  }

  addBox(opts) {
    this.#steps.at(-1).push({type: 'addBox', ...opts});
    return this;
  }

  changeBox(opts) {
    this.#steps.at(-1).push({type: 'changeBox', ...opts});
    return this;
  }

  addArrow(opts) {
    this.#steps.at(-1).push({type: 'addArrow', ...opts});
    return this;
  }

  addCircle(opts) {
    this.#steps.at(-1).push({type: 'addCircle', ...opts});
    return this;
  }

  animateMove(opts) {
    this.#steps.at(-1).push({type: 'animateMove', ...opts});
    return this;
  }

  unselect(names) {
    this.#steps.at(-1).push({type: 'unselect', names});
    return this;
  }

  hide(names) {
    this.#steps.at(-1).push({type: 'hide', names});
    return this;
  }

  reselect(names) {
    this.#steps.at(-1).push({type: 'reselect', names});
    return this;
  }

  addLine(opts) {
    this.#steps.at(-1).push({type: 'addLine', ...opts});
    return this;
  }

  addText(opts) {
    this.#steps.at(-1).push({type: 'addText', ...opts});
    return this;
  }

  #init() {
    for (let i = 0; i < this.#steps.length; i++) {
      const sub = document.createElement('section');
      sub.setAttribute('data-transition', 'none');
      this.#section.appendChild(sub);
      this.#subSections.push(sub);
      this.#renderAt(i, false);
    }

    Reveal.on('slidechanged', e => {
      const cur  = this.#subSections.indexOf(e.currentSlide);
      if (cur === -1) return;
      const prev = this.#subSections.indexOf(e.previousSlide);
      this.#renderAt(cur, cur > prev && prev !== -1);
    });
  }

  #renderAt(stepIdx, animate) {
    const sub = this.#subSections[stepIdx];
    sub.innerHTML = '';
    const svg = SlideDiagram.#makeSvg(sub);
    SlideDiagram.#drawBlank(svg, this.#title);

    const elements = {};
    for (let i = 1; i < stepIdx; i++) {
      this.#applyStep(svg, elements, this.#steps[i], false);
    }
    if (stepIdx > 0) {
      this.#applyStep(svg, elements, this.#steps[stepIdx], animate);
    }
  }

  #applyStep(svg, elements, ops, animate) {
    for (const op of ops) {
      if (op.type === 'addBox')      this.#applyAddBox(svg, elements, op);
      if (op.type === 'addArrow')    this.#applyAddArrow(svg, elements, op);
      if (op.type === 'addCircle')   this.#applyAddCircle(svg, elements, op);
      if (op.type === 'animateMove') this.#applyAnimateMove(svg, elements, op, animate);
      if (op.type === 'unselect')    this.#applyUnselect(elements, op);
      if (op.type === 'hide')        this.#applyHide(elements, op);
      if (op.type === 'reselect')   this.#applyReselect(elements, op);
      if (op.type === 'changeBox')  this.#applyChangeBox(svg, elements, op);
      if (op.type === 'addLine')     this.#applyAddLine(svg, elements, op);
      if (op.type === 'addText')     this.#applyAddText(svg, elements, op);
    }
  }

  #applyAddBox(svg, elements, op) {
    const rc = rough.svg(svg);
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.appendChild(rc.rectangle(op.x, op.y, op.w, op.h, {
      roughness: 1.3,
      fill: op.color ?? '#a8c9e8',
      fillStyle: 'hachure',
      hachureAngle: -41,
      hachureGap: 7,
      fillWeight: 1.5,
      stroke: SlideDiagram.#STROKE,
    }));
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', op.x + op.w / 2);
    t.setAttribute('y', op.y + op.h / 2);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('font-family', SlideDiagram.#FONT);
    t.setAttribute('font-size', '18');
    t.setAttribute('fill', SlideDiagram.#STROKE);
    t.textContent = op.text ?? '';
    group.appendChild(t);
    svg.appendChild(group);
    elements[op.name] = {group, drawnX: op.x, drawnY: op.y, x: op.x, y: op.y, opts: op};
  }

  #applyChangeBox(svg, elements, op) {
    const existing = elements[op.name];
    if (!existing) return;
    existing.group.remove();
    this.#applyAddBox(svg, elements, {...existing.opts, ...op, x: existing.x, y: existing.y});
  }

  #applyAddArrow(svg, elements, op) {
    const rc = rough.svg(svg);
    const {x1, y1, x2, y2} = op;
    const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx*dx + dy*dy);
    const ex = x2 - (dx/len)*6, ey = y2 - (dy/len)*6;
    const a = Math.atan2(dy, dx), h = 10;
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.appendChild(rc.line(x1, y1, ex, ey, {stroke: SlideDiagram.#STROKE, strokeWidth: 1.5, roughness: 0.8}));
    group.appendChild(rc.line(x2, y2, x2 - h*Math.cos(a-0.4), y2 - h*Math.sin(a-0.4), {stroke: SlideDiagram.#STROKE, strokeWidth: 1.5, roughness: 0.3}));
    group.appendChild(rc.line(x2, y2, x2 - h*Math.cos(a+0.4), y2 - h*Math.sin(a+0.4), {stroke: SlideDiagram.#STROKE, strokeWidth: 1.5, roughness: 0.3}));
    svg.appendChild(group);
    elements[op.name] = {group, drawnX: 0, drawnY: 0, x: 0, y: 0};
  }

  #applyAddCircle(svg, elements, op) {
    const rc = rough.svg(svg);
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.appendChild(rc.circle(op.cx, op.cy, op.r * 2, {
      roughness: 1.3,
      fill: op.color ?? '#a8c9e8',
      fillStyle: 'hachure',
      hachureAngle: -41,
      hachureGap: 7,
      fillWeight: 1.5,
      stroke: SlideDiagram.#STROKE,
    }));
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', op.cx);
    t.setAttribute('y', op.cy);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('font-family', SlideDiagram.#FONT);
    t.setAttribute('font-size', '18');
    t.setAttribute('fill', SlideDiagram.#STROKE);
    t.textContent = op.text ?? '';
    group.appendChild(t);
    svg.appendChild(group);
    elements[op.name] = {group, drawnX: op.cx, drawnY: op.cy, x: op.cx, y: op.cy};
  }

  #applyUnselect(elements, op) {
    for (const name of op.names) {
      const el = elements[name];
      if (el) el.group.style.opacity = '0.3';
    }
  }

  #applyHide(elements, op) {
    for (const name of op.names) {
      const el = elements[name];
      if (el) el.group.style.display = 'none';
    }
  }

  #applyReselect(elements, op) {
    for (const name of op.names) {
      const el = elements[name];
      if (el) el.group.style.opacity = '1';
    }
  }

  #applyAddLine(svg, elements, op) {
    const rc = rough.svg(svg);
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const opts = {stroke: SlideDiagram.#STROKE, strokeWidth: 1.5, roughness: 0.8};
    if (op.dashed) opts.strokeLineDash = [8, 6];
    group.appendChild(rc.line(op.x1, op.y1, op.x2, op.y2, opts));
    svg.appendChild(group);
    elements[op.name] = {group, drawnX: 0, drawnY: 0, x: 0, y: 0};
  }

  #applyAddText(svg, elements, op) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', op.x);
    t.setAttribute('y', op.y);
    t.setAttribute('text-anchor', op.anchor ?? 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('font-family', SlideDiagram.#FONT);
    t.setAttribute('font-size', op.size ?? 16);
    t.setAttribute('fill', op.color ?? SlideDiagram.#STROKE);
    t.textContent = op.text;
    group.appendChild(t);
    svg.appendChild(group);
    elements[op.name] = {group, drawnX: op.x, drawnY: op.y, x: op.x, y: op.y};
  }

  #applyAnimateMove(svg, elements, op, animate) {
    const el = elements[op.name];
    if (!el) return;
    const toX = op.x, toY = op.y ?? el.y;
    if (animate) {
      SlideDiagram.#animate(el.group, el.x - el.drawnX, el.y - el.drawnY, toX - el.drawnX, toY - el.drawnY);
    } else {
      el.group.setAttribute('transform', `translate(${toX - el.drawnX}, ${toY - el.drawnY})`);
    }
    el.x = toX;
    el.y = toY;
  }

  static #animate(el, fromDx, fromDy, toDx, toDy) {
    const start = performance.now();
    const dur = SlideDiagram.#DURATION;
    function frame(now) {
      const t = SlideDiagram.#ease(Math.min((now - start) / dur, 1));
      el.setAttribute('transform', `translate(${fromDx + (toDx - fromDx) * t}, ${fromDy + (toDy - fromDy) * t})`);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  static #ease(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  static #makeSvg(section) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', SlideDiagram.#W);
    svg.setAttribute('height', SlideDiagram.#H);
    svg.style.display = 'block';
    svg.style.margin = '0 auto';
    section.appendChild(svg);
    return svg;
  }

  static #drawBlank(svg, title) {
    const rc = rough.svg(svg);
    const W = SlideDiagram.#W, H = SlideDiagram.#H;

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', W);
    bg.setAttribute('height', H);
    bg.setAttribute('fill', 'white');
    svg.appendChild(bg);

    svg.appendChild(rc.rectangle(4, 4, W - 8, H - 8, {
      roughness: 0.5,
      stroke: SlideDiagram.#STROKE,
      strokeWidth: 1.5,
    }));

    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', W / 2);
    t.setAttribute('y', 36);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('font-family', SlideDiagram.#FONT);
    t.setAttribute('font-size', '26');
    t.setAttribute('fill', SlideDiagram.#STROKE);
    t.textContent = title;
    svg.appendChild(t);
  }
}
