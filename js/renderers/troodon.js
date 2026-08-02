(() => {
  const SOURCES = {"A":{"base":"../../assets/embedded/troodon/image-001-d883db85.png","masks":{"dominant":"../../assets/embedded/troodon/image-002-c7f7374d.png","markings":"../../assets/embedded/troodon/image-003-3972e68b.png","flank":"../../assets/embedded/troodon/image-004-b7210ae7.png","detail":"../../assets/embedded/troodon/image-001-d883db85.png","body":"../../assets/embedded/troodon/image-006-28a32006.png","underside":"../../assets/embedded/troodon/image-007-353dc747.png","eyes":"../../assets/embedded/troodon/image-008-8c265864.png"}},"B":{"base":"../../assets/embedded/troodon/image-001-d883db85.png","masks":{"dominant":"../../assets/embedded/troodon/image-010-a0d58eaa.png","markings":"../../assets/embedded/troodon/image-011-d6539083.png","flank":"../../assets/embedded/troodon/image-012-4032c4cc.png","detail":"../../assets/embedded/troodon/image-001-d883db85.png","body":"../../assets/embedded/troodon/image-014-487e8014.png","underside":"../../assets/embedded/troodon/image-015-4c1d4108.png","eyes":"../../assets/embedded/troodon/image-008-8c265864.png"}},"C":{"base":"../../assets/embedded/troodon/image-001-d883db85.png","masks":{"dominant":"../../assets/embedded/troodon/image-018-5ace1cae.png","markings":"../../assets/embedded/troodon/image-019-cc985441.png","flank":"../../assets/embedded/troodon/image-020-a2819e50.png","detail":"../../assets/embedded/troodon/image-001-d883db85.png","body":"../../assets/embedded/troodon/image-022-f728d22a.png","underside":"../../assets/embedded/troodon/image-023-4c28b64f.png","eyes":"../../assets/embedded/troodon/image-008-8c265864.png"}}};
  const CHANNELS = ["dominant","markings","flank","detail","body","underside","eyes"];

  const canvas = document.getElementById("troodonPreview");
  const legacyCanvas = document.getElementById("dinoPreview");
  const omniCanvas = document.getElementById("omniPreview");
  const stegoCanvas = document.getElementById("stegoPreview");
  const kentroCanvas = document.getElementById("kentroPreview");
  const tenontoCanvas = document.getElementById("tenontoPreview");
  const context = canvas?.getContext("2d", { willReadFrequently: true });

  const dinosaurSelect = document.getElementById("dinoSelect");
  const patternSelect = document.getElementById("patternSelect");
  const speciesSelect = document.getElementById("speciesSelect");
  const badge = document.getElementById("previewSpeciesBadge");
  const note = document.getElementById("previewPatternNote");

  if (!canvas || !context || !dinosaurSelect || !patternSelect) return;

  const state = {
    patterns: {
      A: { base: null, masks: {}, ready: false },
      B: { base: null, masks: {}, ready: false },
      C: { base: null, masks: {}, ready: false }
    },
    timer: null
  };

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = source;
    });
  }

  function normalizeHex(value) {
    const clean = String(value || "").trim().toUpperCase();
    return /^#[0-9A-F]{6}$/.test(clean) ? clean : "#FFFFFF";
  }

  function hexToRgb(hex) {
    const value = parseInt(normalizeHex(hex).slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }

  function currentColors() {
    const inputs = [...document.querySelectorAll('#pickers input[type="color"]')];
    return CHANNELS.map((_, index) => normalizeHex(inputs[index]?.value));
  }

  function updateVisibility() {
    const active = dinosaurSelect.value === "troodon";
    if (active) {
      document.body.dataset.activePreview = "troodon";
    } else if (document.body.dataset.activePreview === "troodon") {
      delete document.body.dataset.activePreview;
    }

    if (active) {
      legacyCanvas?.style.setProperty("display", "none", "important");
      omniCanvas?.style.setProperty("display", "none", "important");
      stegoCanvas?.style.setProperty("display", "none", "important");
      kentroCanvas?.style.setProperty("display", "none", "important");
      tenontoCanvas?.style.setProperty("display", "none", "important");
      canvas.style.setProperty("display", "block", "important");

      patternSelect.disabled = false;
      [...patternSelect.options].forEach(option => {
        option.disabled = false;
      });

      if (badge) badge.textContent = `Troodon · Pattern ${patternSelect.value}`;
      if (note) note.textContent = `Pattern ${patternSelect.value}`;
    } else {
      canvas.style.setProperty("display", "none", "important");
    }
  }

  function render() {
    if (dinosaurSelect.value !== "troodon") return;

    const active = state.patterns[patternSelect.value];
    if (!active?.ready) return;

    canvas.width = active.base.naturalWidth;
    canvas.height = active.base.naturalHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(active.base, 0, 0);

    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = frame.data;
    const colors = currentColors().map(hexToRgb);

    CHANNELS.forEach((channel, channelIndex) => {
      const female =
        document.getElementById("sexSelect")?.value === "female";
      const colorIndex =
        female && channel === "dominant" ? 1 : channelIndex;

      const mask = active.masks[channel];
      if (!mask) return;

      const [targetR, targetG, targetB] = colors[colorIndex];

      for (let index = 0; index < pixels.length; index += 4) {
        const amount =
          (mask[index] / 255) *
          (mask[index + 3] / 255);

        if (amount < 0.018) continue;

        const luminance =
          (
            0.2126 * pixels[index] +
            0.7152 * pixels[index + 1] +
            0.0722 * pixels[index + 2]
          ) / 255;

        const shade = 0.30 + Math.pow(luminance, 0.76) * 1.02;
        const recoloredR = Math.min(255, targetR * shade);
        const recoloredG = Math.min(255, targetG * shade);
        const recoloredB = Math.min(255, targetB * shade);
        const strength = Math.min(1, amount * 1.12);

        pixels[index] =
          pixels[index] * (1 - strength) +
          recoloredR * strength;
        pixels[index + 1] =
          pixels[index + 1] * (1 - strength) +
          recoloredG * strength;
        pixels[index + 2] =
          pixels[index + 2] * (1 - strength) +
          recoloredB * strength;
      }
    });

    context.putImageData(frame, 0, 0);
  }

  function schedule(immediate = false) {
    clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      updateVisibility();
      if (dinosaurSelect.value === "troodon") {
        render();
        requestAnimationFrame(updateVisibility);
        setTimeout(updateVisibility, 75);
        setTimeout(updateVisibility, 200);
      }
    }, immediate ? 0 : 135);
  }

  dinosaurSelect.addEventListener("change", () => schedule(true));
  patternSelect.addEventListener("change", () => schedule(true));
  document.getElementById("sexSelect")?.addEventListener("change", () => schedule(true));

  speciesSelect?.addEventListener("change", () => {
    if (String(speciesSelect.value) === "18") {
      dinosaurSelect.value = "troodon";
      schedule(true);
    }
  });

  document.getElementById("pickers")?.addEventListener("input", event => {
    if (
      dinosaurSelect.value === "troodon" &&
      event.target.matches('input[type="color"], .hex-input')
    ) {
      schedule(false);
    }
  });

  document.getElementById("pickers")?.addEventListener("change", event => {
    if (
      dinosaurSelect.value === "troodon" &&
      event.target.matches('input[type="color"], .hex-input')
    ) {
      schedule(true);
    }
  });

  ["randomBtn", "resetBtn", "decodeBtn"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", () => {
      if (dinosaurSelect.value === "troodon") schedule(false);
    });
  });

  document.getElementById("savePreviewBtn")?.addEventListener(
    "click",
    event => {
      if (dinosaurSelect.value !== "troodon") return;

      event.stopImmediatePropagation();
      event.preventDefault();
      render();

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `Troodon_Pattern_${patternSelect.value}_preview.png`;
      link.click();
    },
    true
  );

  function preparePattern(pattern, baseImage, maskImages) {
    const target = state.patterns[pattern];
    target.base = baseImage;

    const temporaryCanvas = document.createElement("canvas");
    temporaryCanvas.width = baseImage.naturalWidth;
    temporaryCanvas.height = baseImage.naturalHeight;

    const temporaryContext = temporaryCanvas.getContext(
      "2d",
      { willReadFrequently: true }
    );

    // Troodon mask references are full screenshots: the normal dinosaur image
    // plus a white painted region. Convert each screenshot into a true mask by
    // subtracting the shared base image. This prevents the dark background and
    // unpainted dinosaur pixels from being treated as part of the mask.
    temporaryContext.clearRect(
      0,
      0,
      temporaryCanvas.width,
      temporaryCanvas.height
    );
    temporaryContext.drawImage(baseImage, 0, 0);
    const basePixels = temporaryContext.getImageData(
      0,
      0,
      temporaryCanvas.width,
      temporaryCanvas.height
    ).data;

    CHANNELS.forEach((channel, index) => {
      temporaryContext.clearRect(
        0,
        0,
        temporaryCanvas.width,
        temporaryCanvas.height
      );
      temporaryContext.drawImage(maskImages[index], 0, 0);

      const sourcePixels = temporaryContext.getImageData(
        0,
        0,
        temporaryCanvas.width,
        temporaryCanvas.height
      ).data;
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

        // Normalize the amount the reference pixel moved toward white.
        // A small dead-zone removes antialiasing/compression noise while
        // preserving tiny details such as the eye mask.
        let amount = (sourceLuma - baseLuma) / Math.max(24, 255 - baseLuma);
        amount = Math.max(0, Math.min(1, (amount - 0.018) / 0.982));
        const value = Math.round(amount * 255);

        cleanMask[pixel] = value;
        cleanMask[pixel + 1] = value;
        cleanMask[pixel + 2] = value;
        cleanMask[pixel + 3] = 255;
      }

      target.masks[channel] = cleanMask;
    });

    target.ready = true;
  }

  Promise.all([
    ...["A","B","C"].flatMap(pattern => [
      loadImage(SOURCES[pattern].base),
      ...CHANNELS.map(channel =>
        loadImage(SOURCES[pattern].masks[channel])
      )
    ])
  ]).then(images => {
    const blockSize = 1 + CHANNELS.length;

    ["A","B","C"].forEach((pattern, patternIndex) => {
      const start = patternIndex * blockSize;
      preparePattern(
        pattern,
        images[start],
        images.slice(start + 1, start + blockSize)
      );
    });

    schedule(true);
  }).catch(error => {
    console.error("Troodon Pattern A/B/C preview failed:", error);
  });
})();
