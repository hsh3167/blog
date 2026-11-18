'use strict';

// Longitudinal stations: z, fender half-width, center height, fender crown, shoulder.
const GT_STATIONS = [
  [-2.36,.91,.70,.77,.62],[-2.24,1.02,.85,.89,.72],[-2.05,1.10,.93,.97,.81],
  [-1.68,1.14,.98,1.05,.89],[-1.40,1.15,1.00,1.07,.94],[-1.05,1.12,1.02,1.04,.86],
  [-.63,1.00,1.01,1.00,.81],[-.15,.98,.99,.96,.78],[.35,.99,.96,.94,.76],
  [.69,1.05,.91,.95,.80],[1.04,1.11,.86,1.00,.86],[1.35,1.13,.80,1.02,.92],
  [1.64,1.10,.76,.92,.83],[1.94,1.06,.74,.80,.72],[2.19,1.00,.67,.69,.60],[2.36,.87,.56,.58,.46],
];

function buildGTBody({ mesh, box, rod, paint, accent, carbon, glazing, alloy, white, red, detail }) {
  const [, frontAxle, rearAxle, radius] = WHEEL_DIMENSIONS.gt;
  const nose = GT_STATIONS.at(-1)[0], tail = GT_STATIONS[0][0];
  const sill = .235, opening = radius + .075;
  const black = carMat({color:0x0c1016, roughness:.88});
  const hardware = carMat({color:0x61717e, roughness:.46, metalness:.55});

  function section(z) {
    const index = GT_STATIONS.findIndex(row => row[0] >= z);
    const end = index < 0 ? GT_STATIONS.length - 1 : index;
    const next = GT_STATIONS[end], prev = GT_STATIONS[Math.max(0,end - 1)];
    const t = prev === next ? 0 : clamp((z - prev[0]) / (next[0] - prev[0]), 0, 1);
    const [width, center, fender, shoulder] = prev.slice(1).map((value, i) => lerp(value, next[i + 1], t));
    const nearestAxle = Math.min(Math.abs(z - frontAxle), Math.abs(z - rearAxle));
    const arch = Math.sqrt(Math.max(0, 1 - (nearestAxle / opening) ** 2));
    const bottom = sill + (radius * 2 + .028 - sill) * arch;
    const edge = Math.max(shoulder, bottom + .038);
    return [
      [0,center,z],[width*.32,center+.018,z],[width*.60,lerp(center,fender,.43),z],
      [width*.82,Math.max(fender,edge+.035),z],[width*.96,edge+.025,z],
      [width,edge,z],[width*.987,lerp(edge,bottom,.45),z],[width*.96,bottom,z],
    ];
  }

  // Width is the second grid axis. Mirror the normals when building the left side.
  function surface(rows, material, flip = false) {
    const columns = rows[0].length;
    const vertices = rows.flat(2), faces = [];
    for (let row = 0; row < rows.length - 1; row++) {
      for (let col = 0; col < columns - 1; col++) {
        const a = row * columns + col, b = a + columns;
        if (flip) faces.push(a,a+1,b,b,a+1,b+1);
        else faces.push(a,b,a+1,b,b+1,a+1);
      }
    }
    addSurface(vertices, faces, material);
  }
  function addSurface(vertices, faces, material) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometry.setIndex(faces);
    geometry.computeVertexNormals();
    mesh(geometry,material);
  }
  function panel(points, normal, material) {
    const [a,b,c] = points.map(point => new THREE.Vector3(...point));
    const rotate = b.sub(a).cross(c.sub(a)).dot(new THREE.Vector3(...normal)) < 0;
    const triangles = [];
    for (let i = 1; i < points.length - 1; i++) triangles.push(0,rotate ? i+1 : i,rotate ? i : i+1);
    addSurface(points.flat(),triangles,material);
  }

  function sidePoint(z,y,offset = .012) {
    const edge = section(z).slice(5);
    const index = edge.findIndex(point=>point[1] <= y);
    const end = index < 0 ? edge.length-1 : index;
    const a = edge[Math.max(0,end-1)], b = edge[end];
    const t = a[1] === b[1] ? 0 : clamp((a[1]-y)/(a[1]-b[1]),0,1);
    return [lerp(a[0],b[0],t)+offset,y,z];
  }
  function hoodPoint(z,x,offset = .009) {
    const top = section(z).slice(0,5);
    const i = top.findIndex(point=>point[0] >= x);
    const a = top[Math.max(0,i-1)], b = top[i < 0 ? top.length-1 : i];
    const t = a[0] === b[0] ? 0 : clamp((x-a[0])/(b[0]-a[0]),0,1);
    return [x,lerp(a[1],b[1],t)+offset,z];
  }

  const zs = new Set(GT_STATIONS.map(row=>row[0]));
  for (const axle of [frontAxle,rearAxle]) {
    const segments = detail === 2 ? 22 : detail === 1 ? 14 : 10;
    for (let i=0;i<=segments;i++) zs.add(axle - opening * Math.cos(Math.PI * i / segments));
  }
  const rows = Array.from(zs).sort((a,b)=>a-b).map(section);
  const mirror = (points,side) => points.map(([x,y,z])=>[x*side,y,z]);
  for (const side of [-1,1]) {
    surface(rows.map(row=>mirror(row,side)),paint,side < 0);
    surface(rows.map(row => {
      const [x,y,z] = row.at(-1);
      return [[x*side,y,z],[.70*side,y-.028,z]];
    }),black,side < 0);
  }
  for (const [row,sign] of [[rows[0],-1],[rows.at(-1),1]]) {
    const edge = row.concat(mirror(row.slice(1),-1).reverse());
    panel(edge,[0,0,sign],paint);
  }

  const glass = [
    [-1.72,.78,.961,.47,1.015],[-1.24,.73,1.003,.535,1.285],
    [-.66,.67,1.013,.505,1.49],[-.10,.666,1.002,.52,1.516],
    [.37,.654,.985,.51,1.473],[.70,.675,.938,.49,1.36],[1.02,.694,.874,.49,1.14],[1.26,.715,.824,.54,.885],
  ];
  const canopy = ([z,x,low,roof,high]) => [[0,high+.027,z],[roof*.72,high+.017,z],[roof,high,z],[x,low,z]];
  const canopyRows = glass.map(canopy);
  for (const side of [-1,1]) {
    surface(canopyRows.map(row=>mirror(row,side)),glazing,side<0);
    const roofPaint = canopyRows.slice(2,6).map(row=>mirror(row.slice(0,3).map(([x,y,z])=>[x,y+.011,z]),side));
    surface(roofPaint,paint,side<0);
    if (detail) {
      for (const index of [1,4,6]) {
        const [z,x,low,roof,high] = glass[index];
        const lean = index < 3 ? .16 : index === 4 ? -.04 : -.16;
        const topZ = z + lean;
        const top = glass[Math.max(0,index-1)];
        const next = glass[Math.min(glass.length-1,index+1)];
        const slope = (next[4] - top[4]) / (next[0] - top[0]);
        const width = index === 4 ? .035 : .071;
        panel([[side*(roof+.012),high+lean*slope,topZ-width],[side*(roof+.012),high+lean*slope,topZ+width],
          [side*(x+.014),low+.018,z+width],[side*(x+.014),low+.018,z-width]],[side,0,0],paint);
      }
      rod([side*.67,1.035,.64],[side*1.045,1.105,.65],.019,carbon);
      const mirrorHousing = box(side*1.037,1.106,.652,.23,.085,.145,paint);
      mirrorHousing.rotation.y = -side * .19;
      box(side*1.046,1.108,.574,.16,.054,.013,hardware);
    }
  }

  // Radiator openings and lamps follow the taper of the bumper.
  const noseFace = (points, material) => panel(points.map(([x,y,z = 0])=>[x,y,nose+z]),[0,0,1],material);
  noseFace([[-.72,.30,.035],[.72,.30,.035],[.63,.435,.023],[.45,.462,.019],[-.45,.462,.019],[-.63,.435,.023]],black);
  box(0,.240,2.24,1.87,.057,.35,carbon);
  if (detail) {
    for (let i=-4;i<=4;i++) box(i*.105,.363,nose+.019,.013,.122,.032,hardware);
    box(0,.361,nose+.038,1.10,.019,.019,hardware);
  }

  const rearFace = (points, material) => panel(points.map(([x,y,z = 0])=>[x,y,tail+z]),[0,0,-1],material);
  rearFace([[-.86,.415,-.027],[.86,.415,-.027],[.81,.622,-.025],[-.81,.622,-.025]],black);
  rearFace([[-.84,.267,-.044],[.84,.267,-.044],[.74,.416,-.033],[-.74,.416,-.033]],carbon);
  const fins = detail ? [-.68,-.45,-.22,0,.22,.45,.68] : [-.61,-.29,.29,.61];
  for (const x of fins) {
    const fin = box(x,.300,-2.245,.031,.144,.375,carbon);
    fin.rotation.x = -.19;
  }
  rearFace([[-.28,.474,-.046],[.28,.474,-.046],[.28,.556,-.045],[-.28,.556,-.045]],hardware);
  const rainLamp = box(0,.302,-2.414,.142,.041,.024,red);
  rainLamp.rotation.x = -.19;

  for (const side of [-1,1]) {
    const front = (points,mat) => panel(mirror(points,side),[0,1,1],mat);
    front([[.43,.595,2.392],[.93,.618,2.214],[1.00,.676,2.127],[.80,.737,2.161],[.49,.680,2.335]],black);
    front([[.47,.614,2.398],[.92,.633,2.220],[.968,.672,2.145],[.87,.694,2.180],[.65,.653,2.308],[.49,.643,2.372]],white);

    const rear = (points,mat) => rearFace(mirror(points,side),mat);
    rear([[.28,.679,-.026],[.79,.682,-.027],[.938,.732,.012],[.81,.749,-.006],[.36,.721,-.028]],black);
    rear([[.316,.685,-.033],[.77,.689,-.036],[.916,.735,-.001],[.81,.732,-.016],[.35,.711,-.034]],red);
    const sillBlade = box(side*.977,.244,-.085,.147,.075,1.74,carbon);
    sillBlade.rotation.y = side*.02;

    const inlet = [
      [sidePoint(.36,.404),sidePoint(.36,.525)],
      [sidePoint(.48,.378),sidePoint(.48,.627)],
      [sidePoint(.61,.386),sidePoint(.61,.641)],
      [sidePoint(.72,.426),sidePoint(.72,.580)],
    ];
    surface(inlet.map(row=>mirror(row,side)),black,side > 0);
    if (detail) {
      for (let i=0;i<3;i++) {
        const z = .48 + i*.08;
        panel(mirror([sidePoint(z,.412,.019),sidePoint(z+.020,.412,.019),
          sidePoint(z-.030,.607,.019),sidePoint(z-.052,.607,.019)],side),[side,0,0],hardware);
      }
      const rearInlet = [[-.90,.556,.65],[-.79,.542,.710],[-.66,.552,.702],[-.53,.574,.649]];
      surface(rearInlet.map(([z,low,high])=>mirror([sidePoint(z,low),sidePoint(z,high)],side)),black,side > 0);

      panel(mirror([hoodPoint(1.29,.49),hoodPoint(1.29,.68),hoodPoint(1.75,.63),hoodPoint(1.81,.48)],side),[0,1,0],carbon);
      for (const z of [1.41,1.51,1.61]) {
        panel(mirror([hoodPoint(z,.512,.015),hoodPoint(z,.638,.015),
          hoodPoint(z+.025,.628,.015),hoodPoint(z+.025,.514,.015)],side),[0,1,0],hardware);
      }

      for (const axle of [frontAxle,rearAxle]) {
        const arch = rows.filter(row=>Math.abs(row[0][2] - axle)<opening);
        const outline = arch.map(row=>{
          const [x,y,z] = row.at(-1);
          return [[side*(x+.009),y+.038,z],[side*(x+.007),y+.002,z]];
        });
        surface(outline,carbon,side<0);
      }
      const pipe = mesh(new THREE.TorusGeometry(.058,.011,6,14),alloy,side*.615,.401,tail-.034);
      pipe.rotation.y = Math.PI;
      box(side*.612,.407,tail-.024,.088,.066,.012,black);
      rearFace(mirror([[.54,.343,-.041],[.72,.343,-.041],[.72,.358,-.044],[.54,.358,-.044]],side),red);
    }

    const support = box(side*.49,1.154,-2.048,.067,.487,.138,carbon);
    support.rotation.x = -.26;
    panel(mirror([[1.065,1.29,-2.430],[1.065,1.50,-2.448],[1.065,1.475,-2.037],[1.065,1.336,-1.95]],side),[side,0,0],accent);
    panel(mirror([[1.064,1.29,-2.430],[1.064,1.50,-2.448],[1.064,1.475,-2.037],[1.064,1.336,-1.95]],side),[-side,0,0],accent);
  }

  const wingProfile = [[1.395,-2.416],[1.427,-2.416],[1.446,-2.30],[1.414,-2.00],[1.396,-2.014]];
  for (let i=0;i<wingProfile.length;i++) {
    const [y,z] = wingProfile[i], [ny,nz] = wingProfile[(i+1)%wingProfile.length];
    panel([[-1.064,y,z],[1.064,y,z],[1.064,ny,nz],[-1.064,ny,nz]],
      [0,nz-z,y-ny],i===0 && detail ? accent : carbon);
  }

  if (detail) {
    const overlay = rows.filter(row=>row[0][2]>=1.27 && row[0][2]<=2.36);
    for (const side of [-1,1]) {
      surface(overlay.map(row=>{
        const z = row[0][2];
        const x = .21 + .09 * smooth(1.36,2.29,z);
        return mirror([hoodPoint(z,x-.047,.011),hoodPoint(z,x+.047,.011)],side);
      }),accent,side<0);
    }
    const roofStripe = canopyRows.slice(2,6).map(row=>[[-.035,row[0][1]+.015,row[0][2]],[.035,row[0][1]+.015,row[0][2]]]);
    surface(roofStripe,accent);
  }
}
