/* Paado Island ticket renderer: draws a ticket (with QR) onto a canvas.
   Needs qrcode.js (qrcode-generator). Usage: await PaadoTicket.draw(ticket, opts) -> canvas */
(function () {
  const THEMES = {
    sand:   { bg1: '#ffc23d', bg2: '#ff8a1a', sun: '#ffefc2', edge: '#0f3440', chip: '#0f3440', chipTx: '#ffffff', ink: '#0b0b0b', accent: '#0f3440' },
    sky:    { bg1: '#bfe7ff', bg2: '#4fb3f0', sun: '#ffc93d', edge: '#0f3440', chip: '#ffc23d', chipTx: '#0b0b0b', ink: '#0b0b0b', accent: '#0f3440' },
    lagoon: { bg1: '#0f6b70', bg2: '#03211f', sun: '#ffb21f', edge: '#ffb21f', chip: '#ffb21f', chipTx: '#0b0b0b', ink: '#fff8ea', accent: '#ffb21f' },
    sunset: { bg1: '#ff8a3d', bg2: '#c2305e', sun: '#ffd23f', edge: '#1a0f2a', chip: '#1a0f2a', chipTx: '#ffb21f', ink: '#fff8ea', accent: '#1a0f2a' },
  };
  const W = 1200, H = 480, STUB = 880;

  function qrMatrix(text) {
    const q = qrcode(0, 'M'); q.addData(text); q.make();
    const n = q.getModuleCount(), m = [];
    for (let r = 0; r < n; r++) { m.push([]); for (let c = 0; c < n; c++) m[r].push(q.isDark(r, c)); }
    return m;
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function palm(ctx, x, base, h, lean, col) {
    ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = col;
    const topX = x + lean, topY = base - h;
    ctx.lineWidth = Math.max(4, h * 0.045); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + lean * 0.2, base - h * 0.5, topX, topY); ctx.stroke();
    const fr = [[-1, -0.15], [-0.85, 0.35], [-0.4, 0.6], [1, -0.1], [0.8, 0.4], [0.35, 0.65], [0, -0.55]];
    for (const [dx, dy] of fr) {
      const ex = topX + dx * h * 0.42, ey = topY + dy * h * 0.32 + h * 0.06;
      ctx.beginPath(); ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(topX + dx * h * 0.25, topY - h * 0.12, ex, ey);
      ctx.quadraticCurveTo(topX + dx * h * 0.22, topY - h * 0.02, topX, topY + 2);
      ctx.fill();
    }
    ctx.restore();
  }
  function zigzag(ctx, x, up, col, line) {
    // vertical sawtooth band on left/right edge
    const s = 40; ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = line; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, 0);
    for (let y = 0; y <= H; y += s) { ctx.lineTo(x + up, y + s / 2); ctx.lineTo(x, y + s); }
    ctx.lineTo(x, H); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }

  async function draw(t, opts = {}) {
    const theme = THEMES[opts.color || t.color || (t.people > 1 ? 'sky' : 'sand')] || THEMES.sand;
    const ev = Object.assign({ edition: '4th Edition', time: '12PM', date: '28TH NOV', venue: 'PAADO ISLAND, WINNEBA', url: location.origin + location.pathname.replace(/[^/]*$/, '') }, opts.event || {});
    try { await Promise.all([document.fonts.load('64px Anton'), document.fonts.load('800 20px "Bricolage Grotesque"')]); } catch (e) {}
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    // ticket shape with notches
    ctx.save(); rr(ctx, 0, 0, W, H, 28); ctx.clip();
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, theme.bg1); g.addColorStop(1, theme.bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // subtle sand texture
    ctx.globalAlpha = .07; ctx.fillStyle = '#000';
    for (let i = 0; i < 1400; i++) { ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    ctx.globalAlpha = 1;
    // sun
    ctx.save(); ctx.shadowColor = theme.sun; ctx.shadowBlur = 50; ctx.fillStyle = theme.sun;
    ctx.beginPath(); ctx.arc(170, 110, 62, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // hill + palms
    ctx.fillStyle = theme.edge; ctx.globalAlpha = .9;
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 400); ctx.quadraticCurveTo(220, 360, 420, 410); ctx.quadraticCurveTo(620, 450, STUB, 420); ctx.lineTo(STUB, H); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    palm(ctx, 70, 430, 270, 30, theme.edge); palm(ctx, 160, 430, 200, -25, theme.edge); palm(ctx, 245, 440, 150, 18, theme.edge);
    zigzag(ctx, 0, 26, theme.edge, '#ffb21f');
    // title block
    const X = 330;
    ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    ctx.font = '74px Anton'; ctx.lineWidth = 12; ctx.strokeStyle = theme.accent; ctx.fillStyle = '#fff8ea';
    ctx.strokeText('PAADO ISLAND', X, 130); ctx.fillText('PAADO ISLAND', X, 130);
    ctx.font = '54px Anton'; ctx.fillStyle = '#9be15d'; ctx.strokeText('EXPERIENCE', X, 192); ctx.fillText('EXPERIENCE', X, 192);
    ctx.font = '800 20px "Bricolage Grotesque", sans-serif'; ctx.fillStyle = theme.accent; ctx.letterSpacing = '4px';
    ctx.fillText(String(ev.edition).toUpperCase(), X + 2, 226); ctx.letterSpacing = '0px';
    // chips
    function chip(x, y, w, label, val) {
      rr(ctx, x, y, w, 68, 16); ctx.fillStyle = theme.chip; ctx.fill();
      ctx.fillStyle = theme.chipTx; ctx.font = '800 14px "Bricolage Grotesque", sans-serif'; ctx.fillText(label, x + 18, y + 25);
      ctx.font = '30px Anton'; ctx.fillText(val, x + 18, y + 57);
    }
    chip(X, 250, 150, 'TIME', ev.time); chip(X + 166, 250, 190, 'DATE', String(ev.date).toUpperCase());
    rr(ctx, X, 330, 356, 42, 14); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
    ctx.fillStyle = '#0b0b0b'; ctx.font = '22px Anton'; ctx.fillText(String(ev.venue).toUpperCase(), X + 16, 360);
    // holder
    ctx.fillStyle = theme.edge === '#ffb21f' ? '#0b0b0b' : '#fff8ea'; ctx.font = '800 17px "Bricolage Grotesque", sans-serif';
    const holder = (t.name || '').toUpperCase().slice(0, 28);
    ctx.fillText('ADMIT: ' + holder, X, 408);
    ctx.font = '800 14px "Bricolage Grotesque", sans-serif'; ctx.globalAlpha = .75;
    ctx.fillText('TICKET ' + t.code + (t.qty > 1 ? '  ·  ' + t.qty + ' × ' + (t.tier_name || '') : ''), X, 432);
    ctx.globalAlpha = 1;
    // stub
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(STUB, 0, W - STUB, H);
    ctx.setLineDash([14, 12]); ctx.strokeStyle = theme.accent; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(STUB, 30); ctx.lineTo(STUB, H - 30); ctx.stroke(); ctx.setLineDash([]);
    zigzag(ctx, W, -26, theme.edge, '#ffb21f');
    // QR
    const url = ev.url + '?t=' + encodeURIComponent(t.code);
    const m = qrMatrix(url), n = m.length, box = 214, cell = Math.floor(box / (n + 2)), qs = cell * (n + 2);
    const qx = STUB + 34, qy = 40;
    rr(ctx, qx, qy, qs, qs, 14); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.fillStyle = '#0b0b0b';
    for (let r = 0; r < n; r++) for (let cc = 0; cc < n; cc++) if (m[r][cc]) ctx.fillRect(qx + cell * (cc + 1), qy + cell * (r + 1), cell, cell);
    // tier + price
    const total = (t.qty || 1) * (t.people || 1);
    ctx.fillStyle = theme.accent; ctx.font = '22px Anton'; ctx.textAlign = 'center';
    ctx.fillText(t.code, qx + qs / 2, qy + qs + 34);
    ctx.font = '46px Anton'; ctx.fillStyle = '#0b0b0b';
    ctx.fillText(String(t.tier_name || 'Ticket').toUpperCase(), qx + qs / 2, qy + qs + 92);
    ctx.font = '800 18px "Bricolage Grotesque", sans-serif'; ctx.fillStyle = theme.accent;
    ctx.fillText('₵' + t.amount + '  ·  ADMIT ' + total, qx + qs / 2, qy + qs + 124);
    ctx.textAlign = 'left';
    ctx.restore();
    // notches (cut-outs)
    ctx.save(); ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(STUB, 0, 22, 0, Math.PI * 2); ctx.arc(STUB, H, 22, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    return c;
  }

  async function toImg(t, opts) {
    const c = await draw(t, opts);
    return c.toDataURL('image/png');
  }
  function download(dataUrl, code) {
    const a = document.createElement('a'); a.href = dataUrl; a.download = 'Paado-Island-' + code + '.png';
    document.body.appendChild(a); a.click(); a.remove();
  }
  window.PaadoTicket = { draw, toImg, download, THEMES };
})();
