(() => {
  const speciesSelect = document.getElementById("speciesSelect");
  const patternSelect = document.getElementById("patternSelect");
  const dinosaurSelect = document.getElementById("dinoSelect");

  if (!speciesSelect || !patternSelect) return;

  const D_SUPPORTED = new Set(["2", "9", "12", "13", "15"]);
  const E_SUPPORTED = new Set(["12", "13"]);

  function updatePatternAvailability() {
    const speciesId = String(speciesSelect.value);
    const optionD = patternSelect.querySelector('option[value="D"]');
    const optionE = patternSelect.querySelector('option[value="E"]');

    const previewId = dinosaurSelect?.value;
    const supportsD = D_SUPPORTED.has(speciesId) || ["austro", "stego"].includes(previewId);
    const supportsE = E_SUPPORTED.has(speciesId) || previewId === "pachy";
    if (optionD) optionD.disabled = !supportsD;
    if (optionE) optionE.disabled = !supportsE;

    if (
      (patternSelect.value === "D" && !supportsD) ||
      (patternSelect.value === "E" && !supportsE)
    ) {
      patternSelect.value = "B";
      patternSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  speciesSelect.addEventListener("change", updatePatternAvailability);
  dinosaurSelect?.addEventListener("change", () => {
    setTimeout(updatePatternAvailability, 0);
  });

  document.getElementById("decodeBtn")?.addEventListener("click", () => {
    setTimeout(updatePatternAvailability, 100);
  });

  updatePatternAvailability();
})();
