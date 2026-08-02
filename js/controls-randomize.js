(() => {
  const button = document.getElementById("randomBtn");
  const earthButton = document.getElementById("earthRandomBtn");
  const pickerContainer = document.getElementById("pickers");

  if (!button || !earthButton || !pickerContainer) return;

  const EARTH_TONES = Object.freeze([
    "#171410", "#24201A", "#302A21", "#3B3025", "#49382A",
    "#594333", "#684D38", "#765941", "#86664A", "#987754",
    "#AA8965", "#BE9D76", "#D0B48C", "#DDC9A5", "#E9DDC2",
    "#2C211C", "#452A20", "#603526", "#77432C", "#8D5031",
    "#A65E36", "#B86E3E", "#C9814B", "#D69A67", "#E2B88B",
    "#27291C", "#343823", "#41472A", "#505832", "#606A3B",
    "#717B45", "#838D50", "#98A566", "#ADB77D", "#C2C69A",
    "#1D2420", "#29342C", "#354439", "#435346", "#526253",
    "#627363", "#748576", "#89998A", "#A0AEA0", "#BAC5B6",
    "#292725", "#3A3732", "#4B4740", "#5D574E", "#70695E",
    "#837B6E", "#989083", "#ADA699", "#C3BDB0", "#DAD5CA",
    "#3A2E25", "#554132", "#70543D", "#8B6847", "#A67D52",
    "#BE9668", "#D1AE80", "#E0C69E", "#EEE0C4"
  ]);

  function randomHex() {
    const value = crypto.getRandomValues(new Uint8Array(3));
    return "#" + [...value]
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

  function shuffledEarthTones() {
    const colors = [...EARTH_TONES];
    const random = crypto.getRandomValues(new Uint32Array(colors.length));

    for (let index = colors.length - 1; index > 0; index -= 1) {
      const swapIndex = random[index] % (index + 1);
      [colors[index], colors[swapIndex]] = [colors[swapIndex], colors[index]];
    }

    return colors;
  }

  function applyColors(event, colors) {
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
      const color = colors[index];

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

  button.addEventListener("click", event => {
    const colorInputs = pickerContainer.querySelectorAll('input[type="color"]');
    applyColors(event, [...colorInputs].map(() => randomHex()));
  }, true);

  earthButton.addEventListener("click", event => {
    const count = pickerContainer.querySelectorAll('input[type="color"]').length;
    applyColors(event, shuffledEarthTones().slice(0, count));
  }, true);
})();
