Gobkit Free Insect Pack Vol.1 — 30 CC0 rigged & animated low-poly insects (GLB)
https://gobkit.com/freebies

Insects: Hercules Beetle, Dung Beetle, Tiger Beetle, Giraffe Weevil, Diving Beetle, Click Beetle, Tortoise Beetle, Beetle Grub, Leafcutter Ant, Soldier Termite, Earwig, Cockroach, Hoverfly, Crane Fly, Hawk Moth, Swallowtail, Lacewing, Mayfly, Aphid, Treehopper, Water Strider, Giant Water Bug, Flea, Silverfish, Stick Insect, Leaf Insect, Orchid Mantis, Mole Cricket, Antlion Larva, Katydid
Each .glb is one model with its texture baked in, plus the shared atlas Texture001.png.
All insects share one 16-bone skeleton (the same rig as the Gobkit animal packs).

Animation: 23 clips per model @ 24 fps, 30 frames each:
  idle | attack | dead (play once, hold) | walk
  groom | alert | run | crawl | jump | fly | sting | eat | threat | hit
  perch | buzz | sing | carry | dart | sway | curl | pounce | flip
  Every clip except dead loops. Play by name — do not slice by frame range.

Three.js quick start:
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
  new GLTFLoader().load('Swallowtail.glb', (g) => { scene.add(g.scene);
    const mixer = new THREE.AnimationMixer(g.scene);
    mixer.clipAction(THREE.AnimationClip.findByName(g.animations, 'fly')).play(); });

License: CC0 1.0 (public domain) — any use, commercial or personal, no attribution required.
More free CC0 assets: https://gobkit.com/freebies
