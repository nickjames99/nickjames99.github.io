(() => {
  const button = document.getElementById("randomBtn");
  const pickerContainer = document.getElementById("pickers");

  if (!button || !pickerContainer) return;

  function randomHex() {
    const value = crypto.getRandomValues(new Uint8Array(3));
    return "#" + [...value]
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

  function randomizeAllColors(event) {
    // This listener owns the button so a broken or duplicated legacy handler
    // cannot cancel or partially overwrite the randomized values.
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
      const color = randomHex();

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

    // Refresh any renderer that listens on the container rather than each input.
    pickerContainer.dispatchEvent(new Event("input", { bubbles: true }));
    pickerContainer.dispatchEvent(new Event("change", { bubbles: true }));
  }

  button.addEventListener("click", randomizeAllColors, true);
})();
