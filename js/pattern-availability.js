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
  const optionF = ensurePatternOption("F");
  const optionA = patternSelect.querySelector('option[value="A"]');
  const optionB = patternSelect.querySelector('option[value="B"]');
  const optionC = patternSelect.querySelector('option[value="C"]');

  function updatePatternAvailability() {
    const speciesId = String(speciesSelect.value);

    const previewId = dinosaurSelect?.value;
    const onlyPatternA = ["camara", "ava", "quetz"].includes(previewId);
    [optionB, optionC].forEach(option => {
      if (!option) return;
      option.disabled = onlyPatternA;
      option.hidden = onlyPatternA;
    });
    if (optionA) {
      optionA.disabled = false;
      optionA.hidden = false;
    }
    const supportsD = D_SUPPORTED.has(speciesId) || ["austro", "stego", "bary", "trex", "trike"].includes(previewId);
    const supportsE = E_SUPPORTED.has(speciesId) || ["pachy", "bary", "trike"].includes(previewId);
    const supportsF = previewId === "trike";
    optionD.disabled = !supportsD;
    optionD.hidden = !supportsD;
    optionE.disabled = !supportsE;
    optionE.hidden = !supportsE;
    optionF.disabled = !supportsF;
    optionF.hidden = !supportsF;

    if (
      onlyPatternA && patternSelect.value !== "A" ||
      (patternSelect.value === "D" && !supportsD) ||
      (patternSelect.value === "E" && !supportsE) ||
      (patternSelect.value === "F" && !supportsF)
    ) {
      patternSelect.value = onlyPatternA ? "A" : "B";
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
