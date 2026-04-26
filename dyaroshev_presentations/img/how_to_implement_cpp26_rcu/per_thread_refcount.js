(function() {
  const STROKE = '#1e1e1e';
  const TC = '#a8c9e8';
  const RC = '#f5c518';
  const IC = '#d0d0d0';
  const SYN = '#e8a0a0';
  const NC = '#b8e8b8';

  const HOPT = {roughness: 1.3, stroke: STROKE, fillStyle: 'hachure', hachureAngle: -41, hachureGap: 7, fillWeight: 1.5};

  const TH = [
    {cx: 110, cy: 155, r: 42, lbl: 'T1'},
    {cx: 360, cy: 155, r: 42, lbl: 'T2'},
    {cx: 610, cy: 155, r: 42, lbl: 'T3'},
  ];

  const CB = [
    {x: 65,  y: 262, w: 90, h: 40},
    {x: 315, y: 262, w: 90, h: 40},
    {x: 565, y: 262, w: 90, h: 40},
  ];

  const CFG_PTR  = {x: 660, y: 15, w: 55,  h: 34};
  const CFG_NEW  = {x: 745, y: 15, w: 95,  h: 34};
  const CFG_OLD  = {x: 745, y: 65, w: 95,  h: 34};
  const WAIT_BOX = {x: 688, y: 175, w: 162, h: 50};

  // cfg: 'current' | 'updated' | 'delete'
  // waiting: null | { sub: string } | 'done'
  const STATES = [
    { counts: ['cnt: 0', 'cnt: 0', 'cnt: 0'], reading: [false, false, false], cfg: 'current'  },
    { counts: ['cnt: 4', 'cnt: 6', 'cnt: 4'], reading: [false, false, false], cfg: 'current'  },
    { counts: ['cnt: 4', 'cnt: 6', 'cnt: 4'], reading: [false, false, false], cfg: 'updated'  },
    { counts: ['cnt: 5', 'cnt: 6', 'cnt: 5'], reading: [true,  false, true],  cfg: 'updated',  waiting: {sub: 'was: 5, 6, 5'} },
    { counts: ['cnt: 6', 'cnt: 6', 'cnt: 6'], reading: [false, false, false], cfg: 'updated',  waiting: 'done' },
    { counts: ['cnt: 6', 'cnt: 6', 'cnt: 6'], reading: [false, false, false], cfg: 'delete'   },
  ];

  function txt(ctx, text, x, y, font) {
    ctx.font = font || 'bold 16px sans-serif';
    ctx.fillStyle = STROKE;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function hbox(rc, ctx, b, fill, text) {
    rc.rectangle(b.x, b.y, b.w, b.h, {...HOPT, fill});
    txt(ctx, text, cx(b), cy(b), 'bold 13px monospace');
  }

  function dashedLine(ctx, x1, y1, x2, y2) {
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = STROKE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawBase(rc, ctx, canvas) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    rc.rectangle(3, 3, canvas.width - 6, canvas.height - 6, {
      stroke: STROKE, strokeWidth: 2, roughness: 0.6
    });
    txt(ctx, 'alternative to a single ref count', canvas.width / 2, 22, 'bold 15px sans-serif');
  }

  function drawCounts(rc, ctx, counts, reading) {
    TH.forEach(t => {
      rc.circle(t.cx, t.cy, t.r * 2, {...HOPT, fill: TC});
      txt(ctx, t.lbl, t.cx, t.cy);
    });
    CB.forEach((c, i) => {
      hbox(rc, ctx, c, reading[i] ? RC : IC, counts[i]);
      arrow(rc, TH[i].cx, TH[i].cy + TH[i].r, cx(c), c.y, STROKE);
    });
    dashedLine(ctx, CB[0].x + CB[0].w, cy(CB[0]), CB[1].x, cy(CB[1]));
    dashedLine(ctx, CB[1].x + CB[1].w, cy(CB[1]), CB[2].x, cy(CB[2]));
  }

  function drawCfg(rc, ctx, cfgState) {
    hbox(rc, ctx, CFG_PTR, IC, 'cfg_');
    arrow(rc, CFG_PTR.x + CFG_PTR.w, cy(CFG_PTR), CFG_NEW.x, cy(CFG_NEW), STROKE);
    hbox(rc, ctx, CFG_NEW, cfgState === 'current' ? RC : NC, 'Config');
    if (cfgState === 'updated' || cfgState === 'delete') {
      hbox(rc, ctx, CFG_OLD, IC, 'Config');
      txt(ctx, '(old)', cx(CFG_OLD), CFG_OLD.y + CFG_OLD.h + 10, 'italic 11px sans-serif');
    }
    if (cfgState === 'delete') {
      ctx.save();
      ctx.strokeStyle = '#cc0000';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(CFG_OLD.x + 5, CFG_OLD.y + 5);
      ctx.lineTo(CFG_OLD.x + CFG_OLD.w - 5, CFG_OLD.y + CFG_OLD.h - 5);
      ctx.moveTo(CFG_OLD.x + CFG_OLD.w - 5, CFG_OLD.y + 5);
      ctx.lineTo(CFG_OLD.x + 5, CFG_OLD.y + CFG_OLD.h - 5);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawWaiting(rc, ctx, waiting) {
    if (!waiting) return;
    if (waiting === 'done') {
      hbox(rc, ctx, WAIT_BOX, NC, 'done!');
    } else {
      rc.rectangle(WAIT_BOX.x, WAIT_BOX.y, WAIT_BOX.w, WAIT_BOX.h, {...HOPT, fill: SYN});
      txt(ctx, 'waiting', cx(WAIT_BOX), WAIT_BOX.y + WAIT_BOX.h * 0.33, 'bold 12px monospace');
      txt(ctx, waiting.sub, cx(WAIT_BOX), WAIT_BOX.y + WAIT_BOX.h * 0.70, '11px sans-serif');
    }
  }

  function drawSchema(rc, ctx, canvas, {counts, reading, cfg, waiting}) {
    drawBase(rc, ctx, canvas);
    drawCounts(rc, ctx, counts, reading);
    drawCfg(rc, ctx, cfg);
    drawWaiting(rc, ctx, waiting);
  }

  function setupDiagram(slideId, canvasId, states) {
    let currentState = 0;

    function draw(n) {
      const canvas = document.getElementById(canvasId);
      if (!canvas || typeof rough === 'undefined') return;
      drawSchema(rough.canvas(canvas), canvas.getContext('2d'), canvas, states[n]);
    }

    Reveal.on('ready', () => {
      const slide = document.getElementById(slideId);
      slide.querySelectorAll(':scope > span.fragment').forEach(el => el.remove());
      for (let i = 1; i < states.length; i++) {
        const span = document.createElement('span');
        span.className = 'fragment';
        slide.appendChild(span);
      }
      if (typeof rough === 'undefined') {
        (function tryDraw() {
          if (typeof rough === 'undefined') { setTimeout(tryDraw, 100); return; }
          draw(0);
        })();
      } else {
        draw(0);
      }
    });

    Reveal.on('slidechanged', e => {
      if (e.currentSlide.id === slideId) { currentState = 0; draw(0); }
    });
    Reveal.on('fragmentshown', e => {
      if (e.fragment.closest('#' + slideId)) { currentState++; draw(currentState); }
    });
    Reveal.on('fragmenthidden', e => {
      if (e.fragment.closest('#' + slideId)) { currentState--; draw(currentState); }
    });
  }

  setupDiagram('rcu-diagram', 'rcu-canvas', STATES);
})();
