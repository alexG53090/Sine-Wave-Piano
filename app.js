    navigator.getUserMedia = (navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);
    // set up forked web audio context, for multiple browsers
    // window. is needed otherwise Safari explodes
    var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var voiceSelect = document.getElementById("voice");
    var source; var stream;
    //set up the different audio nodes we will use for the app
    var analyser = audioCtx.createAnalyser();
    analyser.minDecibels = -900;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;
    // effects
    var distortion = audioCtx.createWaveShaper();
    var gainNode = audioCtx.createGain();
    var biquadFilter = audioCtx.createBiquadFilter();
    var convolver = audioCtx.createConvolver();
    // set up canvas context for visualizer
    var canvas = document.querySelector('.visualizer');
    var canvasCtx = canvas.getContext("2d");
    var intendedWidth = document.querySelector('.wrapper').clientWidth;
    canvas.setAttribute('width',intendedWidth);
    var visualSelect = document.getElementById("visual");
    var drawVisual;
    //main block for doing the audio recording
    if (navigator.getUserMedia) {
       console.log('getUserMedia supported.');
       navigator.getUserMedia (
          // constraints - only audio needed for this app
          { audio: true },
          // Success callback
          function(stream) {
             source = audioCtx.createMediaStreamSource(stream);
             source.connect(analyser);
             analyser.connect(distortion);
             distortion.connect(biquadFilter);
             biquadFilter.connect(convolver);
             convolver.connect(gainNode);
             gainNode.connect(audioCtx.destination);
          	 visualize();
             voiceChange();
          },
          // Error callback
          function(err) {
          }
       );
    }
    function visualize() {
      WIDTH = canvas.width;
      HEIGHT = canvas.height;
      var visualSetting = "sinewave";
        analyser.fftSize = 2048;
        var bufferLength = analyser.fftSize;
        console.log(bufferLength);
        var dataArray = new Uint8Array(bufferLength);
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        function draw() {
          drawVisual = requestAnimationFrame(draw);
          analyser.getByteTimeDomainData(dataArray);
          canvasCtx.fillStyle = "rgba(0,255,255,0.1)";
          canvasCtx.fillRect(0, 0, WIDTH, HEIGHT, 0);
          var gradient = canvasCtx.createLinearGradient(0,0,200,0);
          // gradient.addColorStop(0,"green");
          // gradient.addColorStop(1,"white");
          // camvasCtx.fillStyle = gradient;

          canvasCtx.lineWidth = 2;
          canvasCtx.strokeStyle = 'rgb(255, 255, 0)';
          canvasCtx.beginPath();
          var sliceWidth = WIDTH * 1.0 / bufferLength;
          var x = 0;
          for(var i = 0; i < bufferLength; i++) {
            var v = dataArray[i] / 128.0;
            var y = v * HEIGHT/2;
            if(i === 0) {
              canvasCtx.moveTo(x, y);
            } else {
              canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
          }
          canvasCtx.lineTo(canvas.width, canvas.height/2);
          canvasCtx.stroke();
        };
        draw();
    }
