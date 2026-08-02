(() => {
  const speciesSelect = document.getElementById("speciesSelect");
  const dinosaurSelect = document.getElementById("dinoSelect");
  const patternSelect = document.getElementById("patternSelect");
  const decodeButton = document.getElementById("decodeBtn");

  if (!speciesSelect || !dinosaurSelect || !patternSelect || !decodeButton) return;

  // Existing species IDs used by this editor:
  // 12 = Omniraptor
  // 15 = Stegosaurus
  const PREVIEW_SPECIES = {
    "0": "allo",
    "1": "beipi",
    "2": "carno",
    "3": "cerato",
    "6": "dilo",
    "7": "dryo",
    "10": "hypsi",
    "12": "omniraptor",
    "15": "stego",
    "16": "tenonto",
    "18": "troodon",
    "20": "kentro"
  };

  function syncPreviewFromDecodedSpecies() {
    const decodedSpeciesId = String(speciesSelect.value || "");
    const previewSpecies = PREVIEW_SPECIES[decodedSpeciesId] || "stego";

    if (dinosaurSelect.value !== previewSpecies) {
      dinosaurSelect.value = previewSpecies;
      dinosaurSelect.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      // Force the active renderer to refresh even when the species did not change.
      dinosaurSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }

    // Keep the current pattern when it is valid. If the decoded code or another
    // handler leaves it empty, fall back to Pattern B.
    const validPatterns = new Set(["A", "B", "C"]);
    if (!validPatterns.has(patternSelect.value)) {
      patternSelect.value = "B";
    }

    patternSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  decodeButton.addEventListener("click", () => {
    // The existing decoder updates speciesSelect during the click handler.
    // Run after that logic completes.
    setTimeout(syncPreviewFromDecodedSpecies, 0);
  });

  // Also cover code paths where the decoder updates the species dropdown directly.
  speciesSelect.addEventListener("change", () => {
    setTimeout(syncPreviewFromDecodedSpecies, 0);
  });
})();








