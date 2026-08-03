(() => {
  const SOURCES = {
    A: {
      base: "./assets/embedded/kentrosaurus/image-001-90e57fd5.png",
      masks: {
        dominant: "./assets/embedded/kentrosaurus/image-002-09c9ed07.png",
        markings: "./assets/embedded/kentrosaurus/image-003-93a75fb5.png",
        flank: "./assets/embedded/kentrosaurus/image-004-de80ac5f.png",
        detail: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E",
        body: "./assets/embedded/kentrosaurus/image-006-18678cc4.png",
        underside: "./assets/embedded/kentrosaurus/image-007-44d110ff.png",
        eyes: "./assets/embedded/kentrosaurus/image-008-679118eb.png"
      }
    },
    B: {
      base: "./assets/embedded/kentrosaurus/image-009-39620b38.png",
      masks: {
        dominant: "./assets/embedded/kentrosaurus/image-010-a09c5f2f.png",
        markings: "./assets/embedded/kentrosaurus/image-011-b2d38dee.png",
        flank: "./assets/embedded/kentrosaurus/image-012-be509fe3.png",
        detail: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E",
        body: "./assets/embedded/kentrosaurus/image-014-a24281c9.png",
        underside: "./assets/embedded/kentrosaurus/image-015-2697e367.png",
        eyes: "./assets/embedded/kentrosaurus/image-016-30af3f4b.png"
      }
    },
    C: {
      base: "./assets/embedded/kentrosaurus/image-009-39620b38.png",
      masks: {
        dominant: "./assets/embedded/kentrosaurus/image-018-4c324142.png",
        markings: "./assets/embedded/kentrosaurus/image-019-783a50c1.png",
        flank: "./assets/embedded/kentrosaurus/image-020-8af5ed81.png",
        detail: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'/%3E",
        body: "./assets/embedded/kentrosaurus/image-022-3b1308ef.png",
        underside: "./assets/embedded/kentrosaurus/image-023-9582dbc8.png",
        eyes: "./assets/embedded/kentrosaurus/image-016-30af3f4b.png"
      }
    }
  };

  const CHANNELS = ["dominant","markings","flank","detail","body","underside","eyes"];

  const kentroCanvas = document.getElementById("kentroPreview");
  const stegoCanvas = document.getElementById("stegoPreview");
  const legacyStegoCanvas = document.getElementById("dinoPreview");
  const omniCanvas = document.getElementById("omniPreview");
  const context = kentroCanvas?.getContext("2d", { willReadFrequently: true });

  const dinosaurSelect = document.getElementById("dinoSelect");
  const patternSelect = document.getElementById("patternSelect");
  const speciesSelect = document.getElementById("speciesSelect");
  const badge = document.getElementById("previewSpeciesBadge");
  const note = document.getElementById("previewPatternNote");

  if (
    !kentroCanvas ||
    !context ||
    !dinosaurSelect ||
    !patternSelect
  ) return;

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

  function setVisibility() {
    const isKentro = dinosaurSelect.value === "kentro";

    if (isKentro) {
      legacyStegoCanvas?.style.setProperty("display", "none", "important");
      stegoCanvas?.style.setProperty("display", "none", "important");
      omniCanvas?.style.setProperty("display", "none", "important");
      kentroCanvas.style.setProperty("display", "block", "important");

      [...patternSelect.options].forEach(option => {
        option.disabled = false;
      });
      patternSelect.disabled = false;

      if (badge) badge.textContent = `Kentrosaurus · Pattern ${patternSelect.value}`;
      if (note) note.textContent = `Pattern ${patternSelect.value}`;
    } else {
      kentroCanvas.style.setProperty("display", "none", "important");
    }
  }

  function renderKentro() {
    if (dinosaurSelect.value !== "kentro") return;

    const active = state.patterns[patternSelect.value];
    if (!active?.ready) return;

    kentroCanvas.width = active.base.naturalWidth;
    kentroCanvas.height = active.base.naturalHeight;

    context.clearRect(0, 0, kentroCanvas.width, kentroCanvas.height);
    context.drawImage(active.base, 0, 0);

    const frame = context.getImageData(
      0,
      0,
      kentroCanvas.width,
      kentroCanvas.height
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
        // Troodon mask screenshots have an opaque dark-blue background.
        // Use only pixels substantially brighter than that background so the
        // canvas background is never treated as part of the mask.
        const maskLuminance =
          (
            0.2126 * mask[index] +
            0.7152 * mask[index + 1] +
            0.0722 * mask[index + 2]
          ) / 255;

        let amount;

        if (channel === "eyes") {
          // The Troodon eye mask contains faint bright spill around the face.
          // Keep only the strongest near-white pixels so only the actual eye
          // receives the selected eye color.
          amount =
            Math.max(0, Math.min(1, (maskLuminance - 0.72) / 0.20)) *
            (mask[index + 3] / 255);
        } else {
          amount =
            Math.max(0, Math.min(1, (maskLuminance - 0.11) / 0.55)) *
            (mask[index + 3] / 255);
        }

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

  function scheduleRender(immediate = false) {
    clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      setVisibility();
      if (dinosaurSelect.value === "kentro") renderKentro();
    }, immediate ? 0 : 135);
  }

  dinosaurSelect.addEventListener("change", () => {
    scheduleRender(true);
  });

  patternSelect.addEventListener("change", () => {
    scheduleRender(true);
  });

  speciesSelect?.addEventListener("change", () => {
    if (String(speciesSelect.value) === "20") {
      dinosaurSelect.value = "kentro";
      scheduleRender(true);
    }
  });

  document.getElementById("pickers")?.addEventListener("input", event => {
    if (
      dinosaurSelect.value === "kentro" &&
      event.target.matches('input[type="color"], .hex-input')
    ) {
      scheduleRender(false);
    }
  });

  document.getElementById("pickers")?.addEventListener("change", event => {
    if (
      dinosaurSelect.value === "kentro" &&
      event.target.matches('input[type="color"], .hex-input')
    ) {
      scheduleRender(true);
    }
  });

  ["randomBtn", "resetBtn", "decodeBtn"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", () => {
      if (dinosaurSelect.value === "kentro") scheduleRender(false);
    });
  });

  document.getElementById("savePreviewBtn")?.addEventListener(
    "click",
    event => {
      if (dinosaurSelect.value !== "kentro") return;

      event.stopImmediatePropagation();
      event.preventDefault();
      renderKentro();

      const link = document.createElement("a");
      link.href = kentroCanvas.toDataURL("image/png");
      link.download =
        `Kentrosaurus_Pattern_${patternSelect.value}_preview.png`;
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

    scheduleRender(true);
  }).catch(error => {
    console.error("Kentrosaurus Pattern A/B/C preview failed:", error);
  });
})();

