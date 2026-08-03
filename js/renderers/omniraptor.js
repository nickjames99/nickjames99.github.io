(() => {
  const CHANNELS = [
    "dominant", "markings", "flank", "detail", "body", "underside", "eyes"
  ];

  const SOURCES = {
    A: {
      base: "./assets/embedded/omniraptor/image-009-5acf502a.png",
      dominant: "./assets/embedded/omniraptor/image-010-720f9512.png",
      markings: "./assets/embedded/omniraptor/image-011-3178247f.png",
      flank: "./assets/embedded/omniraptor/image-012-8242645d.png",
      detail: "./assets/embedded/omniraptor/image-005-4fa1756f.png",
      body: "./assets/embedded/omniraptor/image-014-08675ae3.png",
      underside: "./assets/embedded/omniraptor/image-015-0393a687.png",
      eyes: "./assets/embedded/omniraptor/image-008-ad874062.png",
      directMasks: true
    },
    B: {
      base: "./assets/embedded/omniraptor/image-017-d0c2f89c.png",
      dominant: "./assets/embedded/omniraptor/image-018-35eeffd7.png",
      markings: "./assets/embedded/omniraptor/image-019-78a8ae28.png",
      flank: "./assets/embedded/omniraptor/image-020-155268d5.png",
      detail: "./assets/embedded/omniraptor/image-005-4fa1756f.png",
      body: "./assets/embedded/omniraptor/image-022-b8680827.png",
      underside: "./assets/embedded/omniraptor/image-023-4a55adfa.png",
      eyes: "./assets/embedded/omniraptor/image-024-ca5ab23f.png",
      directMasks: true
    },
    C: {
      base: "./assets/embedded/omniraptor/image-001-d811315d.png",
      dominant: "./assets/embedded/omniraptor/image-002-30952556.png",
      markings: "./assets/embedded/omniraptor/image-003-0f55d2d9.png",
      flank: "./assets/embedded/omniraptor/image-004-fcefe431.png",
      detail: "./assets/embedded/omniraptor/image-005-4fa1756f.png",
      body: "./assets/embedded/omniraptor/image-006-8e4d7c03.png",
      underside: "./assets/embedded/omniraptor/image-007-be8f6cdd.png",
      eyes: "./assets/embedded/omniraptor/image-008-ad874062.png",
      directMasks: true
    },
    D: Object.fromEntries(
      ["base", ...CHANNELS].map(name => [
        name, `./assets/embedded/omniraptor/pattern-d/${name}.png`
      ])
    ),
    E: Object.fromEntries(
      ["base", ...CHANNELS].map(name => [
        name, `./assets/embedded/omniraptor/pattern-e/${name}.png`
      ])
    )
  };

  const canvas = document.getElementById("omniPreview");
  const context = canvas?.getContext("2d", { willReadFrequently: true });
  const dinosaurSelect = document.getElementById("dinoSelect");
  const patternSelect = document.getElementById("patternSelect");
  const sexSelect = document.getElementById("sexSelect");
  const speciesSelect = document.getElementById("speciesSelect");
  const badge = document.getElementById("previewSpeciesBadge");
  const note = document.getElementById("previewPatternNote");
  const pickerContainer = document.getElementById("pickers");
  const saveButton = document.getElementById("savePreviewBtn");

  if (!canvas || !context || !dinosaurSelect || !patternSelect) return;

  const state = {
    loaded: new Map(),
    loading: new Map(),
    timer: 0
  };

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = source;
    });
  }

  function imagePixels(image, width, height) {
    const work = document.createElement("canvas");
    work.width = width;
    work.height = height;
    const workContext = work.getContext("2d", { willReadFrequently: true });
    workContext.drawImage(image, 0, 0, width, height);
    return workContext.getImageData(0, 0, width, height).data;
  }

  function subtractBaseMask(image, baseImage, width, height) {
    const basePixels = imagePixels(baseImage, width, height);
    const sourcePixels = imagePixels(image, width, height);
    const mask = new Uint8ClampedArray(sourcePixels.length);

    for (let pixel = 0; pixel < sourcePixels.length; pixel += 4) {
      const baseLuma =
        0.2126 * basePixels[pixel] +
        0.7152 * basePixels[pixel + 1] +
        0.0722 * basePixels[pixel + 2];
      const sourceLuma =
        0.2126 * sourcePixels[pixel] +
        0.7152 * sourcePixels[pixel + 1] +
        0.0722 * sourcePixels[pixel + 2];
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

  async function ensureLoaded(pattern) {
    if (state.loaded.has(pattern)) return state.loaded.get(pattern);
    if (state.loading.has(pattern)) return state.loading.get(pattern);

    const sources = SOURCES[pattern];
    if (!sources) return null;

    const loading = (async () => {
      const base = await loadImage(sources.base);
      const images = await Promise.all(
        CHANNELS.map(channel => loadImage(sources[channel]))
      );
      const masks = {};

      CHANNELS.forEach((channel, index) => {
        masks[channel] = sources.directMasks
          ? imagePixels(images[index], base.naturalWidth, base.naturalHeight)
          : subtractBaseMask(
              images[index], base, base.naturalWidth, base.naturalHeight
            );
      });

      const loaded = { base, masks };
      state.loaded.set(pattern, loaded);
      state.loading.delete(pattern);
      return loaded;
    })().catch(error => {
      state.loading.delete(pattern);
      console.error(`Omniraptor Pattern ${pattern} failed to load:`, error);
      return null;
    });

    state.loading.set(pattern, loading);
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
    const inputs = [
      ...document.querySelectorAll('#pickers input[type="color"]')
    ];
    return CHANNELS.map((_, index) => normalizeHex(inputs[index]?.value));
  }

  function updateControls() {
    const active = dinosaurSelect.value === "omniraptor";

    if (!active) {
      canvas.style.setProperty("display", "none", "important");
      return false;
    }

    document.querySelectorAll(".preview-stage canvas").forEach(item => {
      item.style.setProperty(
        "display", item === canvas ? "block" : "none", "important"
      );
    });

    [...patternSelect.options].forEach(option => {
      const available = ["A", "B", "C", "D", "E"].includes(option.value);
      option.disabled = !available;
      option.hidden = !available;
    });

    if (!["A", "B", "C", "D", "E"].includes(patternSelect.value)) {
      patternSelect.value = "A";
    }

    patternSelect.disabled = false;
    if (speciesSelect) speciesSelect.value = "12";
    if (badge) {
      badge.textContent = `Omniraptor · Pattern ${patternSelect.value}`;
    }
    if (note) note.textContent = `Pattern ${patternSelect.value}`;
    return true;
  }

  async function render() {
    if (!updateControls()) return;

    const pattern = patternSelect.value;
    const active = await ensureLoaded(pattern);

    if (
      !active ||
      dinosaurSelect.value !== "omniraptor" ||
      patternSelect.value !== pattern
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
        const amount = (mask[index] / 255) * (mask[index + 3] / 255);
        if (amount < 0.02) continue;

        const luminance =
          (0.2126 * pixels[index] +
            0.7152 * pixels[index + 1] +
            0.0722 * pixels[index + 2]) / 255;
        const shade = 0.30 + Math.pow(luminance, 0.76) * 1.02;
        const strength = Math.min(1, amount * 1.12);

        pixels[index] =
          pixels[index] * (1 - strength) +
          Math.min(255, targetR * shade) * strength;
        pixels[index + 1] =
          pixels[index + 1] * (1 - strength) +
          Math.min(255, targetG * shade) * strength;
        pixels[index + 2] =
          pixels[index + 2] * (1 - strength) +
          Math.min(255, targetB * shade) * strength;
      }
    });

    context.putImageData(frame, 0, 0);
  }

  function scheduleRender(delay = 35) {
    clearTimeout(state.timer);
    state.timer = setTimeout(render, delay);
  }

  dinosaurSelect.addEventListener("change", () => {
    if (dinosaurSelect.value === "omniraptor") {
      updateControls();
      scheduleRender(0);
    } else {
      canvas.style.setProperty("display", "none", "important");
    }
  });

  patternSelect.addEventListener("change", () => {
    if (dinosaurSelect.value === "omniraptor") scheduleRender(0);
  });

  sexSelect?.addEventListener("change", () => {
    if (dinosaurSelect.value === "omniraptor") scheduleRender(0);
  });

  pickerContainer?.addEventListener("input", () => {
    if (dinosaurSelect.value === "omniraptor") scheduleRender();
  });

  pickerContainer?.addEventListener("change", () => {
    if (dinosaurSelect.value === "omniraptor") scheduleRender(0);
  });

  saveButton?.addEventListener("click", event => {
    if (dinosaurSelect.value !== "omniraptor") return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const link = document.createElement("a");
    link.download =
      `omniraptor-pattern-${patternSelect.value.toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, true);
})();
