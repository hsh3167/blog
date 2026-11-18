'use strict';

// [lengthwise position, half width, sill height, crown height]
const BODY_SECTIONS = {
  f1: [[-2.55,.22,.27,.57],[-1.95,.42,.23,.82],[-1.15,.58,.22,1.00],[-.38,.60,.23,.93],[.4,.48,.23,.78],[1.1,.29,.25,.67],[1.86,.17,.27,.51],[2.54,.11,.24,.42]],
  lmp: [[-2.48,.74,.23,.69],[-2.18,1.05,.22,.90],[-1.13,1.11,.20,.97],[.19,1.00,.20,.92],[1.19,1.09,.21,.87],[2.14,1.05,.22,.64],[2.52,.80,.25,.49]],
  gt: [[-2.37,.83,.25,.75],[-2.16,1.01,.20,1.02],[-1.06,1.08,.22,1.20],[.31,1.01,.23,1.16],[1.39,1.06,.22,1.04],[2.12,1.00,.20,.76],[2.36,.74,.23,.55]],
  muscle: [[-2.41,.88,.29,.92],[-2.19,1.04,.26,1.11],[-.96,1.12,.27,1.13],[.52,1.08,.27,1.17],[1.70,1.10,.29,1.10],[2.38,1.04,.29,.91],[2.49,.9,.31,.81]],
  rally: [[-2.04,.80,.32,.91],[-1.77,1.00,.30,1.11],[-.85,1.02,.31,1.12],[.50,.99,.31,1.18],[1.36,1.03,.32,1.13],[1.98,.88,.36,.86],[2.15,.75,.39,.74]],
  buggy: [[-1.99,.62,.42,.81],[-1.61,.82,.38,.92],[-.61,.88,.39,.78],[.60,.77,.38,.80],[1.33,.67,.41,1.04],[1.82,.50,.44,.87],[2.01,.38,.47,.69]],
};
const CANOPY_SECTIONS = {
  lmp: [[-1.64,.19,.81,.86],[-.89,.45,.83,1.31],[-.25,.52,.84,1.52],[.33,.49,.83,1.44],[.96,.33,.81,1.19],[1.22,.20,.79,.87]],
  gt: [[-1.77,.33,.96,1.04],[-1.08,.66,1.01,1.46],[-.59,.76,1.01,1.67],[.41,.69,1.02,1.65],[.98,.60,.98,1.42],[1.34,.39,.95,1.04]],
  muscle: [[-1.52,.52,1.02,1.12],[-.96,.71,1.05,1.69],[-.49,.78,1.06,1.77],[.36,.78,1.05,1.76],[1.05,.65,1.04,1.48],[1.32,.48,1.04,1.13]],
  rally: [[-1.82,.62,1.01,1.12],[-1.47,.79,1.07,1.80],[-.95,.82,1.08,1.94],[.18,.78,1.10,1.92],[.62,.74,1.12,1.76],[1.2,.57,1.08,1.18]],
};
const WHEEL_DIMENSIONS = {
  f1: [1.02, 1.52, -1.58, .48, .42], lmp: [.96, 1.45, -1.47, .45, .36],
  gt: [.95, 1.33, -1.43, .46, .34], muscle: [1.00, 1.40, -1.43, .49, .36],
  rally: [.96, 1.28, -1.30, .50, .34], buggy: [1.03, 1.30, -1.31, .64, .47],
};

function loftGeometry(sections, rings, shape = 0.67) {
  const positions = [], faces = [];
  const power = x => Math.sign(x) * Math.abs(x) ** shape;
  for (const [z, w, base, crown] of sections) {
    for (let i = 0; i < rings; i++) {
      const angle = i * Math.PI * 2 / rings;
      positions.push(w * power(Math.cos(angle)), (base + crown + (crown - base) * power(Math.sin(angle))) / 2, z);
    }
  }
  for (let row = 0; row < sections.length - 1; row++) {
    for (let i = 0; i < rings; i++) {
      const a = row * rings + i, b = row * rings + (i + 1) % rings;
      faces.push(a, b, a + rings, b, b + rings, a + rings);
    }
  }
  const end = (sections.length - 1) * rings;
  for (let i = 1; i < rings - 1; i++) faces.push(0, i + 1, i, end, end + i, end + i + 1);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  return geometry;
}

function buildCar(vid, ch, detail = 0, hero = false) {
  const group = new THREE.Group();
  group.rotation.order = 'YXZ';
  const body = new THREE.Group();
  group.add(body);

  const paint = Q.carPbr && detail >= 2
    ? new THREE.MeshPhysicalMaterial({ color: ch.color, metalness: .4, roughness: .28, clearcoat: 1, clearcoatRoughness: .14, envMapIntensity: 1.05 })
    : carMat({ color: ch.color, metalness: .35, roughness: .33 });
  const accent = carMat({ color: ch.accent, metalness: .24, roughness: .35 });
  const carbon = carMat({ color: 0x171e26, metalness: .18, roughness: .55 });
  const rubber = carMat({ color: 0x20232b, roughness: .94 });
  const alloy = carMat({ color: 0xaab9cc, metalness: .72, roughness: .29 });
  const disc = carMat({ color: 0x465161, metalness: .72, roughness: .5 });
  const glazing = carMat({ color: 0x19283a, metalness: .58, roughness: .19, envMapIntensity: 1.25 });
  const white = carMat({ color: 0xe3f7ff, emissive: 0x9bdfff, emissiveIntensity: 1.35, roughness: .24 });
  const red = carMat({ color: 0xfa3b43, emissive: 0xd0122a, emissiveIntensity: .52, roughness: .31 });
  const rings = [12, 16, 24][detail];
  const segments = [16, 24, 36][detail];
  const zMin = BODY_SECTIONS[vid][0][0], zMax = BODY_SECTIONS[vid].at(-1)[0];

  const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = body) => {
    const result = new THREE.Mesh(geo, mat);
    result.position.set(x, y, z);
    parent.add(result);
    return result;
  };
  const box = (x,y,z,w,h,d,material) => mesh(new THREE.BoxGeometry(w,h,d), material, x,y,z);
  const shell = (sections, material, x = 0, shape = .67) => mesh(loftGeometry(sections,rings,shape),material,x);
  const rod = (a,b,r,material) => {
    const start = new THREE.Vector3(...a), stop = new THREE.Vector3(...b);
    const middle = start.clone().add(stop).multiplyScalar(.5);
    const part = mesh(new THREE.CylinderGeometry(r,r,start.distanceTo(stop),detail ? 8 : 5),material,middle.x,middle.y,middle.z);
    part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),stop.sub(start).normalize());
    return part;
  };
  const light = (x,y,z,w,h,material,angle = 0) => {
    const lamp = box(x,y,z,w,h,.055,material);
    lamp.rotation.z = angle;
    return lamp;
  };

  const customGT = vid === 'gt' && simulationMode();
  const sections = BODY_SECTIONS[vid];
  if (customGT) buildGTBody({ mesh, box, rod, paint, accent, carbon, glazing, alloy, white, red, detail });
  else shell(sections, paint, 0, vid === 'muscle' ? .48 : .70);
  if (!customGT && CANOPY_SECTIONS[vid]) {
    const glass = CANOPY_SECTIONS[vid];
    shell(glass, glazing, 0, vid === 'lmp' ? .84 : .46);
    shell(glass.slice(1,-1).map(([z,w,base,crown]) => [z,w * .68,crown - .05,crown + .018]), paint);
    for (const s of [-1,1]) {
      const stalk = [[s * .65,1.10,.65],[s * 1.12,1.23,.58]];
      rod(...stalk,.028,carbon);
      box(s * 1.13,1.22,.58,.21,.096,.20,accent);
    }
  }

  const openWheel = vid === 'f1' || vid === 'buggy';
  if (openWheel) {
    const realHelmet = simulationMode() || hero;
    if (realHelmet) {
      const helmet = mesh(new THREE.SphereGeometry(.265, segments, 14), accent,0,1.25,-.38);
      helmet.scale.set(1,.94,1.12);
      const visor = mesh(new THREE.SphereGeometry(.263,segments,9,0,Math.PI,Math.PI * .29,Math.PI * .29),glazing,0,1.27,-.36);
      visor.scale.set(1,.97,1.18);
      box(0,.99,-.50,.41,.32,.42,carbon);
    } else {
      const driver = buildDriver(ch,vid === 'buggy');
      driver.position.set(0,.69,-.4); driver.scale.setScalar(.72); body.add(driver);
    }
  }

  if (vid === 'f1') {
    for (const s of [-1,1]) {
      shell([[-1.80,.20,.27,.46],[-1.10,.30,.23,.68],[-.25,.32,.26,.68],[.25,.18,.28,.48]],paint,s*.66);
      box(s*.68,.46,.27,.34,.16,.056,carbon);
      box(s*1.10,.28,2.21,.055,.29,.72,carbon);
      box(s*.93,1.18,-2.26,.06,.53,.64,accent);
      rod([s*.47,.32,1.25],[s*1.01,.46,1.52],.037,carbon);
      rod([s*.32,.55,1.78],[s*1.03,.40,1.52],.029,alloy);
      rod([s*.30,1.13,.13],[s*.29,1.27,-.49],.038,carbon);
      if (detail) rod([s*.31,1.26,-.49],[0,1.34,.34],.030,carbon);
    }
    box(0,.25,2.28,2.24,.066,.61,accent);
    box(0,.38,2.05,2.05,.056,.31,carbon);
    box(0,1.26,-2.25,1.90,.09,.54,paint);
    box(0,1.37,-2.29,1.81,.065,.37,accent);
    box(0,.86,-2.18,.08,.75,.22,carbon);
    light(0,.51,-2.56,.22,.071,red);
  } else if (vid === 'buggy') {
    for (const s of [-1,1]) {
      rod([s*.78,.66,1.15],[s*.59,1.90,.26],.064,alloy);
      rod([s*.59,1.90,.26],[s*.62,1.87,-.85],.064,accent);
      rod([s*.62,1.87,-.85],[s*.81,.76,-1.44],.064,alloy);
      rod([s*.85,.55,-1.42],[s*.80,.62,1.16],.048,carbon);
      rod([s*.13,.93,1.11],[s*.94,.53,1.33],.045,alloy);
      light(s*.41,.85,1.91,.27,.14,white);
      light(s*.49,.73,-1.87,.27,.082,red);
    }
    rod([-.60,1.9,.27],[.60,1.9,.27],.065,accent);
    rod([-.62,1.87,-.85],[.62,1.87,-.85],.065,alloy);
    box(0,.45,1.94,1.56,.13,.22,carbon);
  } else if (!customGT) {
    box(0,.286,zMax-.11,1.91,.078,.38,carbon);
    box(0,.47,zMax-.24,.86,.17,.32,carbon);
    box(0,.30,zMin+.16,1.83,.098,.42,carbon);
    for (const s of [-1,1]) {
      const mask = light(s*.69,.67,zMax-.10,.49,.20,carbon,s*.14); mask.rotation.y = s*.18;
      light(s*.69,.70,zMax-.07,vid === 'muscle' ? .30 : .45,.082,white,s*.14).rotation.y = s*.18;
      light(s*.70,.766,zMin+.09,.48,.066,red,-s*.13).rotation.y = -s*.13;
      light(s*.62,.67,zMin+.075,.20,.037,red);
      box(s*1.035,.355,-.08,.081,.114,2.23,carbon);
      if (detail) {
        for (let i=0;i<3;i++) box(s*.72,.312,zMin+.16+i*.083,.082,.143,.055,carbon);
        const pipe = mesh(new THREE.CylinderGeometry(.071,.071,.12,12),alloy,s*.65,.44,zMin+.03);
        pipe.rotation.x = Math.PI/2;
      }
    }
    if (vid === 'lmp' || vid === 'gt') {
      const wingY = vid === 'lmp' ? 1.27 : 1.36;
      box(0,wingY,zMin+.23,2.1,.085,.43,accent);
      box(0,wingY+.066,zMin+.07,2.06,.04,.10,carbon);
      for (const s of [-1,1]) {
        rod([s*.60,.79,zMin+.38],[s*.65,wingY,zMin+.23],.04,carbon);
        box(s*1.04,wingY,zMin+.22,.06,.27,.53,carbon);
      }
    } else if (vid === 'rally') {
      box(0,1.81,-1.49,1.72,.08,.48,accent);
      box(0,1.94,-.24,.44,.108,.23,carbon);
      for (const s of [-1,1]) box(s*.92,.31,-1.75,.23,.46,.07,carbon);
    } else {
      shell([[.62,.19,1.03,1.18],[1.10,.24,1.03,1.34],[1.58,.20,1.00,1.26],[1.88,.16,.94,1.05]],carbon);
      for (const s of [-1,1]) light(s*.45,.69,zMax-.055,.13,.11,white);
    }
  }

  if (detail >= 1 && !customGT) {
    const layers = vid === 'f1' ? [0] : [-.15,.15];
    for (const center of layers) {
      const positions = [], indices = [];
      for (const [z,w,base,crown] of sections) {
        if (CANOPY_SECTIONS[vid] && z > -1.5 && z < 1.25) continue;
        const first = positions.length / 3;
        positions.push(center-.048,crown+.016,z,center+.048,crown+.016,z);
        if (first >= 2 && z - positions[(first-2)*3+2] < 1.2) indices.push(first-2,first,first-1,first-1,first,first+1);
      }
      const stripe = new THREE.BufferGeometry();
      stripe.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      stripe.setIndex(indices); stripe.computeVertexNormals();
      mesh(stripe, accent);
    }
  }

  const [halfTrack, frontZ, rearZ, radius, width] = WHEEL_DIMENSIONS[vid];
  const tyreProfile = [
    [.53,-.50],[.81,-.50],[.94,-.46],[.994,-.31],[1,.26],[.96,.43],[.88,.50],[.57,.50],
  ];
  const wheels = [];
  for (const axle of [frontZ,rearZ]) {
    for (const side of [-1,1]) {
      const r = axle === rearZ && openWheel ? radius * 1.07 : radius;
      const steer = new THREE.Group(), spin = new THREE.Group();
      steer.position.set(side * halfTrack,r,axle);
      body.add(steer); steer.add(spin);
      mesh(new THREE.LatheGeometry(tyreProfile.map(([rad,edge])=>new THREE.Vector2(rad*r,edge*width)),segments),rubber,0,0,0,spin).rotation.z = Math.PI/2;
      const face = side * width *.522;
      const cyl = (rad,thick,pos,mat) => {
        const part = mesh(new THREE.CylinderGeometry(rad,rad,thick,segments),mat,pos,0,0,spin);
        part.rotation.z = Math.PI/2; return part;
      };
      cyl(r*.58,.038,face,disc);
      cyl(r*.23,.047,face+side*.025,alloy);
      mesh(new THREE.TorusGeometry(r*.606,.024,5,segments),alloy,face,0,0,spin).rotation.y = Math.PI/2;
      const slots = detail ? 7 : 4;
      for (let i=0;i<slots;i++) {
        const spoke = mesh(new THREE.BoxGeometry(.033,r*.40,customGT ? .026 : .045),alloy,face+side*.018,0,0,spin);
        const angle = i/slots * Math.PI * 2;
        spoke.position.y = Math.cos(angle)*r*.37; spoke.position.z = Math.sin(angle)*r*.37; spoke.rotation.x = angle;
        if (customGT && detail) {
          const split = mesh(spoke.geometry,alloy,face+side*.018,0,0,spin);
          split.position.y = Math.cos(angle+.12)*r*.37; split.position.z = Math.sin(angle+.12)*r*.37;
          split.rotation.x = angle+.28;
        }
      }
      if (detail >= 2) {
        const caliper = mesh(new THREE.BoxGeometry(.065,r*.27,r*.25),red,face-side*.013,r*.15,-r*.34,steer);
        caliper.userData.keep = true;
      }
      if (detail >= 2 && (vid === 'rally' || vid === 'buggy')) {
        for (let i=0;i<14;i++) for (const lane of [-1,1]) {
          const angle = (i + .16 * lane) / 14 * Math.PI * 2;
          const lug = mesh(new THREE.BoxGeometry(width*.43,.032,.078),rubber,lane*width*.22,Math.cos(angle)*r,Math.sin(angle)*r,spin);
          lug.rotation.x = angle;
          lug.rotation.y = lane*.27;
        }
      }
      wheels.push({ steer, spin, front: axle === frontZ, radius:r });
    }
  }
  mergeCar(body,wheels,paint);

  const flame = mesh(new THREE.ConeGeometry(.37,1.65,10),new THREE.MeshBasicMaterial({
    color:0xff9d2b,transparent:true,opacity:.84,depthWrite:false,blending:THREE.AdditiveBlending,
  }),0,.58,zMin-.72,group);
  flame.rotation.x = -Math.PI/2; flame.visible = false;
  const shadowBlob = mesh(new THREE.PlaneGeometry(2.85,5.4),new THREE.MeshBasicMaterial({map:TEX.blob,transparent:true,depthWrite:false,opacity:.59}),0,.04,0,group);
  shadowBlob.rotation.x = -Math.PI/2; shadowBlob.visible = !Q.shadow && !hero;
  group.traverse(node => { if (node.isMesh && !node.material.transparent) node.castShadow = Q.shadow > 0; });
  return { group, body, wheels, sparks:[], flame, shadowBlob, paint, brakeLight:red, baseColor:new THREE.Color(ch.color) };
}
