'use strict';

function circuitTextures() {
  const tile = (w, h, draw) => {
    const texture = canvasTex(w, h, draw);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = Q === QUALITY.low ? 2 : 8;
    return texture;
  };
  const asphalt = tile(512, 512, (g, w, h) => {
    const random = mulberry32(920);
    const raster = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const base = 168 + 13 * random() + 9 * Math.sin(x / w * TAU) * Math.cos(y / h * TAU);
      const grit = random(), v = base + (grit < 0.11 ? -42 : grit > 0.89 ? 37 : (random() - 0.5) * 26);
      const i = (y * w + x) * 4;
      raster.data[i] = v; raster.data[i + 1] = v + 1; raster.data[i + 2] = v + 3; raster.data[i + 3] = 255;
    }
    g.putImageData(raster, 0, 0);
    g.strokeStyle = '#282a2f28';
    g.lineWidth = 0.7;
    for (let k = 0; k < 60; k++) {
      const y = random() * h, x = random() * w;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1 + random() * 7, y - 3); g.stroke();
    }
  });
  const rail = tile(256, 128, (g, w, h) => {
    const gradients = g.createLinearGradient(0, 0, 0, h);
    for (const [offset, color] of [[0,'#f0f2f4'],[.08,'#707b85'],[.15,'#b4bac0'],[.30,'#e2e7eb'],[.41,'#65717b'],[.49,'#9ca6af'],[.67,'#d0d6d9'],[.79,'#4b535b'],[.8,'#9b9c97'],[1,'#4f514f']]) gradients.addColorStop(offset,color);
    g.fillStyle = gradients; g.fillRect(0, 0, w, h);
    g.fillStyle = '#151d2770'; g.fillRect(w * 0.48, 0, w * 0.032, h);
    for (const y of [h * 0.24, h * 0.58]) {
      for (const x of [w * .08, w * .44, w * .55, w * .91]) {
        g.fillStyle = '#4a535b'; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
        g.fillStyle = '#c8cdd2'; g.beginPath(); g.arc(x, y - 0.7, 1.5, 0, TAU); g.fill();
      }
    }
  });
  const gravel = tile(128, 128, (g, w, h) => {
    const random = mulberry32(279);
    g.fillStyle = '#9e9481'; g.fillRect(0,0,w,h);
    const swatches = ['#776f63','#918679','#b5a894','#c4b8a3','#a79884'];
    for (let i=0; i<2900; i++) {
      g.fillStyle = swatches[Math.floor(random() * swatches.length)];
      g.fillRect(random() * w,random() * h,0.7 + random() * 2,0.7 + random() * 2);
    }
  });
  return { asphalt, rail, gravel };
}

function circuitCorners(tr) {
  const candidates = Array.from(tr.curvature, (curvature, idx) => ({ idx, curvature }));
  candidates.sort((a,b) => Math.abs(b.curvature) - Math.abs(a.curvature));
  const corners = [], separation = Math.round(155 / tr.sp);
  for (const candidate of candidates) {
    if (corners.length >= 7 || Math.abs(candidate.curvature) < .010) break;
    if (corners.some(c => Math.min(Math.abs(c.idx - candidate.idx), tr.N - Math.abs(c.idx - candidate.idx)) < separation)) continue;
    const side = Math.sign(candidate.curvature);
    let entry = candidate.idx;
    for (let i=0; i<Math.ceil(95 / tr.sp); i++) {
      const previous = wrapIndex(entry-1,tr.N);
      if (tr.curvature[previous]*side < Math.max(.0045, Math.abs(candidate.curvature)*.38)) break;
      entry=previous;
    }
    corners.push({ ...candidate, side, entry });
  }
  return corners;
}

function circuitRoad(tr, theme, map) {
  const geometry = new THREE.BufferGeometry();
  const position = [], uv = [], color = [], index = [];
  const offsets = Q === QUALITY.high ? [-1,-.92,-.72,-.50,-.31,-.19,-.07,.07,.19,.31,.50,.72,.92,1] : [-1,-.76,-.48,-.23,0,.23,.48,.76,1];
  const row = offsets.length;
  const tone = new THREE.Color(theme.road).multiplyScalar(1.18);
  const routeLength = tr.S[tr.N-1] + tr.P[tr.N-1].distanceTo(tr.P[0]);

  for (let k=0; k<=tr.N; k++) {
    const i=k%tr.N, distance=k===tr.N ? routeLength : tr.S[i];
    const apex = clamp(-tr.curvature[i] * 53,-.49,.49);
    const section = .97 + .035 * Math.cos(distance * .083) + .025 * Math.sin(distance * .19);
    for (const off of offsets) {
      const lateral = off * tr.halfW;
      position.push(tr.P[i].x+tr.R[i].x*lateral,tr.Y[i],tr.P[i].z+tr.R[i].z*lateral);
      uv.push(lateral / 6.8,distance / 6.8);
      const trackLine = Math.exp(-((off - apex) ** 2) / .029);
      const tyre = Math.exp(-((off - apex - .08) ** 2) / .0025) + Math.exp(-((off - apex + .08) ** 2) / .0025);
      const brightness = section * (1 - .081 * trackLine - .07 * tyre - .095 * smooth(.65,1,Math.abs(off)));
      color.push(tone.r * brightness,tone.g * brightness,tone.b * brightness);
    }
    if (k===tr.N) break;
    for (let j=0;j<row-1;j++) {
      const a=k*row+j, b=a+1, c=a+row, d=c+1;
      index.push(a,b,c,b,d,c);
    }
  }
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));
  geometry.setIndex(index); geometry.computeVertexNormals();
  const mat=std(0xffffff,{map,vertexColors:true,roughness:.92});
  const mesh=new THREE.Mesh(geometry,mat);
  mesh.receiveShadow=true;
  scene.add(mesh);
}

function circuitBand(tr, spans, material, height, repeat = 6) {
  const positions=[], uv=[];
  for (const { start, count, a, b } of spans) {
    for (let j=0;j<count;j++) {
      const p=wrapIndex(start+j,tr.N), q=(p+1)%tr.N;
      const end = Math.min(1,count-j);
      for (const [off,t] of [[a,0],[b,0],[a,end],[b,0],[b,end],[a,end]]) {
        const x = lerp(tr.P[p].x + tr.R[p].x * off, tr.P[q].x + tr.R[q].x * off, t);
        const z = lerp(tr.P[p].z + tr.R[p].z * off, tr.P[q].z + tr.R[q].z * off, t);
        positions.push(x,lerp(tr.Y[p],tr.Y[q],t)+height,z);
        uv.push(off/repeat,(j+t)*tr.sp/repeat);
      }
    }
  }
  if (!positions.length) { material.dispose(); return; }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);
  mesh.receiveShadow=true;
  scene.add(mesh);
}

function buildCircuitSurfaces(tr, theme) {
  const assets=circuitTextures();
  const corners = circuitCorners(tr);
  circuitRoad(tr,theme,assets.asphalt);
  const curb = canvasTex(128,256,(g,w,h)=>{
    for (let i=0;i<6;i++) {
      const y=i*h/6;
      g.fillStyle='#'+new THREE.Color(i%2 ? theme.curbB : theme.curbA).getHexString();
      g.fillRect(0,y,w,h/6);
      g.fillStyle='#171a2045'; g.fillRect(0,y,w,1);
      for (let j=0;j<3;j++) g.fillRect(8+j*5,y+4,1,h/6-7);
    }
    const bevel=g.createLinearGradient(0,0,w,0);
    bevel.addColorStop(0,'#10142165'); bevel.addColorStop(.10,'#fff3'); bevel.addColorStop(.44,'#fff0'); bevel.addColorStop(1,'#18213865');
    g.fillStyle=bevel;g.fillRect(0,0,w,h);
  });
  curb.wrapT=THREE.RepeatWrapping;
  const curbMaterial=std(0xffffff,{map:curb,roughness:.77});
  const laneMaterial=std(0xf5f5eb,{roughness:.74,emissive:theme.night?0x55585b:0x0a0a09});
  for (const side of [-1,1]) {
    const edge=side*tr.halfW;
    const band=(a,b)=>[Math.min(a,b),Math.max(a,b)];
    scene.add(ribbon(tr,...band(edge,edge+side*1.8),.032,curbMaterial,12));
    scene.add(ribbon(tr,...band(edge-side*.44,edge-side*.12),.018,laneMaterial,10));
  }
  if (arcadeMode() && !/monza|spa/.test(tr.def.theme)) {
    scene.add(ribbon(tr,-.15,.15,.016,std(0xefeee8,{map:TEX.dash,transparent:true,emissive:theme.night?0x444466:0x000000}),18));
  }

  const gutter = corners.map(c => {
    const a=c.side*(tr.halfW+1.8), b=c.side*(tr.wallD-.44);
    return { start:c.entry, count:Math.round(68/tr.sp),a:Math.min(a,b),b:Math.max(a,b) };
  });
  circuitBand(tr,gutter,std(0xffffff,{map:assets.gravel,roughness:1}),.006);
  const painted = gutter.map(c => {
    return c.b < 0 ? {...c,a:c.b-1.23} : {...c,b:c.a+1.23};
  });
  const accent = tr.def.theme==='desert' ? 0x964b33 : theme.night ? 0x373c7c : 0x195f63;
  circuitBand(tr,painted,std(accent,{roughness:.87,emissive:theme.night?0x14151b:0x000000}),.022);

  const railMaterial=std(0xeeeeee,{map:assets.rail,roughness:.54,metalness:.26,side:THREE.DoubleSide});
  const fenceMaterial=Q.fence ? std(0xa8b2b9,{map:TEX.fence,transparent:true,alphaTest:.34,side:THREE.DoubleSide,roughness:.73}) : null;
  for (const side of [-1,1]) {
    scene.add(wallMesh(tr,side*tr.wallD,0,1.52,railMaterial,5.4));
    if (fenceMaterial) {
      const fence=wallMesh(tr,side*(tr.wallD+.30),1.51,2.40,fenceMaterial,4.0);
      fence.castShadow=false; scene.add(fence); scene.userData.optionalScenery.push(fence);
    }
  }
  return corners;
}

function gridSlot(tr, i) {
  const row = Math.floor(i / 2), col = i % 2;
  return {
    idx: wrapIndex(tr.N - Math.round(12 / tr.sp) - row * Math.round(14 / tr.sp), tr.N),
    lat: (col ? 1 : -1) * tr.halfW * .42 + (row % 2 ? 1.5 : -1.5),
  };
}

function addGridPaint(tr) {
  const spans = [];
  for (let i=0;i<8;i++) {
    const {idx,lat}=gridSlot(tr,i);
    const start=idx-Math.round(4.2/tr.sp);
    const count=Math.max(3,Math.round(7.4/tr.sp));
    for (const side of [-1,1]) {
      const a=lat+side*2.12;
      spans.push({start,count,a:a-.105,b:a+.105});
    }
    spans.push({start,count:0.24/tr.sp,a:lat-2.20,b:lat+2.20});
  }
  circuitBand(tr,spans,std(0xf9f6e6,{roughness:.86,emissive:0x161616}),.033,16);
}

function addBrakingBoards(tr, corners) {
  const pillar = [], boardGeo = new THREE.PlaneGeometry(2.05,1.20);
  boardGeo.translate(0,2.48,0);
  for (const distance of [150,100,50]) {
    const boards=[];
    for (const corner of corners) {
      const idx=wrapIndex(corner.entry-Math.round(distance/tr.sp),tr.N);
      // Prefer the outer shoulder; keep all boards outside the collision rail.
      const side=[corner.side,-corner.side].find(s=>{
        const lat=s*(tr.wallD+1.13), p=tr.P[idx], r=tr.R[idx];
        return nearest(tr,p.x+r.x*lat,p.z+r.z*lat,2).d > tr.wallD+.18;
      });
      if (!side) continue;
      const p=tr.P[idx], r=tr.R[idx], lat=side*(tr.wallD+1.13);
      const spot={x:p.x+r.x*lat,z:p.z+r.z*lat,y:tr.Y[idx],ry:tr.H[idx]+Math.PI,s:1};
      if (pillar.some(x=>Math.hypot(spot.x-x.x,spot.z-x.z)<5)) continue;
      boards.push(spot); pillar.push(spot);
    }
    if (!boards.length) continue;
    const texture=canvasTex(192,112,(g,w,h)=>{
      g.fillStyle='#0b1622';g.fillRect(0,0,w,h);
      g.fillStyle='#f5f2dd';g.fillRect(4,4,w-8,h-8);
      g.fillStyle=distance===50?'#a62c26':'#1c3444';g.fillRect(4,h-16,w-8,12);
      g.fillStyle='#0e151a'; g.font='900 72px Bahnschrift, Arial, sans-serif';
      g.textAlign='center';g.textBaseline='middle';g.fillText(String(distance),w/2,47);
    });
    instanced(boardGeo,new THREE.MeshBasicMaterial({map:texture}),boards,false);
  }
  if (pillar.length) {
    const posts=new THREE.BoxGeometry(.11,2.6,.13);
    posts.translate(0,1.29,0);
    instanced(posts,std(0x4a5862,{roughness:.72}),pillar,false);
  }
}

function addCircuitScenery(tr) {
  const random = mulberry32(732 + tr.N);
  const spots = [];
  for (let meters=30; meters<tr.len; meters+=31) {
    const idx = Math.round(meters / tr.sp) % tr.N;
    const side = random() < .5 ? -1 : 1;
    const lat = side * (tr.wallD + 28 + random() * 36), p = tr.P[idx], r = tr.R[idx];
    const x = p.x + r.x * lat, z = p.z + r.z * lat;
    if (nearest(tr,x,z,2).d < tr.wallD + 10) continue;
    spots.push({x,z,y:tr.terrainH(x,z),s:0.80+random()*.63,ry:random()*TAU});
  }
  if (tr.def.theme === 'desert') {
    const rock = new THREE.DodecahedronGeometry(2.8,0);
    rock.scale(1.2,.56,.94); rock.translate(0,1,0);
    instanced(rock,std(0x84684c,{roughness:.98}),spots,false);
  } else if (tr.def.theme === 'castle') {
    const pole = new THREE.CylinderGeometry(.17,.27,5.6,6);
    pole.translate(0,2.8,0);
    const light = new THREE.BoxGeometry(1.05,.27,.43);
    light.translate(0,5.59,0);
    instanced(pole,std(0x54647b,{roughness:.78}),spots,false);
    instanced(light,new THREE.MeshBasicMaterial({color:0xd7e9ff}),spots,false);
  } else {
    const trunk=new THREE.CylinderGeometry(.24,.36,3.5,6); trunk.translate(0,1.70,0);
    const canopy=new THREE.ConeGeometry(2.37,6.4,8); canopy.translate(0,4.4,0);
    const top=new THREE.ConeGeometry(1.68,4.2,8); top.translate(0,6.5,0);
    instanced(trunk,std(0x654b36,{roughness:.97}),spots,false);
    instanced(mergeGeo([canopy,top]),std(0x3b6241,{roughness:.93}),spots,false);
  }
}

function addGarageFacade(group, location, night) {
  const side=Math.sign(location.lat);
  const photo=canvasTex(768,112,(g,w,h)=>{
    g.fillStyle='#1b242c';g.fillRect(0,0,w,h);
    for(let i=0;i<7;i++){
      const x=i*w/7+5, bay=w/7-10;
      g.fillStyle='#53616a';g.fillRect(x,8,bay,h-10);
      g.fillStyle='#292f37';
      for(let y=36;y<h;y+=7)g.fillRect(x,y,bay,2);
      g.fillStyle='#c4d2d5';g.fillRect(x+3,10,bay-6,17);
      g.font='700 14px Arial';g.fillStyle='#14202a';g.textAlign='left';
      g.fillText('PIT '+String(i+1).padStart(2,'0'),x+7,23);
    }
    g.fillStyle='#baac4b';g.fillRect(1,h-3,w-2,3);
  });
  const face=new THREE.Mesh(new THREE.PlaneGeometry(54,3.1),std(0xffffff,{map:photo,roughness:.74,emissive:night?0x34343d:0x000000,emissiveMap:photo}));
  face.position.set(side*6.02,1.57,0); face.rotation.y=side*Math.PI/2; group.add(face);
  const canopy=new THREE.Mesh(new THREE.BoxGeometry(1.25,.18,55),std(0x465a69,{roughness:.48,metalness:.2}));
  canopy.position.set(side*6.50,3.13,0); group.add(canopy);
}
