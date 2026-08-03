(() => {
  const root = document.getElementById("pickers");
  if (!root) return;

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const hex2 = n => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0").toUpperCase();
  const rgbToHex = ({ r, g, b }) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  const hexToRgb = value => {
    const match = /^#?([0-9a-f]{6})$/i.exec(value || "");
    if (!match) return null;
    return { r: parseInt(match[1].slice(0, 2), 16), g: parseInt(match[1].slice(2, 4), 16), b: parseInt(match[1].slice(4, 6), 16) };
  };
  const rgbToHsv = ({ r, g, b }) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return { h, s: max ? d / max : 0, v: max };
  };
  const hsvToRgb = ({ h, s, v }) => {
    const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
    let p = [0, 0, 0];
    if (h < 60) p = [c, x, 0]; else if (h < 120) p = [x, c, 0];
    else if (h < 180) p = [0, c, x]; else if (h < 240) p = [0, x, c];
    else if (h < 300) p = [x, 0, c]; else p = [c, 0, x];
    return { r: (p[0] + m) * 255, g: (p[1] + m) * 255, b: (p[2] + m) * 255 };
  };

  const style = document.createElement("style");
  style.textContent = `
    .custom-color-popover{position:fixed;z-index:10000;width:272px;padding:12px;border:1px solid #69408a;border-radius:14px;background:rgba(24,16,35,.98);box-shadow:0 18px 50px #000a;color:#fff;font:600 12px/1.2 inherit;display:none;user-select:none;backdrop-filter:blur(14px)}
    .custom-color-popover.open{display:block}.ccp-sv{position:relative;height:154px;border-radius:10px;cursor:crosshair;background:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent),hsl(var(--h),100%,50%);box-shadow:inset 0 0 0 1px #ffffff24;touch-action:none}
    .ccp-sv-dot{position:absolute;width:13px;height:13px;border:3px solid #fff;border-radius:50%;box-shadow:0 1px 5px #000;transform:translate(-50%,-50%);pointer-events:none}.ccp-hue{width:100%;height:16px;margin:11px 0 10px;appearance:none;border-radius:99px;background:linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00);outline:none}.ccp-hue::-webkit-slider-thumb{appearance:none;width:19px;height:19px;border:3px solid #fff;border-radius:50%;background:transparent;box-shadow:0 1px 5px #000}.ccp-row{display:grid;grid-template-columns:1fr 42px 42px 42px;gap:7px}.ccp-field{display:grid;gap:4px;color:#bca7d0;text-align:center;font-size:9px;letter-spacing:.08em}.ccp-field input{box-sizing:border-box;width:100%;height:32px;border:1px solid #ffffff22;border-radius:8px;background:#0c0912;color:#fff;text-align:center;font:700 11px inherit;outline:none}.ccp-field input:focus{border-color:#d88cff;box-shadow:0 0 0 2px #b866e52b}.ccp-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.ccp-actions button{height:34px!important;min-height:34px!important;padding:0 10px!important;border-radius:9px!important}.ccp-apply{border:0!important;color:#130c1b!important;background:linear-gradient(90deg,#f1c879,#eab2c5,#b5a2ec,#59bcef)!important}.ccp-cancel{background:#291d39!important}.ccp-preview{height:8px;margin-bottom:10px;border-radius:99px;background:linear-gradient(90deg,var(--old) 0 50%,var(--new) 50%)}
  `;
  document.head.appendChild(style);

  const pop = document.createElement("div");
  pop.className = "custom-color-popover";
  pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Choose a color");
  pop.innerHTML = `<div class="ccp-sv"><i class="ccp-sv-dot"></i></div><input class="ccp-hue" type="range" min="0" max="359" value="0" aria-label="Hue"><div class="ccp-preview"></div><div class="ccp-row"><label class="ccp-field">HEX<input class="ccp-hex" maxlength="7"></label><label class="ccp-field">R<input class="ccp-r" type="number" min="0" max="255"></label><label class="ccp-field">G<input class="ccp-g" type="number" min="0" max="255"></label><label class="ccp-field">B<input class="ccp-b" type="number" min="0" max="255"></label></div><div class="ccp-actions"><button class="ccp-cancel" type="button">Cancel</button><button class="ccp-apply" type="button">Apply</button></div>`;
  document.body.appendChild(pop);
  const sv = pop.querySelector(".ccp-sv"), dot = pop.querySelector(".ccp-sv-dot"), hue = pop.querySelector(".ccp-hue"), hex = pop.querySelector(".ccp-hex");
  const nums = [pop.querySelector(".ccp-r"), pop.querySelector(".ccp-g"), pop.querySelector(".ccp-b")];
  let target = null, original = "#000000", hsv = { h: 0, s: 0, v: 0 }, dragging = false;

  function syncCard(value, final = false) {
    if (!target) return;
    target.value = value;
    const card = target.closest(".color-card") || target.parentElement;
    const text = card?.querySelector(".hex-input"); if (text) text.value = value;
    const hidden = card?.querySelector(".hex"); if (hidden) hidden.textContent = value;
    const chip = card?.querySelector(".color-chip"); if (chip) chip.style.background = value;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    if (final) target.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function paint(live = true) {
    const rgb = hsvToRgb(hsv), value = rgbToHex(rgb);
    sv.style.setProperty("--h", hsv.h); dot.style.left = `${hsv.s * 100}%`; dot.style.top = `${(1 - hsv.v) * 100}%`;
    hue.value = Math.round(hsv.h); hex.value = value; nums[0].value = Math.round(rgb.r); nums[1].value = Math.round(rgb.g); nums[2].value = Math.round(rgb.b);
    pop.style.setProperty("--new", value); if (live) syncCard(value);
  }
  function position() {
    const r = target.getBoundingClientRect(), gap = 8;
    let left = r.left, top = r.bottom + gap;
    if (left + 296 > innerWidth) left = innerWidth - 296;
    if (top + pop.offsetHeight > innerHeight) top = r.top - pop.offsetHeight - gap;
    pop.style.left = `${Math.max(8, left)}px`; pop.style.top = `${Math.max(8, top)}px`;
  }
  function open(input) {
    target = input; original = input.value.toUpperCase(); hsv = rgbToHsv(hexToRgb(original) || { r: 0, g: 0, b: 0 });
    pop.style.setProperty("--old", original); pop.classList.add("open"); paint(false); position(); hex.focus(); hex.select();
  }
  function close(commit) {
    if (!target) return;
    if (commit) syncCard(rgbToHex(hsvToRgb(hsv)), true); else syncCard(original, true);
    pop.classList.remove("open"); target.focus(); target = null;
  }
  function setSv(event) {
    const r = sv.getBoundingClientRect(); hsv.s = clamp((event.clientX - r.left) / r.width, 0, 1); hsv.v = 1 - clamp((event.clientY - r.top) / r.height, 0, 1); paint();
  }
  sv.addEventListener("pointerdown", e => { dragging = true; sv.setPointerCapture(e.pointerId); setSv(e); });
  sv.addEventListener("pointermove", e => { if (dragging) setSv(e); });
  sv.addEventListener("pointerup", () => { dragging = false; });
  hue.addEventListener("input", () => { hsv.h = +hue.value; paint(); });
  hex.addEventListener("input", () => { const rgb = hexToRgb(hex.value); if (rgb) { hsv = rgbToHsv(rgb); paint(); } });
  nums.forEach(input => input.addEventListener("input", () => { const rgb = { r: clamp(+nums[0].value || 0, 0, 255), g: clamp(+nums[1].value || 0, 0, 255), b: clamp(+nums[2].value || 0, 0, 255) }; hsv = rgbToHsv(rgb); paint(); }));
  pop.querySelector(".ccp-apply").addEventListener("click", () => close(true));
  pop.querySelector(".ccp-cancel").addEventListener("click", () => close(false));
  document.addEventListener("pointerdown", e => { if (target && !pop.contains(e.target) && e.target !== target) close(true); });
  document.addEventListener("keydown", e => { if (!target) return; if (e.key === "Escape") { e.preventDefault(); close(false); } else if (e.key === "Enter" && pop.contains(e.target)) { e.preventDefault(); close(true); } });
  window.addEventListener("resize", () => target && position());
  window.addEventListener("scroll", () => target && position(), true);
  root.addEventListener("click", e => { const input = e.target.closest('input[type="color"]'); if (!input) return; e.preventDefault(); open(input); }, true);
  root.addEventListener("keydown", e => { if (e.target.matches('input[type="color"]') && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(e.target); } }, true);
})();
