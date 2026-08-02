(() => {
  const SOURCES = {"A":{"base":"../../assets/embedded/ceratosaurus/image-001-9e2a54fc.png","body":"../../assets/embedded/ceratosaurus/image-002-b710ccf1.png","detail":"../../assets/embedded/ceratosaurus/image-001-9e2a54fc.png","dominant":"../../assets/embedded/ceratosaurus/image-004-04b78e95.png","eyes":"../../assets/embedded/ceratosaurus/image-005-506aed82.png","flank":"../../assets/embedded/ceratosaurus/image-006-07cc255b.png","markings":"../../assets/embedded/ceratosaurus/image-007-829db461.png","underside":"../../assets/embedded/ceratosaurus/image-008-cd318902.png"},"B":{"base":"../../assets/embedded/ceratosaurus/image-001-9e2a54fc.png","body":"../../assets/embedded/ceratosaurus/image-010-71565ec9.png","detail":"../../assets/embedded/ceratosaurus/image-001-9e2a54fc.png","dominant":"../../assets/embedded/ceratosaurus/image-012-986dc546.png","eyes":"../../assets/embedded/ceratosaurus/image-005-506aed82.png","flank":"../../assets/embedded/ceratosaurus/image-014-99a48cab.png","markings":"../../assets/embedded/ceratosaurus/image-015-93a54d91.png","underside":"../../assets/embedded/ceratosaurus/image-016-45f1bc04.png"},"C":{"base":"../../assets/embedded/ceratosaurus/image-001-9e2a54fc.png","body":"../../assets/embedded/ceratosaurus/image-018-3f606dd2.png","detail":"../../assets/embedded/ceratosaurus/image-001-9e2a54fc.png","dominant":"../../assets/embedded/ceratosaurus/image-020-59e539ad.png","eyes":"../../assets/embedded/ceratosaurus/image-005-506aed82.png","flank":"../../assets/embedded/ceratosaurus/image-022-759f8a60.png","markings":"../../assets/embedded/ceratosaurus/image-023-de27135a.png","underside":"../../assets/embedded/ceratosaurus/image-024-6dd6bd53.png"}};
  const CHANNELS = ["dominant","markings","flank","detail","body","underside","eyes"];

  const canvas = document.getElementById("ceratoPreview");
  const context = canvas?.getContext("2d", { willReadFrequently:true });
  const dinosaurSelect = document.getElementById("dinoSelect");
  const patternSelect = document.getElementById("patternSelect");
  const sexSelect = document.getElementById("sexSelect");
  const speciesSelect = document.getElementById("speciesSelect");
  const badge = document.getElementById("previewSpeciesBadge");
  const note = document.getElementById("previewPatternNote");
  const saveButton = document.getElementById("savePreviewBtn");
  const pickerContainer = document.getElementById("pickers");

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

  function readMask(image, baseImage, width, height) {
    const work = document.createElement("canvas");
    work.width = width;
    work.height = height;
    const workContext = work.getContext("2d", { willReadFrequently:true });

    // Read the untouched Ceratosaurus base.
    workContext.clearRect(0, 0, width, height);
    workContext.drawImage(baseImage, 0, 0, width, height);
    const basePixels = workContext.getImageData(0, 0, width, height).data;

    // Read the full mask reference screenshot.
    workContext.clearRect(0, 0, width, height);
    workContext.drawImage(image, 0, 0, width, height);
    const sourcePixels = workContext.getImageData(0, 0, width, height).data;

    // Convert the full screenshot into a clean mask by measuring how far each
    // pixel moved toward white compared with the shared base image. This is the
    // same background-bleed fix used by the working Troodon renderer.
    const cleanMask = new Uint8ClampedArray(sourcePixels.length);

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

      // Remove compression/antialiasing noise without erasing small eye detail.
      amount = Math.max(0, Math.min(1, (amount - 0.018) / 0.982));
      const value = Math.round(amount * 255);

      cleanMask[pixel] = value;
      cleanMask[pixel + 1] = value;
      cleanMask[pixel + 2] = value;
      cleanMask[pixel + 3] = 255;
    }

    return cleanMask;
  }

  async function ensurePattern(pattern) {
    if (state.loaded.has(pattern)) return state.loaded.get(pattern);
    if (state.loading.has(pattern)) return state.loading.get(pattern);

    const source = SOURCES[pattern];
    if (!source) return null;

    const promise = (async () => {
      const base = await loadImage(source.base);
      const maskImages = await Promise.all(
        CHANNELS.map(channel => loadImage(source[channel]))
      );
      const masks = {};
      CHANNELS.forEach((channel, index) => {
        masks[channel] = readMask(
          maskImages[index],
          base,
          base.naturalWidth,
          base.naturalHeight
        );
      });
      const loaded = { base, masks };
      state.loaded.set(pattern, loaded);
      state.loading.delete(pattern);
      return loaded;
    })().catch(error => {
      state.loading.delete(pattern);
      console.error("Ceratosaurus preview failed to load:", error);
      return null;
    });

    state.loading.set(pattern, promise);
    return promise;
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

  function hideOtherCanvases() {
    document.querySelectorAll(".preview-stage canvas").forEach(item => {
      item.style.setProperty("display", item === canvas ? "block" : "none", "important");
    });
  }

  function updateControls() {
    const active = dinosaurSelect.value === "cerato";
    if (!active) {
      canvas.style.setProperty("display", "none", "important");
      return false;
    }

    hideOtherCanvases();
    patternSelect.disabled = false;
    [...patternSelect.options].forEach(option => {
      option.disabled = !["A","B","C"].includes(option.value);
      option.hidden = !["A","B","C"].includes(option.value);
    });
    if (!["A","B","C"].includes(patternSelect.value)) patternSelect.value = "A";

    if (speciesSelect) speciesSelect.value = "3";
    if (badge) badge.textContent = `Ceratosaurus · Pattern ${patternSelect.value}`;
    if (note) note.textContent = `Pattern ${patternSelect.value}`;
    return true;
  }

  async function render() {
    if (!updateControls()) return;

    const pattern = patternSelect.value;
    const active = await ensurePattern(pattern);
    if (!active || dinosaurSelect.value !== "cerato" || patternSelect.value !== pattern) return;

    hideOtherCanvases();

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
      if (!mask) return;

      // Females use the markings color in the dominant region.
      const colorIndex = female && channel === "dominant" ? 1 : channelIndex;
      const [targetR, targetG, targetB] = colors[colorIndex];

      for (let index = 0; index < pixels.length; index += 4) {
        const amount = (mask[index] / 255) * (mask[index + 3] / 255);
        if (amount < 0.018) continue;

        const luminance = (
          0.2126 * pixels[index] +
          0.7152 * pixels[index + 1] +
          0.0722 * pixels[index + 2]
        ) / 255;

        const shade = 0.30 + Math.pow(luminance, 0.76) * 1.02;
        const strength = Math.min(1, amount * 1.12);

        pixels[index] = pixels[index] * (1 - strength) + Math.min(255, targetR * shade) * strength;
        pixels[index + 1] = pixels[index + 1] * (1 - strength) + Math.min(255, targetG * shade) * strength;
        pixels[index + 2] = pixels[index + 2] * (1 - strength) + Math.min(255, targetB * shade) * strength;
      }
    });

    context.putImageData(frame, 0, 0);
    if (badge) badge.textContent = `Ceratosaurus · Pattern ${pattern}`;
    if (note) note.textContent = `Pattern ${pattern}`;
  }

  function scheduleRender(delay = 35) {
    clearTimeout(state.timer);
    state.timer = setTimeout(render, delay);
  }

  dinosaurSelect.addEventListener("change", () => {
    if (dinosaurSelect.value === "cerato") {
      updateControls();
      scheduleRender(0);
      setTimeout(() => { updateControls(); scheduleRender(0); }, 60);
    }
  });

  patternSelect.addEventListener("change", () => {
    if (dinosaurSelect.value === "cerato") scheduleRender(0);
  });
  sexSelect?.addEventListener("change", () => {
    if (dinosaurSelect.value === "cerato") scheduleRender(0);
  });
  pickerContainer?.addEventListener("input", () => {
    if (dinosaurSelect.value === "cerato") scheduleRender();
  });
  pickerContainer?.addEventListener("change", () => {
    if (dinosaurSelect.value === "cerato") scheduleRender(0);
  });

  // Ensure Randomize, Reset, and pasted-code updates redraw Ceratosaurus.
  document.addEventListener("click", event => {
    if (
      dinosaurSelect.value === "cerato" &&
      (event.target?.id === "randomBtn" || event.target?.id === "resetBtn" || event.target?.id === "decodeBtn")
    ) {
      setTimeout(() => scheduleRender(0), 25);
    }
  }, true);

  saveButton?.addEventListener("click", event => {
    if (dinosaurSelect.value !== "cerato") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const link = document.createElement("a");
    link.download = `ceratosaurus-pattern-${patternSelect.value.toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, true);

  if (dinosaurSelect.value === "cerato") scheduleRender(0);
})();
