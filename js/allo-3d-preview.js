const dinosaurSelect = document.getElementById("dinoSelect");
document.getElementById("savePreviewBtn")?.remove();

if (dinosaurSelect && !dinosaurSelect.querySelector('option[value="austro"]')) {
  const option = document.createElement("option");
  option.value = "austro";
  option.textContent = "Austroraptor";
  dinosaurSelect.querySelector('option[value="allo"]')?.after(option);
}

if (dinosaurSelect && !dinosaurSelect.querySelector('option[value="bary"]')) {
  const option = document.createElement("option");
  option.value = "bary";
  option.textContent = "Baryonyx";
  const anchor =
    dinosaurSelect.querySelector('option[value="austro"]') ||
    dinosaurSelect.querySelector('option[value="allo"]');
  anchor?.after(option);
}

if (dinosaurSelect && !dinosaurSelect.querySelector('option[value="ovi"]')) {
  const option = document.createElement("option");
  option.value = "ovi";
  option.textContent = "Oviraptor";
  const anchor =
    dinosaurSelect.querySelector('option[value="bary"]') ||
    dinosaurSelect.querySelector('option[value="austro"]') ||
    dinosaurSelect.querySelector('option[value="allo"]');
  anchor?.after(option);
}

if (dinosaurSelect && !dinosaurSelect.querySelector('option[value="camara"]')) {
  const option = document.createElement("option");
  option.value = "camara";
  option.textContent = "Camarasaurus";
  const anchor =
    dinosaurSelect.querySelector('option[value="bary"]') ||
    dinosaurSelect.querySelector('option[value="ovi"]') ||
    dinosaurSelect.querySelector('option[value="austro"]') ||
    dinosaurSelect.querySelector('option[value="allo"]');
  anchor?.after(option);
}

if (dinosaurSelect && !dinosaurSelect.querySelector('option[value="ava"]')) {
  const option = document.createElement("option");
  option.value = "ava";
  option.textContent = "Avaceratops";
  const anchor =
    dinosaurSelect.querySelector('option[value="austro"]') ||
    dinosaurSelect.querySelector('option[value="allo"]');
  anchor?.after(option);
}

if (dinosaurSelect && !dinosaurSelect.querySelector('option[value="quetz"]')) {
  const option = document.createElement("option");
  option.value = "quetz";
  option.textContent = "Quetzalcoatlus";
  const anchor =
    dinosaurSelect.querySelector('option[value="ptera"]') ||
    dinosaurSelect.querySelector('option[value="ovi"]') ||
    dinosaurSelect.querySelector('option[value="allo"]');
  anchor?.after(option);
}

function sortDinosaurOptions() {
  if (!dinosaurSelect) return;
  const current = [...dinosaurSelect.options];
  const sorted = [...current].sort((first, second) =>
    first.textContent.trim().localeCompare(
      second.textContent.trim(),
      undefined,
      { sensitivity: "base" }
    )
  );
  if (current.every((option, index) => option === sorted[index])) return;
  const selectedValue = dinosaurSelect.value;
  dinosaurSelect.append(...sorted);
  dinosaurSelect.value = selectedValue;
}

sortDinosaurOptions();

if (dinosaurSelect) {
  new MutationObserver(sortDinosaurOptions).observe(dinosaurSelect, {
    childList: true
  });
}

const viewerModules = Object.freeze({
  allo: "./dinos/allosaurus-3d-preview.js",
  austro: "./dinos/austroraptor-3d-preview.js",
  beipi: "./dinos/beipiaosaurus-3d-preview.js",
  carno: "./dinos/carnotaurus-3d-preview.js",
  deino: "./dinos/deinosuchus-3d-preview.js",
  dibble: "./dinos/diabloceratops-3d-preview.js",
  cerato: "./dinos/ceratosaurus-3d-preview.js",
  ptera: "./dinos/pteranodon-3d-preview.js",
  dilo: "./dinos/dilophosaurus-3d-preview.js",
  omniraptor: "./dinos/omniraptor-3d-preview.js",
  dryo: "./dinos/dryosaurus-3d-preview.js",
  galli: "./dinos/gallimimus-3d-preview.js",
  herra: "./dinos/herrerasaurus-3d-preview.js",
  hypsi: "./dinos/hypsilophodon-3d-preview.js",
  kentro: "./dinos/kentrosaurus-3d-preview.js",
  maia: "./dinos/maiasaura-3d-preview.js",
  pachy: "./dinos/pachycephalosaurus-3d-preview.js?v=extended-patterns-final-4",
  stego: "./dinos/stegosaurus-3d-preview.js?v=extended-patterns-final-4",
  tenonto: "./dinos/tenontosaurus-3d-preview.js",
  trex: "./dinos/tyrannosaurus-3d-preview.js",
  trike: "./dinos/triceratops-3d-preview.js",
  troodon: "./dinos/troodon-3d-preview.js",
  bary: "./dinos/baryonyx-3d-preview.js?v=extended-patterns-final-4",
  ovi: "./dinos/oviraptor-3d-preview.js",
  camara: "./dinos/camarasaurus-3d-preview.js",
  ava: "./dinos/avaceratops-3d-preview.js",
  quetz: "./dinos/quetzalcoatlus-3d-preview.js"
});

const loadedViewers = new Map();

function loadSelectedViewer() {
  const species = dinosaurSelect?.value;
  const modulePath = viewerModules[species];
  if (!modulePath) return Promise.resolve();

  if (!loadedViewers.has(species)) {
    const loadPromise = import(modulePath).catch(error => {
      loadedViewers.delete(species);
      console.error(`Unable to load the ${species} 3D preview:`, error);
      throw error;
    });
    loadedViewers.set(species, loadPromise);
  }

  return loadedViewers.get(species);
}

dinosaurSelect?.addEventListener("change", loadSelectedViewer);
loadSelectedViewer();
