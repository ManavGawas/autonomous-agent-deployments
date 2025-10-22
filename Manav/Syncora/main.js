import * as THREE from 'three';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import World from './World.js';

const canvas = document.getElementById('webgl-canvas');

if (!canvas) {
  throw new Error('Canvas element with id "webgl-canvas" not found.');
}

const world = new World(canvas, THREE);

// Hook into LoadingManager (if present) to update overlay
if (world.manager) {
  const overlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  let itemsLoaded = 0;
  let itemsTotal = 0;

  world.manager.onStart = function(url, itemsLoadedArg, itemsTotalArg) {
    itemsLoaded = itemsLoadedArg;
    itemsTotal = itemsTotalArg;
    loadingText.textContent = `Loading assets: 0%`;
    overlay.style.display = 'block';
  };

  world.manager.onProgress = function(url, itemsLoadedArg, itemsTotalArg) {
    const pct = Math.round((itemsLoadedArg / itemsTotalArg) * 100);
    loadingText.textContent = `Loading assets: ${pct}%`;
  };

  world.manager.onLoad = function() {
    loadingText.textContent = `Assets loaded`;
    setTimeout(() => overlay.style.display = 'none', 400);
  };

  world.manager.onError = function(url) {
    console.warn('Asset failed to load:', url);
    loadingText.textContent = `Some assets failed to load`;
  };
}

window.addEventListener('mousemove', (event) => {
  if (typeof world.handleMouseMove === 'function') {
    world.handleMouseMove(event);
  }
});

// Detail panel handling
const detailPanel = document.getElementById('detail-panel');
const detailClose = document.getElementById('detail-close');
const detailBackdrop = detailPanel && detailPanel.querySelector('.detail-backdrop');
let lastFocusedElement = null;

function openDetail(title, body, triggerEl) {
  lastFocusedElement = triggerEl || document.activeElement;
  document.getElementById('detail-title').textContent = title;
  document.getElementById('detail-body').innerHTML = body;
  detailPanel.style.display = 'flex';
  detailPanel.setAttribute('aria-hidden', 'false');
  detailClose.focus();
}

function closeDetail() {
  detailPanel.style.display = 'none';
  detailPanel.setAttribute('aria-hidden', 'true');
  if (lastFocusedElement) lastFocusedElement.focus();
}

if (detailClose) detailClose.addEventListener('click', closeDetail);
if (detailBackdrop) detailBackdrop.addEventListener('click', closeDetail);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });

// Accessibility: trap focus in detail panel when open
function trapFocus(container) {
  const focusable = container.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  function handle(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
    else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
  }
  container.addEventListener('keydown', handle);
  return () => container.removeEventListener('keydown', handle);
}

let untrap = null;
function openDetail(title, body, triggerEl) {
  lastFocusedElement = triggerEl || document.activeElement;
  document.getElementById('detail-title').textContent = title;
  document.getElementById('detail-body').innerHTML = body;
  detailPanel.style.display = 'flex';
  detailPanel.setAttribute('aria-hidden', 'false');
  detailClose.focus();
  untrap = trapFocus(detailPanel.querySelector('.detail-content'));
}

function closeDetail() {
  detailPanel.style.display = 'none';
  detailPanel.setAttribute('aria-hidden', 'true');
  if (untrap) untrap();
  if (lastFocusedElement) lastFocusedElement.focus();
}

// Bind clicks from 3D world to open overlay
if (typeof world.bindServiceClicks === 'function') {
  world.bindServiceClicks((plane, triggerEl) => {
    const title = plane.name || 'Service';
    const body = `<p>Details about ${title}.</p>`;
    openDetail(title, body, triggerEl || null);
  });
}

// Keyboard activation: allow Enter on canvas to trigger focused plane
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    // attempt to open first intersected
    // create a synthetic click at center
    const centerX = window.innerWidth / 2; const centerY = window.innerHeight / 2;
    const rect = canvas.getBoundingClientRect();
    const x = ((centerX - rect.left) / rect.width) * 2 - 1;
    const y = -((centerY - rect.top) / rect.height) * 2 + 1;
    world.raycaster.setFromCamera({ x, y }, world.camera);
    const hits = world.raycaster.intersectObjects(world.constellationNodes);
    if (hits.length > 0) {
      const plane = hits[0].object;
      openDetail(plane.name, `<p>Details for ${plane.name}</p>`);
    }
  }
});

const lenis = new Lenis({
  autoRaf: false,
  smoothWheel: true,
  smoothTouch: false,
  lerp: 0.08
});

gsap.registerPlugin(ScrollTrigger);

gsap.set('#zone-services', { opacity: 0 });
gsap.set('#zone-home', { opacity: 1 });

let currentScroll = 0;

lenis.on('scroll', ({ scroll }) => {
  currentScroll = scroll;
  ScrollTrigger.update();
});

ScrollTrigger.scrollerProxy(document.body, {
  scrollTop(value) {
    if (value !== undefined) {
      lenis.scrollTo(value, { immediate: true });
    }
    return currentScroll;
  },
  getBoundingClientRect() {
    return {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight
    };
  }
});

ScrollTrigger.defaults({
  markers: false
});

ScrollTrigger.addEventListener('refresh', () => {
  if (typeof lenis.resize === 'function') {
    lenis.resize();
  }
});

ScrollTrigger.refresh();

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#content',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    markers: false
  }
});

tl.to(world.camera.position, {
  z: -8,
  duration: 2,
  ease: 'power2.inOut'
}, 'startFlight');

tl.to('#zone-home', {
  opacity: 0,
  duration: 1,
  ease: 'power1.out'
}, 'startFlight');

tl.to(world.core.material, {
  opacity: 0,
  duration: 1,
  ease: 'power1.out'
}, 'startFlight');

if (world.particles) {
  tl.to(world.particles.position, {
    z: 10,
    duration: 2,
    ease: 'power2.inOut'
  }, 'startFlight');
}

const part2Label = 'startFlight+=1';

tl.to('#zone-services', {
  opacity: 1,
  duration: 1,
  ease: 'power1.in'
}, part2Label);

(world.constellationNodes || []).forEach((node) => {
  tl.to(node.material, {
    opacity: 1,
    duration: 1,
    ease: 'power1.in'
  }, part2Label);
});

// --- PART 3: ARRIVE AT CASE STUDIES (ZONE 3) ---
const part3Label = `${part2Label}+=1`;

tl.to(world.camera.position, {
  z: -20,
  duration: 2,
  ease: 'power2.inOut'
}, part3Label);

tl.to('#zone-services', {
  opacity: 0,
  duration: 1,
  ease: 'power1.out'
}, part3Label);

(world.constellationNodes || []).forEach((node) => {
  tl.to(node.material, {
    opacity: 0,
    duration: 1,
    ease: 'power1.out'
  }, part3Label);
});

tl.to('#zone-case-studies', {
  opacity: 1,
  duration: 1,
  ease: 'power1.in'
}, part3Label);

(world.caseStudyPlanes || []).forEach((plane) => {
  tl.to(plane.material, {
    opacity: 0.8,
    duration: 1,
    ease: 'power1.in'
  }, part3Label);
});

function tick(time) {
  lenis.raf(time);
  world.update();
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
