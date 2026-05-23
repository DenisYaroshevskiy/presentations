class SlideDiagram {
  static #W = 880;
  static #H = 460;
  static #STROKE = '#1e1e1e';
  static #FONT = 'Excalifont, cursive';

  #svg;
  #steps = [];

  constructor(opts) {
    const section = document.currentScript.closest('section');
    this.#svg = SlideDiagram.#makeSvg(section);
    SlideDiagram.#drawBlank(this.#svg, opts.title);
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
