(() => {
  const SOURCES = {
    A: {
      base: "../../assets/embedded/tenontosaurus/image-001-d2f0679e.png",
      masks: {
        dominant: "../../assets/embedded/tenontosaurus/image-002-c0a22d9c.png",
        markings: "../../assets/embedded/tenontosaurus/image-003-e58fdc4b.png",
        flank: "../../assets/embedded/tenontosaurus/image-004-97f823d4.png",
        detail: "../../assets/embedded/omniraptor/image-005-4fa1756f.png",
        body: "../../assets/embedded/tenontosaurus/image-006-87743bef.png",
        underside: "../../assets/embedded/tenontosaurus/image-007-5c4e3339.png",
        eyes: "../../assets/embedded/tenontosaurus/image-008-7a6c577d.png"
      }
    },
    B: {
      base: "../../assets/embedded/tenontosaurus/image-009-17f21797.png",
      masks: {
        dominant: "../../assets/embedded/tenontosaurus/image-010-f0a842fe.png",
        markings: "../../assets/embedded/tenontosaurus/image-011-ee4e55bc.png",
        flank: "../../assets/embedded/tenontosaurus/image-012-9c4681ec.png",
        detail: "../../assets/embedded/omniraptor/image-005-4fa1756f.png",
        body: "../../assets/embedded/tenontosaurus/image-014-2335a576.png",
        underside: "../../assets/embedded/tenontosaurus/image-015-ececd10f.png",
        eyes: "../../assets/embedded/tenontosaurus/image-016-035b8629.png"
      }
    },
    C: {
      base: "../../assets/embedded/tenontosaurus/image-009-17f21797.png",
      masks: {
        dominant: "../../assets/embedded/tenontosaurus/image-018-1a79ef30.png",
        markings: "../../assets/embedded/tenontosaurus/image-019-eb4e14a7.png",
        flank: "../../assets/embedded/tenontosaurus/image-020-c0354358.png",
        detail: "../../assets/embedded/omniraptor/image-005-4fa1756f.png",
        body: "../../assets/embedded/tenontosaurus/image-022-a597b424.png",
        underside: "../../assets/embedded/tenontosaurus/image-023-00e7f336.png",
        eyes: "../../assets/embedded/tenontosaurus/image-016-035b8629.png"
      }
    }
  };

  const CHANNELS = ["dominant","markings","flank","detail","body","underside","eyes"];

  const canvas = document.getElementById("tenontoPreview");
  const legacyCanvas = document.getElementById("dinoPreview");
  const kentroCanvas = document.getElementById("kentroPreview");
  const stegoCanvas = document.getElementById("stegoPreview");
  const omniCanvas = document.getElementById("omniPreview");
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
    const active = dinosaurSelect.value === "tenonto";

    if (active) {
      legacyCanvas?.style.setProperty("display", "none", "important");
      kentroCanvas?.style.setProperty("display", "none", "important");
      stegoCanvas?.style.setProperty("display", "none", "important");
      omniCanvas?.style.setProperty("display", "none", "important");
      canvas.style.setProperty("display", "block", "important");

      patternSelect.disabled = false;
      [...patternSelect.options].forEach(option => {
        option.disabled = false;
      });

      if (badge) {
        badge.textContent = `Tenontosaurus · Pattern ${patternSelect.value}`;
      }
      if (note) note.textContent = `Pattern ${patternSelect.value}`;
    } else {
      canvas.style.setProperty("display", "none", "important");
    }
  }

  function render() {
    if (dinosaurSelect.value !== "tenonto") return;

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
      if (dinosaurSelect.value === "tenonto") render();
    }, immediate ? 0 : 135);
  }

  dinosaurSelect.addEventListener("change", () => schedule(true));
  patternSelect.addEventListener("change", () => schedule(true));

  speciesSelect?.addEventListener("change", () => {
    if (String(speciesSelect.value) === "16") {
      dinosaurSelect.value = "tenonto";
      schedule(true);
    }
  });

  document.getElementById("pickers")?.addEventListener("input", event => {
    if (
      dinosaurSelect.value === "tenonto" &&
      event.target.matches('input[type="color"], .hex-input')
    ) {
      schedule(false);
    }
  });

  document.getElementById("pickers")?.addEventListener("change", event => {
    if (
      dinosaurSelect.value === "tenonto" &&
      event.target.matches('input[type="color"], .hex-input')
    ) {
      schedule(true);
    }
  });

  ["randomBtn", "resetBtn", "decodeBtn"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", () => {
      if (dinosaurSelect.value === "tenonto") schedule(false);
    });
  });

  document.getElementById("savePreviewBtn")?.addEventListener(
    "click",
    event => {
      if (dinosaurSelect.value !== "tenonto") return;

      event.stopImmediatePropagation();
      event.preventDefault();
      render();

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download =
        `Tenontosaurus_Pattern_${patternSelect.value}_preview.png`;
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

    schedule(true);
  }).catch(error => {
    console.error("Tenontosaurus Pattern A/B/C preview failed:", error);
  });
})();
