const dinosaurSelect = document.getElementById("dinoSelect");

const viewerModules = Object.freeze({
  allo: "./allosaurus-3d-preview.js",
  austro: "./austroraptor-3d-preview.js",
  beipi: "./beipiaosaurus-3d-preview.js",
  carno: "./carnotaurus-3d-preview.js",
  deino: "./deinosuchus-3d-preview.js",
  dibble: "./diabloceratops-3d-preview.js",
  cerato: "./ceratosaurus-3d-preview.js",
  ptera: "./pteranodon-3d-preview.js",
  dilo: "./dilophosaurus-3d-preview.js",
  omniraptor: "./omniraptor-3d-preview.js",
  dryo: "./dryosaurus-3d-preview.js",
  galli: "./gallimimus-3d-preview.js"
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
