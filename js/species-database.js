(() => {
  const SPECIES_DATABASE = {
    Allosaurus: {
      speciesId: "0",
      prefix: "AQEA",
      previewId: "allo"
    },
    Beipiaosaurus: {
      speciesId: "1",
      prefix: "AQEB",
      previewId: "beipi"
    },
    Carnotaurus: {
      speciesId: "2",
      prefix: "AQEC",
      previewId: "carno"
    },
    Ceratosaurus: {
      speciesId: "3",
      prefix: "AQED",
      previewId: "cerato"
    },
    Deinosuchus: {
      speciesId: "4",
      prefix: "AQEE",
      previewId: "stego"
    },
    Diabloceratops: {
      speciesId: "5",
      prefix: "AQEF",
      previewId: "stego"
    },
    Dilophosaurus: {
      speciesId: "6",
      prefix: "AQEG",
      previewId: "dilo"
    },
    Dryosaurus: {
      speciesId: "7",
      prefix: "AQEH",
      previewId: "dryo"
    },
    Gallimimus: {
      speciesId: "8",
      prefix: "AQEI",
      previewId: "stego"
    },
    Herrerasaurus: {
      speciesId: "9",
      prefix: "AQEJ",
      previewId: "stego"
    },
    Hypsilophodon: {
      speciesId: "10",
      prefix: "AQEK",
      previewId: "hypsi"
    },
    Maiasaura: {
      speciesId: "11",
      prefix: "AQEL",
      previewId: "maia"
    },
    Omniraptor: {
      speciesId: "12",
      prefix: "AQEM",
      previewId: "omniraptor"
    },
    Pachycephalosaurus: {
      speciesId: "13",
      prefix: "AQEN",
      previewId: "stego"
    },
    Pteranodon: {
      speciesId: "14",
      prefix: "AQEO",
      previewId: "stego"
    },
    Stegosaurus: {
      speciesId: "15",
      prefix: "AQEP",
      previewId: "stego"
    },
    Tenontosaurus: {
      speciesId: "16",
      prefix: "AQEQ",
      previewId: "tenonto"
    },
    Triceratops: {
      speciesId: "17",
      prefix: "AQER",
      previewId: "stego"
    },
    Troodon: {
      speciesId: "18",
      prefix: "AQES",
      previewId: "troodon"
    },
    Tyrannosaurus: {
      speciesId: "19",
      prefix: "AQET",
      previewId: "trex"
    },
    Kentrosaurus: {
      speciesId: "20",
      prefix: "AQEU",
      previewId: "kentro"
    }
  };

  const PATTERN_TOKENS = {
    A: "Aw",
    B: "Ac",
    C: "Ag",
    D: "BA",
    E: "BQ"
  };

  const TOKEN_TO_PATTERN = {
    Aw: "A",
    Ac: "B",
    Ag: "C",
    BA: "D",
    BQ: "E"
  };

  const BY_PREFIX = Object.fromEntries(
    Object.entries(SPECIES_DATABASE).map(([name, data]) => [
      data.prefix,
      { name, ...data }
    ])
  );

  const BY_SPECIES_ID = Object.fromEntries(
    Object.entries(SPECIES_DATABASE).map(([name, data]) => [
      data.speciesId,
      { name, ...data }
    ])
  );

  const speciesSelect = document.getElementById("speciesSelect");
  const dinosaurSelect = document.getElementById("dinoSelect");
  const patternSelect = document.getElementById("patternSelect");
  const codeInput = document.getElementById("codeIn");
  const codeOutput = document.getElementById("codeOut");
  const decodeButton = document.getElementById("decodeBtn");
  const decodeStatus = document.getElementById("decodeStatus");

  if (
    !speciesSelect ||
    !dinosaurSelect ||
    !patternSelect ||
    !codeInput ||
    !codeOutput
  ) return;

  function dispatchChange(element) {
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function readHeader(code) {
    const normalized = String(code || "").trim();
    const match = normalized.match(/^ISL1\.(AQE[A-U])(Aw|Ac|Ag|BA|BQ)/);

    if (!match) return null;

    const species = BY_PREFIX[match[1]];
    const pattern = TOKEN_TO_PATTERN[match[2]];

    if (!species || !pattern) return null;

    return {
      ...species,
      pattern
    };
  }

  function selectDecodedCode(code) {
    const detected = readHeader(code);
    if (!detected) return false;

    const dedicatedPreviewSpecies = new Set([
      "Allosaurus",
      "Beipiaosaurus",
      "Carnotaurus",
      "Ceratosaurus",
      "Dilophosaurus",
      "Dryosaurus",
      "Hypsilophodon",
      "Omniraptor",
      "Stegosaurus",
      "Tenontosaurus",
      "Troodon",
      "Tyrannosaurus",
      "Kentrosaurus",
      "Maiasaura"
    ]);
    const hasDedicatedPreview = dedicatedPreviewSpecies.has(detected.name);

    // Preserve the colors that the existing decoder just loaded. Some of the
    // older species/pattern handlers regenerate the editor when their dropdown
    // change events fire, so restore the decoded values immediately afterward.
    const colorInputs = [
      ...document.querySelectorAll('#pickers input[type="color"]')
    ];
    const hexInputs = [
      ...document.querySelectorAll('#pickers .hex-input')
    ];
    const decodedColors = colorInputs.map(input => input.value);
    const decodedHex = hexInputs.map(input => input.value);

    // Keep the actual pasted species selected, but do not dispatch its change
    // event here. The original decoder has already handled the species/colors.
    speciesSelect.value = detected.speciesId;

    if (hasDedicatedPreview) {
      patternSelect.value = detected.pattern;
      dinosaurSelect.value = detected.previewId;
    } else {
      // Only the visualization falls back. The pasted species and decoded
      // colors remain untouched.
      patternSelect.value = "B";
      dinosaurSelect.value = "stego";
    }

    dispatchChange(patternSelect);
    dispatchChange(dinosaurSelect);

    const restoreDecodedColors = () => {
      colorInputs.forEach((input, index) => {
        if (decodedColors[index] !== undefined) {
          input.value = decodedColors[index];
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });

      hexInputs.forEach((input, index) => {
        if (decodedHex[index] !== undefined) {
          input.value = decodedHex[index];
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
    };

    restoreDecodedColors();
    requestAnimationFrame(restoreDecodedColors);
    setTimeout(restoreDecodedColors, 50);

    if (decodeStatus) {
      decodeStatus.textContent = hasDedicatedPreview
        ? `${detected.name} · Pattern ${detected.pattern}`
        : `${detected.name} · Pattern ${detected.pattern} — previewing Stegosaurus · Pattern B with decoded colors`;
    }

    return true;
  }

  function rewriteGeneratedHeader() {
    const species = BY_SPECIES_ID[String(speciesSelect.value)];
    const pattern = PATTERN_TOKENS[patternSelect.value] || PATTERN_TOKENS.B;

    if (!species) return;

    const current = String(codeOutput.value || "");
    if (!current.startsWith("ISL1.")) return;

    const replacement = `ISL1.${species.prefix}${pattern}`;
    const updated = current.replace(
      /^ISL1\.AQE[A-U](?:Aw|Ac|Ag|BA|BQ)/,
      replacement
    );

    if (updated !== current) {
      codeOutput.value = updated;
    }
  }

  // Detect immediately while pasting, without waiting for the Decode button.
  codeInput.addEventListener("input", () => {
    const detected = readHeader(codeInput.value);
    if (!detected) return;

    if (decodeStatus) {
      decodeStatus.textContent =
        `Detected: ${detected.name} · Pattern ${detected.pattern}`;
    }
  });

  // Run after the editor's existing decoder has populated its color fields.


  speciesSelect.addEventListener("change", () => {
    // Species changes may update the generated-code header, but they should
    // never move the live preview automatically.
    setTimeout(rewriteGeneratedHeader, 0);
  });

  patternSelect.addEventListener("change", () => {
    setTimeout(rewriteGeneratedHeader, 0);
  });

  dinosaurSelect.addEventListener("change", () => {
    const matched = Object.values(BY_PREFIX).find(
      species => species.previewId === dinosaurSelect.value
    );

    // Only synchronize species for dinosaurs with their own live preview.
    if (matched) {
      speciesSelect.value = matched.speciesId;
    }

    setTimeout(rewriteGeneratedHeader, 0);
  });

  // The existing editor regenerates the textarea programmatically.
  // This keeps its species/pattern header synchronized afterward.
  let lastOutput = "";
  setInterval(() => {
    if (codeOutput.value !== lastOutput) {
      lastOutput = codeOutput.value;
      rewriteGeneratedHeader();
      lastOutput = codeOutput.value;
    }
  }, 180);

  // Expose the single source of truth for future preview additions.
  window.ISLE_SPECIES_DATABASE = Object.freeze(SPECIES_DATABASE);
  window.ISLE_PATTERN_TOKENS = Object.freeze(PATTERN_TOKENS);
  window.detectIsleSpeciesPattern = readHeader;
})();










