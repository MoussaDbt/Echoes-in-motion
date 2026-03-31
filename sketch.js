const fullCode = `
let particlesN = 25000;
let particles = [];
let distance = Math.min(200, 800 / 4); 
let angle = 0;
let fft;

let attraction =0.01;
let damping = 0.9;
let w = 1500;
let h = 1500;
let radius = 0.45*w;

const FLOW_STRENGTH_BASE = 0.0;
const FLOW_STRENGTH_FLASH = 0.8; // max burst strength
const FLOW_FLASH_RAMP = 0.02;
let song;
let flowFlash = 0; 
let flowFlashTarget = 0;
let flowFlashDuration = 0;


function preload() {
  song = loadSound('tunetank-vlog-beat-background-349853.mp3');
}


function setup() {
  createCanvas(w, h);

  // Initialisation des particules une seule fois
  for (let j = 0; j < particlesN; j++) {
    // Angles en radians
    particles.push({
      pos : createVector(0, 0),
      index: j,
      vel: createVector(0, 0)});
    
  }
  angle = 0;
  updateTargets()
  
  
  fft =  new p5.FFT()
  
}
  



function draw() {
  background(0);
  
  fill(78,0,178);
  noStroke();
  translate(width / 2, height / 2); // centre du canevas
  
  fft.analyze();
  // on va se servir de l'amplitude de la bass, il est egalement possible de se servir d'autres types de frequences
  bass = fft.getEnergy(90,260);
  
  bassAmp = map(bass,0,255, 0,1)
  if(bassAmp<0.75) bassAmp=0;
  console.log(bassAmp)
  
  
  for (let i = 0; i < particles.length; i++) {
    let p = particles[i];
    
    
    // compute the rotating “home” position
    let homeX = cos(i + angle) * cos(i * i) * radius;
    let homeY = sin(i * i) * radius
    let home = createVector(homeX, homeY);
    
    let toHome = p5.Vector.sub(home, p.pos);   //vecteur entre la position actuelle et le point de depart
    let spring = toHome.mult(attraction);      // multipliction du vecteur par une constante d'attraction
    p.vel.add(spring);                          //on utilise le vescteur obtenue pour ramener la particule au point de depart
    
    
    
      const angleR = getFlowAngle(p.pos.x , p.pos.y)
      p.vel.add(Math.cos(angleR) * bassAmp, Math.sin(angleR) * bassAmp);
    
    p.vel.mult(damping);       // on reduit la velocite sans ca le resultat est un peu chaotique
    p.pos.add(p.vel)
    
    
    // Clamp to sphere radius
    const Dist = Math.sqrt(p.pos.x*p.pos.x + p.pos.y*p.pos.y);
    if(Dist > radius){
        p.pos.x = (p.pos.x/Dist) * radius;
        p.pos.y = (p.pos.y/Dist) * radius;
    }
    
    ellipse(p.pos.x, p.pos.y, 5, 5);
    
  }
  angle += 0.01;
}



function updateTargets() {
  for (let p of particles) {
	let i = p.index;
	let x = cos(i + angle) * cos(i * i) * radius;
	let y = sin(i * i) * radius
	p.pos.set(x, y);
  }
}



function getFlowAngle(x, y) {
    // Scale coordinates for smooth noise
    const scale = 0.002; 
    return SimplexNoise(x * scale, y * scale) * Math.PI * 2; // full angle 0..2π
}

const grad = (hash, x, y) => {
    let h = hash & 0x0F;
    let u = h < 8 ? x : y;
    let v = h < 4 ? y : 0;

    return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
};


// https://github.com/attilabuti/SimplexNoise/blob/main/LICENSE
// foction permettant de generer un point aleatoirment lie avec le point passé en argument
const tableSize = 512;
var perm = new Uint8Array(tableSize);
var permMod12 = new Uint8Array(tableSize);

// Skewing and unskewing factors for 2 dimensions
const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

function SimplexNoise (xin, yin) {
    let n0, n1, n2; // Noise contributions from the three corners

    // Skew the input space to determine which simplex cell we're in
    let s = (xin + yin) * F2; // Hairy factor for 2D
    let i = Math.floor(xin + s);
    let j = Math.floor(yin + s);
    let t = (i + j) * G2;

    // (i - t) Unskew the cell origin back to (x,y) space
    let x0 = xin - (i - t); // The x,y distances from the cell origin
    let y0 = yin - (j - t);

    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if (x0 > y0) {
        [i1, j1] = [1, 0]; // lower triangle, XY order: (0,0)->(1,0)->(1,1)
    } else {
        [i1, j1] = [0, 1]; // upper triangle, YX order: (0,0)->(0,1)->(1,1)
    }

    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    let x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    let y1 = y0 - j1 + G2;
    let x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
    let y2 = y0 - 1.0 + 2.0 * G2;

    // Work out the hashed gradient indices of the three simplex corners
    i &= 255;
    j &= 255;

    let gi0 = permMod12[i + perm[j]];
    let gi1 = permMod12[i + i1 + perm[j + j1]];
    let gi2 = permMod12[i + 1 + perm[j + 1]];

    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) {
        n0 = 0.0;
    } else {
        t0 *= t0;
        n0 = t0 * t0 * grad(gi0, x0, y0); // (x,y) of grad used for 2D gradient
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) {
        n1 = 0.0;
    } else {
        t1 *= t1;
        n1 = t1 * t1 * grad(gi1, x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) {
        n2 = 0.0;
    } else {
        t2 *= t2;
        n2 = t2 * t2 * grad(gi2, x2, y2);
    }

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70.0 * (n0 + n1 + n2);
}


function mousePressed() {
  if (song.isPlaying()) {
    song.stop();
  } else {
    song.play();
  }
}`.trim();


const codeLines = fullCode.split("\n").map(l=>l.trim()).filter(l=>l);
const charSize = 14;
let codeCols=[];

let particlesN = 25000;
let particles = [];
let distance = Math.min(200, 800 / 4); 
let angle = 0;
let fft;

let attraction =0.01;
let damping = 0.9;
let w = window.innerWidth;
let h = window.innerHeight;
let radius = 0.425*h;

const FLOW_STRENGTH_BASE = 0.0;
const FLOW_STRENGTH_FLASH = 0.8; // max burst strength
const FLOW_FLASH_RAMP = 0.02;
let song;
let flowFlash = 0; 
let flowFlashTarget = 0;
let flowFlashDuration = 0;


function initCodeRain(){
  codeCols=[];
  const n=Math.floor(w/charSize);
  for(let i=0;i<n;i++) codeCols.push({x:i*charSize, y:random(0,1)*-h, speed:random(0.1,0.3)});
}


function drawCodeRain(){
  fill(0,255,70);
  textSize(charSize);
  textFont('monospace');
  textAlign(LEFT, TOP);
  for(let col of codeCols){
    col.y += charSize*col.speed;
    if(col.y > h) {
      col.y = -charSize;  // on remet le bloc de code en haut
    }
    for(let i=0; i<2; i++){
      const line = codeLines[Math.floor(random(0,1)*codeLines.length)];
      y = col.y + i*charSize;
      fill(255,255,255, random(50, 100)); // fade out en bas
      text(line, col.x, y);
    }
  }
}




let r;
let g ;
let b ;

function preload() {
  song = loadSound('tunetank-vlog-beat-background-349853.mp3');
}


function setup() {
  createCanvas(w, h);

  initCodeRain();

  // Initialisation des particules une seule fois
  for (let j = 0; j < particlesN; j++) {
    // Angles en radians
    particles.push({
      pos : createVector(0, 0),
      index: j,
      vel: createVector(0, 0)});
    
  }
  angle = 0;
  updateTargets()
  
  
  fft =  new p5.FFT()
  r=random(50,255);
  g=random(50,255);
  b=random(50,255);
  shapeColor = color(r, g, b);
}
  

function draw() {
  background(0);

  drawCodeRain()
  
  fill(shapeColor);
  noStroke();
  translate(width / 2, height / 2); // centre du canvas
  
  fft.analyze();
  // on va se servir de l'amplitude de la bass, il est egalement possible de se servir d'autres types de frequences
  bass = fft.getEnergy(20,60);

  bassAmp = map(bass,0,255, 0,1)
  
  radius = map(bassAmp, 0, 1, 0.425*height, 0.425*height*1.1);  // augmentation du rayon en fonction du rythme

  
  console.log(bassAmp)
  
  
  for (let i = 0; i < particles.length; i++) {
    let p = particles[i];
    
    
    // compute the rotating “home” position
    let homeX = cos(i + angle) * cos(i * i) * radius;
    let homeY = sin(i * i) * radius
    let home = createVector(homeX, homeY);
    
    let toHome = p5.Vector.sub(home, p.pos);   //vecteur entre la position actuelle et le point de depart
    let spring = toHome.mult(attraction);      // multipliction du vecteur par une constante d'attraction
    p.vel.add(spring);                          //on utilise le vescteur obtenue pour ramener la particule au point de depart
    
    
    
    const angleR = getFlowAngle(p.pos.x + width/4, p.pos.y+ height/4)
    p.vel.add(Math.cos(angleR) * bassAmp, Math.sin(angleR) * bassAmp);
    
    p.vel.mult(damping);       // on reduit la velocite sans ca le resultat est un peu chaotique
    p.pos.add(p.vel)
    
    
    // Clamp to sphere radius
    const Dist = Math.sqrt(p.pos.x*p.pos.x + p.pos.y*p.pos.y);
    if(Dist > radius){
        p.pos.x = (p.pos.x/Dist) * radius;
        p.pos.y = (p.pos.y/Dist) * radius;
    }
    
    ellipse(p.pos.x, p.pos.y, 3, 3);
    
  }
  angle += 0.0125;
}



function updateTargets() {
  for (let p of particles) {
	let i = p.index;
	let x = cos(i + angle) * cos(i * i) * radius;
	let y = sin(i * i) * radius
	p.pos.set(x, y);
  }
}



function getFlowAngle(x, y) {
    // Scale coordinates for smooth noise
    const scale = 0.002; 
    return SimplexNoise(x * scale, y * scale) * Math.PI * 2; // full angle 0..2π
}

const grad = (hash, x, y) => {
    let h = hash & 0x0F;
    let u = h < 8 ? x : y;
    let v = h < 4 ? y : 0;

    return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
};


// https://github.com/attilabuti/SimplexNoise/blob/main/LICENSE
// foction permettant de generer un point aleatoirment lie avec le point passé en argument
const tableSize = 512;
var perm = new Uint8Array(tableSize);
var permMod12 = new Uint8Array(tableSize);

// Skewing and unskewing factors for 2 dimensions
const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

function SimplexNoise (xin, yin) {
    let n0, n1, n2; // Noise contributions from the three corners

    // Skew the input space to determine which simplex cell we're in
    let s = (xin + yin) * F2; // Hairy factor for 2D
    let i = Math.floor(xin + s);
    let j = Math.floor(yin + s);
    let t = (i + j) * G2;

    // (i - t) Unskew the cell origin back to (x,y) space
    let x0 = xin - (i - t); // The x,y distances from the cell origin
    let y0 = yin - (j - t);

    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if (x0 > y0) {
        [i1, j1] = [1, 0]; // lower triangle, XY order: (0,0)->(1,0)->(1,1)
    } else {
        [i1, j1] = [0, 1]; // upper triangle, YX order: (0,0)->(0,1)->(1,1)
    }

    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    let x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    let y1 = y0 - j1 + G2;
    let x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
    let y2 = y0 - 1.0 + 2.0 * G2;

    // Work out the hashed gradient indices of the three simplex corners
    i &= 255;
    j &= 255;

    let gi0 = permMod12[i + perm[j]];
    let gi1 = permMod12[i + i1 + perm[j + j1]];
    let gi2 = permMod12[i + 1 + perm[j + 1]];

    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) {
        n0 = 0.0;
    } else {
        t0 *= t0;
        n0 = t0 * t0 * grad(gi0, x0, y0); // (x,y) of grad used for 2D gradient
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) {
        n1 = 0.0;
    } else {
        t1 *= t1;
        n1 = t1 * t1 * grad(gi1, x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) {
        n2 = 0.0;
    } else {
        t2 *= t2;
        n2 = t2 * t2 * grad(gi2, x2, y2);
    }

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70.0 * (n0 + n1 + n2);
}


function mousePressed() {
  if (song.isPlaying()) {
    song.stop();
  } else {
    song.play();
  }
}






