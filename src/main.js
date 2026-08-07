import * as THREE from 'three';
import { Game } from './Game.js';

const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// FC 26 style camera
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 50, 28);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(10, 40, 20);
sun.castShadow = true;
scene.add(sun);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const game = new Game(scene, camera, renderer.domElement);

let last = performance.now();
(function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  const dt  = Math.min((now - last) / 1000, 0.05);
  last = now;
  game.update(dt);
  renderer.render(scene, camera);
})();
