window.onload = function(){
  var canvas = document.getElementById('canvas');
      context = canvas.getContext("2d"),
      width = canvas.width = window.innerWidth,
      height = canvas.height = window.innerHeight;

  K = 2;
  F = 2;
  Noise = 0.01;
  ALPHA = 0.8;
  ALPHA2 = 0.01;


  update();
  var phase =0;
  var speed = 0.15;
  function update(){
    phase = (phase + speed)%(Math.PI *64)
    context.clearRect(0,0,width,height);
//    		this.ctx.globalCompositeOperation = 'destination-out';
//		this.ctx.fillRect(0, 0, this.width, this.height);
//		this.ctx.globalCompositeOperation = 'source-over';

    drawLine(1,"rgba(255,255,255,1)", 1.5);
    drawLine(2,"rgba(255,255,255,0.4)");
    drawLine(-2,"rgba(255,255,255,0.1)");
    drawLine(4,"rgba(255,255,255,0.4)");
    drawLine(-6,"rgba(255,255,255,0.2)");
    requestAnimationFrame(update);
  }


  function drawLine(attenuation, lineColor, lineWidth) {
    context.moveTo(0,0);
    context.beginPath();
    context.strokeStyle = lineColor;
    context.lineWidth = lineWidth || 1;
    var x,y;
    for (var i = -K; i <= K; i+=0.01) {
      x = width * ((i+K)/(K*2));
      y = height/2 + Noise* (1/attenuation)*((height/2) * (Math.sin(F*i - phase))) * globalAttenuationFn(i);
      context.lineTo(x,y);
    }
    context.stroke();
  }


  function globalAttenuationFn(x) {
    return Math.pow(K*4/(K*4+Math.pow(x,4)),K*2);
  }
}

// create the audio context (chrome only for now)
if (! window.AudioContext) {
  if (! window.webkitAudioContext) {
    alert('no audiocontext found');
  }
  window.AudioContext = window.webkitAudioContext;
}
var contextA = new AudioContext();
var audioBuffer;
var sourceNode;
var splitter;
var analyser;
var javascriptNode;

// get the context from the canvas to draw on

// create a gradient for the fill. Note the strange
// offset, since the gradient is calculated based on
// the canvas, not the specific element we draw

// load the sound
setupAudioNodes();
loadSound('music/sound.mp3');


function setupAudioNodes() {

  // setup a javascript node
  javascriptNode = contextA.createScriptProcessor(2048, 1, 1);
  // connect to destination, else it isn't called
  javascriptNode.connect(contextA.destination);


  // setup a analyzer
  analyser = contextA.createAnalyser();
  analyser.smoothingTimeConstant = 0.3;
  analyser.fftSize = 1024;

  analyser2 = contextA.createAnalyser();
  analyser2.smoothingTimeConstant = 0.0;
  analyser2.fftSize = 1024;

  // create a buffer source node
  sourceNode = contextA.createBufferSource();
  splitter = contextA.createChannelSplitter();

  // connect the source to the analyser and the splitter
  sourceNode.connect(splitter);
  splitter.connect(analyser,0,0);
  analyser.connect(javascriptNode);

  sourceNode.connect(contextA.destination);
}

// load the specified sound
function loadSound(url) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // When loaded decode the data
  request.onload = function() {

    // decode the data
    contextA.decodeAudioData(request.response, function(buffer) {
      // when the audio is decoded play the sound
      playSound(buffer);
    }, onError);
  }
  request.send();
}


function playSound(buffer) {
  sourceNode.buffer = buffer;
  sourceNode.start(0);
}

// log if an error occurs
function onError(e) {
  console.log(e);
}

// when the javascript node is called
// we use information from the analyzer node
// to draw the volume
var isLoadingTextShowing = true;
var loaded = 0;
javascriptNode.onaudioprocess = function() {

  // get the average for the first channel
  var array =  new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(array);
  var average = getAverageVolume(array);
  if (average > 0 || loaded) {
    loaded = 1;
    changeNoise(average);
    changeFrequence(average);
    if (isLoadingTextShowing) {
      isLoadingTextShowing = false;
      document.getElementById('hint').style.display = 'none';
    }
   }

}
var id;
function changeNoise(value) {
  var now = Noise;
  Noise = ALPHA * now + (1 - ALPHA) * (value / 100);
}
function changeFrequence(value) {
  F = 2 + (value/100) *3;
}

function getAverageVolume(array) {
  var values = 0;
  var average;

  var length = array.length;

  // get all the frequency amplitudes
  for (var i = 0; i < length; i++) {
    values += array[i];
  }
  average = values / length;
  return average;
}