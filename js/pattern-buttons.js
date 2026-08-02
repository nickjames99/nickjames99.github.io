(() => {
  const select = document.getElementById("patternSelect");
  if (!select) return;

  const patterns = ["A", "B", "C", "D", "E"];
  const group = document.createElement("div");
  group.className = "pattern-button-group";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Preview pattern");

  const buttons = new Map();
  patterns.forEach(pattern => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pattern-choice-button";
    button.dataset.pattern = pattern;
    button.textContent = pattern;
    button.setAttribute("aria-label", `Pattern ${pattern}`);
    button.addEventListener("click", () => {
      if (button.disabled || select.value === pattern) return;
      select.value = pattern;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    buttons.set(pattern, button);
    group.append(button);
  });

  select.insertAdjacentElement("afterend", group);
  select.setAttribute("aria-hidden", "true");
  select.tabIndex = -1;

  const style = document.createElement("style");
  style.textContent = `
    #patternSelect {
      display: none !important;
    }

    .pattern-button-group {
      display: flex;
      align-items: center;
      gap: 7px;
      flex-wrap: wrap;
    }

    .preview-controls .pattern-choice-button {
      min-width: 43px;
      min-height: 40px;
      padding: 0 13px;
      border: 1px solid rgba(255, 255, 255, 0.24);
      border-radius: 12px;
      color: #17101D;
      background: linear-gradient(
        100deg,
        #F1C879 0%,
        #EAB2C5 37%,
        #B5A2EC 68%,
        #59BCEF 100%
      );
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.34);
      font-weight: 950;
      opacity: 0.72;
      filter: saturate(0.78) brightness(0.86);
      transition: transform 150ms ease, opacity 150ms ease,
        filter 150ms ease, box-shadow 150ms ease;
    }

    .preview-controls .pattern-choice-button:hover:not(:disabled) {
      opacity: 0.9;
      filter: saturate(0.95) brightness(0.96);
    }

    .preview-controls .pattern-choice-button.is-active {
      opacity: 1;
      filter: none;
      transform: translateY(-1px);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.48),
        0 0 0 2px rgba(197, 163, 255, 0.28),
        0 7px 20px rgba(89, 188, 239, 0.18);
    }

    .preview-controls .pattern-choice-button:disabled {
      cursor: not-allowed;
      opacity: 0.2;
      filter: grayscale(0.85) brightness(0.55);
      transform: none;
    }

    .preview-controls .pattern-choice-button[hidden] {
      display: none !important;
    }
  `;
  document.head.append(style);

  function syncButtons() {
    patterns.forEach(pattern => {
      const option = [...select.options].find(item => item.value === pattern);
      const available = Boolean(option && !option.disabled && !option.hidden);
      const button = buttons.get(pattern);
      const active = available && select.value === pattern;

      button.hidden = !available;
      button.disabled = !available;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      button.title = available
        ? `Pattern ${pattern}`
        : `Pattern ${pattern} is not available for this dinosaur`;
    });
  }

  select.addEventListener("change", syncButtons);
  document.getElementById("dinoSelect")?.addEventListener("change", () => {
    requestAnimationFrame(syncButtons);
    setTimeout(syncButtons, 0);
  });

  new MutationObserver(syncButtons).observe(select, {
    attributes: true,
    childList: true,
    subtree: true
  });

  syncButtons();
})();
