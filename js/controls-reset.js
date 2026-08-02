(() => {
  const button = document.getElementById("resetBtn");
  const pickerContainer = document.getElementById("pickers");
  const copyStatus = document.getElementById("copyStatus");

  if (!button || !pickerContainer) return;

  function resetAllColors(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const colorInputs = [
      ...pickerContainer.querySelectorAll('input[type="color"]')
    ];
    const hexInputs = [
      ...pickerContainer.querySelectorAll('.hex-input')
    ];
    const hiddenHexLabels = [
      ...pickerContainer.querySelectorAll('.hex')
    ];
    const chips = [
      ...pickerContainer.querySelectorAll('.color-chip')
    ];

    colorInputs.forEach((picker, index) => {
      const color = "#000000";

      picker.value = color;

      if (hexInputs[index]) {
        hexInputs[index].value = color;
      }

      if (hiddenHexLabels[index]) {
        hiddenHexLabels[index].textContent = color;
      }

      if (chips[index]) {
        chips[index].style.background = color;
      }

      picker.dispatchEvent(new Event("input", { bubbles: true }));
      picker.dispatchEvent(new Event("change", { bubbles: true }));
    });

    pickerContainer.dispatchEvent(new Event("input", { bubbles: true }));
    pickerContainer.dispatchEvent(new Event("change", { bubbles: true }));

    if (copyStatus) {
      copyStatus.textContent = "Colors reset to black.";
      setTimeout(() => {
        if (copyStatus.textContent === "Colors reset to black.") {
          copyStatus.textContent = "";
        }
      }, 1600);
    }
  }

  button.addEventListener("click", resetAllColors, true);
})();
