const dinosaurSelect = document.getElementById("dinoSelect");
document.getElementById("savePreviewBtn")?.remove();

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
  pachy: "./dinos/pachycephalosaurus-3d-preview.js",
  stego: "./dinos/stegosaurus-3d-preview.js",
  tenonto: "./dinos/tenontosaurus-3d-preview.js",
  trex: "./dinos/tyrannosaurus-3d-preview.js",
  trike: "./dinos/triceratops-3d-preview.js"
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
