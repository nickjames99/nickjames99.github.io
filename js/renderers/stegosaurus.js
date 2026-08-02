(() => {
  const SOURCES = {
    A: {
      base: "../../assets/embedded/stegosaurus/image-001-bed4040b.png",
      masks: {
        dominant: "../../assets/embedded/stegosaurus/image-002-5f6de345.png",
        markings: "../../assets/embedded/stegosaurus/image-003-ec2345f2.png",
        flank: "../../assets/embedded/stegosaurus/image-004-7a41fd38.png",
        detail: "../../assets/embedded/omniraptor/image-005-4fa1756f.png",
        body: "../../assets/embedded/stegosaurus/image-006-5b1ba20d.png",
        underside: "../../assets/embedded/stegosaurus/image-007-e75135aa.png",
        eyes: "../../assets/embedded/stegosaurus/image-008-4914bdc4.png"
      }
    },
    B: {
      base: "../../assets/embedded/stegosaurus/image-009-43763343.png",
      masks: {
        dominant: "../../assets/embedded/stegosaurus/image-010-5cf2d4ac.png",
        markings: "../../assets/embedded/stegosaurus/image-011-0dd8eb4b.png",
        flank: "../../assets/embedded/stegosaurus/image-012-76276c44.png",
        detail: "../../assets/embedded/omniraptor/image-005-4fa1756f.png",
        body: "../../assets/embedded/stegosaurus/image-014-c4cdf4d5.png",
        underside: "../../assets/embedded/stegosaurus/image-015-ee7e5edf.png",
        eyes: "../../assets/embedded/stegosaurus/image-016-c79514e9.png"
      }
    },
    C: {
      base: "../../assets/embedded/stegosaurus/image-017-ba005562.png",
      masks: {
        dominant: "../../assets/embedded/stegosaurus/image-018-b17caf01.png",
        markings: "../../assets/embedded/stegosaurus/image-019-7befdb1d.png",
        flank: "../../assets/embedded/stegosaurus/image-020-4fe71a0c.png",
        detail: "../../assets/embedded/omniraptor/image-005-4fa1756f.png",
        body: "../../assets/embedded/stegosaurus/image-022-4c814c1c.png",
        underside: "../../assets/embedded/stegosaurus/image-023-8f73e196.png",
        eyes: "../../assets/embedded/stegosaurus/image-024-12c3b2d5.png"
      }
    }
  };

  const CHANNELS = ["dominant","markings","flank","detail","body","underside","eyes"];

  const legacyStegoCanvas = document.getElementById("dinoPreview");
  const stegoCanvas = document.getElementById("stegoPreview");
  const omniCanvas = document.getElementById("omniPreview");
  const ctx = stegoCanvas?.getContext("2d", { willReadFrequently: true });

  const dinosaurSelect = document.getElementById("dinoSelect");
  const patternSelect = document.getElementById("patternSelect");
  const badge = document.getElementById("previewSpeciesBadge");
  const note = document.getElementById("previewPatternNote");

  if (
    !legacyStegoCanvas ||
    !stegoCanvas ||
    !omniCanvas ||
    !ctx ||
    !dinosaurSelect ||
    !patternSelect
  ) return;

  const state = {
    patterns: {
      A: { base: null, masks: {}, ready: false },
      B: { base: null, masks: {}, ready: false },
      C: { base: null, masks: {}, ready: false }
    },
    holdOriginal: false,
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

  function updatePatternAvailability() {
    const optionA = patternSelect.querySelector('option[value="A"]');
    const optionB = patternSelect.querySelector('option[value="B"]');
    const optionC = patternSelect.querySelector('option[value="C"]');

    if (dinosaurSelect.value === "stego") {
      if (optionA) optionA.disabled = false;
      if (optionB) optionB.disabled = false;
      if (optionC) optionC.disabled = false;
    } else {
      if (optionA) optionA.disabled = false;
      if (optionB) optionB.disabled = false;
      if (optionC) optionC.disabled = false;
    }
  }

  function showCorrectCanvas() {
    updatePatternAvailability();

    const isStego = dinosaurSelect.value === "stego";
    const activePattern = patternSelect.value;

    // Hide the older fixed Pattern B renderer. The selected A/B/C mask set
    // is always rendered on the dedicated Stego canvas.
    legacyStegoCanvas.style.setProperty("display", "none", "important");
    stegoCanvas.style.setProperty(
      "display",
      isStego ? "block" : "none",
      "important"
    );
    omniCanvas.style.setProperty(
      "display",
      isStego ? "none" : "block",
      "important"
    );

    if (badge) {
      badge.textContent = isStego
        ? `Stegosaurus · Pattern ${activePattern}`
        : `Omniraptor · Pattern ${activePattern}`;
    }

    if (note) note.textContent = `Pattern ${activePattern}`;
  }

  function renderStego() {
    if (dinosaurSelect.value !== "stego") return;

    const active = state.patterns[patternSelect.value];
    if (!active?.ready) return;

    stegoCanvas.width = active.base.naturalWidth;
    stegoCanvas.height = active.base.naturalHeight;

    ctx.clearRect(0, 0, stegoCanvas.width, stegoCanvas.height);
    ctx.drawImage(active.base, 0, 0);

    if (state.holdOriginal) return;

    const frame = ctx.getImageData(
      0,
      0,
      stegoCanvas.width,
      stegoCanvas.height
    );
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

        if (amount < 0.02) continue;

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

    ctx.putImageData(frame, 0, 0);
  }

  function scheduleRender(immediate = false) {
    clearTimeout(state.timer);

    state.timer = setTimeout(() => {
      showCorrectCanvas();
      if (dinosaurSelect.value === "stego") renderStego();
    }, immediate ? 0 : 135);
  }

  dinosaurSelect.addEventListener("change", () => scheduleRender(true));
  patternSelect.addEventListener("change", () => scheduleRender(true));

  document.getElementById("pickers")?.addEventListener("input", event => {
    if (event.target.matches('input[type="color"], .hex-input')) {
      scheduleRender(false);
    }
  });

  document.getElementById("pickers")?.addEventListener("change", event => {
    if (event.target.matches('input[type="color"], .hex-input')) {
      scheduleRender(true);
    }
  });

  ["randomBtn", "resetBtn", "decodeBtn"].forEach(id => {
    document.getElementById(id)?.addEventListener(
      "click",
      () => scheduleRender(false)
    );
  });

  const originalButton = document.getElementById("originalPreviewBtn");

  function holdOriginal(event) {
    if (dinosaurSelect.value !== "stego") return;

    event?.preventDefault();
    state.holdOriginal = true;
    renderStego();
  }

  function releaseOriginal(event) {
    if (dinosaurSelect.value !== "stego") return;

    event?.preventDefault();
    state.holdOriginal = false;
    renderStego();
  }

  originalButton?.addEventListener("mousedown", holdOriginal);
  originalButton?.addEventListener("mouseup", releaseOriginal);
  originalButton?.addEventListener("mouseleave", releaseOriginal);
  originalButton?.addEventListener(
    "touchstart",
    holdOriginal,
    { passive: false }
  );
  originalButton?.addEventListener(
    "touchend",
    releaseOriginal,
    { passive: false }
  );

  document.getElementById("savePreviewBtn")?.addEventListener(
    "click",
    event => {
      if (dinosaurSelect.value !== "stego") return;

      event.stopImmediatePropagation();
      event.preventDefault();
      renderStego();

      const link = document.createElement("a");
      link.href = stegoCanvas.toDataURL("image/png");
      link.download =
        `Stegosaurus_Pattern_${patternSelect.value}_preview.png`;
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

    CHANNELS.forEach((channel, index) => {
      temporaryContext.clearRect(
        0,
        0,
        temporaryCanvas.width,
        temporaryCanvas.height
      );
      temporaryContext.drawImage(maskImages[index], 0, 0);

      target.masks[channel] = temporaryContext.getImageData(
        0,
        0,
        temporaryCanvas.width,
        temporaryCanvas.height
      ).data;
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

    updatePatternAvailability();
    scheduleRender(true);
  }).catch(error => {
    console.error("Stegosaurus Pattern A/B/C preview failed:", error);
  });
})();
