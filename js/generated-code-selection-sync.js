(() => {
  const dinosaurSelect = document.getElementById("dinoSelect");
  const patternSelect = document.getElementById("patternSelect");
  const speciesSelect = document.getElementById("speciesSelect");
  const codeOutput = document.getElementById("codeOut");

  if (!dinosaurSelect || !patternSelect || !speciesSelect || !codeOutput) return;

  const SPECIES = Object.freeze({
    allo: ["0", "AQEA"],
    beipi: ["1", "AQEB"],
    carno: ["2", "AQEC"],
    cerato: ["3", "AQED"],
    deino: ["4", "AQEE"],
    dibble: ["5", "AQEF"],
    dilo: ["6", "AQEG"],
    dryo: ["7", "AQEH"],
    galli: ["8", "AQEI"],
    herra: ["9", "AQEJ"],
    hypsi: ["10", "AQEK"],
    maia: ["11", "AQEL"],
    omniraptor: ["12", "AQEM"],
    pachy: ["13", "AQEN"],
    ptera: ["14", "AQEO"],
    stego: ["15", "AQEP"],
    tenonto: ["16", "AQEQ"],
    trike: ["17", "AQER"],
    troodon: ["18", "AQES"],
    trex: ["19", "AQET"],
    kentro: ["20", "AQEU"]
  });

  const PATTERNS = Object.freeze({
    A: "Aw",
    B: "Ac",
    C: "Ag",
    D: "BA",
    E: "BQ"
  });

  function synchronize() {
    const species = SPECIES[dinosaurSelect.value];
    if (!species) return;

    const [speciesId, prefix] = species;
    const patternToken = PATTERNS[patternSelect.value] || PATTERNS.B;

    // The live-preview selection is the source of truth. This also corrects
    // legacy renderers that write their own species ID during a render.
    if (speciesSelect.value !== speciesId) {
      speciesSelect.value = speciesId;
    }

    const current = String(codeOutput.value || "");
    if (!current.startsWith("ISL1.")) return;

    const header = `ISL1.${prefix}${patternToken}`;
    const updated = current.replace(
      /^ISL1\.AQE[A-U](?:Aw|Ac|Ag|BA|BQ)/,
      header
    );

    if (updated !== current) codeOutput.value = updated;
  }

  function synchronizeAfterHandlers() {
    synchronize();
    requestAnimationFrame(synchronize);
    setTimeout(synchronize, 0);
    setTimeout(synchronize, 80);
  }

  function regenerateFromSelection() {
    synchronize();

    // The original editor rebuilds the complete code from color-input events.
    // Reuse that path without changing the selected color.
    const firstColor = document.querySelector('#pickers input[type="color"]');
    if (firstColor) {
      firstColor.dispatchEvent(new Event("input", { bubbles: true }));
      firstColor.dispatchEvent(new Event("change", { bubbles: true }));
    }

    synchronizeAfterHandlers();
  }

  dinosaurSelect.addEventListener("change", regenerateFromSelection);
  patternSelect.addEventListener("change", regenerateFromSelection);
  document.getElementById("pickers")?.addEventListener("input", synchronize);
  document.getElementById("pickers")?.addEventListener("change", synchronizeAfterHandlers);

  // Generated textarea values are assigned directly, so they do not emit an
  // input event. Keep the header corrected after any automatic regeneration.
  setInterval(synchronize, 120);
  synchronizeAfterHandlers();
})();
