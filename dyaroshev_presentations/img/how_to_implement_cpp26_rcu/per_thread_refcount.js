(function() {
  const STROKE = '#1e1e1e';
  const TC = '#a8c9e8';
  const RC = '#f5c518';
  const IC = '#d0d0d0';
  const SYN = '#e8a0a0';

  const HOPT = {roughness: 1.3, stroke: STROKE, fillStyle: 'hachure', hachureAngle: -41, hachureGap: 7, fillWeight: 1.5};

  const TH = [
    {cx: 130, cy: 155, r: 50, lbl: 'T1'},
    {cx: 430, cy: 155, r: 50, lbl: 'T2'},
    {cx: 730, cy: 155, r: 50, lbl: 'T3'},
  ];

  const SYNC_BOX = {x: 310, y: 15, w: 240, h: 44};

  const CB = [
    {x: 80,  y: 265, w: 100, h: 44},
    {x: 380, y: 265, w: 100, h: 44},
    {x: 680, y: 265, w: 100, h: 44},
  ];

  function txt(ctx, text, x, y, font) {
    ctx.font = font || 'bold 16px sans-serif';
    ctx.fillStyle = STROKE;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  function thread(rc, ctx, t) {
    rc.circle(t.cx, t.cy, t.r * 2, {...HOPT, fill: TC});
    txt(ctx, t.lbl, t.cx, t.cy);
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

  function drawCounts(rc, ctx, vals, colors) {
    CB.forEach((c, i) => {
      hbox(rc, ctx, c, colors[i], vals[i]);
      arrow(rc, TH[i].cx, TH[i].cy + TH[i].r, cx(c), c.y, STROKE);
    });
    dashedLine(ctx, CB[0].x + CB[0].w, cy(CB[0]), CB[1].x, cy(CB[1]));
    dashedLine(ctx, CB[1].x + CB[1].w, cy(CB[1]), CB[2].x, cy(CB[2]));
  }

  function drawState(n) {
    const canvas = document.getElementById('rcu-canvas');
    if (!canvas || typeof rough === 'undefined') return;
    const ctx = canvas.getContext('2d');
    const rc = rough.canvas(canvas);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    TH.forEach(t => thread(rc, ctx, t));

    if (n === 0) {
      hbox(rc, ctx, SYNC_BOX, RC, 'ref_count');
      TH.forEach(t => arrow(rc, t.cx, t.cy - t.r, cx(SYNC_BOX), SYNC_BOX.y + SYNC_BOX.h, STROKE));

    } else if (n === 1) {
      drawCounts(rc, ctx, ['cnt: 0', 'cnt: 0', 'cnt: 0'], [IC, IC, IC]);

    } else if (n === 2) {
      drawCounts(rc, ctx,
        ['cnt: 1', 'cnt: 2', 'cnt: 1'],
        [RC, IC, RC]);

    } else if (n === 3) {
      drawCounts(rc, ctx,
        ['cnt: 1', 'cnt: 2', 'cnt: 1'],
        [RC, IC, RC]);
      hbox(rc, ctx, SYNC_BOX, SYN, 'synchronize()');
      arrow(rc, cx(SYNC_BOX), SYNC_BOX.y + SYNC_BOX.h, TH[0].cx, TH[0].cy - TH[0].r, STROKE);
      arrow(rc, cx(SYNC_BOX), SYNC_BOX.y + SYNC_BOX.h, TH[2].cx, TH[2].cy - TH[2].r, STROKE);
    }
  }

  let rcuState = 0;

  function tryDraw() {
    if (typeof rough === 'undefined') { setTimeout(tryDraw, 100); return; }
    drawState(0);
  }

  Reveal.on('ready', tryDraw);
  Reveal.on('slidechanged', e => {
    if (e.currentSlide.id === 'rcu-diagram') { rcuState = 0; drawState(0); }
  });
  Reveal.on('fragmentshown', e => {
    if (e.fragment.closest('#rcu-diagram')) { rcuState++; drawState(rcuState); }
  });
  Reveal.on('fragmenthidden', e => {
    if (e.fragment.closest('#rcu-diagram')) { rcuState--; drawState(rcuState); }
  });
})();
