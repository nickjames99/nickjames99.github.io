(() => {
  const speciesSelect = document.getElementById("speciesSelect");
  const patternSelect = document.getElementById("patternSelect");
  const dinosaurSelect = document.getElementById("dinoSelect");

  if (!speciesSelect || !patternSelect) return;

  const D_SUPPORTED = new Set(["2", "9", "12", "13", "15"]);
  const E_SUPPORTED = new Set(["12", "13"]);

  function ensurePatternOption(pattern) {
    let option = patternSelect.querySelector(`option[value="${pattern}"]`);
    if (!option) {
      option = document.createElement("option");
      option.value = pattern;
      option.textContent = `Pattern ${pattern}`;
      patternSelect.append(option);
    }
    return option;
  }

  const optionD = ensurePatternOption("D");
  const optionE = ensurePatternOption("E");
  const optionA = patternSelect.querySelector('option[value="A"]');
  const optionB = patternSelect.querySelector('option[value="B"]');
  const optionC = patternSelect.querySelector('option[value="C"]');

  function updatePatternAvailability() {
    const speciesId = String(speciesSelect.value);

    const previewId = dinosaurSelect?.value;
    const camarasaurusSelected = previewId === "camara";
    [optionB, optionC].forEach(option => {
      if (!option) return;
      option.disabled = camarasaurusSelected;
      option.hidden = camarasaurusSelected;
    });
    if (optionA) {
      optionA.disabled = false;
      optionA.hidden = false;
    }
    const supportsD = D_SUPPORTED.has(speciesId) || ["austro", "stego", "bary"].includes(previewId);
    const supportsE = E_SUPPORTED.has(speciesId) || ["pachy", "bary"].includes(previewId);
    optionD.disabled = !supportsD;
    optionD.hidden = !supportsD;
    optionE.disabled = !supportsE;
    optionE.hidden = !supportsE;

    if (
      camarasaurusSelected && patternSelect.value !== "A" ||
      (patternSelect.value === "D" && !supportsD) ||
      (patternSelect.value === "E" && !supportsE)
    ) {
      patternSelect.value = camarasaurusSelected ? "A" : "B";
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
