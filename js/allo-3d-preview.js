import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const stage = document.querySelector(".preview-stage");
const dinosaurSelect = document.getElementById("dinoSelect");
const patternSelect = document.getElementById("patternSelect");
const sexSelect = document.getElementById("sexSelect");
const pickerContainer = document.getElementById("pickers");

if (stage && dinosaurSelect) {
  const canvas = document.createElement("canvas");
  canvas.id = "allo3dPreview";
  canvas.setAttribute("aria-label", "Interactive 3D Allosaurus preview");
  canvas.style.cssText = [
    "position:absolute",
    "inset:0",
    "width:100%",
    "height:100%",
    "display:none",
    "z-index:6",
    "cursor:grab",
    "touch-action:none"
  ].join(";");
  stage.appendChild(canvas);

  const status = document.createElement("div");
  status.className = "allo-3d-status";
  status.textContent = "Loading Allosaurus 3D…";
  status.style.cssText = [
    "position:absolute",
    "left:50%",
    "top:50%",
    "transform:translate(-50%,-50%)",
    "z-index:7",
    "display:none",
    "padding:9px 13px",
    "border:1px solid rgba(181,162,236,.35)",
    "border-radius:999px",
    "background:rgba(12,9,18,.84)",
    "color:#d8caec",
    "font-size:11px",
    "letter-spacing:.08em",
    "text-transform:uppercase",
    "pointer-events:none"
  ].join(";");
  stage.appendChild(status);

  let renderer;
  let scene;
  let camera;
  let controls;
  let modelRoot;
  let bodyShader;
  let eyeMaterials = [];
  const maskTextures = new Map();
  let loaded = false;
  let failed = false;
  let active = false;
  let frameId = 0;
  let visibilityFrame = 0;
  let legacyVisibilityTimer = 0;
  let finalVisibilityTimer = 0;

  const CHANNELS = [
    "dominant", "markings", "flank", "detail",
    "body", "underside", "eyes"
  ];

  function editorColors() {
    const inputs = [...pickerContainer.querySelectorAll('input[type="color"]')];
    return Object.fromEntries(CHANNELS.map((name, index) => [
      name,
      new THREE.Color(inputs[index]?.value || "#FFFFFF")
    ]));
  }

  function prepareMask(texture) {
    texture.flipY = false;
    texture.colorSpace = THREE.NoColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  async function loadMasks() {
    const textureLoader = new THREE.TextureLoader();
    const tasks = [];
    ["a", "b", "c"].forEach(pattern => {
      ["male", "female"].forEach(sex => {
        [1, 2].forEach(set => {
          const key = `${pattern}-${sex}-${set}`;
          const source =
            `./assets/textures/allosaurus/${pattern}-${sex}-channels-${set}.png`;
          tasks.push(
            textureLoader.loadAsync(source).then(texture => {
              maskTextures.set(key, prepareMask(texture));
            })
          );
        });
      });
    });
    await Promise.all(tasks);
  }

  function activeMasks() {
    const pattern = ["A", "B", "C"].includes(patternSelect?.value)
      ? patternSelect.value.toLowerCase()
      : "a";
    const sex = sexSelect?.value === "female" ? "female" : "male";
    return {
      first: maskTextures.get(`${pattern}-${sex}-1`),
      second: maskTextures.get(`${pattern}-${sex}-2`)
    };
  }

  function updateLiveMaterial() {
    if (!bodyShader) return;
    const colors = editorColors();
    const masks = activeMasks();
    if (masks.first) bodyShader.uniforms.alloMask1.value = masks.first;
    if (masks.second) bodyShader.uniforms.alloMask2.value = masks.second;
    bodyShader.uniforms.alloDominant.value.copy(colors.dominant);
    bodyShader.uniforms.alloMarkings.value.copy(colors.markings);
    bodyShader.uniforms.alloFlank.value.copy(colors.flank);
    bodyShader.uniforms.alloDetail.value.copy(colors.detail);
    bodyShader.uniforms.alloBody.value.copy(colors.body);
    bodyShader.uniforms.alloUnderside.value.copy(colors.underside);
    eyeMaterials.forEach(material => {
      material.color.copy(colors.eyes);
    });
  }

  function installBodyShader(material) {
    const colors = editorColors();
    const masks = activeMasks();
    // Source's exponent texture is not a glTF metallic/roughness texture.
    // Using it as one makes the dinosaur look black and mirror-like.
    material.metalness = 0;
    material.metalnessMap = null;
    material.roughness = 0.72;
    material.roughnessMap = null;
    material.envMapIntensity = 0.28;
    if ("specularIntensity" in material) material.specularIntensity = 0.28;
    if ("specularIntensityMap" in material) material.specularIntensityMap = null;
    if ("specularColorMap" in material) material.specularColorMap = null;
    material.onBeforeCompile = shader => {
      shader.uniforms.alloMask1 = { value: masks.first };
      shader.uniforms.alloMask2 = { value: masks.second };
      shader.uniforms.alloDominant = { value: colors.dominant.clone() };
      shader.uniforms.alloMarkings = { value: colors.markings.clone() };
      shader.uniforms.alloFlank = { value: colors.flank.clone() };
      shader.uniforms.alloDetail = { value: colors.detail.clone() };
      shader.uniforms.alloBody = { value: colors.body.clone() };
      shader.uniforms.alloUnderside = { value: colors.underside.clone() };
      shader.fragmentShader = `
        uniform sampler2D alloMask1;
        uniform sampler2D alloMask2;
        uniform vec3 alloDominant;
        uniform vec3 alloMarkings;
        uniform vec3 alloFlank;
        uniform vec3 alloDetail;
        uniform vec3 alloBody;
        uniform vec3 alloUnderside;
      ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        vec4 alloChannels1 = texture2D( alloMask1, vMapUv );
        vec3 alloChannels2 = texture2D( alloMask2, vMapUv ).rgb;
        vec3 alloTint = alloBody;
        alloTint = mix( alloTint, alloUnderside, smoothstep( 0.02, 0.98, alloChannels2.r ) );
        alloTint = mix( alloTint, alloFlank, smoothstep( 0.02, 0.98, alloChannels1.b ) );
        alloTint = mix( alloTint, alloMarkings, smoothstep( 0.02, 0.98, alloChannels1.g ) );
        alloTint = mix( alloTint, alloDominant, smoothstep( 0.02, 0.98, alloChannels1.r ) );
        alloTint = mix( alloTint, alloDetail, smoothstep( 0.02, 0.98, alloChannels2.g ) );
        float alloShade = clamp(
          dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) ) * 0.24 + 0.90,
          0.88,
          1.16
        );
        diffuseColor.rgb = alloTint * alloShade;`
      );
      bodyShader = shader;
      updateLiveMaterial();
    };
    material.customProgramCacheKey = () => "allosaurus-live-colors-v2";
    material.color.set(0xffffff);
    material.needsUpdate = true;
  }

  function isAllosaurus() {
    return dinosaurSelect.value === "allo";
  }

  function showThreeDimensionalError() {
    status.textContent = "Allosaurus 3D preview could not be loaded";
    updateVisibility();
  }

  function updateVisibility() {
    active = isAllosaurus();

    if (!active) {
      canvas.style.setProperty("display", "none", "important");
      status.style.display = "none";
      return;
    }

    stage.querySelectorAll(":scope > canvas").forEach(item => {
      item.style.setProperty(
        "display",
        item === canvas ? "block" : "none",
        "important"
      );
    });

    status.style.display = loaded ? "none" : "block";
    resize();
    startRendering();
  }

  function keepThreeDimensionalPreviewVisible() {
    if (!isAllosaurus()) return;
    active = true;
    stage.querySelectorAll(":scope > canvas").forEach(item => {
      item.style.setProperty(
        "display",
        item === canvas ? "block" : "none",
        "important"
      );
    });
    status.style.display = loaded ? "none" : "block";
    startRendering();
  }

  function keepVisibleAfterLegacyRenderer() {
    keepThreeDimensionalPreviewVisible();
    cancelAnimationFrame(visibilityFrame);
    clearTimeout(legacyVisibilityTimer);
    clearTimeout(finalVisibilityTimer);
    visibilityFrame = requestAnimationFrame(keepThreeDimensionalPreviewVisible);
    legacyVisibilityTimer = setTimeout(keepThreeDimensionalPreviewVisible, 175);
    finalVisibilityTimer = setTimeout(keepThreeDimensionalPreviewVisible, 300);
  }

  function resize() {
    if (!renderer || !camera) return;
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function frameModel(object) {
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    object.position.sub(center);
    object.updateMatrixWorld(true);

    const radius = Math.max(size.length() * 0.5, 0.01);
    const distance = radius / Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));

    camera.near = Math.max(radius / 100, 0.01);
    camera.far = radius * 100;
    camera.position.set(distance * 0.12, radius * 0.22, distance * 1.08);
    camera.updateProjectionMatrix();

    controls.target.set(0, 0, 0);
    controls.minDistance = radius * 0.55;
    controls.maxDistance = radius * 5;
    controls.update();
  }

  function startRendering() {
    if (frameId) return;
    const draw = () => {
      frameId = 0;
      if (!active || !renderer || !scene || !camera) return;
      controls?.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);
  }

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1, 0.01, 10000);
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;

    canvas.addEventListener("pointerdown", () => { canvas.style.cursor = "grabbing"; });
    window.addEventListener("pointerup", () => { canvas.style.cursor = "grab"; });

    scene.add(new THREE.HemisphereLight(0xf1f5ff, 0x30283a, 2.6));
    const key = new THREE.DirectionalLight(0xfff1e3, 3.4);
    key.position.set(4, 6, 7);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xb9adff, 1.6);
    rim.position.set(-6, 2, -5);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0x9ce5ff, 1.15);
    fill.position.set(2, -3, 4);
    scene.add(fill);

    const masksReady = loadMasks();
    const loader = new GLTFLoader();
    loader.load(
      "./assets/models/allosaurus.glb",
      async gltf => {
        await masksReady;
        modelRoot = new THREE.Group();
        modelRoot.add(gltf.scene);
        scene.add(modelRoot);

        gltf.scene.traverse(item => {
          if (!item.isMesh) return;
          item.frustumCulled = false;
          item.castShadow = false;
          item.receiveShadow = false;
          const materials = Array.isArray(item.material)
            ? item.material
            : [item.material];
          materials.filter(Boolean).forEach(material => {
            material.side = THREE.DoubleSide;
            if (/body/i.test(material.name)) installBodyShader(material);
            if (/eye/i.test(material.name)) {
              material.metalness = 0;
              material.metalnessMap = null;
              material.roughness = 0.48;
              material.roughnessMap = null;
              if ("specularIntensity" in material) {
                material.specularIntensity = 0.38;
              }
              eyeMaterials.push(material);
            }
            material.needsUpdate = true;
          });
        });

        frameModel(modelRoot);
        loaded = true;
        status.style.display = "none";
        updateLiveMaterial();
        updateVisibility();
      },
      progress => {
        if (!progress.total) return;
        const percent = Math.round(progress.loaded / progress.total * 100);
        status.textContent = `Loading Allosaurus 3D · ${percent}%`;
      },
      error => {
        console.error("Allosaurus 3D preview failed:", error);
        failed = true;
        showThreeDimensionalError();
      }
    );

    new ResizeObserver(resize).observe(stage);
  } catch (error) {
    console.error("WebGL initialization failed:", error);
    failed = true;
    showThreeDimensionalError();
  }

  dinosaurSelect.addEventListener("change", () => {
    requestAnimationFrame(updateVisibility);
  });
  patternSelect?.addEventListener("change", () => {
    updateLiveMaterial();
    keepVisibleAfterLegacyRenderer();
  });
  sexSelect?.addEventListener("change", () => {
    updateLiveMaterial();
    keepVisibleAfterLegacyRenderer();
  });
  pickerContainer?.addEventListener("input", () => {
    updateLiveMaterial();
    keepVisibleAfterLegacyRenderer();
  });
  pickerContainer?.addEventListener("change", () => {
    updateLiveMaterial();
    keepVisibleAfterLegacyRenderer();
  });

  requestAnimationFrame(updateVisibility);
}
