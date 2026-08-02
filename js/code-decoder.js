(() => {
  const codeInput = document.getElementById("codeIn");
  const decodeButton = document.getElementById("decodeBtn");
  const decodeStatus = document.getElementById("decodeStatus");
  const dinosaurSelect = document.getElementById("dinoSelect");
  const patternSelect = document.getElementById("patternSelect");
  const speciesSelect = document.getElementById("speciesSelect");

  if (
    !codeInput ||
    !decodeButton ||
    !dinosaurSelect ||
    !patternSelect ||
    !speciesSelect
  ) return;

  const SPECIES_BY_ID = {
    0: "Allosaurus",
    1: "Beipiaosaurus",
    2: "Carnotaurus",
    3: "Ceratosaurus",
    4: "Deinosuchus",
    5: "Diabloceratops",
    6: "Dilophosaurus",
    7: "Dryosaurus",
    8: "Gallimimus",
    9: "Herrerasaurus",
    10: "Hypsilophodon",
    11: "Maiasaura",
    12: "Omniraptor",
    13: "Pachycephalosaurus",
    14: "Pteranodon",
    15: "Stegosaurus",
    16: "Tenontosaurus",
    17: "Triceratops",
    18: "Troodon",
    19: "Tyrannosaurus",
    20: "Kentrosaurus"
  };

  const PREVIEW_BY_SPECIES_ID = {
    0: "allo",
    1: "beipi",
    2: "carno",
    3: "cerato",
    4: "deino",
    5: "dibble",
    6: "dilo",
    7: "dryo",
    8: "galli",
    9: "herra",
    10: "hypsi",
    11: "maia",
    12: "omniraptor",
    13: "pachy",
    14: "ptera",
    15: "stego",
    16: "tenonto",
    17: "trike",
    18: "troodon",
    19: "trex",
    20: "kentro"
  };

  const PATTERN_BY_BYTE = {
    1: "B",
    2: "C",
    3: "A",
    4: "D",
    5: "E"
  };

  const AVAILABLE_PREVIEW_PATTERNS = {
    dibble: ["A", "B", "C"],
    trike: ["A", "B", "C"],
    deino: ["A", "B", "C"],
    galli: ["A", "B", "C"],
    herra: ["A", "B", "C", "D"],
    pachy: ["A", "B", "C", "D"],
    ptera: ["A", "B", "C"],
    trex: ["A", "B", "C"],
    maia: ["A", "B", "C"],
    dryo: ["A", "B", "C"],
    dilo: ["A", "B", "C"],
    beipi: ["A", "B", "C"],
    allo: ["A", "B", "C"],
    carno: ["A", "B", "C", "D"],
    hypsi: ["A", "B", "C"],
    kentro: ["A", "B", "C"],
    omniraptor: ["A", "B", "C", "D", "E"],
    stego: ["A", "B", "C"],
    tenonto: ["A", "B", "C"],
    troodon: ["A", "B", "C"]
  };

  function fromBase64Url(value) {
    let normalized = String(value || "")
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    while (normalized.length % 4) normalized += "=";

    return Uint8Array.from(
      atob(normalized),
      character => character.charCodeAt(0)
    );
  }

  function rgbToHex(red, green, blue) {
    return "#" + [red, green, blue]
      .map(value => value.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

  function applyDecodedColors(colors) {
    const colorInputs = [
      ...document.querySelectorAll('#pickers input[type="color"]')
    ];
    const hexInputs = [
      ...document.querySelectorAll('#pickers .hex-input')
    ];
    const legacyHexLabels = [
      ...document.querySelectorAll('#pickers .hex')
    ];
    const chips = [
      ...document.querySelectorAll('#pickers .color-chip')
    ];

    if (colorInputs.length < 7) {
      throw new Error("The color editor has not finished loading yet.");
    }

    colors.forEach((color, index) => {
      const picker = colorInputs[index];
      if (!picker) return;

      picker.value = color;

      if (hexInputs[index]) hexInputs[index].value = color;
      if (legacyHexLabels[index]) legacyHexLabels[index].textContent = color;
      if (chips[index]) chips[index].style.background = color;

      picker.dispatchEvent(new Event("input", { bubbles: true }));
      picker.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function decodePastedCode(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    try {
      const code = codeInput.value.trim();

      if (!code.startsWith("ISL1.")) {
        throw new Error("Code must begin with ISL1.");
      }

      const bytes = fromBase64Url(code.slice(5));

      if (bytes.length !== 26) {
        throw new Error(`Expected 26 payload bytes, found ${bytes.length}.`);
      }

      if (bytes[0] !== 1 || bytes[1] !== 1) {
        throw new Error("This is not a recognized ISL1 skin code.");
      }

      const speciesName = SPECIES_BY_ID[bytes[2]];
      const patternName = PATTERN_BY_BYTE[bytes[3]];

      if (!speciesName) {
        throw new Error(`Unknown dinosaur species byte: ${bytes[2]}.`);
      }

      if (!patternName) {
        throw new Error(`Unknown pattern byte: ${bytes[3]}.`);
      }

      const colors = [];

      for (let index = 0; index < 7; index += 1) {
        const offset = 4 + index * 3;
        colors.push(
          rgbToHex(bytes[offset], bytes[offset + 1], bytes[offset + 2])
        );
      }

      const previewId = PREVIEW_BY_SPECIES_ID[bytes[2]];
      if (!previewId) {
        throw new Error(`No live preview is registered for ${speciesName}.`);
      }

      // Select the decoded dinosaur first. Several preview renderers refresh
      // their controls when this event fires, so colors are applied afterward.
      speciesSelect.value = String(bytes[2]);
      dinosaurSelect.value = previewId;
      dinosaurSelect.dispatchEvent(new Event("change", { bubbles: true }));

      // Rebuild the pattern options immediately so D/E codes also work when
      // the previously selected dinosaur only exposed Patterns A-C.
      updatePatternOptions(patternName);

      applyDecodedColors(colors);

      // A few legacy renderers finish their species/pattern work on the next
      // frame. Reapply the decoded colors once after those updates so they
      // cannot be replaced by a renderer's defaults.
      requestAnimationFrame(() => {
        applyDecodedColors(colors);
      });
      setTimeout(() => {
        applyDecodedColors(colors);
      }, 50);

      decodeStatus.textContent =
        `${speciesName} · Pattern ${patternName} — preview and 7 colors loaded`;
      decodeStatus.style.color = "var(--green)";

      // Let existing preview/generator listeners finish updating.
      requestAnimationFrame(() => {
        const firstPicker = document.querySelector(
          '#pickers input[type="color"]'
        );
        firstPicker?.dispatchEvent(new Event("input", { bubbles: true }));
      });
    } catch (error) {
      decodeStatus.textContent = error.message;
      decodeStatus.style.color = "var(--danger)";
    }
  }

  function updatePatternOptions(preferredPattern = patternSelect.value) {
    const available =
      AVAILABLE_PREVIEW_PATTERNS[dinosaurSelect.value] || ["A", "B", "C"];
    const next = available.includes(preferredPattern)
      ? preferredPattern
      : available[0];

    patternSelect.replaceChildren(
      ...available.map(pattern => {
        const option = document.createElement("option");
        option.value = pattern;
        option.textContent = `Pattern ${pattern}`;
        return option;
      })
    );

    patternSelect.value = next;
    patternSelect.disabled = available.length < 2;
    patternSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Capture phase blocks the old Pattern-B-only decoder before it can run.
  decodeButton.addEventListener("click", decodePastedCode, true);

  // Keep the preview pattern list limited to what the selected dinosaur has.
  dinosaurSelect.addEventListener("change", () => {
    requestAnimationFrame(() => updatePatternOptions());
  });

  updatePatternOptions();
})();















