(() => {
  const sexSelect = document.getElementById("sexSelect");
  const patternSelect = document.getElementById("patternSelect");
  const dinosaurSelect = document.getElementById("dinoSelect");

  if (!sexSelect || !patternSelect || !dinosaurSelect) return;

  function refreshPreview() {
    // Existing species renderers already redraw when these controls change.
    patternSelect.dispatchEvent(new Event("change", { bubbles: true }));
    dinosaurSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  sexSelect.addEventListener("change", refreshPreview);
})();
