// @ts-nocheck
// Original procedural forest, insects, net and textures copied from the working WEB prototype.
// Gameplay is exclusively in game/arcade/original/butterflyCatch.ts.
import * as THREE from 'three';
import {originalButterflyWorldPosition,originalButterflyProjection} from '../../../game/arcade/original/butterflyCatch';
export function createOriginalButterflyWorld(canvas:HTMLCanvasElement){
const isIosSafari=true,scene=new THREE.Scene(),wingTextureCache=new Map(),random=mulberry32(7331);
const camera=new THREE.PerspectiveCamera(62,360/640,.08,90);camera.position.set(0,1.78,0);camera.rotation.order='YXZ';scene.add(camera);scene.fog=new THREE.FogExp2(0x9ebda5,.025);
const flyingBugSpecs = [
  { kind: "butterfly", name: "Koninginnenpage", base: "#f6b93b", edge: "#30251c", accent: "#fff1a3", flap: 15, speed: 0.038, scale: 0.35, points: 2, focusRate: 1 },
  { kind: "dragonfly", name: "Smaragdlibel", base: "#43bfa8", edge: "#153b3a", accent: "#a8fff1", flap: 25, speed: 0.066, scale: 0.3, points: 3, focusRate: 1 },
  { kind: "bee", name: "Aardhommel", base: "#e4ae38", edge: "#2d2319", accent: "#f8edcf", flap: 32, speed: 0.028, scale: 0.31, points: 1, focusRate: 1 },
  { kind: "moth", name: "Atlasmot", base: "#bc714c", edge: "#45261d", accent: "#f4ca9f", flap: 11, speed: 0.022, scale: 0.4, points: 1, focusRate: 1 },
  { kind: "beetle", name: "Gouden tor", base: "#3aa36d", edge: "#163d31", accent: "#d9b95c", flap: 22, speed: 0.045, scale: 0.3, points: 2, focusRate: 1 },
  { kind: "butterfly", name: "Blauwe morpho", base: "#1f8de4", edge: "#10203b", accent: "#8fe9ff", flap: 16, speed: 0.061, scale: 0.36, points: 3, focusRate: 1 },
  { kind: "dragonfly", name: "Keizerlibel", base: "#55aee2", edge: "#173653", accent: "#c5f5ff", flap: 27, speed: 0.068, scale: 0.33, points: 3, focusRate: 1 },
  { kind: "bee", name: "Honingbij", base: "#d4932c", edge: "#34251b", accent: "#fff0b8", flap: 34, speed: 0.03, scale: 0.28, points: 1, focusRate: 1 },
  { kind: "moth", name: "Maanmot", base: "#a5d398", edge: "#344d34", accent: "#ecffdf", flap: 10, speed: 0.024, scale: 0.42, points: 1, focusRate: 1 },
  { kind: "beetle", name: "Juweelkever", base: "#3a9e9a", edge: "#162f31", accent: "#d9823e", flap: 23, speed: 0.047, scale: 0.29, points: 2, focusRate: 1 },
  { kind: "butterfly", name: "Atalanta", base: "#d95f32", edge: "#241b1b", accent: "#fff2d1", flap: 16, speed: 0.041, scale: 0.34, points: 2, focusRate: 1 },
  { kind: "dragonfly", name: "Bandheidelibel", base: "#d44a35", edge: "#40221d", accent: "#f8c7aa", flap: 26, speed: 0.065, scale: 0.31, points: 3, focusRate: 1 },
];

function mulberry32(seed) {
  return function nextRandom() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function range(min, max) {
  return min + (max - min) * random();
}

function smoothstep(value) {
  const clamped = THREE.MathUtils.clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}


function groundHeight(x, z) {
  const distance = Math.hypot(x, z);
  const centerFlatten = smoothstep((distance - 2.5) / 7);
  const rolling =
    Math.sin(x * 0.24) * 0.34
    + Math.cos(z * 0.19) * 0.28
    + Math.sin((x + z) * 0.11) * 0.22;
  return rolling * centerFlatten - 0.08;
}

function createLights(targetScene) {
  const hemisphere = new THREE.HemisphereLight(0xd7efff, 0x203c27, 1.55);
  targetScene.add(hemisphere);

  const sun = new THREE.DirectionalLight(0xffe7b0, 4.15);
  sun.position.set(-11, 16, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -16;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 42;
  sun.shadow.bias = -0.00018;
  sun.shadow.normalBias = 0.028;
  targetScene.add(sun);

  const warmFill = new THREE.PointLight(0xffc978, 4.5, 13, 2);
  warmFill.position.set(4, 4.5, -5);
  targetScene.add(warmFill);
}

function createSkyDome(targetScene) {
  const geometry = new THREE.SphereGeometry(55, 36, 20);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x4d8eaf) },
      horizonColor: { value: new THREE.Color(0xd6e3c4) },
      bottomColor: { value: new THREE.Color(0x587b51) },
      sunDirection: { value: new THREE.Vector3(-0.45, 0.72, 0.35).normalize() },
    },
    vertexShader: `
      varying vec3 vWorldDirection;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldDirection = normalize(worldPosition.xyz - cameraPosition);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vWorldDirection;
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      uniform vec3 sunDirection;
      void main() {
        float heightMix = smoothstep(-0.2, 0.75, vWorldDirection.y);
        vec3 base = mix(bottomColor, horizonColor, smoothstep(-0.35, 0.05, vWorldDirection.y));
        base = mix(base, topColor, heightMix);
        float sunDot = max(dot(vWorldDirection, sunDirection), 0.0);
        float sunGlow = pow(sunDot, 72.0);
        float haze = pow(1.0 - abs(vWorldDirection.y), 7.0);
        float cloudBands = sin(vWorldDirection.x * 22.0 + vWorldDirection.z * 13.0)
          + sin(vWorldDirection.x * 47.0 - vWorldDirection.z * 31.0) * 0.42;
        float clouds = smoothstep(0.78, 1.28, cloudBands) * smoothstep(0.05, 0.5, vWorldDirection.y);
        base = mix(base, vec3(0.93, 0.95, 0.88), clouds * 0.22);
        base += vec3(1.0, 0.73, 0.34) * sunGlow * 0.82;
        base += vec3(0.32, 0.38, 0.25) * haze * 0.12;
        gl_FragColor = vec4(base, 1.0);
      }
    `,
  });
  const dome = new THREE.Mesh(geometry, material);
  targetScene.add(dome);

  const sunDisc = new THREE.Mesh(
    new THREE.SphereGeometry(1.25, 20, 12),
    new THREE.MeshBasicMaterial({ color: 0xffe79a, fog: false }),
  );
  sunDisc.position.set(-25, 31, 19);
  targetScene.add(sunDisc);
}

function createGroundTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 512;
  const context = textureCanvas.getContext("2d");
  const image = context.createImageData(512, 512);
  for (let index = 0; index < image.data.length; index += 4) {
    const x = (index / 4) % 512;
    const y = Math.floor(index / 4 / 512);
    const broad = Math.sin(x * 0.055) * 9 + Math.cos(y * 0.047) * 7;
    const grain = (random() - 0.5) * 24;
    image.data[index] = 74 + broad + grain;
    image.data[index + 1] = 118 + broad + grain * 0.55;
    image.data[index + 2] = 62 + broad * 0.45 + grain * 0.3;
    image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  context.globalAlpha = 0.2;
  for (let index = 0; index < 280; index += 1) {
    context.fillStyle = index % 3 === 0 ? "#b9a36d" : "#315f34";
    context.beginPath();
    context.arc(range(0, 512), range(0, 512), range(0.6, 2.4), 0, Math.PI * 2);
    context.fill();
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7, 7);
  texture.anisotropy = Math.min(isIosSafari ? 2 : 8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function createTerrain(targetScene) {
  const terrainSegments = isIosSafari ? 56 : 80;
  const geometry = new THREE.PlaneGeometry(64, 64, terrainSegments, terrainSegments);
  const positions = geometry.attributes.position;

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = positions.getY(index);
    positions.setZ(index, groundHeight(x, z));
  }

  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);

  const groundTexture = createGroundTexture();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: groundTexture,
    bumpMap: groundTexture,
    bumpScale: 0.08,
    roughness: 0.97,
    metalness: 0,
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  targetScene.add(terrain);

  const path = new THREE.Mesh(
    new THREE.RingGeometry(2.1, 3.05, 64),
    new THREE.MeshStandardMaterial({
      color: 0x8a7650,
      roughness: 1,
      transparent: true,
      opacity: 0.76,
      depthWrite: false,
    }),
  );
  path.rotation.x = -Math.PI / 2;
  path.position.y = 0.012;
  path.receiveShadow = true;
  targetScene.add(path);
}

function createForest(targetScene) {
  const treeCount = isIosSafari ? 38 : 52;
  const dummy = new THREE.Object3D();
  const trunkGeometry = new THREE.CylinderGeometry(0.24, 0.42, 4.1, 14, 3);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x6a4c31, roughness: 0.98 });
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, treeCount);
  trunks.castShadow = true;
  trunks.receiveShadow = true;

  const crownClusters = isIosSafari ? 4 : 6;
  const crownGeometry = new THREE.SphereGeometry(1, 14, 10);
  const crownMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.94 });
  const crowns = new THREE.InstancedMesh(crownGeometry, crownMaterial, treeCount * crownClusters);
  crowns.castShadow = true;
  crowns.receiveShadow = true;
  const treeData = [];

  for (let index = 0; index < treeCount; index += 1) {
    const angle = (index / treeCount) * Math.PI * 2 + range(-0.045, 0.045);
    const distance = index % 3 === 0 ? range(10, 15) : range(17, 29);
    const far = distance > 18;
    const scale = far ? range(1.2, 2.05) : range(0.8, 1.35);
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = groundHeight(x, z);
    const rotation = range(0, Math.PI * 2);
    treeData.push({ x, y, z, scale, far, rotation });

    dummy.position.set(x, y + 2.05 * scale, z);
    dummy.rotation.set(0, rotation, 0);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    trunks.setMatrixAt(index, dummy.matrix);

    for (let cluster = 0; cluster < crownClusters; cluster += 1) {
      const layer = Math.floor(cluster / 2);
      const side = cluster % 2 === 0 ? -1 : 1;
      const crownScale = scale * (1.28 - layer * 0.13) * range(0.91, 1.08);
      dummy.position.set(
        x + Math.cos(rotation + layer * 1.7) * side * scale * (0.38 + layer * 0.08),
        y + scale * (3.55 + layer * 0.63 + (cluster % 2) * 0.12),
        z + Math.sin(rotation + layer * 1.7) * side * scale * (0.35 + layer * 0.08),
      );
      dummy.rotation.set(range(-0.08, 0.08), rotation + cluster * 0.7, range(-0.08, 0.08));
      dummy.scale.set(crownScale * 1.16, crownScale * 0.78, crownScale);
      dummy.updateMatrix();
      const crownIndex = index * crownClusters + cluster;
      crowns.setMatrixAt(crownIndex, dummy.matrix);
      crowns.setColorAt(crownIndex, new THREE.Color(
        far
          ? ["#31543a", "#365f3d", "#2f5739"][cluster % 3]
          : ["#356c40", "#3f7b47", "#477f49", "#2f6339"][cluster % 4],
      ));
    }
  }
  trunks.instanceMatrix.needsUpdate = true;
  crowns.instanceMatrix.needsUpdate = true;
  crowns.instanceColor.needsUpdate = true;
  targetScene.add(trunks, crowns);

  const hillMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f6947,
    roughness: 1,
  });

  const hillCount = isIosSafari ? 12 : 18;
  for (let index = 0; index < hillCount; index += 1) {
    const angle = (index / hillCount) * Math.PI * 2 + range(-0.12, 0.12);
    const distance = range(28, 37);
    const hill = new THREE.Mesh(
      new THREE.SphereGeometry(range(3.6, 6.5), 18, 10),
      hillMaterial,
    );
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    hill.scale.y = range(0.55, 0.95);
    hill.position.set(x, groundHeight(x, z) - 1.2, z);
    hill.rotation.set(range(-0.1, 0.1), range(0, Math.PI), range(-0.08, 0.08));
    targetScene.add(hill);
  }
}

function createMeadowDetails(targetScene) {
  const dummy = new THREE.Object3D();

  const grassGeometry = new THREE.ConeGeometry(0.032, 0.56, 5);
  grassGeometry.translate(0, 0.26, 0);
  const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x5f9a51,
    roughness: 1,
    side: THREE.DoubleSide,
  });
  const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, isIosSafari ? 440 : 760);
  grass.receiveShadow = true;

  for (let index = 0; index < grass.count; index += 1) {
    const angle = range(0, Math.PI * 2);
    const distance = Math.sqrt(random()) * 21 + 2.8;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const size = range(0.65, 1.7);
    dummy.position.set(x, groundHeight(x, z), z);
    dummy.rotation.set(range(-0.08, 0.08), range(0, Math.PI * 2), range(-0.16, 0.16));
    dummy.scale.set(size, size, size);
    dummy.updateMatrix();
    grass.setMatrixAt(index, dummy.matrix);
  }
  grass.instanceMatrix.needsUpdate = true;
  targetScene.add(grass);

  const flowerStemGeometry = new THREE.CylinderGeometry(0.018, 0.024, 0.45, 5);
  flowerStemGeometry.translate(0, 0.225, 0);
  const flowerStemMaterial = new THREE.MeshStandardMaterial({ color: 0x3d743f, roughness: 1 });
  const flowerCount = isIosSafari ? 96 : 150;
  const flowerStems = new THREE.InstancedMesh(flowerStemGeometry, flowerStemMaterial, flowerCount);

  const flowerHeadGeometry = new THREE.SphereGeometry(0.095, 8, 6);
  const flowerHeadMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x3c2604,
    emissiveIntensity: 0.15,
    roughness: 0.8,
    vertexColors: true,
  });
  const flowerHeads = new THREE.InstancedMesh(flowerHeadGeometry, flowerHeadMaterial, flowerCount);

  for (let index = 0; index < flowerStems.count; index += 1) {
    const angle = range(0, Math.PI * 2);
    const distance = range(3.2, 17);
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const scale = range(0.65, 1.45);
    const y = groundHeight(x, z);

    dummy.position.set(x, y, z);
    dummy.rotation.set(0, range(0, Math.PI * 2), range(-0.1, 0.1));
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    flowerStems.setMatrixAt(index, dummy.matrix);

    dummy.position.set(x, y + 0.46 * scale, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    flowerHeads.setMatrixAt(index, dummy.matrix);
    flowerHeads.setColorAt(index, new THREE.Color([
      "#f7c75f",
      "#f29abe",
      "#b6d9ff",
      "#f5f0d5",
      "#d8a5ff",
    ][index % 5]));
  }
  flowerStems.instanceMatrix.needsUpdate = true;
  flowerHeads.instanceMatrix.needsUpdate = true;
  flowerHeads.instanceColor.needsUpdate = true;
  targetScene.add(flowerStems, flowerHeads);

  const stoneGeometry = new THREE.DodecahedronGeometry(0.38, 1);
  const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x777d70, roughness: 0.98 });
  const stones = new THREE.InstancedMesh(stoneGeometry, stoneMaterial, isIosSafari ? 32 : 48);
  stones.castShadow = true;
  stones.receiveShadow = true;

  for (let index = 0; index < stones.count; index += 1) {
    const angle = range(0, Math.PI * 2);
    const distance = range(4.5, 22);
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    dummy.position.set(x, groundHeight(x, z) + 0.12, z);
    dummy.rotation.set(range(0, Math.PI), range(0, Math.PI), range(0, Math.PI));
    dummy.scale.set(range(0.35, 1.25), range(0.25, 0.75), range(0.4, 1.15));
    dummy.updateMatrix();
    stones.setMatrixAt(index, dummy.matrix);
  }
  stones.instanceMatrix.needsUpdate = true;
  targetScene.add(stones);

  const shrubGeometry = new THREE.SphereGeometry(0.52, 12, 8);
  const shrubMaterial = new THREE.MeshStandardMaterial({ color: 0x397342, roughness: 0.96 });
  const shrubs = new THREE.InstancedMesh(shrubGeometry, shrubMaterial, isIosSafari ? 44 : 68);
  for (let index = 0; index < shrubs.count; index += 1) {
    const angle = range(0, Math.PI * 2);
    const distance = range(5.5, 18);
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const scale = range(0.45, 1.35);
    dummy.position.set(x, groundHeight(x, z) + 0.24 * scale, z);
    dummy.rotation.set(range(-0.08, 0.08), range(0, Math.PI * 2), range(-0.08, 0.08));
    dummy.scale.set(scale * range(0.85, 1.25), scale * range(0.7, 1.15), scale);
    dummy.updateMatrix();
    shrubs.setMatrixAt(index, dummy.matrix);
  }
  shrubs.instanceMatrix.needsUpdate = true;
  targetScene.add(shrubs);

  const motesGeometry = new THREE.BufferGeometry();
  const moteCount = isIosSafari ? 120 : 240;
  const motePositions = new Float32Array(moteCount * 3);
  for (let index = 0; index < moteCount; index += 1) {
    const angle = range(0, Math.PI * 2);
    const distance = range(2, 18);
    motePositions[index * 3] = Math.cos(angle) * distance;
    motePositions[index * 3 + 1] = range(0.35, 5.5);
    motePositions[index * 3 + 2] = Math.sin(angle) * distance;
  }
  motesGeometry.setAttribute("position", new THREE.BufferAttribute(motePositions, 3));
  const motes = new THREE.Points(
    motesGeometry,
    new THREE.PointsMaterial({
      color: 0xffedaa,
      size: 0.045,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  motes.name = "sun-motes";
  targetScene.add(motes);
}

function createWingTexture(palette) {
  if (wingTextureCache.has(palette.name)) {
    return wingTextureCache.get(palette.name);
  }

  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 512;
  const context = textureCanvas.getContext("2d");
  const gradient = context.createRadialGradient(180, 220, 25, 240, 240, 310);
  gradient.addColorStop(0, palette.accent);
  gradient.addColorStop(0.42, palette.base);
  gradient.addColorStop(1, palette.edge);

  context.clearRect(0, 0, 512, 512);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);

  context.globalAlpha = 0.32;
  context.strokeStyle = palette.edge;
  context.lineWidth = 8;
  for (let index = 0; index < 9; index += 1) {
    context.beginPath();
    context.moveTo(24, 430);
    context.quadraticCurveTo(170 + index * 18, 220 - index * 11, 478, 42 + index * 36);
    context.stroke();
  }

  context.globalAlpha = 0.78;
  for (let index = 0; index < 12; index += 1) {
    const x = 90 + (index % 4) * 104 + (index % 2) * 12;
    const y = 78 + Math.floor(index / 4) * 140;
    context.beginPath();
    context.fillStyle = index % 3 === 0 ? palette.accent : palette.edge;
    context.arc(x, y, index % 3 === 0 ? 18 : 11, 0, Math.PI * 2);
    context.fill();
  }

  context.globalAlpha = 0.95;
  context.strokeStyle = palette.edge;
  context.lineWidth = 18;
  context.strokeRect(8, 8, 496, 496);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.needsUpdate = true;
  wingTextureCache.set(palette.name, texture);
  return texture;
}

function createForeWingGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.5, 0.15, 1.55, 0.68, 1.72, 1.55);
  shape.bezierCurveTo(1.82, 2.12, 1.12, 2.35, 0.58, 1.82);
  shape.bezierCurveTo(0.18, 1.42, 0.02, 0.64, 0, 0);
  return new THREE.ShapeGeometry(shape, 12);
}

function createHindWingGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.45, -0.05, 1.22, 0.24, 1.4, 0.98);
  shape.bezierCurveTo(1.48, 1.52, 0.84, 1.78, 0.4, 1.42);
  shape.bezierCurveTo(0.08, 1.12, 0.01, 0.42, 0, 0);
  return new THREE.ShapeGeometry(shape, 10);
}

function createAntenna(points, material) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.012, 5, false), material);
}

function createFlightCurve(index) {
  const points = [];
  const pointCount = 12;
  const nearRadius = 0.82 + (index % 4) * 0.18;
  const farRadius = 6.2 + (index % 6) * 0.8;
  const angularOffset = (index / 12) * Math.PI * 2 + range(-0.4, 0.4);

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    const angle = angularOffset + (pointIndex / pointCount) * Math.PI * 2;
    const approachWave = (Math.sin((pointIndex / pointCount) * Math.PI * 2 + index * 0.73) + 1) * 0.5;
    const radius = THREE.MathUtils.lerp(nearRadius, farRadius, smoothstep(approachWave)) * range(0.9, 1.1);
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      range(1.05, 2.65) + approachWave * range(0.3, 1.5) + Math.sin(angle * 2 + index) * 0.28,
      Math.sin(angle) * radius,
    ));
  }

  return new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.55);
}

function createButterfly(index) {
  const palette = flyingBugSpecs[index % flyingBugSpecs.length];
  const kind = palette.kind;
  const group = new THREE.Group();
  group.name = `flying-bug-${kind}-${index}`;

  const wingMaterialOptions = {
    map: createWingTexture(palette),
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: kind === "dragonfly" || kind === "bee" ? 0.64 : 0.98,
  };
  const wingMaterial = isIosSafari
    ? new THREE.MeshBasicMaterial(wingMaterialOptions)
    : new THREE.MeshPhysicalMaterial({
      ...wingMaterialOptions,
      roughness: kind === "dragonfly" ? 0.28 : 0.55,
      metalness: kind === "beetle" ? 0.24 : 0.02,
      clearcoat: kind === "beetle" ? 0.72 : 0.38,
      clearcoatRoughness: 0.45,
    });

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: palette.edge,
    roughness: kind === "moth" ? 0.92 : 0.68,
    metalness: kind === "beetle" ? 0.34 : 0,
  });
  const eyeMaterial = isIosSafari
    ? new THREE.MeshBasicMaterial({ color: 0x090704 })
    : new THREE.MeshPhysicalMaterial({
      color: 0x090704,
      roughness: 0.18,
      clearcoat: 0.8,
    });

  const foreWingLeft = new THREE.Group();
  const foreWingRight = new THREE.Group();
  const hindWingLeft = new THREE.Group();
  const hindWingRight = new THREE.Group();

  const foreWingGeometry = createForeWingGeometry();
  const hindWingGeometry = createHindWingGeometry();

  const foreLeftMesh = new THREE.Mesh(foreWingGeometry, wingMaterial);
  foreLeftMesh.rotation.x = -Math.PI / 2;
  foreLeftMesh.position.set(0.08, 0, 0);
  if (kind === "dragonfly") foreLeftMesh.scale.set(1.35, 0.34, 1);
  if (kind === "bee") foreLeftMesh.scale.set(0.68, 0.74, 1);
  if (kind === "beetle") foreLeftMesh.scale.set(0.58, 0.68, 1);
  if (kind === "moth") foreLeftMesh.scale.set(1.08, 1.12, 1);
  foreLeftMesh.castShadow = true;
  foreWingLeft.add(foreLeftMesh);

  const foreRightMesh = foreLeftMesh.clone();
  foreRightMesh.scale.x *= -1;
  foreRightMesh.position.x = -0.08;
  foreWingRight.add(foreRightMesh);

  const hindLeftMesh = new THREE.Mesh(hindWingGeometry, wingMaterial);
  hindLeftMesh.rotation.x = -Math.PI / 2;
  hindLeftMesh.position.set(0.08, -0.01, 0.15);
  hindLeftMesh.scale.set(0.82, 0.82, 0.82);
  if (kind === "dragonfly") hindLeftMesh.scale.set(1.2, 0.3, 0.78);
  if (kind === "bee") hindLeftMesh.scale.set(0.52, 0.58, 0.72);
  if (kind === "beetle") hindLeftMesh.scale.set(0.46, 0.54, 0.68);
  hindLeftMesh.castShadow = true;
  hindWingLeft.add(hindLeftMesh);

  const hindRightMesh = hindLeftMesh.clone();
  hindRightMesh.scale.x *= -1;
  hindRightMesh.position.x = -0.08;
  hindWingRight.add(hindRightMesh);

  const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), bodyMaterial);
  thorax.scale.set(
    kind === "bee" || kind === "beetle" ? 1.18 : 0.9,
    kind === "dragonfly" ? 0.68 : 0.85,
    kind === "bee" || kind === "beetle" ? 1.42 : 1.25,
  );
  thorax.castShadow = true;

  const abdomen = new THREE.Mesh(
    new THREE.CapsuleGeometry(kind === "dragonfly" ? 0.072 : 0.105, kind === "dragonfly" ? 0.88 : 0.48, 7, 12),
    bodyMaterial,
  );
  abdomen.rotation.x = Math.PI / 2;
  abdomen.position.z = 0.35;
  abdomen.castShadow = true;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), bodyMaterial);
  head.position.z = -0.25;

  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), eyeMaterial);
  leftEye.position.set(0.09, 0.045, -0.33);
  const rightEye = leftEye.clone();
  rightEye.position.x = -0.09;

  const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x2b1c12, roughness: 0.8 });
  const leftAntenna = createAntenna([
    new THREE.Vector3(0.05, 0.05, -0.34),
    new THREE.Vector3(0.18, 0.16, -0.56),
    new THREE.Vector3(0.3, 0.2, -0.78),
  ], antennaMaterial);
  const rightAntenna = createAntenna([
    new THREE.Vector3(-0.05, 0.05, -0.34),
    new THREE.Vector3(-0.18, 0.16, -0.56),
    new THREE.Vector3(-0.3, 0.2, -0.78),
  ], antennaMaterial);

  const speciesDetails = new THREE.Group();
  if (kind === "bee") {
    const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xf1c64f, roughness: 0.74 });
    [-0.02, 0.16, 0.34].forEach((z) => {
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.022, 7, 18), stripeMaterial);
      stripe.position.z = z;
      speciesDetails.add(stripe);
    });
  }
  if (kind === "beetle") {
    const shellMaterial = isIosSafari
      ? new THREE.MeshStandardMaterial({ color: palette.base, metalness: 0.22, roughness: 0.38 })
      : new THREE.MeshPhysicalMaterial({
        color: palette.base,
        clearcoat: 0.9,
        clearcoatRoughness: 0.22,
        metalness: 0.38,
        roughness: 0.28,
      });
    [-0.07, 0.07].forEach((x) => {
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 10), shellMaterial);
      shell.position.set(x, 0.055, 0.17);
      shell.scale.set(0.62, 0.42, 1.28);
      shell.castShadow = true;
      speciesDetails.add(shell);
    });
  }
  if (kind === "moth") {
    const fuzz = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 14, 10),
      new THREE.MeshStandardMaterial({ color: palette.accent, roughness: 1 }),
    );
    fuzz.scale.set(0.68, 0.68, 1.05);
    speciesDetails.add(fuzz);
  }

  group.add(
    foreWingLeft,
    foreWingRight,
    hindWingLeft,
    hindWingRight,
    thorax,
    abdomen,
    head,
    leftEye,
    rightEye,
    leftAntenna,
    rightAntenna,
    speciesDetails,
  );

  const scale = palette.scale * range(0.92, 1.08);
  group.scale.setScalar(scale);
  group.userData = {
    palette,
    kind,
    foreWingLeft,
    foreWingRight,
    hindWingLeft,
    hindWingRight,
    curve: createFlightCurve(index),
    speed: palette.speed * range(0.9, 1.1),
    flapSpeed: palette.flap * range(0.94, 1.06),
    phase: random(),
    flapOffset: range(0, Math.PI * 2),
    bankOffset: range(0, Math.PI * 2),
    caught: false,
    captureAnimation: null,
    dodgeSide: index % 2 === 0 ? 1 : -1,
    dodgeUntil: 0,
    respawnAt: 0,
    baseScale: scale,
  };

  scene.add(group);
  return group;
}

function createWoodTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 128;
  textureCanvas.height = 512;
  const context = textureCanvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 128, 0);
  gradient.addColorStop(0, "#4a2819");
  gradient.addColorStop(0.22, "#9d6136");
  gradient.addColorStop(0.52, "#c58a52");
  gradient.addColorStop(0.78, "#88502e");
  gradient.addColorStop(1, "#3d2217");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 512);
  context.globalAlpha = 0.34;
  for (let index = 0; index < 90; index += 1) {
    context.strokeStyle = index % 3 === 0 ? "#2b160f" : "#e2b176";
    context.lineWidth = range(0.4, 1.3);
    context.beginPath();
    context.moveTo(range(0, 128), -20);
    context.bezierCurveTo(range(0, 128), 130, range(0, 128), 340, range(0, 128), 540);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2.8);
  return texture;
}

function createNetWeaveTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 256;
  textureCanvas.height = 256;
  const context = textureCanvas.getContext("2d");
  context.fillStyle = "#050505";
  context.fillRect(0, 0, 256, 256);
  context.strokeStyle = "#ffffff";
  context.lineWidth = 3;
  for (let value = -256; value <= 512; value += 18) {
    context.beginPath();
    context.moveTo(value, 0);
    context.lineTo(value + 256, 256);
    context.stroke();
    context.beginPath();
    context.moveTo(value, 256);
    context.lineTo(value + 256, 0);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.3, 3.8);
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function createNet(targetCamera) {
  const netGroup = new THREE.Group();
  netGroup.name = "butterfly-net";

  const handleMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: createWoodTexture(),
    roughness: 0.58,
    clearcoat: 0.28,
    clearcoatRoughness: 0.68,
  });
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0xb98a45,
    roughness: 0.24,
    metalness: 0.82,
  });
  const rimMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xd8b56e,
    roughness: 0.3,
    metalness: 0.48,
    clearcoat: 0.66,
    clearcoatRoughness: 0.3,
  });
  const weaveTexture = createNetWeaveTexture();
  const meshMaterial = new THREE.MeshPhysicalMaterial({
    alphaMap: weaveTexture,
    alphaTest: 0.12,
    color: 0xf2ead4,
    depthWrite: false,
    opacity: 0.68,
    roughness: 0.86,
    side: THREE.DoubleSide,
    transparent: true,
  });

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.064, 1.95, 24, 5), handleMaterial);
  handle.position.y = -0.9;
  handle.castShadow = true;

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.074, 0.22, 24, 2), metalMaterial);
  collar.position.y = 0.12;
  collar.castShadow = true;

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.032, 20, 96), rimMaterial);
  rim.position.y = 0.58;
  rim.castShadow = true;

  const bagProfile = [
    new THREE.Vector2(0.58, 0),
    new THREE.Vector2(0.56, -0.12),
    new THREE.Vector2(0.48, -0.34),
    new THREE.Vector2(0.34, -0.62),
    new THREE.Vector2(0.16, -0.86),
    new THREE.Vector2(0.055, -1.02),
  ];
  const basket = new THREE.Mesh(new THREE.LatheGeometry(bagProfile, 56), meshMaterial);
  basket.rotation.x = Math.PI / 2;
  basket.position.y = 0.58;

  const rimGlow = new THREE.Mesh(
    new THREE.TorusGeometry(0.584, 0.009, 8, 80),
    new THREE.MeshBasicMaterial({ color: 0xffdf7b, transparent: true, opacity: 0.18, depthWrite: false }),
  );
  rimGlow.position.y = 0.58;

  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.069, 0.072, 0.54, 20, 2),
    new THREE.MeshStandardMaterial({ color: 0x2f211b, roughness: 0.94 }),
  );
  grip.position.y = -1.52;
  grip.castShadow = true;

  const gripWrap = new THREE.Group();
  for (let index = 0; index < 8; index += 1) {
    const wrap = new THREE.Mesh(
      new THREE.TorusGeometry(0.0715, 0.007, 6, 22),
      new THREE.MeshStandardMaterial({ color: index % 2 === 0 ? 0x76513c : 0x4c3127, roughness: 0.9 }),
    );
    wrap.position.y = -1.75 + index * 0.067;
    wrap.rotation.x = Math.PI / 2;
    gripWrap.add(wrap);
  }

  const catchAnchor = new THREE.Object3D();
  catchAnchor.position.set(0, 0.58, -0.62);

  const motionTrail = [];
  for (let index = 0; index < 3; index += 1) {
    const trail = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.012 + index * 0.007, 8, 64),
      new THREE.MeshBasicMaterial({
        color: 0xffdf76,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    trail.position.y = 0.58;
    trail.visible = false;
    netGroup.add(trail);
    motionTrail.push(trail);
  }

  netGroup.add(handle, collar, rim, rimGlow, basket, grip, gripWrap, catchAnchor);
  netGroup.position.set(0.76, -0.66, -1.28);
  netGroup.rotation.set(-0.15, -0.1, -0.43);
  netGroup.userData = { basket, catchAnchor, motionTrail, rim, rimGlow };
  targetCamera.add(netGroup);
  return netGroup;
}



const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.setClearColor(0x8bb89f,1);renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
createLights(scene);createSkyDome(scene);createTerrain(scene);createForest(scene);createMeadowDetails(scene);
const bugs=Array.from({length:12},(_,i)=>createButterfly(i)),net=createNet(camera);
const rest=new THREE.Vector3(.34,-.5,-1.48),wind=new THREE.Vector3(.56,-.86,-.96),strike=new THREE.Vector3(0,-.12,-2.12),follow=new THREE.Vector3(-.3,.05,-2.02);
const restQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.15,-.1,-.43)),strikeQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(.02,.02,.06));let lastSwing=-1,swingCurve;
return{draw(s,reducedMotion=false){
const width=canvas.clientWidth||360,height=canvas.clientHeight||640;renderer.setSize(width,height,false);camera.quaternion.fromArray(s.cameraQ);camera.updateMatrixWorld();
const elapsed=s.elapsedMs/1000;
if(s.swinging&&s.swingStartedAt!==lastSwing){lastSwing=s.swingStartedAt;const p=s.swingTarget===null?null:originalButterflyProjection(s,s.bugs[s.swingTarget]),aimX=p?THREE.MathUtils.clamp(p.x*.62,-.34,.34):0,aimY=p?THREE.MathUtils.clamp(p.y*.42,-.24,.24):0;const target=strike.clone().add(new THREE.Vector3(aimX,aimY,0)),end=follow.clone().add(new THREE.Vector3(aimX*.62,aimY*.55,.06));swingCurve=new THREE.CatmullRomCurve3([rest.clone(),rest.clone().lerp(wind,.34),wind.clone(),target,end,rest.clone().lerp(end,.24),rest.clone()],false,'centripetal',.45);}
net.position.copy(rest);net.quaternion.copy(restQ);net.scale.setScalar(.82);
if(s.swinging&&swingCurve&&!reducedMotion){const progress=THREE.MathUtils.clamp((s.elapsedMs-s.swingStartedAt)/880,0,1);net.position.copy(swingCurve.getPointAt(.5-Math.cos(progress*Math.PI)*.5));net.quaternion.slerpQuaternions(restQ,strikeQ,Math.pow(Math.sin(progress*Math.PI),1.18));}
for(const b of s.bugs){const g=bugs[b.index],d=g.userData;g.visible=b.caughtUntil<=s.elapsedMs||b.captureAt>=0&&s.elapsedMs-b.captureAt<620;if(!g.visible)continue;
const p=originalButterflyWorldPosition(s,b),next=originalButterflyWorldPosition({...s,elapsedMs:s.elapsedMs+20},b);g.position.copy(p);g.lookAt(next);let size=d.baseScale;
if(b.captureAt>=0&&s.elapsedMs-b.captureAt<620){const progress=THREE.MathUtils.clamp((s.elapsedMs-b.captureAt)/620,0,1),e=progress<.5?4*progress**3:1-Math.pow(-2*progress+2,3)/2,start=originalButterflyWorldPosition({...s,elapsedMs:b.captureAt},b),end=new THREE.Vector3();net.userData.catchAnchor.getWorldPosition(end);const mid=start.clone().lerp(end,.5);mid.y+=.42;mid.x+=b.dodgeSide*.16;g.position.copy(start.multiplyScalar((1-e)**2).add(mid.multiplyScalar(2*(1-e)*e)).add(end.multiplyScalar(e*e)));size*=1-smoothstep((progress-.62)/.38)*.88;}
g.scale.setScalar(size);const flap=reducedMotion?0:Math.sin(elapsed*d.flapSpeed+b.flapOffset),fa=d.kind==='dragonfly'?.2:d.kind==='bee'?.37:d.kind==='beetle'?.3:.68,ha=d.kind==='dragonfly'?-.17:d.kind==='bee'?.27:d.kind==='beetle'?.2:.45;d.foreWingLeft.rotation.z=.1+flap*fa;d.foreWingRight.rotation.z=-.1-flap*fa;d.hindWingLeft.rotation.z=.05+flap*ha;d.hindWingRight.rotation.z=-.05-flap*ha;}
renderer.render(scene,camera);
},dispose(){const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();}};
}
