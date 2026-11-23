/* Buildless portfolio. Replace files in assets/ to use your own photography. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const year = document.querySelector('#year');
  year.textContent = new Date().getFullYear();
  const equalizer = document.querySelector('.equalizer');
  for (let i = 0; i < 46; i++) {
    const bar = document.createElement('i');
    bar.style.setProperty('--height', `${12 + Math.sin(i * .57) ** 2 * 42}px`);
    bar.style.setProperty('--delay', `${-i * .13}s`);
    equalizer.append(bar);
  }
  const dialog = document.querySelector('#lightbox');
  let lastPhoto;
  document.querySelectorAll('.photo').forEach(photo => {
    photo.addEventListener('click', () => {
      lastPhoto = photo;
      const content = dialog.querySelector('.lightbox-content');
      content.replaceChildren();
      content.className = `lightbox-content ${[...photo.classList].find(c => c.startsWith('photo-'))}`;
      const source = photo.querySelector('img');
      if (!source.hidden && source.complete && source.naturalWidth) {
        const img = document.createElement('img'); img.src = source.src; img.alt = source.alt; content.append(img);
      } else {
        const art = document.createElement('span'); art.className = 'photo-art'; content.append(art);
      }
      dialog.querySelector('.lightbox-caption').textContent = photo.dataset.caption + (source.hidden ? ' / Illustrative placeholder â€” add your photograph in assets/' : '');
      dialog.showModal();
    });
  });
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => lastPhoto?.focus());
  if (!reduced && matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.tilt').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.transform = `perspective(1000px) rotateX(${(0.5 - (e.clientY-r.top)/r.height)*3}deg) rotateY(${((e.clientX-r.left)/r.width-0.5)*3}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }
  // Cursor-following light and restrained tilt for the engineering glass panels.
  if (matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('#engineering .hud-card').forEach(card=>{
      let pointerFrame=0;
      card.addEventListener('pointermove',event=>{
        if(event.pointerType==='touch') return;
        cancelAnimationFrame(pointerFrame);
        const x=event.clientX,y=event.clientY;
        pointerFrame=requestAnimationFrame(()=>{
          const rect=card.getBoundingClientRect();
          const u=Math.max(0,Math.min(1,(x-rect.left)/rect.width));
          const v=Math.max(0,Math.min(1,(y-rect.top)/rect.height));
          card.style.setProperty('--spot-x',`${u*100}%`);
          card.style.setProperty('--spot-y',`${v*100}%`);
          if(!reduced) card.style.transform=`perspective(1400px) rotateX(${(.5-v)*1.6}deg) rotateY(${(u-.5)*1.6}deg)`;
        });
      });
      card.addEventListener('pointerleave',()=>{
        cancelAnimationFrame(pointerFrame);
        card.style.transform='';
        card.style.removeProperty('--spot-x');card.style.removeProperty('--spot-y');
      });
    });
  }
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (!reduced) {
      gsap.utils.toArray('.reveal').forEach(el => gsap.from(el, {
        opacity: 0, y: el.matches('.hud-card') ? 0 : 35, rotationX: el.matches('.hud-card') ? 0 : 3, duration: .85, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      }));
    }
    if(!document.body.hasAttribute('data-spatial-hub')) {
    gsap.to('.track-fill', {scaleY: 1, ease: 'none', scrollTrigger: {trigger: '.timeline', start: 'top 65%', end: 'bottom 65%', scrub: true}});
    gsap.to(document.documentElement, {'--accent': '#f59e0b', ease: 'none', scrollTrigger: {trigger: '#beyond', start: 'top 95%', end: 'top 35%', scrub: true}});
    }
  } else {
    document.querySelector('.track-fill').style.transform = 'scaleY(1)';
  }

  // The text and interactions work even when the CDN or WebGL is unavailable.
  if (!window.THREE) return;
  const canvas = document.querySelector('#scene');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: false, powerPreference: 'low-power'}); }
  catch (_) { canvas.style.display = 'none'; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  const scene = new THREE.Scene();
  const galleryVoid=new THREE.Color('#0C0C0F'),pitchVoid=new THREE.Color('#010102');
  const sceneBackdrop=galleryVoid.clone();scene.background=sceneBackdrop;
  const heroInk=new THREE.Color('#F4F4F6'),nightInk=new THREE.Color('#CBD5E1'),inkBlend=heroInk.clone();
  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, .1, 100);
  camera.position.z = 10;
  const group = new THREE.Group(); scene.add(group);
  // One outer containment cage only; no inner wireframe or extra particle shell.
  const cageScale=1.35, characterScale=1.45;
  const cageGeometry = new THREE.IcosahedronGeometry(2.48, 2);
  const cageMaterial = new THREE.MeshBasicMaterial({color: 0x60a5fa, wireframe: true, transparent: true, opacity: .28, blending: THREE.AdditiveBlending, depthWrite: false});
  const cage = new THREE.Mesh(cageGeometry, cageMaterial); group.add(cage);
  // Shared soft sprite gives stars and telemetry nodes a halo without postprocessing.
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 64;
  const ctx = glowCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(255,255,255,1)');
  gradient.addColorStop(.12,'rgba(255,255,255,.9)');
  gradient.addColorStop(.35,'rgba(255,255,255,.18)');
  gradient.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0,0,64,64);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const glowMaterial = new THREE.SpriteMaterial({map:glowTexture,color:0x60a5fa,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false});
  const innerGlow = new THREE.Sprite(glowMaterial); innerGlow.scale.set(5.13,5.13,1); innerGlow.position.z=-.45; group.add(innerGlow);
  // One fixed-size particle buffer is shared by the silhouette and its wave state.
  const sceneMobile=matchMedia('(max-width: 768px)');
  const silhouetteCount = sceneMobile.matches ? 15400 : 28000;
  const sourcePositions = new Float32Array(silhouetteCount*3);
  const targetPositions = new Float32Array(silhouetteCount*3);
  const particlePositions = new Float32Array(silhouetteCount*3);
  const particleColors = new Float32Array(silhouetteCount*3);
  const sourceColors = new Float32Array(silhouetteCount*3);
  const waveColor = new THREE.Color('#E2E8F0');
  const curlSeeds = new Float32Array(silhouetteCount);
  const palette = ['#0F172A','#0369A1','#1E293B'].map(hex=>new THREE.Color(hex));
  const gridColumns=sceneMobile.matches ? 140 : 200, gridRows=sceneMobile.matches ? 110 : 140;
  for (let i=0;i<silhouetteCount;i++) {
    const j=i*3;
    targetPositions[j]=(i%gridColumns/(gridColumns-1)-.5)*19;
    targetPositions[j+1]=-1.8;
    targetPositions[j+2]=(Math.floor(i/gridColumns)/(gridRows-1)-.5)*14;
    curlSeeds[i]=Math.random()*Math.PI*2;
  }
  const silhouetteGeometry = new THREE.BufferGeometry();
  const silhouetteAttribute = new THREE.BufferAttribute(particlePositions,3).setUsage(THREE.DynamicDrawUsage);
  const colorAttribute = new THREE.BufferAttribute(particleColors,3).setUsage(THREE.DynamicDrawUsage);
  silhouetteGeometry.setAttribute('position',silhouetteAttribute);
  silhouetteGeometry.setAttribute('color',colorAttribute);
  // Static appearance attributes never modify the character's geometry or transforms.
  const sparkleData=new Float32Array(silhouetteCount*3);
  for(let i=0;i<silhouetteCount;i++) {
    sparkleData[i*3]=.88+((i*73%997)/997)*.24;
    sparkleData[i*3+1]=((i*137%991)/991)*Math.PI*2;
    sparkleData[i*3+2]=.65;
  }
  const sparkleAttribute=new THREE.BufferAttribute(sparkleData,3);
  silhouetteGeometry.setAttribute('aSparkle',sparkleAttribute);
  const sparkleTime={value:0};
  const featherData=new Float32Array(silhouetteCount);
  const featherAttribute=new THREE.BufferAttribute(featherData,1);
  silhouetteGeometry.setAttribute('aFeather',featherAttribute);
  const mistMorph={value:0};
  // Soft radial stars retain a clear center and dissolve gently at their rims.
  const characterCanvas=document.createElement('canvas');characterCanvas.width=characterCanvas.height=64;
  const characterContext=characterCanvas.getContext('2d');
  const characterGradient=characterContext.createRadialGradient(32,32,0,32,32,32);
  characterGradient.addColorStop(0,'rgba(255,255,255,1)');
  characterGradient.addColorStop(.42,'rgba(255,255,255,1)');
  characterGradient.addColorStop(.58,'rgba(255,255,255,.5)');
  characterGradient.addColorStop(.76,'rgba(255,255,255,.06)');
  characterGradient.addColorStop(1,'rgba(255,255,255,0)');
  characterContext.fillStyle=characterGradient;characterContext.fillRect(0,0,64,64);
  const characterTexture=new THREE.CanvasTexture(characterCanvas);
  const silhouetteMaterial = new THREE.PointsMaterial({map:characterTexture,vertexColors:true,size:sceneMobile.matches?1.5:1.8,sizeAttenuation:false,transparent:true,opacity:.96,blending:THREE.AdditiveBlending,depthWrite:false});
  // Extend PointsMaterial to shimmer on the GPU; no per-frame attribute uploads.
  silhouetteMaterial.onBeforeCompile=shader=>{
    shader.uniforms.uSparkleTime=sparkleTime;
    shader.uniforms.uMistMorph=mistMorph;
    shader.vertexShader='attribute vec3 aSparkle; attribute float aFeather; uniform float uSparkleTime; uniform float uMistMorph; varying float vStardustAlpha;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      float mistAmplitude=(0.002+0.012*aFeather)*(1.0-uMistMorph);
      transformed.xy+=vec2(sin(uSparkleTime*0.55+aSparkle.y),cos(uSparkleTime*0.43+aSparkle.y))*mistAmplitude;
    `);
    shader.vertexShader=shader.vertexShader.replace('gl_PointSize = size;',`
      float shimmer=0.5+0.5*sin(uSparkleTime*(0.65+aSparkle.x*0.35)+aSparkle.y);
      gl_PointSize=size*aSparkle.x*(0.94+0.12*shimmer);
      vStardustAlpha=aSparkle.z*(0.96+0.04*shimmer)*(1.0-aFeather*0.3*(1.0-uMistMorph));
    `);
    shader.fragmentShader='varying float vStardustAlpha;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\n diffuseColor.a *= vStardustAlpha;');
  };
  silhouetteMaterial.customProgramCacheKey=()=> 'moonlight-feather-stardust-v3';
  const silhouette = new THREE.Points(silhouetteGeometry,silhouetteMaterial);
  silhouette.frustumCulled=false; silhouette.position.z=-.15; silhouette.renderOrder=1; group.add(silhouette);
  cage.renderOrder=2;
  function setParticleColor(i,edge) {
    const color=palette[i%palette.length];
    const brightness=edge ? .85+Math.random()*.15 : .18+Math.random()*.2;
    sourceColors[i*3]=color.r*brightness;
    sourceColors[i*3+1]=color.g*brightness;
    sourceColors[i*3+2]=color.b*brightness;
  }
  function constellationFallback() {
    for (let i=0;i<silhouetteCount;i++) {
      const u=i/(silhouetteCount-1), angle=u*Math.PI*18;
      const radius=.18+Math.sin(u*Math.PI)*1.25;
      sourcePositions[i*3]=Math.cos(angle)*radius+(Math.random()-.5)*.09;
      sourcePositions[i*3+1]=(u-.5)*3.5;
      sourcePositions[i*3+2]=Math.sin(angle)*.22+(Math.random()-.5)*.05;
      setParticleColor(i,i%10<7);
    }
    particlePositions.set(sourcePositions); particleColors.set(sourceColors); silhouetteAttribute.needsUpdate=true; colorAttribute.needsUpdate=true;
  }
  // Start immediately; successful image decoding replaces the spiral without new GPU buffers.
  constellationFallback();
  let disposed=false;
  const silhouetteImage=new Image();
  silhouetteImage.onload=()=>{
    if(disposed) return;
    try {
      const samplingCanvas=document.createElement('canvas');
      const size=360; samplingCanvas.width=samplingCanvas.height=size;
      const context=samplingCanvas.getContext('2d',{willReadFrequently:true});
      // Black also makes transparent PNGs obey the same background rejection as JPGs.
      context.fillStyle='#000000';context.fillRect(0,0,size,size);
      const fit=(size-4)/Math.max(silhouetteImage.naturalWidth,silhouetteImage.naturalHeight);
      const w=silhouetteImage.naturalWidth*fit,h=silhouetteImage.naturalHeight*fit;
      context.drawImage(silhouetteImage,(size-w)/2,(size-h)/2,w,h);
      const pixels=context.getImageData(0,0,size,size).data;
      const validPixels=[];
      let minX=size,maxX=0,minY=size,maxY=0;
      // Fine raster sampling retains interior color detail, not just the silhouette edge.
      for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
        const pixel=y*size+x,j=pixel*4;
        if(pixels[j]+pixels[j+1]+pixels[j+2]<35) continue;
        validPixels.push(pixel);
        minX=Math.min(minX,x);maxX=Math.max(maxX,x);
        minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      }
      if(!validPixels.length) throw new Error('Empty character color mask');
      const centerX=(minX+maxX)/2,centerY=(minY+maxY)/2;
      const scale=4.35*1.35/Math.hypot(maxX-minX+1,maxY-minY+1);
      const sampledColor=new THREE.Color();
      const rimCyan=new THREE.Color('#7DD3FC'),rimWhite=new THREE.Color('#E0F2FE'),rimLight=new THREE.Color();
      function luminousChannel(channel,glacial,lavender,tintMix) {
        const tint=glacial+(lavender-glacial)*tintMix;
        return THREE.MathUtils.clamp(channel*.78+tint*.32,0,255)/255;
      }
      let maxRadius=0;
      for(let i=0;i<silhouetteCount;i++) {
        // Stratified indices cover the whole raster evenly. Tiny subpixel jitter
        // separates repeated samples if the mask contains fewer than 28,000 pixels.
        const index=Math.min(validPixels.length-1,Math.floor((i+Math.random())*validPixels.length/silhouetteCount));
        const pixel=validPixels[index],offset=pixel*4,j=i*3;
        const r=pixels[offset],g=pixels[offset+1],b=pixels[offset+2];
        const lum=(.299*r+.587*g+.114*b)/255;
        sourcePositions[j]=(pixel%size-centerX+(Math.random()-.5)*.55)*scale;
        sourcePositions[j+1]=-(Math.floor(pixel/size)-centerY+(Math.random()-.5)*.55)*scale;
        sourcePositions[j+2]=(lum-.5)*.08;
        maxRadius=Math.max(maxRadius,Math.hypot(sourcePositions[j],sourcePositions[j+1]));
        // Appearance only: luminance and mask boundaries reveal a cyan rim.
        const px=pixel%size,py=Math.floor(pixel/size);
        let edge=0;
        for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
          const nx=px+dx,ny=py+dy;
          if(nx<0||ny<0||nx>=size||ny>=size) {edge=1;continue;}
          const n=(ny*size+nx)*4;
          if(pixels[n]+pixels[n+1]+pixels[n+2]<35) edge=1;
        }
        const light=THREE.MathUtils.smoothstep(lum,.1,.88);
        // True source RGB, lifted by glacial silver-cyan and a quiet lavender highlight.
        sampledColor.setRGB(
          luminousChannel(r,186,221,(1-light)*.4),
          luminousChannel(g,230,214,(1-light)*.4),
          luminousChannel(b,253,254,(1-light)*.4),
          THREE.SRGBColorSpace
        );
        const radial=THREE.MathUtils.clamp(Math.hypot(sourcePositions[j],sourcePositions[j+1])/2.7,0,1);
        featherData[i]=Math.min(1,edge*.65+radial*.25+(1-light)*radial*.1);
        sparkleData[j+2]=Math.min(1,THREE.MathUtils.lerp(.94,1,light)+edge*.02);
        // Small radiance lift; keep image shading and concentrate the extra light at edges.
        sampledColor.multiplyScalar(1.06);
        rimLight.copy(rimCyan).lerp(rimWhite,light);
        sampledColor.lerp(rimLight,edge*.12+radial*light*.035);
        sampledColor.toArray(sourceColors,j);
      }
      // Uniformly fit extreme cape tips; leave space for breathing, float and tilt.
      const safeRadius=(2.48*.85-.075)/1.012;
      const fitInside=Math.min(1,safeRadius/Math.max(maxRadius,.001));
      for(let i=0;i<silhouetteCount;i++) {
        sourcePositions[i*3]*=fitInside;sourcePositions[i*3+1]*=fitInside;
      }
      particleColors.set(sourceColors);
      featherAttribute.needsUpdate=true; sparkleAttribute.needsUpdate=true; colorAttribute.needsUpdate=true; demand();
    } catch (_) {constellationFallback(); demand();}
  };
  silhouetteImage.onerror=()=>{if(!disposed){constellationFallback();demand();}};
  // Use the existing full-color PNG directly; no lossy JPG conversion is needed.
  silhouetteImage.src='./assets/image-Photoroom.png';
  const vertexPositions=[],uniqueVertices=new Set();
  const cageVertices=cageGeometry.getAttribute('position');
  for(let i=0;i<cageVertices.count;i++) {
    const x=cageVertices.getX(i),y=cageVertices.getY(i),z=cageVertices.getZ(i);
    const key=`${x.toFixed(5)},${y.toFixed(5)},${z.toFixed(5)}`;
    if(uniqueVertices.has(key)) continue;
    uniqueVertices.add(key);vertexPositions.push(x,y,z);
  }
  const cageNodeGeometry=new THREE.BufferGeometry();
  cageNodeGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertexPositions,3));
  const cageNodeMaterial=new THREE.PointsMaterial({map:glowTexture,color:0x60a5fa,size:.03,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false});
  const cageNodes=new THREE.Points(cageNodeGeometry,cageNodeMaterial);cageNodes.renderOrder=2;cage.add(cageNodes);
  const ringGeometry = new THREE.TorusGeometry(3.05,.008,4,180);
  const ringMaterial = new THREE.MeshBasicMaterial({color:0x3adfff,transparent:true,opacity:.38,blending:THREE.AdditiveBlending,depthWrite:false});
  const nodeMaterial = new THREE.SpriteMaterial({map:glowTexture,color:0xb9faff,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false});
  const orbits = [];
  for (let i=0;i<3;i++) {
    const orbit = new THREE.Group();
    orbit.rotation.set(.65+i*.78,.3+i*.65,i*.45);
    orbit.scale.setScalar(cageScale*(1+i*.12));
    orbit.add(new THREE.Mesh(ringGeometry,ringMaterial));
    const nodes = [];
    for (let n=0;n<2;n++) {
      const node = new THREE.Sprite(nodeMaterial); node.scale.set(.17,.17,1);
      orbit.add(node); nodes.push(node);
    }
    group.add(orbit); orbits.push({orbit,nodes});
  }
  // Three depth volumes move at distinct speeds; wrapping keeps the flight continuous.
  const starLayers = [];
  const mobile = innerWidth <= 768;
  for (let layer=0;layer<3;layer++) {
    const total = mobile ? 180 : 330;
    const starPositions = new Float32Array(total*3);
    const colors = new Float32Array(total*3);
    const width = 44+layer*20, depth = 30+layer*20;
    for (let i=0;i<total;i++) {
      starPositions[i*3]=(Math.random()-.5)*width;
      starPositions[i*3+1]=(Math.random()-.5)*width*.7;
      starPositions[i*3+2]=4-Math.random()*depth;
      const c = new THREE.Color().setHSL(.54+Math.random()*.18,.2+Math.random()*.3,.65+Math.random()*.25);
      c.toArray(colors,i*3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(starPositions,3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color',new THREE.BufferAttribute(colors,3));
    const m = new THREE.PointsMaterial({map:glowTexture,vertexColors:true,size:[.075,.09,.11][layer],transparent:true,opacity:[.72,.55,.4][layer],blending:THREE.AdditiveBlending,depthWrite:false});
    const stars = new THREE.Points(g,m); stars.frustumCulled=false; scene.add(stars);
    starLayers.push({stars,geometry:g,material:m,positions:starPositions,base:starPositions.slice(),depth,speed:[1,.6,.3][layer]});
  }
  let terrainMix = 0, warmth = 0, mouseX = 0, mouseY = 0, frame=0, active = true;
  let isRealmOpen=false,resizePending=false;
  let terrainTarget = 0, warmthTarget = 0;
  let engineeringTop = 0, beyondTop = 0, flightTarget = 0, flight = 0;
  let lastTime = 0, elapsed = 0;
  const cold = new THREE.Color('#00e5ff'), blue = new THREE.Color('#2563eb'), amber = new THREE.Color('#f59e0b');
  const tint = new THREE.Color();
  let portalProgress=0;
  const silver=new THREE.Color('#E2E8F0');
  const spatialFog=new THREE.FogExp2('#020203',0);scene.fog=spatialFog;
  const spatialScene={value:0};
  const isSpatialHub=document.body.hasAttribute('data-spatial-hub');
  let spatialSceneTween;
  function setSpatialScene(event) {
    const value=event.detail.open ? 1 : 0;
    if(window.gsap) {
      spatialSceneTween?.kill();
      spatialSceneTween=gsap.to(spatialScene,{value,duration:reduced ? 0 : 1.25,ease:'power2.inOut',onUpdate:()=>demand()});
    } else {spatialScene.value=value;demand();}
  }
  if(isSpatialHub) addEventListener('portfolio:spatial-view',setSpatialScene);
  const dispersionState={value:0};
  const dispersionTween=!isSpatialHub && window.gsap && window.ScrollTrigger ? gsap.to(dispersionState,{
    value:1,ease:'none',scrollTrigger:{trigger:'#hero',start:'top top',endTrigger:'#engineering',end:'top top',scrub:reduced ? true : .65,onUpdate:()=>demand()}
  }) : null;
  function measure() {
    engineeringTop = document.querySelector('#engineering').offsetTop;
    beyondTop = document.querySelector('#beyond').offsetTop;
  }
  function scroll() {
    const heroHeight=document.querySelector('#hero').offsetHeight;
    portalProgress=THREE.MathUtils.clamp((scrollY-heroHeight*.25)/(heroHeight*.6),0,1);
    flightTarget = scrollY / Math.max(innerHeight,1) * 2.2;
    terrainTarget = THREE.MathUtils.clamp(scrollY / (engineeringTop || 1),0,1);
    warmthTarget = THREE.MathUtils.clamp((scrollY + innerHeight*.7 - beyondTop)/(innerHeight*.65),0,1);
  }
  function resize() {
    if(isRealmOpen){resizePending=true;measure();scroll();return;}
    silhouetteMaterial.size=sceneMobile.matches?1.5:1.8;
    camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight);
    if(sceneMobile.matches && silhouetteCount>15400) {
      const indices=new Uint16Array(15400);
      for(let i=0;i<indices.length;i++)indices[i]=Math.floor(i*silhouetteCount/indices.length);
      silhouetteGeometry.setIndex(new THREE.BufferAttribute(indices,1));
    } else silhouetteGeometry.setIndex(null);
    measure(); scroll();
  }
  function pointer(e) {if(e.pointerType === 'touch') return; mouseX=(e.clientX/innerWidth-.5)*1.6; mouseY=(e.clientY/innerHeight-.5)*.9;}
  function resetPointer() {mouseX=0; mouseY=0;}
  document.documentElement.addEventListener('pointerleave',resetPointer);
  addEventListener('resize',resize); addEventListener('scroll',scroll,{passive:true});
  if (!reduced) addEventListener('pointermove',pointer,{passive:true});
  measure(); scroll();
  document.fonts.ready.then(() => {measure(); scroll();});
  function render(time) {
    frame=0;
    if (!active||isRealmOpen||disposed) return;
    const dt = lastTime ? Math.min((time-lastTime)/1000,.05) : 1/60;
    lastTime = time;
    if (!reduced) elapsed += dt;
    const t = elapsed*.12;
    sparkleTime.value=reduced ? 0 : elapsed;
    const damping = 1-Math.exp(-dt*5);
    flight += (flightTarget-flight)*damping;
    const morphTarget=isSpatialHub ? Math.max(spatialScene.value,portalProgress) : (dispersionTween ? dispersionState.value : terrainTarget);
    terrainMix = reduced ? morphTarget : terrainMix+(morphTarget-terrainMix)*damping;
    const effectiveWarmthTarget=isSpatialHub ? 0 : warmthTarget;
    warmth += (effectiveWarmthTarget-warmth)*.035;
    document.documentElement.style.setProperty('--void-progress',terrainMix.toFixed(4));
    sceneBackdrop.copy(galleryVoid).lerp(pitchVoid,terrainMix);
    spatialFog.color.copy(sceneBackdrop);spatialFog.density=terrainMix*.018;
    document.documentElement.style.setProperty('--scene-bg',`#${sceneBackdrop.getHexString()}`);
    inkBlend.copy(heroInk).lerp(nightInk,terrainMix);
    document.documentElement.style.setProperty('--hero-ink',`#${inkBlend.getHexString()}`);
    const morph=terrainMix*terrainMix*(3-2*terrainMix);
    mistMorph.value=morph;
    const curl=Math.sin(Math.PI*morph)*.65;
    const floatY=(reduced?0:Math.sin(elapsed*.75)*.075)*(1-morph);
    const breath=1+(reduced?0:Math.sin(elapsed*.9)*.012)*(1-morph);
    const waveTime=reduced?0:elapsed*.55;
    for(let i=0;i<silhouetteCount;i++) {
      const j=i*3,x=targetPositions[j],z=targetPositions[j+2],seed=curlSeeds[i];
      const waveY=Math.sin(x*.35+waveTime)*Math.cos(z*.35+waveTime)*.85;
      particlePositions[j]=sourcePositions[j]*characterScale*breath*(1-morph)+x*morph+Math.sin(seed+morph*6)*curl;
      particlePositions[j+1]=(sourcePositions[j+1]*characterScale*breath+floatY)*(1-morph)+(targetPositions[j+1]+waveY)*morph+Math.cos(seed+morph*5)*curl*.6;
      particlePositions[j+2]=sourcePositions[j+2]*characterScale*(1-morph)+z*morph+Math.sin(seed*2+morph*6)*curl;
      const silverShade=.72+(i%7)/6*.28;
      particleColors[j]=sourceColors[j]+(waveColor.r*silverShade-sourceColors[j])*morph;
      particleColors[j+1]=sourceColors[j+1]+(waveColor.g*silverShade-sourceColors[j+1])*morph;
      particleColors[j+2]=sourceColors[j+2]+(waveColor.b*silverShade-sourceColors[j+2])*morph;
    }
    silhouetteAttribute.needsUpdate=true;
    colorAttribute.needsUpdate=true;
    silhouette.rotation.x+=(-mouseY*.08*(1-morph)-silhouette.rotation.x)*damping;
    silhouette.rotation.y+=(mouseX*.1*(1-morph)-silhouette.rotation.y)*damping;
    tint.copy(cold).lerp(blue, terrainMix*.32).lerp(amber,warmth).lerp(silver,terrainMix);
    cageMaterial.color.set('#94A3B8').lerp(silver,terrainMix); ringMaterial.color.set('#94A3B8').lerp(silver,terrainMix);
    cageMaterial.blending=THREE.NormalBlending;ringMaterial.blending=THREE.NormalBlending;cageNodeMaterial.blending=THREE.NormalBlending;
    nodeMaterial.color.set('#0369A1').lerp(silver,terrainMix);
    glowMaterial.color.set('#BAE6FD').lerp(amber,warmth);
    silhouetteMaterial.color.set(0xffffff).lerp(amber,warmth*.55);
    silhouetteMaterial.opacity=.96;
    const heroPresence = 1-terrainMix;
    const pulse = reduced ? 1 : 1+Math.sin(elapsed*1.5)*.09;
    cageMaterial.opacity = .08*heroPresence;
    cageNodeMaterial.opacity=.18*heroPresence;
    cageNodeMaterial.color.copy(cageMaterial.color);
    ringMaterial.opacity = .10*heroPresence;
    glowMaterial.opacity = .055*heroPresence;
    cage.scale.setScalar(cageScale*(1+terrainMix*1.6));
    nodeMaterial.opacity = .95*heroPresence;
    innerGlow.scale.set(5.13*pulse,5.13*pulse,1);

    orbits.forEach(({orbit,nodes},i) => {
      orbit.rotation.z=i*.45+t*(i%2 ? -.18 : .18);
      orbit.scale.setScalar(cageScale*(1+i*.12)*(1+terrainMix*1.9));
      nodes.forEach((node,n) => {
        const angle=elapsed*(.32+i*.1)*(i%2 ? -1 : 1)+n*Math.PI+i;
        node.position.set(Math.cos(angle)*3.05,Math.sin(angle)*3.05,0);
      });
    });
    cage.rotation.y = t*.4; cage.rotation.z = t*.18;
    // Shift the whole hero assembly; the completed wave remains centered.
    if(sceneMobile.matches) {
      group.position.set(0,1.15*heroPresence,0);
      group.scale.setScalar(.62+.38*terrainMix);
    } else {
      group.position.set(2.6*heroPresence,-.1,0);
      group.scale.setScalar(1);
    }
    // Orbit the camera, so stars and the core shift naturally at different depths.
    const distance = (sceneMobile.matches ? 15-5*terrainMix : 10)+terrainMix*2+warmth*2;
    const yaw = mouseX*.24, pitch=mouseY*.2;
    camera.position.x += (Math.sin(yaw)*distance-camera.position.x)*damping;
    camera.position.y += (-Math.sin(pitch)*distance-camera.position.y)*damping;
    camera.position.z = Math.cos(yaw)*Math.cos(pitch)*distance;
    camera.lookAt(0,sceneMobile.matches ? -1.25*heroPresence : 0,0);
    starLayers.forEach(layer => {
      const travel = reduced ? 0 : flight*layer.speed+elapsed*.035*layer.speed;
      for (let i=2;i<layer.positions.length;i+=3) {
        const z = layer.base[i]+travel;
        layer.positions[i] = 4-(((4-z)%layer.depth+layer.depth)%layer.depth);
      }
      layer.geometry.attributes.position.needsUpdate=true;
    });
    renderer.render(scene,camera);
    if (!reduced || Math.abs(terrainMix-morphTarget)>.001 || Math.abs(warmth-effectiveWarmthTarget)>.001) scheduleRender();
  }
  // One scheduled frame at most; a fully opaque realm stops all hidden draws.
  function scheduleRender() {
    if(!active||isRealmOpen||disposed||frame)return;
    frame=requestAnimationFrame(render);
  }
  function demand() {if(reduced){cancelAnimationFrame(frame);frame=0;scheduleRender();}}
  function realmRendering(event) {
    isRealmOpen=Boolean(event.detail.paused);
    cancelAnimationFrame(frame);frame=0;lastTime=0;
    if(!isRealmOpen){if(resizePending){resizePending=false;resize();}scheduleRender();}
  }
  addEventListener('portfolio:realm-render',realmRendering);
  addEventListener('scroll',demand,{passive:true});addEventListener('resize',demand);
  function visibility(){lastTime=0;active=!document.hidden;cancelAnimationFrame(frame);frame=0;scheduleRender();}
  document.addEventListener('visibilitychange',visibility);
  scheduleRender();
  addEventListener('pagehide', e => {
    if(e.persisted) return;
    disposed=true;silhouetteImage.onload=null;silhouetteImage.onerror=null;
    dispersionTween?.scrollTrigger?.kill();dispersionTween?.kill();
    spatialSceneTween?.kill();removeEventListener('portfolio:spatial-view',setSpatialScene);
    removeEventListener('portfolio:realm-render',realmRendering);
    active=false;cancelAnimationFrame(frame);
    removeEventListener('resize',resize);removeEventListener('scroll',scroll);removeEventListener('pointermove',pointer);
    removeEventListener('scroll',demand);removeEventListener('resize',demand);document.removeEventListener('visibilitychange',visibility);
    document.documentElement.removeEventListener('pointerleave',resetPointer);
    [cageGeometry,cageNodeGeometry,silhouetteGeometry,ringGeometry,...starLayers.map(layer=>layer.geometry)].forEach(g=>g.dispose());
    [cageMaterial,cageNodeMaterial,silhouetteMaterial,glowMaterial,ringMaterial,nodeMaterial,...starLayers.map(layer=>layer.material)].forEach(m=>m.dispose());
    characterTexture.dispose(); glowTexture.dispose(); renderer.dispose();
  });
})();


/* Living archive: edit this array to add chapters; Hero/Three.js code above is untouched. */
const ARCHIVE_CHAPTERS = [
  {
    id:'second-sight',number:'I',code:'01 // EDGE VISION',category:'Edge AI & Vision',
    title:'The Second Sight',poem:'A second sight. A quieter kind of freedom.',
    hook:'Wearable perception, translating the unseen into touch and sound.',
    role:'Founder & Lead Architect',date:'2026 // PIISE DIVISION A FINALIST',
    tags:['Raspberry Pi 5','YOLOv26n-seg','8x8 ToF LiDAR','SOLIDWORKS'],schematic:'vision',
    summary:'Wearable assistive smart glasses for visually impaired navigation, bringing visual recognition and spatial depth into one compact system.',
    specifications:[['Perception','14-class YOLOv26n-seg instance segmentation, trained on approximately 30,000 images.'],['Spatial sensing','8x8 ToF LiDAR fused with visual inference.'],['Compute & thermal','Active-cooled Raspberry Pi 5.'],['Human interface','Tactile and audio feedback for assistive navigation.'],['Mechanical design','Custom SOLIDWORKS 3D-printed housing.']],
    stack:['YOLOv26n-seg','Raspberry Pi 5','ToF LiDAR','Sensor fusion','SOLIDWORKS'],
    results:[['14','recognition classes'],['~30k','training images'],['8 x 8','depth-sensor array']],
    outcome:'PIISE 2026 Division A Finalist.',
    links:[{label:'GitHub / project archive',url:'https://github.com/Todaii-Agnes'},{label:'Request project documentation',url:'mailto:student250908@ptnk.edu.vn?subject=The%20Second%20Sight%20documentation'}]
  },
  {
    id:'spatial-perception',number:'II',code:'02 // SPATIAL RESEARCH',category:'Edge AI & Vision',
    title:'Spatial Perception Research',poem:'Teaching silicon to perceive space.',
    hook:'Indoor obstacle detection at the boundary of vision and spatial awareness.',
    role:'Student Research Lead',date:'2026 // HCMUT CONTROL & VISION LAB',
    tags:['Computer vision','Spatial awareness','Low-latency pipelines'],schematic:'radar',
    summary:'Leading indoor AI obstacle-detection research under Dr. Pham Viet Cuong at Ho Chi Minh City University of Technology.',
    specifications:[['Research environment','HCMUT Control & Vision Lab, Department of Automatic Control.'],['Advisor','Dr. Pham Viet Cuong.'],['Research focus','Indoor obstacle detection and spatial awareness.'],['Pipeline objective','Optimize low-latency perception for assistive navigation.']],
    stack:['AI vision','Obstacle detection','Spatial perception'],results:[],
    outcome:'Algorithmic foundations for wearable assistive navigation. Latency and accuracy measurements are not yet published here.',
    links:[{label:'GitHub / research archive',url:'https://github.com/Todaii-Agnes'},{label:'Request research notes',url:'mailto:student250908@ptnk.edu.vn?subject=Spatial%20perception%20research'}]
  },
  {
    id:'bare-metal',number:'III',code:'03 // SILICON & SIGNAL',category:'Bare-Metal & Hardware',
    title:'Silicon & Bare-Metal Registers',poem:'Close to the metal. Open to possibility.',
    hook:'From register-level firmware to the traces that carry each signal.',
    role:'Embedded Developer',date:'2026 // STM32F411E & KICAD',
    tags:['Zero-HAL C','STM32F411E','DMA / EXTI','KiCad'],schematic:'silicon',
    summary:'Zero-HAL register-level C firmware written from scratch, paired with custom PCB schematic design in KiCad.',
    specifications:[['Microcontroller','STM32F411E / STM32F4 family.'],['Firmware','Bare-metal C without HAL libraries.'],['Peripherals','DMA, EXTI, UART and I2C; register-level GPIO foundations.'],['Board design','Custom PCB schematic design in KiCad.'],['Training','IMIC Technology certification.']],
    stack:['Bare-metal C','STM32F411E','DMA','EXTI','UART','I2C','KiCad'],results:[['8.0/10','IMIC certification score']],
    outcome:'Firmware and circuit foundations built from first principles.',
    links:[{label:'GitHub / firmware archive',url:'https://github.com/Todaii-Agnes'},{label:'Request firmware notes',url:'mailto:student250908@ptnk.edu.vn?subject=Bare-metal%20firmware%20notes'}]
  },
  {
    id:'foundations',number:'IV',code:'04 // FOUNDATIONS & PEOPLE',category:'Academic & Leadership',
    title:'Foundations & International Track',poem:'Curiosity travels further, together.',
    hook:'An interdisciplinary foundation in informatics, leadership, and robotics.',
    role:'Grade 11 Informatics Class Monitor',date:'2025-2026 // VNU-HCM PTNK & HKU ALLIANCE',
    tags:['AP CS A 5/5','HKU Alliance','C++ / Python','Classical CV'],schematic:'trajectory',
    summary:'Grade 11 Informatics at VNU-HCM High School for the Gifted, connecting academic foundations with an international AI and robotics track.',
    specifications:[['Academic record','9.3 overall GPA; 9.85 Computer Science GPA; AP Computer Science A: 5/5.'],['International track','HKU Global Engineering Alliance AI & Robotics qualifier; TISF representative.'],['First-principles vision','Classical computer vision in C++, Python, OpenCV and NumPy.'],['Leadership','Class Monitor, Class 11 TinLN: academic schedules, curriculum tracking, and faculty-student communications.']],
    stack:['C++','Python','OpenCV','NumPy','Academic leadership'],
    results:[['9.3','overall GPA'],['9.85','CS GPA'],['5/5','AP Computer Science A']],
    outcome:'HKU Global Engineering Alliance AI & Robotics qualifier and TISF representative.',
    links:[{label:'GitHub / learning archive',url:'https://github.com/Todaii-Agnes'},{label:'Request academic portfolio',url:'mailto:student250908@ptnk.edu.vn?subject=Academic%20portfolio'}]
  }
];

(() => {
  const list=document.querySelector('#archive-chapters');
  const drawer=document.querySelector('#detail-drawer');
  const content=document.querySelector('#drawer-content');
  const closeButton=document.querySelector('#drawer-close');
  const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)');
  const escapeText=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let returnFocus=null,closeTimer=0,openFrame=0,closing=false;
  const scrollLock={overflow:'',paddingRight:''};
  function schematic(key) {return document.querySelector(`#schematic-${key}`).innerHTML;}
  let archiveScope='systems';
  function render(category='All') {
    // Realm 02 has its own curator strip and archival index.
    if(archiveScope==='foundations')return;
    document.querySelectorAll('#archive-chapters .archive-chapter').forEach(el=>el.remove());
    const destination=list;
    const chapters=ARCHIVE_CHAPTERS.filter(chapter=>(archiveScope==='foundations' ? chapter.category==='Academic & Leadership' : chapter.category!=='Academic & Leadership') && (category==='All'||chapter.category===category));
    chapters.forEach(chapter=>{
      const article=document.createElement('article');article.className='archive-chapter';article.dataset.chapter=chapter.id;
      article.innerHTML=`<div class="chapter-registration mono"><span>${escapeText(chapter.code)}</span><span>${escapeText(chapter.number)} / IV</span></div><div class="chapter-composition"><div class="chapter-copy"><p class="chapter-date mono">${escapeText(chapter.date)}</p><h3>${escapeText(chapter.title)}</h3><p class="chapter-poem">${escapeText(chapter.poem)}</p><p class="chapter-hook">${escapeText(chapter.hook)}</p><div class="chapter-tags mono">${chapter.tags.map(tag=>`<span>${escapeText(tag)}</span>`).join('')}</div><button type="button" class="inspect-telemetry" data-inspect="${chapter.id}" aria-haspopup="dialog" aria-controls="detail-drawer" aria-label="Inspect telemetry: ${escapeText(chapter.title)}">[ + inspect telemetry ]</button></div><div class="chapter-diagram" aria-hidden="true">${schematic(chapter.schematic)}</div></div><span class="chapter-cross" aria-hidden="true">+</span>`;
      destination.append(article);
    });
    document.querySelector('#archive-count').textContent=`${String(chapters.length).padStart(2,'0')} CHAPTER${chapters.length===1?'':'S'}`;
    document.querySelector('#archive-status').textContent=`${chapters.length} chapters shown. ${category}.`;
    document.querySelectorAll('[data-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===category)));
    // Re-measure existing scroll observers after a filter changes document height.
    requestAnimationFrame(()=>{if(!document.body.hasAttribute('data-spatial-hub'))window.ScrollTrigger?.refresh();dispatchEvent(new Event('resize'));});
  }
  function unlockScroll() {document.documentElement.style.overflow=scrollLock.overflow;document.documentElement.style.paddingRight=scrollLock.paddingRight;}
  function closeDrawer() {
    if(!drawer.open||closing) return;
    closing=true;cancelAnimationFrame(openFrame);drawer.classList.remove('is-open');
    const finish=()=>{drawer.close();};
    if(prefersReduced.matches) finish();else closeTimer=setTimeout(finish,320);
  }
  function openDrawer(id,trigger) {
    const chapter=ARCHIVE_CHAPTERS.find(chapter=>chapter.id===id);if(!chapter)return;
    clearTimeout(closeTimer);closing=false;returnFocus=trigger;
    content.innerHTML=`<p class="drawer-code mono">CHAPTER ${escapeText(chapter.number)} / ${escapeText(chapter.category)}</p><h2 id="drawer-title">${escapeText(chapter.title)}</h2><p class="drawer-poem">${escapeText(chapter.poem)}</p><p class="drawer-date mono">${escapeText(chapter.date)}</p><p class="drawer-role">${escapeText(chapter.role)}</p><p class="drawer-summary">${escapeText(chapter.summary)}</p><div class="drawer-schematic">${schematic(chapter.schematic)}<p class="mono">SYSTEM SCHEMATIC / ILLUSTRATIVE</p></div><section class="drawer-specifications"><h3 class="mono">SYSTEM NOTES</h3><dl>${chapter.specifications.map(([label,value])=>`<div><dt>${escapeText(label)}</dt><dd>${escapeText(value)}</dd></div>`).join('')}</dl></section><section class="drawer-stack"><h3 class="mono">HARDWARE / SOFTWARE STACK</h3><div class="chapter-tags mono">${chapter.stack.map(tag=>`<span>${escapeText(tag)}</span>`).join('')}</div></section><section class="drawer-results"><h3 class="mono">RECORDED OUTCOMES</h3>${chapter.results.length?`<div class="result-grid">${chapter.results.map(([value,label])=>`<div><strong>${escapeText(value)}</strong><span>${escapeText(label)}</span></div>`).join('')}</div>`:''}<p>${escapeText(chapter.outcome)}</p></section><div class="drawer-links">${chapter.links.map(link=>`<a href="${escapeText(link.url)}"${link.url.startsWith('https:')?' target="_blank" rel="noopener noreferrer"':''}>${escapeText(link.label)}</a>`).join('')}</div>`;
    content.scrollTop=0;
    if(!drawer.open) {
      scrollLock.overflow=document.documentElement.style.overflow;scrollLock.paddingRight=document.documentElement.style.paddingRight;
      const gap=innerWidth-document.documentElement.clientWidth;
      document.documentElement.style.overflow='hidden';if(gap>0)document.documentElement.style.paddingRight=`${gap}px`;
      drawer.showModal();
    }
    drawer.scrollTop=0;closeButton.focus({preventScroll:true});
    openFrame=requestAnimationFrame(()=>{drawer.classList.add('is-open');});
  }
  document.querySelector('.archive-filters').addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(button)render(button.dataset.category);});
  document.querySelector('#realm-overlay').addEventListener('click',event=>{const button=event.target.closest('[data-inspect]');if(button)openDrawer(button.dataset.inspect,button);});
  addEventListener('portfolio:archive-scope',event=>{archiveScope=event.detail.scope;render();});
  closeButton.addEventListener('click',closeDrawer);
  drawer.addEventListener('cancel',event=>{event.preventDefault();closeDrawer();});
  drawer.addEventListener('click',event=>{if(event.target!==drawer)return;const rect=drawer.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeDrawer();});
  drawer.addEventListener('close',()=>{clearTimeout(closeTimer);cancelAnimationFrame(openFrame);closing=false;drawer.classList.remove('is-open');unlockScroll();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
  render();
})();

/* Quiet spatial hub: navigation lifecycle, independent from the Three.js objects. */
(() => {
  const workspace=document.querySelector('#realm-overlay');
  const viewport=workspace.querySelector('.workspace-scroll');
  const stage=workspace.querySelector('.workspace-stage');
  const tabs=[...workspace.querySelectorAll('[data-spatial-tab]')];
  const panels={systems:document.querySelector('#engineering'),foundations:document.querySelector('#foundations'),beyond:document.querySelector('#beyond')};
  const names={systems:'Systems & Research',foundations:'Academic & Leadership',beyond:'Beyond the Terminal'};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const drawerPortrait=matchMedia('(max-width: 768px)');
  const updateDrawerLabel=()=>{document.querySelector('#drawer-close').textContent=drawerPortrait.matches?'[ X CLOSE ]':'ESC  [ X ]';};
  drawerPortrait.addEventListener('change',updateDrawerLabel);updateDrawerLabel();
  let active='systems',returnFocus=null,closing=false,sequence=0;
  const transitions=new Map();
  let originalOverflow='',originalPadding='',savedScrollY=0,realmLocked=false,diving=false;
  function lockRealm() {
    if(realmLocked)return;
    savedScrollY=window.scrollY;originalOverflow=document.documentElement.style.overflow;originalPadding=document.documentElement.style.paddingRight;
    const gap=innerWidth-document.documentElement.clientWidth;
    document.documentElement.style.overflow='hidden';if(gap>0)document.documentElement.style.paddingRight=`${gap}px`;realmLocked=true;
  }
  function animate(target,values,onComplete) {
    transitions.get(target)?.kill();
    if(window.gsap&&!reduced.matches) transitions.set(target,gsap.to(target,{...values,duration:.4,ease:'power2.out',overwrite:true,onComplete}));
    else {if(values.opacity!==undefined)target.style.opacity=values.opacity;if(values.y!==undefined||values.scale!==undefined)target.style.transform=`translateY(${values.y??0}px) scale(${values.scale??1})`;onComplete?.();}
  }
  function activate(view,focusTab=false) {
    active=view;workspace.dataset.realm=view;document.querySelector('#detail-drawer').dataset.realm=view;
    for(const [key,panel] of Object.entries(panels))panel.hidden=key!==view;
    document.querySelector('#arsenal').hidden=view!=='systems';
    dispatchEvent(new CustomEvent('portfolio:archive-scope',{detail:{scope:view==='foundations'?'foundations':'systems'}}));
    tabs.forEach(tab=>{const selected=tab.dataset.spatialTab===view;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
    document.querySelector('#workspace-title').textContent=`${names[view]} spatial view`;
    viewport.scrollTop=0;
    if(focusTab)tabs.find(tab=>tab.dataset.spatialTab===view).focus({preventScroll:true});
  }
  let portalTimeline=null,entryDoor=null;
  const doorStage=document.querySelector('#gateways');
  const portalUI=[workspace.querySelector('.workspace-top'),viewport];
  const mistVeil=document.createElement('div');mistVeil.className='realm-mist-veil';mistVeil.setAttribute('aria-hidden','true');workspace.append(mistVeil);
  const setRealmRendering=paused=>dispatchEvent(new CustomEvent('portfolio:realm-render',{detail:{paused}}));
  function promoteLayers() {
    [doorStage,workspace].forEach(element=>{element.style.willChange='transform, opacity';element.style.backfaceVisibility='hidden';});
    doorStage.classList.add('dolly-active');
  }
  function releaseLayers() {
    [doorStage,workspace].forEach(element=>element.style.removeProperty('will-change'));
    doorStage.classList.remove('dolly-active');
  }

  function setDollyOrigin(door) {
    const frame=door.querySelector('.doorway').getBoundingClientRect();
    const stageBounds=doorStage.getBoundingClientRect();
    const originX=frame.left+frame.width/2,originY=frame.top+frame.height/2;
    // Convert the screen-space center into the stage's local transform coordinates.
    gsap.set(doorStage,{transformOrigin:`${originX-stageBounds.left}px ${originY-stageBounds.top}px`});
  }
  function resetPortalStyles() {
    workspace.style.transform='';workspace.style.opacity='';mistVeil.style.opacity='0';
    stage.style.transform='';
    portalUI.forEach(element=>{element.style.opacity='';element.style.transform='';element.inert=false;});
  }
  function present(view,trigger) {
    returnFocus=trigger;closing=false;lockRealm();activate(view);workspace.showModal();
    dispatchEvent(new CustomEvent('portfolio:spatial-view',{detail:{open:true,view}}));
  }
  function open(view,trigger,connect=false) {
    if(!panels[view])return;
    if(!workspace.open) {
      entryDoor=null;resetPortalStyles();promoteLayers();present(view,trigger);
      document.querySelector('#return-core').focus({preventScroll:true});
      if(window.gsap&&!reduced.matches)gsap.set(workspace,{opacity:0});
      animate(workspace,{opacity:1,y:0,scale:1},()=>{releaseLayers();setRealmRendering(true);});
    } else if(view!==active&&!diving&&!closing) {
      activate(view,true);
      if(window.gsap&&!reduced.matches)gsap.set(stage,{opacity:0,y:8});
      animate(stage,{opacity:1,y:0});
    }
    if(connect)requestAnimationFrame(()=>{document.querySelector('#workspace-contact').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'end'});document.querySelector('#workspace-contact a').focus({preventScroll:true});});
  }
  function close() {
    if(closing||!workspace.open)return;
    closing=true;diving=false;portalTimeline?.kill();setRealmRendering(false);promoteLayers();
    dispatchEvent(new CustomEvent('portfolio:spatial-view',{detail:{open:false}}));
    portalUI.forEach(element=>element.inert=true);
    if(!entryDoor||reduced.matches||!window.gsap) {
      if(entryDoor){entryDoor.classList.remove('is-diving','is-ajar');entryDoor.querySelector('.door-leaf').style.transform='';}
      doorStage.style.transform='';doorStage.style.transformOrigin='';
      releaseLayers();workspace.close();return;
    }
    const door=entryDoor,leaf=door.querySelector('.door-leaf');
    portalTimeline=gsap.timeline({onComplete:()=>{
      door.classList.remove('is-diving','is-ajar');
      gsap.set(leaf,{clearProps:'transform'});gsap.set(doorStage,{clearProps:'transform,transformOrigin'});
      releaseLayers();diving=false;
    }})
      .to(portalUI,{opacity:0,y:8,duration:.22,ease:'power2.out'},0)
      .to(doorStage,{scale:1,duration:.65,ease:'power2.inOut'},.15)
      .to(workspace,{opacity:0,scale:1.06,duration:.65,ease:'power2.inOut'},.15)
      .to(mistVeil,{opacity:1,duration:.5,ease:'power2.inOut'},.15)
      .to(leaf,{rotationY:0,duration:.35,ease:'power2.out'},.65)
      .call(()=>workspace.close(),null,1);
  }
  function enterDoor(view,trigger) {
    if(diving||closing||workspace.open)return;
    portalTimeline?.kill();entryDoor=trigger;diving=true;lockRealm();promoteLayers();trigger.classList.add('is-diving');
    const leaf=trigger.querySelector('.door-leaf');
    if(reduced.matches||!window.gsap) {
      resetPortalStyles();present(view,trigger);diving=false;releaseLayers();setRealmRendering(true);
      document.querySelector('#return-core').focus({preventScroll:true});return;
    }
    gsap.set(doorStage,{scale:1});setDollyOrigin(trigger);
    portalTimeline=gsap.timeline({onComplete:()=>{
      diving=false;portalUI.forEach(element=>element.inert=false);releaseLayers();setRealmRendering(true);
      document.querySelector('#return-core').focus({preventScroll:true});
    }})
      .to(leaf,{rotationY:-85,duration:.4,ease:'power2.inOut'},0)
      .call(()=>{
        present(view,trigger);
        gsap.set(workspace,{opacity:0,scale:1.06,y:0});gsap.set(mistVeil,{opacity:1});
        gsap.set(portalUI,{opacity:0,y:10});portalUI.forEach(element=>element.inert=true);
      },null,.28)
      .to(doorStage,{scale:6.5,duration:.7,ease:'power2.inOut'},.28)
      .to(workspace,{opacity:1,scale:1,duration:.7,ease:'power2.inOut'},.28)
      .to(mistVeil,{opacity:0,duration:.7,ease:'power2.out'},.28)
      .to(portalUI,{opacity:1,y:0,duration:.33,ease:'power2.out'},.82);
  }
  document.addEventListener('click',event=>{
    const trigger=event.target.closest('[data-gateway],a[href="#engineering"],a[href="#beyond"]');
    if(!trigger||workspace.contains(trigger)||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();const view=trigger.dataset.gateway||(trigger.getAttribute('href')==='#beyond'?'beyond':'systems');
    if(trigger.matches('#gateways .door-trigger'))enterDoor(view,trigger);
    else open(view,trigger,trigger.hasAttribute('data-connect'));
  });
  tabs.forEach(tab=>tab.addEventListener('click',()=>open(tab.dataset.spatialTab,tab)));
  workspace.querySelector('[role="tablist"]').addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const current=tabs.indexOf(document.activeElement);
    const index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(current+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    open(tabs[index].dataset.spatialTab,tabs[index]);
  });
  document.querySelector('#return-core').addEventListener('click',close);
  workspace.addEventListener('cancel',event=>{event.preventDefault();close();});
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||!workspace.open||document.querySelector('#detail-drawer').open||document.querySelector('#lightbox').open)return;
    event.preventDefault();close();
  });
  workspace.addEventListener('close',()=>{
    setRealmRendering(false);releaseLayers();
    closing=false;diving=false;sequence++;transitions.forEach(animation=>animation.kill());transitions.clear();resetPortalStyles();stage.style.opacity='1';
    document.documentElement.style.overflow=originalOverflow;document.documentElement.style.paddingRight=originalPadding;
    realmLocked=false;
    if(window.gsap)gsap.set(doorStage,{clearProps:'transform,transformOrigin'});
    else {doorStage.style.transform='';doorStage.style.transformOrigin='';}
    window.scrollTo({top:savedScrollY,behavior:'instant'});
    if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
  });
  activate('systems');
})();

/* Door feedback is independent of the protected Hero and silver-wave scene. */
(() => {
  const doors=[...document.querySelectorAll('#gateways .door-trigger')];
  const workspace=document.querySelector('#realm-overlay');
  function synchronizeDoors() {
    const active=workspace.querySelector('[role="tab"][aria-selected="true"]')?.dataset.spatialTab;
    doors.forEach(door=>{
      const expanded=workspace.open&&door.dataset.gateway===active;
      door.setAttribute('aria-expanded',String(expanded));
      if(!workspace.open)door.classList.remove('is-ajar');
    });
  }
  doors.forEach(door=>{
    door.addEventListener('pointerdown',()=>door.classList.add('is-ajar'));
    door.addEventListener('pointercancel',()=>{if(!workspace.open)door.classList.remove('is-ajar');});
    door.addEventListener('pointerleave',()=>{if(!workspace.open)door.classList.remove('is-ajar');});
  });
  new MutationObserver(synchronizeDoors).observe(workspace,{attributes:true,subtree:true,attributeFilter:['open','aria-selected']});
  workspace.addEventListener('close',synchronizeDoors);
  synchronizeDoors();
})();

/* Gallery actions are independent of the protected realm and dolly controllers. */
(() => {
  const email='student250908@ptnk.edu.vn';
  const copyButton=document.querySelector('#copy-email');
  const toast=document.querySelector('#email-toast');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let toastTimer=0,hideTimer=0,copying=false;
  function showToast(message) {
    clearTimeout(toastTimer);clearTimeout(hideTimer);
    toast.textContent=message;toast.hidden=false;
    requestAnimationFrame(()=>toast.classList.add('is-visible'));
    toastTimer=setTimeout(()=>{toast.classList.remove('is-visible');hideTimer=setTimeout(()=>{toast.hidden=true;},reduced.matches?0:200);},2200);
  }
  function fallbackCopy() {
    const field=document.createElement('textarea');field.value=email;
    field.setAttribute('readonly','');field.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';
    document.body.append(field);field.select();field.setSelectionRange(0,email.length);
    let copied=false;
    try {copied=document.execCommand('copy');} catch (_) {copied=false;}
    field.remove();copyButton.focus({preventScroll:true});return copied;
  }
  copyButton.addEventListener('click',async()=>{
    if(copying)return;copying=true;
    let copied=false;
    try {if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(email);copied=true;}else copied=fallbackCopy();}
    catch (_) {copied=fallbackCopy();}
    showToast(copied?`Email copied \u2014 ${email}`:`Email: ${email}`);
    copying=false;
  });

  let scrollTween=null,frame=0,scrolling=false,previousBehavior='';
  function finishScroll() {
    if(!scrolling)return;
    scrolling=false;document.documentElement.style.scrollBehavior=previousBehavior;
    document.querySelector('.gallery-scroll').setAttribute('aria-busy','false');
  }
  function cancelScroll() {
    scrollTween?.kill();scrollTween=null;cancelAnimationFrame(frame);finishScroll();
  }
  document.querySelector('.gallery-scroll').addEventListener('click',()=>{
    cancelScroll();
    const target=document.querySelector('#gateways').offsetTop;
    if(reduced.matches){window.scrollTo({top:target,behavior:'instant'});return;}
    const start=window.scrollY;
    previousBehavior=document.documentElement.style.scrollBehavior;document.documentElement.style.scrollBehavior='auto';
    scrolling=true;document.querySelector('.gallery-scroll').setAttribute('aria-busy','true');
    if(window.gsap) {
      const position={y:start};
      scrollTween=gsap.to(position,{y:target,duration:2.4,ease:'power2.inOut',onUpdate:()=>window.scrollTo({top:position.y,behavior:'instant'}),onComplete:finishScroll});
    } else {
      const beginning=performance.now();
      const tick=now=>{
        const progress=Math.min(1,(now-beginning)/2400);
        const ease=progress<.5?4*progress**3:1-(-2*progress+2)**3/2;
        window.scrollTo({top:start+(target-start)*ease,behavior:'instant'});
        if(progress<1&&scrolling)frame=requestAnimationFrame(tick);else finishScroll();
      };
      frame=requestAnimationFrame(tick);
    }
  });
  addEventListener('wheel',cancelScroll,{passive:true});
  addEventListener('touchstart',cancelScroll,{passive:true});
  addEventListener('pointerdown',()=>{if(scrolling)cancelScroll();},{passive:true});
  addEventListener('resize',cancelScroll,{passive:true});
  addEventListener('keydown',event=>{if(['Escape','ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))cancelScroll();});
  addEventListener('pagehide',cancelScroll);
})();

/* Realm 02 index content. No shared scene or navigation behavior is changed. */
(() => {
  const FOUNDATIONS_INDEX = [
    {year:'2026 \u2014 PRESENT',milestone:'Class Monitor, Grade 11 Tin-LN (Interdisciplinary Informatics)',record:'VNU-HCM High School for the Gifted (PTNK)'},
    {year:'2026',milestone:'Division A Finalist \u2014 PIISE 2026 (Founder & Team Leader, "The Second Sight")',record:'Wearable Edge-AI Assistive Navigation \u00b7 HCMC'},
    {year:'2026',milestone:'Team Leader \u2014 AI Vision & Indoor Obstacle Perception Lab',record:'Dept. of Automatic Control, HCMUT (Advisor: Dr. Pham Viet Cuong)'},
    {year:'2026 \u2014 2027',milestone:'Member \u2014 HKU Academy for the Talented & AI Training',record:'The University of Hong Kong (ID: 2026YBQ1383)'},
    {year:'2026',milestone:'College Board AP Computer Science A',record:'Score 5 / 5'},
    {year:'2025 \u2014 2026',milestone:'Bare-Metal STM32 Firmware Development (Certified)',record:'IMIC Technology \u2014 Grade 8.0 / 10 (Good)'},
    {year:'2025 \u2014 2026',milestone:'Grade 10 Academic Standing & English Proficiency',record:'Overall GPA 9.3/10 (Informatics 9.8/10) \u00b7 CEFR B2+/C1 Verified'}
  ];
  const rows=document.querySelector('#foundations-index-rows');
  const fragment=document.createDocumentFragment();
  FOUNDATIONS_INDEX.forEach(entry=>{
    const row=document.createElement('tr');
    for(const [key,label] of [['year','Year'],['milestone','Milestone & role'],['record','Institution / record']]) {
      const cell=document.createElement(key==='milestone'?'th':'td');
      if(key==='milestone')cell.scope='row';
      cell.dataset.label=label;cell.className=`index-${key}`;cell.textContent=entry[key];row.append(cell);
    }
    fragment.append(row);
  });
  rows.replaceChildren(fragment);
})();
