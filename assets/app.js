/* =========================================================
   SIDHARTH CHOUDHARY — shared JS
   - 5 different 3D backgrounds (pick per page via data-scene)
   - nav, mobile menu, scroll reveals, count-up, page transitions
   All vanilla + Three.js. No build step.
   ========================================================= */

/* ---------- NAV ---------- */
(function(){
  const nav = document.getElementById('nav');
  if(nav){ window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>30)); }
  const burger = document.getElementById('burger');
  const mm = document.getElementById('mobileMenu');
  if(burger&&mm){
    burger.addEventListener('click',()=>mm.classList.toggle('open'));
    mm.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>mm.classList.remove('open')));
  }
})();

/* ---------- PAGE TRANSITION (fade-cover on internal link click) ---------- */
(function(){
  const overlay = document.createElement('div');
  overlay.className='page-transition';
  document.body.appendChild(overlay);
  // intercept internal .html links
  document.querySelectorAll('a[href$=".html"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const url = a.getAttribute('href');
      if(!url || url.startsWith('http')) return;
      e.preventDefault();
      overlay.classList.add('cover');
      setTimeout(()=>{ window.location.href = url; }, 480);
    });
  });
})();

/* ---------- SCROLL REVEAL ---------- */
(function(){
  const io = new IntersectionObserver((es)=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
  },{threshold:0.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
})();

/* ---------- COUNT-UP STATS ---------- */
(function(){
  function run(el){
    const isFloat = el.dataset.float;
    const target = parseFloat(isFloat || el.dataset.count);
    const dur=1400, start=performance.now();
    function tick(now){
      const p=Math.min((now-start)/dur,1), e=1-Math.pow(1-p,3), v=target*e;
      el.textContent = isFloat ? v.toFixed(2) : Math.round(v);
      if(p<1) requestAnimationFrame(tick);
      else el.innerHTML = isFloat ? `<em>${target.toFixed(2)}</em>` : `<em>${target}</em>`;
    }
    requestAnimationFrame(tick);
  }
  const io = new IntersectionObserver((es)=>{
    es.forEach(e=>{ if(e.isIntersecting){ const b=e.target.querySelector('.big'); if(b) run(b); io.unobserve(e.target);} });
  },{threshold:0.5});
  document.querySelectorAll('.stat').forEach(s=>io.observe(s));
})();

/* ---------- HERO INTRO STAGGER (home) ---------- */
window.addEventListener('load',()=>{
  const items = document.querySelectorAll('.intro');
  items.forEach((el,i)=> setTimeout(()=>el.classList.add('show'), 120 + i*150));
});

/* =========================================================
   3D BACKGROUNDS
   Each page sets <body data-scene="neural|particles|grid|globe|waves">
   ========================================================= */
(function(){
  const canvas = document.getElementById('bg-canvas');
  if(!canvas || !window.THREE) return;
  const scene3 = document.body.dataset.scene || 'neural';

  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1000);
  camera.position.z = 60;
  const MINT = new THREE.Color(0x5EEAD4);
  const SOFT = new THREE.Color(0x3a4a6a);
  const group = new THREE.Group();
  scene.add(group);

  let mouseX=0,mouseY=0,tX=0,tY=0;
  addEventListener('mousemove',e=>{ tX=e.clientX/innerWidth-0.5; tY=e.clientY/innerHeight-0.5; });

  const clock = new THREE.Clock();
  let updater = ()=>{};

  /* ---------- SCENE: neural network ---------- */
  function buildNeural(){
    const N = innerWidth<768?34:64;
    const nodes=[]; const geo=new THREE.SphereGeometry(0.42,12,12);
    for(let i=0;i<N;i++){
      const m=new THREE.MeshBasicMaterial({color:Math.random()<0.22?MINT:SOFT});
      const mesh=new THREE.Mesh(geo,m);
      const x=(Math.random()-0.5)*90,y=(Math.random()-0.5)*60,z=(Math.random()-0.5)*50;
      mesh.position.set(x,y,z); mesh.userData={bx:x,by:y,ph:Math.random()*6.28};
      group.add(mesh); nodes.push(mesh);
    }
    const pairs=[],lp=[];
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      if(nodes[i].position.distanceTo(nodes[j].position)<20){pairs.push([i,j]);lp.push(0,0,0,0,0,0);}
    }
    const lg=new THREE.BufferGeometry();
    lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));
    const lines=new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0x5EEAD4,transparent:true,opacity:0.12}));
    group.add(lines);
    updater=(t)=>{
      for(const n of nodes){ n.position.x=n.userData.bx+Math.sin(t*0.4+n.userData.ph)*2.2; n.position.y=n.userData.by+Math.cos(t*0.35+n.userData.ph)*2.0; }
      const pos=lg.attributes.position.array;
      for(let k=0;k<pairs.length;k++){const a=nodes[pairs[k][0]].position,b=nodes[pairs[k][1]].position,o=k*6;pos[o]=a.x;pos[o+1]=a.y;pos[o+2]=a.z;pos[o+3]=b.x;pos[o+4]=b.y;pos[o+5]=b.z;}
      lg.attributes.position.needsUpdate=true;
      group.rotation.y=mouseX*0.5+t*0.02; group.rotation.x=mouseY*0.3;
    };
  }

  /* ---------- SCENE: drifting particle field ---------- */
  function buildParticles(){
    const N=innerWidth<768?1200:2600;
    const pos=new Float32Array(N*3), spd=new Float32Array(N);
    for(let i=0;i<N;i++){pos[i*3]=(Math.random()-0.5)*160;pos[i*3+1]=(Math.random()-0.5)*120;pos[i*3+2]=(Math.random()-0.5)*120;spd[i]=0.3+Math.random()*0.8;}
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    const m=new THREE.PointsMaterial({color:0x5EEAD4,size:0.5,transparent:true,opacity:0.55});
    const pts=new THREE.Points(g,m); group.add(pts);
    updater=(t)=>{
      const p=g.attributes.position.array;
      for(let i=0;i<N;i++){ p[i*3+1]+=spd[i]*0.04; if(p[i*3+1]>60)p[i*3+1]=-60; }
      g.attributes.position.needsUpdate=true;
      group.rotation.y=mouseX*0.4+t*0.015; group.rotation.x=mouseY*0.25;
    };
  }

  /* ---------- SCENE: floating geometric grid ---------- */
  function buildGrid(){
    const items=[]; 
    const geos=[new THREE.TetrahedronGeometry(2.4),new THREE.OctahedronGeometry(2.2),new THREE.IcosahedronGeometry(2.2),new THREE.BoxGeometry(3,3,3)];
    const N=innerWidth<768?14:26;
    for(let i=0;i<N;i++){
      const g=geos[i%geos.length];
      const mat=new THREE.MeshBasicMaterial({color:Math.random()<0.3?MINT:SOFT,wireframe:true,transparent:true,opacity:0.5});
      const mesh=new THREE.Mesh(g,mat);
      mesh.position.set((Math.random()-0.5)*100,(Math.random()-0.5)*70,(Math.random()-0.5)*50);
      mesh.userData={rx:(Math.random()-0.5)*0.01,ry:(Math.random()-0.5)*0.01,fy:(Math.random()-0.5)*0.4,ph:Math.random()*6.28,by:mesh.position.y};
      group.add(mesh); items.push(mesh);
    }
    updater=(t)=>{
      for(const m of items){ m.rotation.x+=m.userData.rx; m.rotation.y+=m.userData.ry; m.position.y=m.userData.by+Math.sin(t*0.5+m.userData.ph)*3; }
      group.rotation.y=mouseX*0.35+t*0.01; group.rotation.x=mouseY*0.2;
    };
  }

  /* ---------- SCENE: rotating wireframe globe / constellation ---------- */
  function buildGlobe(){
    const globe=new THREE.Mesh(new THREE.SphereGeometry(26,28,28),new THREE.MeshBasicMaterial({color:0x2a3a5a,wireframe:true,transparent:true,opacity:0.35}));
    group.add(globe);
    // orbiting points
    const N=innerWidth<768?120:240; const pos=new Float32Array(N*3);
    for(let i=0;i<N;i++){const r=30+Math.random()*14,th=Math.random()*6.28,ph=Math.acos(2*Math.random()-1);pos[i*3]=r*Math.sin(ph)*Math.cos(th);pos[i*3+1]=r*Math.sin(ph)*Math.sin(th);pos[i*3+2]=r*Math.cos(ph);}
    const pg=new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0x5EEAD4,size:0.7,transparent:true,opacity:0.7}));
    group.add(pts);
    updater=(t)=>{ globe.rotation.y=t*0.08; pts.rotation.y=-t*0.05; group.rotation.y=mouseX*0.4; group.rotation.x=mouseY*0.25; };
  }

  /* ---------- SCENE: drifting wave mesh ---------- */
  function buildWaves(){
    const SEG=44, SIZE=140;
    const g=new THREE.PlaneGeometry(SIZE,SIZE,SEG,SEG);
    const m=new THREE.MeshBasicMaterial({color:0x2c3c5c,wireframe:true,transparent:true,opacity:0.4});
    const mesh=new THREE.Mesh(g,m); mesh.rotation.x=-Math.PI/2.4; mesh.position.y=-10; group.add(mesh);
    const base=g.attributes.position.array.slice();
    updater=(t)=>{
      const p=g.attributes.position.array;
      for(let i=0;i<p.length;i+=3){ const x=base[i],y=base[i+1]; p[i+2]=Math.sin((x*0.06)+t)*2.4+Math.cos((y*0.06)+t*0.8)*2.4; }
      g.attributes.position.needsUpdate=true;
      group.rotation.z=mouseX*0.1; camera.position.x=mouseX*8;
    };
  }

  const scenes={neural:buildNeural,particles:buildParticles,grid:buildGrid,globe:buildGlobe,waves:buildWaves};
  (scenes[scene3]||buildNeural)();

  let running=true;
  document.addEventListener('visibilitychange',()=>{running=!document.hidden;if(running)loop();});
  function loop(){
    if(!running)return;
    requestAnimationFrame(loop);
    const t=clock.getElapsedTime();
    mouseX+=(tX-mouseX)*0.04; mouseY+=(tY-mouseY)*0.04;
    updater(t);
    renderer.render(scene,camera);
  }
  function resize(){ renderer.setSize(innerWidth,innerHeight); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); }
  addEventListener('resize',resize); resize(); loop();
})();
