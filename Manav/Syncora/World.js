import { gsap } from 'gsap';

/**
 * Create a small labeled sprite used for UI labels above planes.
 * @param {THREE} THREELib
 * @param {string} text
 * @returns {THREE.Sprite}
 */
export function createLabelSprite(THREELib, text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const tex = new THREELib.Texture(canvas);
  tex.needsUpdate = true;
  tex.minFilter = THREELib.NearestFilter; // avoid mipmap blur

  const mat = new THREELib.SpriteMaterial({ map: tex, depthWrite: false });
  const sprite = new THREELib.Sprite(mat);
  sprite.scale.set(1.8, 0.45, 1);
  return sprite;
}

/** Helper to build a service plane mesh */
export function makeServicePlane(THREELib, texture) {
  const geo = new THREELib.PlaneGeometry(1.5, 1.5);
  const mat = new THREELib.MeshStandardMaterial({ map: texture, transparent: true, opacity: 0, side: THREELib.DoubleSide });
  return new THREELib.Mesh(geo, mat);
}

/** Helper to build a case study plane */
export function makeCaseStudyPlane(THREELib) {
  const geo = new THREELib.PlaneGeometry(3, 2);
  const mat = new THREELib.MeshStandardMaterial({ color: 0xffffff, metalness: 0.8, roughness: 0.2, transparent: true, opacity: 0, side: THREELib.DoubleSide });
  return new THREELib.Mesh(geo, mat);
}

export default class World {
  constructor(canvas, THREE) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    const fogSource = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-bg')
      .trim() || '#030008';
    const fogColor = new THREE.Color(fogSource);
    this.scene.fog = new THREE.Fog(fogColor, 5, 20);
    this.THREE = THREE;
    this.manager = new this.THREE.LoadingManager();
    this.raycaster = new this.THREE.Raycaster();
    this.mouse = new this.THREE.Vector2();
    this.mouse.set(999, 999);
    this.hoveredNode = null;

    this.camera = new this.THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 5);

    this.renderer = new this.THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.clock = new this.THREE.Clock();

  // Accessibility & interaction
  this.caseStudyTexturesLoaded = false;
  this.caseStudyLoading = false;
  this.caseStudyTextures = [];
  this.caseStudyTextureNames = ['case1.png', 'case2.png', 'case3.png'];
  this.caseStudyLoadThreshold = -18; // configurable threshold for lazy load
  this._activationCallback = null; // will be set by bindServiceClicks
  this.a11yProxyContainer = null;
  this.prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Performance: cap DPR for low-end devices
  const urlParams = new URLSearchParams(window.location.search);
  const forcedParticles = parseInt(urlParams.get('particles'), 10);
  this.particleCount = Number.isFinite(forcedParticles) && forcedParticles > 0 ? forcedParticles : 5000;
  const maxDpr = window.devicePixelRatio > 1.5 ? 1.5 : window.devicePixelRatio;
  this.renderer.setPixelRatio(Math.min(maxDpr, window.devicePixelRatio));

  // FPS tracker
  this.fpsSamples = [];
  this.lastFpsCheck = performance.now();

    this.sceneRotationGroup = new this.THREE.Group();
    this.scene.add(this.sceneRotationGroup);

  this.constellationNodes = [];
  this.caseStudyPlanes = [];

  this.addLights();
  this.addEnvironment();
  this.createSyncoraCore();
  this.createConstellation();
  this.createCaseStudyZone();
  this.createParticleField();

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  addLights() {
    const ambientLight = new this.THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new this.THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    this.scene.add(directionalLight);
  }

  addEnvironment() {
    const loader = new this.THREE.CubeTextureLoader(this.manager);
    loader.setPath('textures/kurt/');

    try {
      const textureCube = loader.load([
        'space_rt.png',
        'space_lf.png',
        'space_up.png',
        'space_dn.png',
        'space_ft.png',
        'space_bk.png'
      ], () => {
        // loaded
        document.getElementById('loading-text').textContent = 'Environment loaded';
      });

      this.scene.background = textureCube;
      this.scene.environment = textureCube;
    } catch (err) {
      console.warn('Skybox failed to load:', err);
      // graceful fallback: no environment, keep background color
      this.scene.environment = null;
    }
  }

  createSyncoraCore() {
    const colorValue = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-primary')
      .trim() || '#4a90e2';

    const coreGeometry = new this.THREE.IcosahedronGeometry(1.5, 5);
    const coreMaterial = new this.THREE.MeshStandardMaterial({
      color: new this.THREE.Color(colorValue),
      metalness: 0.8,
      roughness: 0.2,
      wireframe: true
    });

    this.core = new this.THREE.Mesh(coreGeometry, coreMaterial);
    this.sceneRotationGroup.add(this.core);
  }

  createConstellation() {
    this.constellationGroup = new this.THREE.Group();
    this.constellationGroup.position.z = -12;
    this.scene.add(this.constellationGroup);

    const services = [
      { name: 'web-dev', position: [-4, 2, 0] },
      { name: 'n8n', position: [0, 3, 0] },
      { name: 'ai-agent', position: [4, 2, 0] },
      { name: 'shopify', position: [-2, -1, 0] },
      { name: 'chatbot', position: [2, -1, 0] }
    ];

    const nodeGeometry = new this.THREE.PlaneGeometry(1.5, 1.5);
    const textureLoader = new this.THREE.TextureLoader(this.manager);

    services.forEach((service) => {
      let serviceTexture;
      try {
        serviceTexture = textureLoader.load(`textures/services/${service.name}.png`);
        serviceTexture.colorSpace = this.THREE.SRGBColorSpace;
      } catch (e) {
        // fallback: single-color texture as data URL
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#777'; ctx.fillRect(0,0,128,128);
        serviceTexture = new this.THREE.Texture(canvas);
        serviceTexture.needsUpdate = true;
      }

      const node = makeServicePlane(this.THREE, serviceTexture);
      node.position.set(service.position[0], service.position[1], service.position[2]);
      node.name = service.name;

      const label = createLabelSprite(this.THREE, service.name.replace('-', ' '));
      label.position.set(0, -1.05, 0);
      node.add(label);

      node.userData = { label };

      this.constellationGroup.add(node);
      this.constellationNodes.push(node);
      // enable pointer events on this mesh
      node.userData.traversable = true;
    });

      // create focusable proxies for a11y after nodes created
      this._createA11yProxies();
  }

  /**
   * Bind DOM interactions for service planes: when clicked, call the provided callback with (plane)
   * @param {(mesh:THREE.Mesh)=>void} callback
   */
  bindServiceClicks(callback) {
    // store callback for use by click handler and keyboard proxies
    this._activationCallback = callback;

    if (!callback) return;
    // Listen to canvas clicks and raycast
    this.canvas.addEventListener('click', (ev) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera({ x, y }, this.camera);
      const hits = this.raycaster.intersectObjects(this.constellationNodes);
      if (hits.length > 0) {
        // pass null for triggerEl when activated by pointer directly on canvas
        callback(hits[0].object, null);
      }
    });
  }

  createCaseStudyZone() {
    this.caseStudyGroup = new this.THREE.Group();
    this.caseStudyGroup.position.z = -22;
    this.scene.add(this.caseStudyGroup);

    const planeGeometry = new this.THREE.PlaneGeometry(3, 2);
    const planeMaterial = new this.THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0,
      side: this.THREE.DoubleSide
    });

    const planePositions = [
      [-4, 0, 0],
      [0, 0, 0],
      [4, 0, 0]
    ];

    planePositions.forEach((pos) => {
      const plane = new this.THREE.Mesh(planeGeometry, planeMaterial.clone());
      plane.position.set(pos[0], pos[1], pos[2]);

      this.caseStudyGroup.add(plane);
      this.caseStudyPlanes.push(plane);
    });

    // create proxies for case study planes too
    this._createA11yProxies();
  }

  /**
   * Create lightweight focusable DOM proxies for each interactive plane so they are reachable via Tab.
   * Proxies forward keyboard activation to the registered callback. Proxies are absolutely positioned and
   * updated each frame to follow the 3D plane screen position.
   */
  _createA11yProxies() {
    if (!document) return;
    if (!this.a11yProxyContainer) {
      this.a11yProxyContainer = document.createElement('div');
      this.a11yProxyContainer.id = 'plane-proxies';
      this.a11yProxyContainer.style.position = 'fixed';
      this.a11yProxyContainer.style.left = '0';
      this.a11yProxyContainer.style.top = '0';
      this.a11yProxyContainer.style.width = '100%';
      this.a11yProxyContainer.style.height = '100%';
      this.a11yProxyContainer.style.pointerEvents = 'none';
      this.a11yProxyContainer.style.zIndex = '60';
      document.body.appendChild(this.a11yProxyContainer);
    }

    // remove existing
    this.a11yProxyContainer.querySelectorAll('.plane-proxy').forEach((n) => n.remove());

    const createProxy = (mesh, idx, type) => {
      const btn = document.createElement('button');
      btn.className = 'plane-proxy';
      btn.setAttribute('aria-label', mesh.name || `${type} plane ${idx + 1}`);
      btn.setAttribute('tabindex', '0');
      btn.style.position = 'absolute';
      btn.style.width = '48px';
      btn.style.height = '48px';
      btn.style.background = 'transparent';
      btn.style.border = 'none';
      btn.style.padding = '0';
  btn.style.pointerEvents = 'none';
      btn.dataset.index = idx;
      btn.dataset.type = type;

      btn.addEventListener('focus', () => this._onProxyFocus(mesh));
      btn.addEventListener('blur', () => this._onProxyBlur(mesh));

      btn.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          if (typeof this._activationCallback === 'function') this._activationCallback(mesh, btn);
        }
      });

      this.a11yProxyContainer.appendChild(btn);
    };

    this.constellationNodes.forEach((n, i) => createProxy(n, i, 'service'));
    this.caseStudyPlanes.forEach((p, i) => createProxy(p, i, 'case'));
  }

  _onProxyFocus(mesh) {
    if (this.prefersReducedMotion) {
      mesh.scale.set(1.15, 1.15, 1.15);
    } else {
      gsap.to(mesh.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.18, ease: 'power2.out' });
    }
    document.body.style.cursor = 'pointer';
  }

  _onProxyBlur(mesh) {
    if (this.prefersReducedMotion) {
      mesh.scale.set(1, 1, 1);
    } else {
      gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 0.18, ease: 'power2.out' });
    }
    document.body.style.cursor = 'default';
  }

  _updateProxyPositions() {
    const rect = this.canvas.getBoundingClientRect();
    const pos3 = new this.THREE.Vector3();
    const proj = new this.THREE.Vector3();
    const proxies = Array.from(this.a11yProxyContainer.querySelectorAll('.plane-proxy'));
    const allPlanes = this.constellationNodes.concat(this.caseStudyPlanes);
    for (let i = 0; i < proxies.length; i += 1) {
      const proxy = proxies[i];
      const mesh = allPlanes[i];
      if (!mesh) continue;
      pos3.copy(mesh.position);
      mesh.getWorldPosition(pos3);
      proj.copy(pos3).project(this.camera);
      const x = (proj.x + 1) / 2 * rect.width + rect.left - 24; // center
      const y = (-proj.y + 1) / 2 * rect.height + rect.top - 24;
      proxy.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    }
  }

  createParticleField() {
    const particleCount = this.particleCount || 5000;
    const positions = new Float32Array(particleCount * 3);
    const geometry = new this.THREE.BufferGeometry();

    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 20;
    }

    geometry.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));

    const material = new this.THREE.PointsMaterial({
      size: 0.02,
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: this.THREE.AdditiveBlending
    });

    this.particles = new this.THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  /**
   * Lazy-load case study textures once the camera crosses the configured z threshold.
   */
  maybeLoadCaseStudyTextures() {
    if (this.caseStudyTexturesLoaded || this.caseStudyLoading) return;
    if (!this.camera) return;
    if (this.camera.position.z > this.caseStudyLoadThreshold) return;

    const loadingTextEl = document.getElementById('loading-text');
    this.caseStudyLoading = true;

    const manager = new this.THREE.LoadingManager();
    const loader = new this.THREE.TextureLoader(manager);

    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      if (loadingTextEl) loadingTextEl.textContent = `Loading case studies: ${Math.round((itemsLoaded / itemsTotal) * 100)}%`;
    };

    manager.onLoad = () => {
      this.caseStudyTexturesLoaded = true;
      this.caseStudyLoading = false;
      if (loadingTextEl) loadingTextEl.textContent = 'Case studies loaded';
      for (let i = 0; i < this.caseStudyPlanes.length; i += 1) {
        const tex = this.caseStudyTextures[i];
        const plane = this.caseStudyPlanes[i];
        if (tex && plane && plane.material) {
          plane.material.map = tex;
          plane.material.needsUpdate = true;
          plane.material.opacity = 0.8;
        }
      }
      setTimeout(() => { if (loadingTextEl) loadingTextEl.textContent = ''; }, 800);
    };

    manager.onError = (url) => {
      console.warn('Case study texture failed to load:', url);
      this.caseStudyLoading = false;
      if (loadingTextEl) loadingTextEl.textContent = 'Some case studies failed to load';
    };

    this.caseStudyTextures = new Array(this.caseStudyTextureNames.length);
    this.caseStudyTextureNames.forEach((name, idx) => {
      loader.load(`textures/case-studies/${name}`, (tex) => {
        try { tex.colorSpace = this.THREE.SRGBColorSpace; } catch (e) {}
        this.caseStudyTextures[idx] = tex;
      }, undefined, (err) => {
        console.warn('Failed to load case study texture', name, err);
      });
    });
  }

  /**
   * Dispose of loaded case study textures and revert materials back to placeholders.
   */
  unloadCaseStudyTextures() {
    this.caseStudyTextures.forEach((tex) => {
      if (tex && typeof tex.dispose === 'function') tex.dispose();
    });
    this.caseStudyTextures = [];
    this.caseStudyTexturesLoaded = false;
    this.caseStudyLoading = false;
    this.caseStudyPlanes.forEach((plane) => {
      if (plane && plane.material) {
        plane.material.map = null;
        plane.material.needsUpdate = true;
        plane.material.opacity = 0;
      }
    });
  }

  rebuildParticleField() {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.particles = null;
    }
    this.createParticleField();
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  handleMouseMove(event) {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.mouse.x = x;
    this.mouse.y = y;

    gsap.to(this.sceneRotationGroup.rotation, {
      y: x * 0.2,
      x: y * 0.2,
      duration: 2.5,
      ease: 'power2.out'
    });
  }

  update() {
    const delta = this.clock.getDelta();

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.constellationNodes);

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;

      if (this.hoveredNode !== intersectedObject) {
        if (this.hoveredNode) {
          gsap.to(this.hoveredNode.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.3,
            ease: 'power2.out'
          });
        }

        this.hoveredNode = intersectedObject;
        document.body.style.cursor = 'pointer';
        gsap.to(this.hoveredNode.scale, {
          x: 1.2,
          y: 1.2,
          z: 1.2,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    } else if (this.hoveredNode) {
      document.body.style.cursor = 'default';
      gsap.to(this.hoveredNode.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
      this.hoveredNode = null;
    }

    if (this.core) {
      this.core.rotation.y += delta * 0.4;
    }

    if (this.constellationGroup) {
      this.constellationGroup.rotation.y += delta * 0.05;
    }

    if (this.particles) {
      this.particles.rotation.y += 0.0002;
    }

    // Update proxies positions to follow the 3D objects
    if (this.a11yProxyContainer) this._updateProxyPositions();

    // Lazy-load case study textures when camera crosses threshold
    try {
      this.maybeLoadCaseStudyTextures();
    } catch (e) {
      console.warn('maybeLoadCaseStudyTextures error', e);
    }

    // FPS sampling
    const now = performance.now();
    const dt = now - this.lastFpsCheck;
    this.lastFpsCheck = now;
    const fps = 1000 / dt;
    this.fpsSamples.push(fps);
    if (this.fpsSamples.length > 60) this.fpsSamples.shift();
    const avgFps = this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length;
    if (avgFps < 30 && this.particleCount > 1000) {
      // reduce particles by half and rebuild
      this.particleCount = Math.max(1000, Math.floor(this.particleCount / 2));
      this.rebuildParticleField();
    }

    // Click and keyboard interaction handled via DOM events; provide pointer mapping utility
    // Raycasting click example (converted to normalized coordinates on click)
    // Developer: add external click-to-open hook if desired

    this.renderer.render(this.scene, this.camera);
  }
}
