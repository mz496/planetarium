var fps = 60;

// planetary orbital elements from wikipedia
// at scale 1:
// 1 AU of distance = 100 px
// 1000 km of radius = 1 px
var data = {
  mercury: {
    a: 0.387,
    e: 0.206,
    w: degToRad(29.124),
    r: 2440
  },
  venus: {
    a: 0.723,
    e: 0.007,
    w: degToRad(55.186),
    r: 6052
  },
  earth: {
    a: 1,
    e: 0.017,
    w: degToRad(114.208),
    r: 6371
  },
  moon: {
    a: Math.pow(27.3/365.25, 2/3),
    e: 0.0549,
    w: 0, // (?) varies significantly with time and is not clearly defined in any fixed reference frame
    r: 2000
  },
  mars: {
    a: 1.524,
    e: 0.093,
    w: degToRad(286.537),
    r: 3390
  }
}

// some optimization shim thingy (http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/)
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){ // fallback
            window.setTimeout(callback, 1000 / 60);
          };
})();

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

var orbits = document.getElementById("orbits");
var planets = document.getElementById("planets");
var imageCanvasesLoaded = false;

// pre-render everything possible for better performance
if (orbits.getContext) { // let's just assume that it will work for the others too...
  var orbitsCtx = orbits.getContext("2d");
  var planetsCtx = planets.getContext("2d");
  var sunCanvas = prerender("images/sun.jpg", 80, 77);
  var mercuryCanvas = prerender("images/mercury.jpg", 16, 16);
  var earthCanvas = prerender("images/earth.jpg", 16, 16);
  var venusCanvas = prerender("images/venus.jpg", 24, 24);
  var marsCanvas = prerender("images/mars.jpg", 24, 24);
  var moonCanvas = prerender("images/moon.jpg", 16, 16);
  imageCanvasesLoaded = true;
}

var width = window.innerWidth;
var height = window.innerHeight;
var universalScale = 2;

var time = 0;
var mercuryOrbit = new Orbit(data.mercury.a, data.mercury.e, data.mercury.w, universalScale, 0);
var venusOrbit = new Orbit(data.venus.a, data.venus.e, data.venus.w, universalScale, 0);
var earthOrbit = new Orbit(data.earth.a, data.earth.e, data.earth.w, universalScale, 0);
var marsOrbit = new Orbit(data.mars.a, data.mars.e, data.mars.w, universalScale, 0);

var moonOrbit = new Orbit(data.moon.a, data.moon.e, data.moon.w, universalScale, 0, earthOrbit);

var halleyOrbit = new Orbit(17.8, .967, degToRad(20), universalScale, degToRad(-1));


function render(univScale) {
  width = window.innerWidth;
  height = window.innerHeight;
  orbits.width = width;
  orbits.height = height;
  planets.width = width;
  planets.height = height;

  orbitsCtx.fillRect(0, 0, width, height);
  orbitsCtx.shadowColor = "#ffea75";
  orbitsCtx.shadowOffsetX = 0;
  orbitsCtx.shadowOffsetY = 0;
  orbitsCtx.shadowBlur = 60;
  drawDot(polarToCanvas(0, 0), 15*univScale, orbitsCtx, null, "#ffd900"); // origin
  drawDot(polarToCanvas(0, 0), 15*univScale, orbitsCtx, sunCanvas);//, "#ffd900"); // origin

  // orbits
  mercuryOrbit.drawOrbit(orbitsCtx, univScale, null);
  venusOrbit.drawOrbit(orbitsCtx, univScale, null);
  earthOrbit.drawOrbit(orbitsCtx, univScale, null);
  marsOrbit.drawOrbit(orbitsCtx, univScale, null);
  halleyOrbit.drawOrbit(orbitsCtx, univScale, null);

  // planets
  mercuryOrbit.drawOrbiter(data.mercury.r*univScale/2000, time, planetsCtx, univScale, mercuryCanvas, null);
  venusOrbit.drawOrbiter(data.venus.r*univScale/2000, time, planetsCtx, univScale, venusCanvas, null);
  earthOrbit.drawOrbiter(data.earth.r*univScale/2000, time, planetsCtx, univScale, earthCanvas, null);
  marsOrbit.drawOrbiter(data.mars.r*univScale/2000, time, planetsCtx, univScale, marsCanvas, null);
  halleyOrbit.drawOrbiter(3, time, planetsCtx, univScale, null, null);

  // satellites, since we need getPlanetLocation updated after everything's been drawn already

  var earthLocation = earthOrbit.getPlanetLocation();
  moonOrbit.drawOrbit(orbitsCtx, univScale, earthLocation);
  moonOrbit.drawOrbiter(data.moon.r*univScale/2000, time, planetsCtx, univScale, moonCanvas, earthLocation);

  time += 1000/fps;
}

(function animLoop() {
  requestAnimFrame(animLoop);
  render(0.5*Math.cos(time*Math.PI/500)+1.5);
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
    layer.strokeStyle = (!color) ? "#00ffff" : color;
    layer.fillStyle = (!color) ? "#00ffff" : color;

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

  layer.strokeStyle = (!color) ? "#555555" : color;

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

  this.drawOrbit = function(layer, scale, origin) {
    // draws an orbit in using origin as polar(0,0)

    if (!origin)
      var origin = [0,0];

    drawPolarEllipse(a, e, w, scale, layer, origin);

    // put dots on the actual orbit for debugging
    /*Kepler 1: orbits are ellipses with central mass at focus
    for (var i = 0; i < 30; i++) {
      var phi = 2*Math.PI*i/30;
      point = projectEqualTimePoint(phi, origin); // so we can loop through the angle that will give us a better approximation for Kepler 2, equal area equal time
      drawDot(polarToCanvas(point[0], point[1], scale), 1, layer);
    }*/

  }

  this.drawOrbiter = function(planetRadius, time, layer, scale, imageCanvas, origin) {
    // orbiting object drawn as a dot of some radius (px), after some time (ms), onto some layer

    if (!origin)
      var origin = [0,0];

    // Kepler 3: P^2=a^3 where P in yr, a in AU (r units)
    var period = Math.pow(a, 1.5);

    // now, as in old drawOrbit, loop through the angle at the other focus phi from 0 to 2pi at constant rate
    
    // *** THIS LINE DETERMINES SPEED OF ANIMATIONS ***
    var yearsSinceZero = time/(1000*10); // 1 earth yr = 10 sec
    // ************************************************

    var fractionPeriodCovered = yearsSinceZero/period; // where are we in the period?
    var phi = fractionPeriodCovered*(2*Math.PI) + phiAngularOffset; // what does this translate to in terms of angle? + any starting position we may have

    var planetPoint = projectEqualTimePoint(phi);
    
    var trueR = planetPoint[0];
    var trueTheta = planetPoint[1];

    // update the properties for reading
    this.r = trueR;
    this.theta = trueTheta;
    this.location = polarToCanvas(trueR, trueTheta, scale, origin); // for convenience, esp with satellites and the origin shift vector

    drawDot(this.location, planetRadius, layer, imageCanvas);
  }

  this.getPlanetLocation = function() {
    return [this.r, this.theta];
  }
}
