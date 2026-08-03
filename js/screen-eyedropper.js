(() => {
  const pickerContainer = document.getElementById("pickers");
  if (!pickerContainer) return;

  const supported = "EyeDropper" in window;
  const style = document.createElement("style");
  style.textContent = `
    .color-card.has-screen-eyedropper {
      grid-template-columns: 84px 36px minmax(0, 1fr) !important;
      gap: 8px !important;
    }

    .color-card.has-screen-eyedropper .color-info {
      grid-column: 1;
    }

    .color-card.has-screen-eyedropper .color-control {
      grid-column: 3;
    }

    .screen-eyedropper-button {
      grid-column: 2;
      align-self: center;
      justify-self: center;
      display: grid;
      place-items: center;
      width: 34px;
      min-width: 34px;
      height: 34px;
      min-height: 34px !important;
      padding: 0 !important;
      border: 1px solid rgba(255, 255, 255, 0.36);
      border-radius: 9px;
      color: #FFFFFF;
      background: rgba(12, 10, 18, 0.72);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(5px);
    }

    .screen-eyedropper-button:hover:not(:disabled) {
      color: #FFFFFF;
      background: rgba(45, 31, 63, 0.9);
      border-color: rgba(232, 121, 249, 0.72);
    }

    .screen-eyedropper-button.is-picking {
      color: #17101D;
      background: linear-gradient(
        100deg,
        #F1C879,
        #EAB2C5 38%,
        #B5A2EC 68%,
        #59BCEF
      );
    }

    .screen-eyedropper-button:disabled {
      display: none;
    }

    .screen-eyedropper-button svg {
      width: 17px;
      height: 17px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      pointer-events: none;
    }

    @media(max-width:1280px) {
      .color-card.has-screen-eyedropper {
        grid-template-columns: 76px 34px minmax(0, 1fr) !important;
        gap: 7px !important;
      }
    }

    @media(max-width:620px) {
      .color-card.has-screen-eyedropper {
        grid-template-columns: 70px 34px minmax(0, 1fr) !important;
        gap: 6px !important;
      }
    }
  `;
  document.head.append(style);

  function applyPickedColor(picker, color) {
    const normalized = String(color || "").toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(normalized)) return;

    const card = picker.closest(".color-card");
    const hexInput = card?.querySelector(".hex-input");
    const legacyHex = card?.querySelector(".hex");
    const chip = card?.querySelector(".color-chip");

    picker.value = normalized;
    if (hexInput) hexInput.value = normalized;
    if (legacyHex) legacyHex.textContent = normalized;
    if (chip) chip.style.background = normalized;

    picker.dispatchEvent(new Event("input", { bubbles: true }));
    picker.dispatchEvent(new Event("change", { bubbles: true }));
    pickerContainer.dispatchEvent(new Event("input", { bubbles: true }));
    pickerContainer.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function installButton(picker) {
    if (picker.dataset.screenEyedropperInstalled === "true") return;
    picker.dataset.screenEyedropperInstalled = "true";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "screen-eyedropper-button";
    button.disabled = !supported;
    button.title = supported
      ? "Pick a color from the screen"
      : "Screen eyedropper is not supported by this browser";
    button.setAttribute("aria-label", button.title);
    button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m2 22 1-1h3l9-9"></path>
        <path d="M3 21v-3l9-9"></path>
        <path d="m15 6 3.4-3.4a2.1 2.1 0 0 1 3 3L18 9"></path>
        <path d="m15 6 3 3"></path>
        <path d="M12 9l3 3"></path>
      </svg>
    `;

    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      if (!supported || button.classList.contains("is-picking")) return;

      button.classList.add("is-picking");
      button.disabled = true;

      try {
        const result = await new EyeDropper().open();
        applyPickedColor(picker, result.sRGBHex);
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error("Screen eyedropper failed:", error);
        }
      } finally {
        button.disabled = false;
        button.classList.remove("is-picking");
      }
    });

    const card = picker.closest(".color-card");
    const colorInfo = card?.querySelector(".color-info");
    const colorControl = card?.querySelector(".color-control");

    if (!card || !colorControl) return;

    card.classList.add("has-screen-eyedropper");
    if (colorInfo) {
      colorInfo.insertAdjacentElement("afterend", button);
    } else {
      colorControl.insertAdjacentElement("beforebegin", button);
    }
  }

  function installAll() {
    pickerContainer
      .querySelectorAll('input[type="color"]')
      .forEach(installButton);
  }

  new MutationObserver(installAll).observe(pickerContainer, {
    childList: true,
    subtree: true
  });

  installAll();
})();
