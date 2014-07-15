var fps = 60;
var startYear = 2014;
var secPerEarthYear = 10;

// planetary orbital elements from wikipedia
// at zoom level 1:
// 1 AU of distance = 200 px (1 px = 0.005 AU)
// 1000 km of radius = 1 px
var data = {
  mercury: {
    a: 0.387,
    e: 0.206,
    w: degToRad(29),
    r: 2440
  },
  venus: {
    a: 0.723,
    e: 0.007,
    w: degToRad(55),
    r: 6052
  },
  earth: {
    a: 1,
    e: 0.017,
    w: degToRad(114),
    r: 6371
  },
  moon: {
    a: Math.pow(27.3/365.25, 2/3), // from Kepler 3
    e: 0.0549,
    w: 0, // (?) varies significantly with time and is not clearly defined in any fixed reference frame
    r: 2000
  },
  mars: {
    a: 1.524,
    e: 0.093,
    w: degToRad(287),
    r: 3390
  },
  jupiter: {
    a: 5.204,
    e: 0.049,
    w: degToRad(275),
    r: 69911
  },
  saturn: {
    a: 9.582,
    e: 0.056,
    w: degToRad(336),
    r: 70*2000 // the image is the proper size (58232 for planet radius) and transparent in the proper places, but this is just so that the rings don't get clipped
  },
  uranus: {
    a: 19.229,
    e: 0.044,
    w: degToRad(97),
    r: 25362*1.5
  },
  neptune: {
    a: 30.104,
    e: 0.011,
    w: degToRad(266),
    r: 24622*1.5
  },
  pluto: { // which will always be a planet #vivapluto
    a: 39.264,
    e: 0.249,
    w: degToRad(114),
    r: 1184
  },
  halley: {
    a: 17.9,
    e: 0.967,
    w: degToRad(20)
  }
}



var orbits = document.getElementById("orbits");
var planets = document.getElementById("planets");
var imageCanvasesLoaded = false;

var width = window.innerWidth;
var height = window.innerHeight;

// ZOOM VARIABLES
var startBGW = $("#bg").css("width").slice(0,-2);
var startBGH = $("#bg").css("height").slice(0,-2);

var zoomLevel = 1; // default Earth view
var bgScale = 2;

var zoomLevel1 = 2;
var BGzoomLevel1 = 2; // in this case, 1 is native size

var zoomLevel2 = 0.2;
var BGzoomLevel2 = 1.5;

var zoomSpeed = 1000; // ms
var zoomingIn = false;
var zoomingOut = false;

var universalScale = zoomLevel1;

$("#yearNum").html(startYear);





// some optimization shim thingy (http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/)
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){ // fallback
            window.setTimeout(callback, 1000 / 60);
          };
})();

// for performance
function prerender(imgSrc, w, h) {
  var imgCanvas = document.createElement("canvas");
  imgCanvas.width = w;
  imgCanvas.height = h;
  var imgCanvasCtx = imgCanvas.getContext("2d");
  var imgObj = new Image();
  imgObj.onload = function() {
    imgCanvasCtx.drawImage(imgObj, 0, 0);
  }
  imgObj.src = imgSrc;
  return imgCanvas;
}

var sunCanvas;
var mercuryCanvas;
var earthCanvas;
var moonCanvas;
var venusCanvas;
var marsCanvas;
var jupiterCanvas;
var saturnCanvas;
var uranusCanvas;
var neptuneCanvas;
var plutoCanvas;

function prerenderImages() {
  sunCanvas = prerender("images/sun.jpg", 80, 77);
  mercuryCanvas = prerender("images/mercury.jpg", 16, 16);
  earthCanvas = prerender("images/earth.jpg", 16, 16);
  moonCanvas = prerender("images/moon.jpg", 16, 16);
  venusCanvas = prerender("images/venus.jpg", 24, 24);
  marsCanvas = prerender("images/mars.jpg", 24, 24);
  jupiterCanvas = prerender("images/jupiter.jpg", 36, 36);
  saturnCanvas = prerender("images/saturn2.png", 30, 12); // this size is the only size we will see
  uranusCanvas = prerender("images/uranus.jpg", 16, 16);
  neptuneCanvas = prerender("images/neptune.jpg", 16, 16);
  plutoCanvas = prerender("images/pluto.jpg", 8, 8);
}

// pre-render everything possible for better performance
if (orbits.getContext) { // let's just assume that it will work for the others too...
  var orbitsCtx = orbits.getContext("2d");
  var planetsCtx = planets.getContext("2d");
  prerenderImages();
  imageCanvasesLoaded = true;
}

function updateBG(bgScale) {
  console.log(startBGW);
  var BGW = bgScale * startBGW;
  var BGH = bgScale * startBGH;

  $("#bg").css("width", BGW);
  $("#bg").css("left", (width/2 - BGW/2));
  $("#bg").css("top", (height/2 - BGH/2));
}
updateBG(bgScale); // starting view

// **** fade off the cover once everything is loaded
$("#cover").fadeOut(1000);




var time = 0;
var mercuryOrbit = new Orbit(data.mercury.a, data.mercury.e, data.mercury.w, 0);
var venusOrbit = new Orbit(data.venus.a, data.venus.e, data.venus.w, 0);
var earthOrbit = new Orbit(data.earth.a, data.earth.e, data.earth.w, 0);
var marsOrbit = new Orbit(data.mars.a, data.mars.e, data.mars.w, 0);
var jupiterOrbit = new Orbit(data.jupiter.a, data.jupiter.e, data.jupiter.w, 0);
var saturnOrbit = new Orbit(data.saturn.a, data.saturn.e, data.saturn.w, 0);
var uranusOrbit = new Orbit(data.uranus.a, data.uranus.e, data.uranus.w, degToRad(50));
var neptuneOrbit = new Orbit(data.neptune.a, data.neptune.e, data.neptune.w, degToRad(90));
var plutoOrbit = new Orbit(data.pluto.a, data.pluto.e, data.pluto.w, degToRad(40));

var moonOrbit = new Orbit(data.moon.a, data.moon.e, data.moon.w, 0, earthOrbit);

var halleyOrbit = new Orbit(data.halley.a, data.halley.e, data.halley.w, Math.PI - 0.0147833); // calculated from getPhi in the other direction but input manually, since this time we want the angle in terms of theta, not phi. Last perihelion was 28 years ago (1986), and period is ~76 years, and angularOffset is measured from the center (sun)

function rand(lower, upper) {
  // uniformly generates a random number from lower to upper by scaling/shifting the range of Math.random()
  return Math.random() * (upper-lower) + lower;
}

// random asteroids in the belt, rough distributions taken from wikipedia
var asteroids = [];

function addAsteroids(lowerRadius, upperRadius, num) { // num divisible by 10
  for (var i = 0; i<0.1*num; i++)
    asteroids.push(new Orbit(rand(lowerRadius,upperRadius), rand(0,0.05), rand(0,2*Math.PI), rand(0,2*Math.PI)));
  for (var i = 0; i<0.8*num; i++)
    asteroids.push(new Orbit(rand(lowerRadius,upperRadius), rand(0.1,0.2), rand(0,2*Math.PI), rand(0,2*Math.PI)));
  for (var i = 0; i<0.1*num; i++)
    asteroids.push(new Orbit(rand(lowerRadius,upperRadius), rand(0.2,0.35), rand(0,2*Math.PI), rand(0,2*Math.PI)));
}
addAsteroids(2.2, 2.45, 80);
addAsteroids(2.55, 2.8, 60);
addAsteroids(2.9, 3.2, 40);





function render(univScale) {
  width = window.innerWidth;
  height = window.innerHeight;
  orbits.width = width;
  orbits.height = height;
  planets.width = width;
  planets.height = height;

  //orbitsCtx.fillRect(0, 0, width, height);

  // orbits
  mercuryOrbit.drawOrbit(orbitsCtx, univScale);
  venusOrbit.drawOrbit(orbitsCtx, univScale);
  earthOrbit.drawOrbit(orbitsCtx, univScale);
  marsOrbit.drawOrbit(orbitsCtx, univScale);
  jupiterOrbit.drawOrbit(orbitsCtx, univScale);
  saturnOrbit.drawOrbit(orbitsCtx, univScale);
  uranusOrbit.drawOrbit(orbitsCtx, univScale);
  neptuneOrbit.drawOrbit(orbitsCtx, univScale);
  plutoOrbit.drawOrbit(orbitsCtx, univScale);
  halleyOrbit.drawOrbit(orbitsCtx, univScale);

  // planets
  // make sure the small planets stay visible
  if (univScale < 0.5) {
    mercuryOrbit.drawOrbiter(1, time, planetsCtx, univScale, mercuryCanvas);
    venusOrbit.drawOrbiter(1, time, planetsCtx, univScale, venusCanvas);
    earthOrbit.drawOrbiter(1, time, planetsCtx, univScale, earthCanvas);
    marsOrbit.drawOrbiter(1, time, planetsCtx, univScale, marsCanvas);
  }
  else {
    mercuryOrbit.drawOrbiter(data.mercury.r*univScale/2000, time, planetsCtx, univScale, mercuryCanvas);
    venusOrbit.drawOrbiter(data.venus.r*univScale/2000, time, planetsCtx, univScale, venusCanvas);
    earthOrbit.drawOrbiter(data.earth.r*univScale/2000, time, planetsCtx, univScale, earthCanvas);
    marsOrbit.drawOrbiter(data.mars.r*univScale/2000, time, planetsCtx, univScale, marsCanvas);
  }
  jupiterOrbit.drawOrbiter(data.jupiter.r*univScale/2000, time, planetsCtx, univScale, jupiterCanvas);
  saturnOrbit.drawOrbiter(data.saturn.r*univScale/2000, time, planetsCtx, univScale, saturnCanvas);
  uranusOrbit.drawOrbiter(data.uranus.r*univScale/2000, time, planetsCtx, univScale, uranusCanvas);
  neptuneOrbit.drawOrbiter(data.neptune.r*univScale/2000, time, planetsCtx, univScale, neptuneCanvas);
  plutoOrbit.drawOrbiter(2, time, planetsCtx, univScale, plutoCanvas);

  halleyOrbit.drawOrbiter(1, time, planetsCtx, univScale, null); // almost always out of the inner planet scene, so just make it have constant radius

  // satellites, since we need getPlanetLocation updated after everything's been drawn already
  var earthLocation = earthOrbit.getPlanetLocation();
  moonOrbit.drawOrbit(orbitsCtx, univScale);
  if (univScale < 0.5)
    moonOrbit.drawOrbiter(2, time, planetsCtx, univScale, moonCanvas);
  else
    moonOrbit.drawOrbiter(1.5, time, planetsCtx, univScale, moonCanvas);

  // asteroids, no orbit drawn, just 1px dots
  for (var i = 0; i<asteroids.length; i++) {
    asteroids[i].drawOrbiter(1, time, planetsCtx, univScale, null, "#999999");
  }
  // sun last so that the shadows don't make other things look strange
  orbitsCtx.shadowColor = "#ffea75";
  orbitsCtx.shadowOffsetX = 0;
  orbitsCtx.shadowOffsetY = 0;
  orbitsCtx.shadowBlur = 30*univScale;
  drawDot(polarToCanvas(0, 0), 15*univScale, orbitsCtx, null, "#ffd900"); 
  drawDot(polarToCanvas(0, 0), 15*univScale, orbitsCtx, sunCanvas);

  // update year counter if Earth has completed an orbit
  updateYear();

  time += 1000/fps;
}

function updateYear() {
  var yearsElapsed = time/(1000*secPerEarthYear);
  var currentYear = +$("#yearNum").html(); // unary plus

  if (currentYear != startYear + Math.floor(yearsElapsed))
    $("#yearNum").html(currentYear + 1); // only way is up
}

$("#toggleZoom").click(function(){
  $("#toggleZoom").fadeOut(300, function(){
    if (zoomLevel === 1) // default
      zoomingOut = true;
    else
      zoomingIn = true;
  })
});

var dt = 0;

// controls animation
(function animLoop() {
  requestAnimFrame(animLoop);

  // measured every frame, so we update universalScale at each tick when zooming in/out
  // zooming in/out follows a cosine curve with wavelength 2 sec, starting/ending points at proper zooms

  // OUT
  if (zoomingOut) {
    universalScale = (zoomLevel1-zoomLevel2)/2 * Math.cos(dt * Math.PI/zoomSpeed) + (zoomLevel1+zoomLevel2)/2; // increase from zl2 to zl1
    bgScale = (BGzoomLevel1-BGzoomLevel2)/2 * Math.cos(dt * Math.PI/zoomSpeed) + (BGzoomLevel1+BGzoomLevel2)/2;// increase from bgzl2 to bgzl1

    render(universalScale);
    updateBG(bgScale);
    dt += 1000/fps;

    if (dt > 1000) { // finished zooming out
      zoomLevel = 2;
      zoomingOut = false;
      dt = 0;
      $("#toggleZoom").html("Zoom in");
      $("#toggleZoom").fadeIn(300);
    }
  }

  // IN
  if (zoomingIn) {
    universalScale = -(zoomLevel1-zoomLevel2)/2 * Math.cos(dt * Math.PI/zoomSpeed) + (zoomLevel1+zoomLevel2)/2; // decrease from zl1 to zl2
    bgScale = -(BGzoomLevel1-BGzoomLevel2)/2 * Math.cos(dt * Math.PI/zoomSpeed) + (BGzoomLevel1+BGzoomLevel2)/2;// increase from bgzl2 to bgzl1

    render(universalScale);
    updateBG(bgScale);
    dt += 1000/fps;

    if (dt > 1000) { // finished zooming in
      zoomLevel = 1;
      zoomingIn = false;
      dt = 0;
      $("#toggleZoom").html("Zoom out");
      $("#toggleZoom").fadeIn(300);
    }
  }

  // NOTA
  if (!zoomingIn && !zoomingOut)
    render(universalScale);
})();





function degToRad(degree) {
  return degree*Math.PI/180;
}

function polarToCanvas(r, theta, scale, origin) { // -> [float, float]
  // scale and origin are optional (origin in polar coordinates)
  // for given polar coords, returns canvas coords
  
  // default scale is 1, meaning 1 unit r = 100px = 1 AU (arbitrarily/approximately)
  if (!scale)
    var scale = 1;
  // default origin is center of canvas
  if (!origin)
    var origin = [0,0];

  // define this from the cartesian center, the center of the canvas
  var originX = 100*scale*origin[0] * Math.cos(origin[1]) + width/2;
  var originY = -100*scale*origin[0] * Math.sin(origin[1]) + height/2;

  var x = 100*scale*r * Math.cos(theta) + originX;
  var y = -100*scale*r * Math.sin(theta) + originY; // negative bc we want +y direction to be up

  return [x, y];
}

/*function canvasToPolar(x, y, scale, origin) {
  // scale and origin are optional (origin in cartesian coordinates)
  
  if (!scale)
    var scale = 1;
  if (!origin)
    var origin = [width/2, height/2];

  // "true" x and y measured from origin
  var dx = (x - origin[0])/(100*scale);
  var dy = (-y + origin[1])/(100*scale);
  // ex. point (100, 200) with origin (300, 400) should have dx=-200, dy=200
  var r = Math.sqrt(dx*dx + dy*dy);
  var theta = Math.atan2(dy, dx);
  return [r, theta];
}*/

function shiftOrigin(newOrigin, r, t) { // -> [r', theta']
  // with respect to the new origin in polar coordinates
  var r0 = newOrigin[0];
  var t0 = newOrigin[1];
  // the formula treats r,theta as a translation vector for the ORIGIN
  var rNew = Math.sqrt(r*r + r0*r0 - 2*r*r0*Math.cos(t-t0));
  var thetaNew = Math.atan2(r*Math.sin(t) - r0*Math.sin(t0), r*Math.cos(t) - r0*Math.cos(t0));
  return [rNew, thetaNew];
}

function drawDot(center, radius, layer, imageCanvas, color) {
  //[x, y], float, ctx
  // radius in pixels, center in canvas coordinates

  if (!imageCanvas) {
    layer.strokeStyle = (!color) ? "#ffffff" : color;
    layer.fillStyle = (!color) ? "#ffffff" : color;

    layer.beginPath();
    layer.arc(center[0], center[1], radius, 0, 2*Math.PI);
    //layer.stroke();
    layer.fill();
  }
  else {
    if (imageCanvasesLoaded) {
      layer.save();

      layer.beginPath();
      layer.arc(center[0], center[1], radius, 0, 2*Math.PI);
      layer.closePath();
      layer.clip();
      layer.drawImage(imageCanvas, center[0]-imageCanvas.width/2, center[1]-imageCanvas.height/2);

      layer.restore();
    }
  }
}

function drawPolarEllipse(a_, e, w, scale, layer, origin, color) {
  // converts the html5 usage of circles to polar ellipses with the given parameters
  // origin is in polar coordinates; location of focus
  
  var a = 100*scale*a_; // set the scale for everything else
  var b = a*Math.sqrt(1-e*e); // semiminor axis
  var c = a*e; // distance from center to focus

  layer.strokeStyle = (!color) ? "#777777" : color;

  if (!origin)
    var origin = [0,0];
  origin = polarToCanvas(scale*origin[0], origin[1]);

  // corresponding restore() at the end
  layer.save();

  // order is important here
  // move center of desired ellipse to new origin
  layer.translate(origin[0] - c*Math.cos(w), origin[1] + c*Math.sin(w));
  // rotate about this new origin by an angle of w CCW to align it properly
  layer.rotate(-w);
  // set the proper scale w.r.t. this new origin
  layer.scale(1, b/a);
  // dashed lines
  layer.setLineDash([3,6]);

  // draw the "circle"
  layer.beginPath();
  layer.arc(0, 0, a, 0, 2*Math.PI);
  layer.scale(1,a/b); // scale back to original to use original stroke pattern
  layer.stroke();

  layer.restore();
}





function Orbit(a, e, w, angularOffset, parentObject) {
  // a=semimajor axis (AU), e=eccentricity (unitless), w=argument of perihelion (rad), angularOffset=true anomaly of the position at time t=0 (rad)
  // parentObject=the parent object if this is a satellite or nested orbit
  // equation: r = a(1-e^2) / (1+e*cos(theta - w))

  // these parameters are unchangeable properties of the orbit
  this.a = a;
  this.e = e;
  this.w = w;
  // eccentricity = c/a, a^2-b^2=c^2
  var b = a*Math.sqrt(1-e*e); // semiminor axis
  var c = a*e; // distance from center to focus

  // these properties are for the planet in the orbit
  var phiAngularOffset = getPhi(angularOffset);

  var r0 = a * (1-e*e) / (1+e*Math.cos(-w));
  var t0 = angularOffset;
  // starting values
  this.r;//= r0;
  this.theta;// = t0;
  this.location;// = polarToCanvas(r0, t0, universalScale);

  if (!parentObject)
    var nested = false;
  else
    var nested = true;

  // THETA is measured from the origin at center, PHI is measured from the other focus of the ellipse

  function getPhi(theta) { // -> phi
    var R = a * (1-e*e) / (1+e*Math.cos(theta)); // measured for theta, since we want a phi angle from a given theta angle

    // r'
    var rP = (a*(1-e*e)*e*Math.sin(theta)) / (Math.pow(1 + e*Math.cos(theta),2));

    var dy = rP * Math.sin(theta) + R * Math.cos(theta); // y=rsin
    var dx = rP * Math.cos(theta) - R * Math.sin(theta); // x=rcos
    var tanLineAngle = Math.atan2(dy,dx);
    var radiusLineAngle = theta;

    // angle between, use tangent subtraction formula
    var angleBetween = (tanLineAngle - radiusLineAngle < Math.PI/2) ? (tanLineAngle - radiusLineAngle) : Math.PI - (tanLineAngle - radiusLineAngle);
    // only take the acute one, using the ternary operator (true or false) ? (assigned if true) : (assigned if false)

    // from geometry, pi - 2*angle between = theta - phi; solve for phi
    return theta - Math.PI + 2*angleBetween;
  }

  function projectEqualTimePoint(phi) { // -> [r, theta]
    // cycle through phi from 0 to 2pi
    // use the approximation that we are centered at the other focus; phi is measured from here

    //if (!origin)
      //var origin = [0,0];

    var r = a * (1-e*e) / (1-e*Math.cos(phi)); // facing the other direction
    var c = a*e;

    if (nested) {
      // if this is a satellite of some sort, shift origin to the parent object's location
      // graph it originally at origin, then move it to right point
      // IDK HOW THIS LINE WORKS
      var ptOnEllipse = shiftOrigin([parentObject.r, parentObject.theta-(w-Math.PI)], r, phi-Math.PI);
    }
    else
      // if this is not a satellite, simply shift origin 2c to the right
      // graph it originally at origin, then shift origin to other focus, so we are oriented properly
      var ptOnEllipse = shiftOrigin([2*c, 0], r, phi);

    var r1 = ptOnEllipse[0];
    var theta1 = ptOnEllipse[1];
    
    // tilt at the end, since we want the tilt w.r.t. the real origin
    // +w for the CCW tilt
    return [r1, theta1+w];
  }

  this.drawOrbit = function(layer, scale) {
    // draws an orbit in using origin as polar(0,0)

    if (!nested)
      var origin = [0,0];
    else
      var origin = parentObject.getPlanetLocation();

    drawPolarEllipse(a, e, w, scale, layer, origin);

    // put dots on the actual orbit for debugging
    /*Kepler 1: orbits are ellipses with central mass at focus
    for (var i = 0; i < 30; i++) {
      var phi = 2*Math.PI*i/30;
      point = projectEqualTimePoint(phi, origin); // so we can loop through the angle that will give us a better approximation for Kepler 2, equal area equal time
      drawDot(polarToCanvas(point[0], point[1], scale), 1, layer);
    }*/

  }

  this.drawOrbiter = function(planetRadius, time, layer, scale, imageCanvas, color) { // color optional
    // orbiting object drawn as a dot of some radius (px), after some time (ms), onto some layer

    if (!nested)
      var origin = [0,0];
    else {
      var origin = parentObject.getPlanetLocation();
      origin[0] = 0; // not really sure why this line is necessary...
    }

    // Kepler 3: P^2=a^3 where P in yr, a in AU (r units)
    var period = Math.pow(a, 1.5);

    // now, as in old drawOrbit, loop through the angle at the other focus phi from 0 to 2pi at constant rate
    
    // *** THIS LINE DETERMINES SPEED OF ANIMATIONS ***
    var yearsSinceZero = time/(1000*secPerEarthYear); // 1 earth yr = 10 sec
    // ************************************************

    var fractionPeriodCovered = yearsSinceZero/period; // where are we in the period?
    var phi = fractionPeriodCovered*(2*Math.PI) + phiAngularOffset; // what does this translate to in terms of angle? + any starting position we may have

    var planetPoint = projectEqualTimePoint(phi);
    
    var trueR = planetPoint[0];
    var trueTheta = planetPoint[1];

    // update the properties for reading
    this.r = trueR;
    this.theta = trueTheta;
    this.location = polarToCanvas(trueR, trueTheta, scale, origin); // for convenience, esp with satellites

    drawDot(this.location, planetRadius, layer, imageCanvas, color);
  }

  this.getPlanetLocation = function() {
    return [this.r, this.theta];
  }
}
