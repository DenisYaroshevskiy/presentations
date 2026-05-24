const _onReady = [];

function _initAll() {
  for (const cb of _onReady) cb();
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    if (Reveal.isReady()) _initAll();
    else Reveal.on('ready', _initAll);
  } catch(e) {
    console.error('[diagram]', e);
  }
});

class SlideDiagram {
  static #W = 880;
  static #H = 460;
  static #STROKE = '#1e1e1e';
  static #FONT = 'Excalifont, cursive';
  static #DURATION = 500;

  #section;
  #svg;
  #steps = [[]];
  #elements = {};

  constructor(opts) {
    this.#section = document.currentScript.closest('section');
    this.#svg = SlideDiagram.#makeSvg(this.#section);
    SlideDiagram.#drawBlank(this.#svg, opts.title);
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

  addArrow(opts) {
    this.#steps.at(-1).push({type: 'addArrow', ...opts});
    return this;
  }

  animateMove(opts) {
    this.#steps.at(-1).push({type: 'animateMove', ...opts});
    return this;
  }

  #init() {
    const nFragments = this.#steps.length - 1;
    for (let i = 0; i < nFragments; i++) {
      const span = document.createElement('span');
      span.className = 'fragment';
      this.#section.appendChild(span);
    }

    let current = 0;

    Reveal.on('fragmentshown', e => {
      if (!this.#section.contains(e.fragment)) return;
      current++;
      this.#applyStep(this.#steps[current], 1);
    });

    Reveal.on('fragmenthidden', e => {
      if (!this.#section.contains(e.fragment)) return;
      this.#applyStep(this.#steps[current], -1);
      current--;
    });

    Reveal.on('slidechanged', e => {
      if (e.currentSlide === this.#section) current = 0;
    });
  }

  #applyStep(ops, direction) {
    for (const op of ops) {
      if (op.type === 'addBox')   this.#applyAddBox(op, direction);
      if (op.type === 'addArrow') this.#applyAddArrow(op, direction);
      if (op.type === 'animateMove') this.#applyMoveBox(op, direction);
    }
  }

  #applyAddArrow(op, direction) {
    if (direction === 1) {
      const rc = rough.svg(this.#svg);
      const {x1, y1, x2, y2} = op;
      const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx*dx + dy*dy);
      const ex = x2 - (dx/len)*6, ey = y2 - (dy/len)*6;
      const a = Math.atan2(dy, dx), h = 10;
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.appendChild(rc.line(x1, y1, ex, ey, {stroke: SlideDiagram.#STROKE, strokeWidth: 1.5, roughness: 0.8}));
      group.appendChild(rc.line(x2, y2, x2 - h*Math.cos(a-0.4), y2 - h*Math.sin(a-0.4), {stroke: SlideDiagram.#STROKE, strokeWidth: 1.5, roughness: 0.3}));
      group.appendChild(rc.line(x2, y2, x2 - h*Math.cos(a+0.4), y2 - h*Math.sin(a+0.4), {stroke: SlideDiagram.#STROKE, strokeWidth: 1.5, roughness: 0.3}));
      this.#svg.appendChild(group);
      this.#elements[op.name] = {group, drawnX: 0, drawnY: 0, x: 0, y: 0};
    } else {
      const el = this.#elements[op.name];
      if (el) { el.group.remove(); delete this.#elements[op.name]; }
    }
  }

  #applyAddBox(op, direction) {
    if (direction === 1) {
      const rc = rough.svg(this.#svg);
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
      this.#svg.appendChild(group);
      this.#elements[op.name] = {group, drawnX: op.x, drawnY: op.y, x: op.x, y: op.y};
    } else {
      const el = this.#elements[op.name];
      if (el) { el.group.remove(); delete this.#elements[op.name]; }
    }
  }

  #applyMoveBox(op, direction) {
    const el = this.#elements[op.name];
    if (!el) return;

    if (direction === 1) {
      const toX = op.x, toY = op.y ?? el.y;
      op._savedX = el.x;
      op._savedY = el.y;
      SlideDiagram.#animate(el.group,
        el.x - el.drawnX, el.y - el.drawnY,
        toX  - el.drawnX, toY  - el.drawnY);
      el.x = toX;
      el.y = toY;
    } else {
      const toX = op._savedX, toY = op._savedY;
      SlideDiagram.#animate(el.group,
        el.x - el.drawnX, el.y - el.drawnY,
        toX  - el.drawnX, toY  - el.drawnY);
      el.x = toX;
      el.y = toY;
    }
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
