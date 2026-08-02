(() => {
  const dinosaurSelect = document.getElementById("dinoSelect");
  const patternSelect = document.getElementById("patternSelect");

  if (!dinosaurSelect) return;

  function renderInitialPreview() {
    dinosaurSelect.dispatchEvent(new Event("change", { bubbles: true }));
    patternSelect?.dispatchEvent(new Event("change", { bubbles: true }));
  }

  if (document.readyState === "complete") {
    requestAnimationFrame(renderInitialPreview);
  } else {
    window.addEventListener("load", () => {
      requestAnimationFrame(renderInitialPreview);
    }, { once: true });
  }
})();

