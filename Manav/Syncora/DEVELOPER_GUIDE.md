Syncora — Developer Guide

Overview
--------
This repository is a single-page, experimental "scroll-flight" website named Syncora. The site layers a 3D WebGL canvas (Three.js) fixed to the page background and scrollable HTML content on top. Smooth scrolling is handled by Lenis, and scroll-driven animations are implemented with GSAP + ScrollTrigger.

Purpose of this document
------------------------
This guide summarizes completed work, partial items, file-by-file responsibilities, runtime requirements, how to run locally, known quirks, and suggested next steps so a new developer can continue development with minimal friction.

Project status (high level)
----------------------------
Completed:
- Foundational layout: `index.html`, `style.css`.
- 3D scene and rendering: `World.js` builds the scene, camera, renderer, lighting, skybox, fog, and multiple 3D content groups.
- Smooth scroll + scroll-linked timeline: `main.js` integrates Lenis and GSAP, registers ScrollTrigger, and defines a multi-part timeline moving the camera across zones.
- Zone content: Zone 1 (Home + Syncora Core), Zone 2 (Service Constellation — interactive planes), Zone 3 (Case Studies — 3 data screens).
- Interactions: Mouse tilt via `sceneRotationGroup` and hover interactions on Zone 2 plane nodes using Three.js `Raycaster`.
- Particle environment: 5,000-point particle field for fly-through effect and Fog for depth.
- Environment: CubeTexture skybox from `textures/kurt/` (6 images) used for reflections.

Partially-done / Needs assets:
- Image assets are referenced but not included. The textures expected are:
  - Skybox (put these under `textures/kurt/`):
    - `space_rt.png`
    - `space_lf.png`
    - `space_up.png`
    - `space_dn.png`
    - `space_ft.png`
    - `space_bk.png`
  - Service constellation images (put these under `textures/services/`):
    - `web-dev.png`
    - `n8n.png`
    - `ai-agent.png`
    - `shopify.png`
    - `chatbot.png`
  - (Optional) HDR alternative was used earlier but replaced by skybox images.

- `package.json`, build scripts, automated tests, and CI are not implemented.

Files and responsibilities
-------------------------
- `index.html`
  - Sets up the import map for ESM CDN modules (Three.js, GSAP, ScrollTrigger, Lenis).
  - Contains the DOM layout: `canvas#webgl-canvas` (fixed background), `header`, `main#content` and five `section.zone` elements for Home, Services, Case Studies, Workflow, Sandbox.
  - Loads `main.js` as `type="module"`.

- `style.css`
  - Modern reset and CSS variables.
  - Layers the fixed canvas behind the scrolling content via `z-index` (canvas z-index: 1, content z-index: 10).
  - Header is fixed with z-index: 100.
  - `section.zone` is `min-height: 100vh` for full-screen sections.
  - Sets `html, body { cursor: default; }` to ensure default cursor and allow JS to set pointer on hover.

- `main.js`
  - Imports ESM modules via importmap names: `three`, `lenis`, `gsap`, `gsap/ScrollTrigger`.
  - Instantiates `World` with canvas and Three.js.
  - Creates a Lenis instance configured with `smoothWheel: true` and `smoothTouch: false` (desktop smooth scroll). Uses `lenis.raf(time)` in the RAF tick loop.
  - Registers `ScrollTrigger` plugin and establishes `scrollerProxy` using Lenis to bridge ScrollTrigger's native scroll with Lenis' smooth scroll.
  - Builds a GSAP timeline with three segments:
    - Part 1: Fly from Home -> closer to core (z: 5 -> -8) and fade Zone 1 core and HTML.
    - Part 2: Reveal Zone 2 (services) and fade in constellation nodes and move particle field toward camera.
    - Part 3: Fly to Zone 3 (case studies), fade out services, and fade in 3 case-study planes and `#zone-case-studies` HTML.
  - Adds global mouse move listener (calls `world.handleMouseMove`).
  - Starts RAF-driven tick loop to call `world.update()` and `lenis.raf()`.

- `World.js`
  - Exports a default `World` class (ESM) that builds the Three.js scene.
  - Key properties and groups:
    - `this.scene` — main Three.js scene.
    - `this.camera` — PerspectiveCamera, starts at z=5.
    - `this.renderer` — WebGLRenderer using canvas.
    - `this.sceneRotationGroup` — parent group for mouse-tilt behavior; `core` and other groups are attached to this.
    - `this.constellationGroup` — Zone 2 group at z=-12; contains 5 interactive planes.
    - `this.caseStudyGroup` — Zone 3 group at z=-22; contains 3 case-study planes.
    - `this.particles` — the large 5k Points field for fly-through.
    - `this.raycaster`, `this.mouse`, `this.hoveredNode` — for hover detection.
    - `this.scene.fog` — fog with color from `--color-bg`.
  - Key methods:
    - `addLights()` — ambient + directional lights.
    - `addEnvironment()` — loads skybox from `textures/kurt/` and sets `scene.environment` (cube map).
    - `createSyncoraCore()` — reflective wireframe Icosahedron for Zone 1.
    - `createConstellation()` — creates textured planes for services. Textures loaded from `textures/services/*` and `MeshStandardMaterial` used; initial opacity 0.
    - `createParticleField()` — builds the Points particle cloud.
    - `createCaseStudyZone()` — builds 3 planes (3x2) at z = -22, opacity 0 initially.
    - `handleMouseMove(event)` — updates normalized mouse vector for raycasting and GSAP-tweens `sceneRotationGroup.rotation` for mouse tilt.
    - `update()` — called each frame: runs raycaster hover logic for constellation nodes (scaling with GSAP), rotates core/constellation/particles, renders scene.
    - `handleResize()` — updates camera projection and renderer size.

Additional recent features:

- Keyboard / focus proxies: The app now creates lightweight DOM "proxy" buttons (in `#plane-proxies`) for each interactive plane (services and case studies). These proxies are focusable via Tab and forward Enter/Space activations to the same handler used by pointer clicks. Proxies follow the 3D object on screen and are updated each frame.
- Focus-visible and reduced-motion: CSS rules for `#plane-proxies .plane-proxy:focus-visible` provide a subtle focus ring. Motion is reduced automatically when the user prefers reduced motion (via media query).
- Lazy-loading case studies: Case study textures are lazy-loaded when the camera z position crosses a configurable threshold (default `-18`). The `World` class uses a `THREE.LoadingManager` to show progress via the existing `#loading-text` overlay. Textures are swapped into materials once ready; `unloadCaseStudyTextures()` can dispose them.

Change history / important notes (chronological)
------------------------------------------------
- Initial scaffold created: index, CSS, canvas, header, and five zones in HTML.
- Test Box added to World.js, replaced with Points sphere for quick visual verification.
- main.js bound to Three.js via CDN modules — caused file:// CORS failure when loaded directly from filesystem.
- Switched to UMD globals for local dev (temporary), then migrated to importmap + ESM pattern to be modern and predictable.
- Lenis required an ESM build; linked via `esm.sh` to provide default export in the importmap.
- Replaced particle orb with reflective Icosahedron and added lights/environment for realistic reflections.
- Replaced HDR approach with CubeTexture skybox (6 images) using `THREE.CubeTextureLoader`.
- Built Zone 2 (Service Constellation) with textured planes and Raycaster hover interactions.
- Added particle field (5k) and fog to create depth.
- Added Zone 3 (Case Studies): 3 planes at z=-22 and GSAP timeline steps to fly the camera to them.

Runtime requirements and how to run locally
-----------------------------------------
Why you must run an HTTP server
- The project uses an `importmap` and ES module imports. Modern browsers block ESM import requests for local files via `file://`. You must serve the directory over HTTP.

Minimal local run (recommended):
- Using Node (if you have npx):
```powershell
npx serve .
```
- Or Python 3 built-in server:
```powershell
python -m http.server 5173
```
Open the server URL printed by the chosen command (e.g., http://localhost:3000 or http://localhost:5173).

Known dev-time gotchas
- Asset paths in `World.js` are relative to the project root or where the server serves. Ensure `textures/kurt/*` and `textures/services/*` exist.
- If Lenis import fails, try updating the importmap `lenis` line to a known ESM URL. We used `https://esm.sh/@studio-freight/lenis@1.0.6` earlier.
- Three.js version used: 0.160.0 (importmap points to this). Module paths use `three` and `three/addons/` for loader imports.

Assets list (to add to repo)
----------------------------
Place these files in the indicated folders:
- textures/kurt/
  - space_rt.png
  - space_lf.png
  - space_up.png
  - space_dn.png
  - space_ft.png
  - space_bk.png

- textures/services/
  - web-dev.png
  - n8n.png
  - ai-agent.png
  - shopify.png
  - chatbot.png

Optional: If you prefer HDR environment, replace with `.hdr` files and update `addEnvironment()`.

How to debug common issues
--------------------------
- Blank canvas or black screen:
  - Open devtools console. Look for failed network requests (404) for textures or ESM modules.
  - Verify server is running and the importmap URLs are reachable.
  - Confirm `canvas#webgl-canvas` exists (should be present in `index.html`).
- Lenis/ScrollTrigger not animating:
  - Ensure `lenis` import resolves to an ESM module exporting default constructor.
  - Confirm `ScrollTrigger.scrollerProxy` exists and is registered.
- Textures not visible:
  - Confirm textures are in the correct path and have the right names.
  - Check permissions on the files and server logs (CORS issues seldom occur on local server unless remote CDN blocking).
- Raycaster not triggering hover:
  - Ensure `this.mouse` is updated on `mousemove` and normalized to [-1, 1]. This code exists in `handleMouseMove`.
  - Confirm the constellation planes are present and their materials are not fully transparent (opacity > 0).

Testing checklist (quick sanity tests)
-------------------------------------
- [ ] Start server and open index.html
- [ ] Ensure console has no module import errors and textures load (Network tab)
- [ ] Page shows the Syncora core in center; moving the mouse tilts the scene
- [ ] Scroll slowly — core fades and camera moves to reveal services (Zone 2)
- [ ] Hover service planes — they scale up and cursor changes to pointer
- [ ] Continue scrolling — services fade and case-study planes appear

Development notes and next steps
-------------------------------
Suggested short-term tasks (low-risk):
- Add `package.json` with dev script to run a static server (`serve` or `http-server`) and pin versions.
- Add the missing image assets and verify sizes. Optimize textures for web (compressed PNG/WebP or KTX2 for GPU upload).
- Replace wireframe `core` with a textured PBR material/normal maps for polish.
- Add labels and click handlers for service planes so they navigate or open detail overlays.

Suggested medium-term tasks:
- Implement a bundler (Vite or Rollup) to improve module work and local dev DX.
- Add touch/keyboard accessibility for hover interactions (tappable planes, focus outlines).
- Make particle count adaptive to device performance and add a debug `?particles=1000` query param.

Suggested long-term tasks:
- Turn each case-study plane into a dynamic canvas or video texture showing interactive charts (D3/Chart.js).
- Add unit/integration tests for the JS logic (using Jest/Playwright for visual smoke tests).
- Add CI that builds a production bundle and optimizes assets.

Appendix — Where to look in code
--------------------------------
- `index.html` — importmap, script entry, DOM sections. If modules fail to load, check network requests here.
- `style.css` — layout, canvas positioning, sizes. Change color variables here.
- `main.js` — Lenis, GSAP/ScrollTrigger, timeline, tick loop.
- `World.js` — scene construction, methods to modify/update 3D content. This file holds most of the project logic.

Contact notes
-------------
If you hand this to another dev, I recommend pairing for 30–60 minutes for a handoff. The importmap and assets are the most likely sticking points.

---

I will now mark todo item #1 as completed and leave the rest unchanged. If you want, I can also: (A) commit these changes to git with a suggested commit message, (B) create a `package.json` and small `start` script, or (C) add a `README.md` trimmed version for the repo root.
