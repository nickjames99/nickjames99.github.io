(() => {
  const SOURCES = Object.fromEntries(
    ["top", "bottom"].map(view => [
      view,
      Object.fromEntries(["A", "B", "C"].map(pattern => {
        const folder = `pattern-${pattern.toLowerCase()}`;
        return [pattern, {
          base: `./assets/embedded/pteranodon/${view}/${folder}/base.png`,
          body: `./assets/embedded/pteranodon/${view}/${folder}/body.png`,
          detail: `./assets/embedded/pteranodon/${view}/${folder}/detail.png`,
          dominant: `./assets/embedded/pteranodon/${view}/${folder}/dominant.png`,
          eyes: `./assets/embedded/pteranodon/${view}/${folder}/eyes.png`,
          flank: `./assets/embedded/pteranodon/${view}/${folder}/flank.png`,
          markings: `./assets/embedded/pteranodon/${view}/${folder}/markings.png`,
          underside: `./assets/embedded/pteranodon/${view}/${folder}/underside.png`
        }];
      }))
    ])
  );
  const CHANNELS = ["dominant", "markings", "flank", "detail", "body", "underside", "eyes"];

  const canvas = document.getElementById("pteraPreview");
  const context = canvas?.getContext("2d", { willReadFrequently: true });
  const dinosaurSelect = document.getElementById("dinoSelect");
  const patternSelect = document.getElementById("patternSelect");
  const viewSelect = document.getElementById("pteraViewSelect");
  const sexSelect = document.getElementById("sexSelect");
  const speciesSelect = document.getElementById("speciesSelect");
  const badge = document.getElementById("previewSpeciesBadge");
  const note = document.getElementById("previewPatternNote");
  const pickerContainer = document.getElementById("pickers");
  const saveButton = document.getElementById("savePreviewBtn");

  if (!canvas || !context || !dinosaurSelect || !patternSelect || !viewSelect) return;

  const state = { loaded: new Map(), loading: new Map(), timer: 0 };

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = source;
    });
  }

  function readMask(image, baseImage, width, height) {
    const work = document.createElement("canvas");
    work.width = width;
    work.height = height;
    const workContext = work.getContext("2d", { willReadFrequently: true });

    workContext.drawImage(baseImage, 0, 0, width, height);
    const basePixels = workContext.getImageData(0, 0, width, height).data;
    workContext.clearRect(0, 0, width, height);
    workContext.drawImage(image, 0, 0, width, height);
    const sourcePixels = workContext.getImageData(0, 0, width, height).data;
    const mask = new Uint8ClampedArray(sourcePixels.length);

    for (let pixel = 0; pixel < sourcePixels.length; pixel += 4) {
      const baseLuma = 0.2126 * basePixels[pixel] + 0.7152 * basePixels[pixel + 1] + 0.0722 * basePixels[pixel + 2];
      const sourceLuma = 0.2126 * sourcePixels[pixel] + 0.7152 * sourcePixels[pixel + 1] + 0.0722 * sourcePixels[pixel + 2];
      let amount = (sourceLuma - baseLuma) / Math.max(24, 255 - baseLuma);
      amount = Math.max(0, Math.min(1, (amount - 0.018) / 0.982));
      const value = Math.round(amount * 255);
      mask[pixel] = value;
      mask[pixel + 1] = value;
      mask[pixel + 2] = value;
      mask[pixel + 3] = 255;
    }
    return mask;
  }

  async function ensureLoaded(pattern, view) {
    const key = `${view}-${pattern}`;
    if (state.loaded.has(key)) return state.loaded.get(key);
    if (state.loading.has(key)) return state.loading.get(key);
    const sources = SOURCES[view]?.[pattern];
    if (!sources) return null;

    const loading = (async () => {
      const base = await loadImage(sources.base);
      const images = await Promise.all(
        CHANNELS.map(channel => loadImage(sources[channel]))
      );
      const masks = {};
      CHANNELS.forEach((channel, index) => {
        masks[channel] = readMask(
          images[index], base, base.naturalWidth, base.naturalHeight
        );
      });
      const loaded = { base, masks };
      state.loaded.set(key, loaded);
      state.loading.delete(key);
      return loaded;
    })().catch(error => {
      state.loading.delete(key);
      console.error(`Pteranodon Pattern ${pattern} failed to load:`, error);
      return null;
    });

    state.loading.set(key, loading);
    return loading;
  }

  function normalizeHex(value) {
    const clean = String(value || "").trim().toUpperCase();
    return /^#[0-9A-F]{6}$/.test(clean) ? clean : "#000000";
  }

  function hexToRgb(hex) {
    const value = parseInt(normalizeHex(hex).slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }

  function currentColors() {
    const inputs = [...document.querySelectorAll('#pickers input[type="color"]')];
    return CHANNELS.map((_, index) => normalizeHex(inputs[index]?.value));
  }

  function updateControls() {
    const active = dinosaurSelect.value === "ptera";
    viewSelect.hidden = !active;
    viewSelect.disabled = !active;
    if (!active) {
      canvas.style.setProperty("display", "none", "important");
      return false;
    }

    document.querySelectorAll(".preview-stage canvas").forEach(item => {
      item.style.setProperty("display", item === canvas ? "block" : "none", "important");
    });
    [...patternSelect.options].forEach(option => {
      const available = ["A", "B", "C"].includes(option.value);
      option.disabled = !available;
      option.hidden = !available;
    });
    if (!["A", "B", "C"].includes(patternSelect.value)) {
      patternSelect.value = "A";
    }
    patternSelect.disabled = false;
    if (badge) badge.textContent =
      `Pteranodon · Pattern ${patternSelect.value} · ${viewSelect.value === "bottom" ? "Bottom" : "Top"}`;
    if (note) note.textContent = `Pattern ${patternSelect.value} · ${viewSelect.value === "bottom" ? "Bottom" : "Top"}`;
    return true;
  }

  async function render() {
    if (!updateControls()) return;
    const pattern = patternSelect.value;
    const view = viewSelect.value === "bottom" ? "bottom" : "top";
    const active = await ensureLoaded(pattern, view);
    if (
      !active ||
      dinosaurSelect.value !== "ptera" ||
      patternSelect.value !== pattern ||
      viewSelect.value !== view
    ) return;

    updateControls();
    canvas.width = active.base.naturalWidth;
    canvas.height = active.base.naturalHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(active.base, 0, 0);

    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = frame.data;
    const colors = currentColors().map(hexToRgb);
    const female = sexSelect?.value === "female";

    CHANNELS.forEach((channel, channelIndex) => {
      const mask = active.masks[channel];
      const colorIndex = female && channel === "dominant" ? 1 : channelIndex;
      const [targetR, targetG, targetB] = colors[colorIndex];

      for (let index = 0; index < pixels.length; index += 4) {
        const amount = mask[index] / 255;
        if (amount < 0.018) continue;
        const luminance = (0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2]) / 255;
        const shade = 0.30 + Math.pow(luminance, 0.76) * 1.02;
        const strength = Math.min(1, amount * 1.12);
        pixels[index] = pixels[index] * (1 - strength) + Math.min(255, targetR * shade) * strength;
        pixels[index + 1] = pixels[index + 1] * (1 - strength) + Math.min(255, targetG * shade) * strength;
        pixels[index + 2] = pixels[index + 2] * (1 - strength) + Math.min(255, targetB * shade) * strength;
      }
    });

    context.putImageData(frame, 0, 0);
  }

  function scheduleRender(delay = 35) {
    clearTimeout(state.timer);
    state.timer = setTimeout(render, delay);
  }

  dinosaurSelect.addEventListener("change", () => {
    if (dinosaurSelect.value === "ptera") {
      updateControls();
      scheduleRender(0);
    } else {
      viewSelect.hidden = true;
      viewSelect.disabled = true;
      canvas.style.setProperty("display", "none", "important");
    }
  });
  viewSelect.addEventListener("change", () => {
    if (dinosaurSelect.value === "ptera") scheduleRender(0);
  });
  patternSelect.addEventListener("change", () => {
    if (dinosaurSelect.value === "ptera") scheduleRender(0);
  });
  sexSelect?.addEventListener("change", () => {
    if (dinosaurSelect.value === "ptera") scheduleRender(0);
  });
  pickerContainer?.addEventListener("input", () => {
    if (dinosaurSelect.value === "ptera") scheduleRender();
  });
  pickerContainer?.addEventListener("change", () => {
    if (dinosaurSelect.value === "ptera") scheduleRender(0);
  });

  saveButton?.addEventListener("click", event => {
    if (dinosaurSelect.value !== "ptera") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const link = document.createElement("a");
    link.download = `pteranodon-${viewSelect.value}-pattern-${patternSelect.value.toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, true);
})();

