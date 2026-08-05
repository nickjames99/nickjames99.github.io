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

    const supportsD = D_SUPPORTED.has(speciesId) || dinosaurSelect?.value === "austro";
    if (optionD) optionD.disabled = !supportsD;
    if (optionE) optionE.disabled = !E_SUPPORTED.has(speciesId);

    if (
      (patternSelect.value === "D" && !supportsD) ||
      (patternSelect.value === "E" && !E_SUPPORTED.has(speciesId))
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
