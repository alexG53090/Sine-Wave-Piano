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



///// Piano JS


(function() {
    // Create audio (context) container
    var audioCtx = new (AudioContext || webkitAudioContext)();

    // Table of notes with correspending keyboard codes. Frequencies are in hertz.
    // The notes start from middle C
    var notesByKeyCode = {
        65: { noteName: 'c4', frequency: 261.6, keyName: 'a' },
        83: { noteName: 'd4', frequency: 293.7, keyName: 's' },
        68: { noteName: 'e4', frequency: 329.6, keyName: 'd' },
        70: { noteName: 'f4', frequency: 349.2, keyName: 'f' },
        71: { noteName: 'g4', frequency: 392, keyName: 'g' },
        72: { noteName: 'a4', frequency: 440, keyName: 'h' },
        74: { noteName: 'b4', frequency: 493.9, keyName: 'j' },
        75: { noteName: 'c5', frequency: 523.3, keyName: 'k' },
        76: { noteName: 'd5', frequency: 587.3, keyName: 'l' },
        186: { noteName: 'e5', frequency: 659.3, keyName: ';' }
    };

    function Key(noteName, keyName, frequency) {
        var keyHTML = document.createElement('div');
        var keySound = new Sound(frequency, 'triangle');

        /* Style the key */
        keyHTML.className = 'key';
        keyHTML.innerHTML = noteName + '<br><span>' + keyName + '</span>';

        return {
            html: keyHTML,
            sound: keySound
        };
    }

    function Sound(frequency, type) {
        this.osc = audioCtx.createOscillator(); // Create oscillator node
        this.pressed = false; // flag to indicate if sound is playing
        /* Set default configuration for sound */
        if(typeof frequency !== 'undefined') {
            /* Set frequency. If it's not set, the default is used (440Hz) */
            this.osc.frequency.value = frequency;
        }

        /* Set waveform type. Default is actually 'sine' but triangle sounds better :) */
        this.osc.type = type || 'triangle';

        /* Start playing the sound. You won't hear it yet as the oscillator node needs to be
        piped to output (AKA your speakers). */
        this.osc.start(0);
    };

    Sound.prototype.play = function() {
        if(!this.pressed) {
            this.pressed = true;
            this.osc.connect(audioCtx.destination);
        }
    };

    Sound.prototype.stop = function() {
        this.pressed = false;
        this.osc.disconnect();
    };

    function createKeyboard(notes, containerId) {
        var sortedKeys = []; // Placeholder for keys to be sorted
        var waveFormSelector = document.getElementById('soundType');
        for(var keyCode in notes) {
            var note = notes[keyCode];
            /* Generate playable key */
            note.key = new Key(note.noteName, note.keyName, note.frequency);
            /* Add new key to array to be sorted */
            sortedKeys.push(notes[keyCode]);
        }

        /* Sort keys by frequency so that they'll be added to the DOM in the correct order */
        sortedKeys = sortedKeys.sort(function(note1, note2) {
            if (note1.frequency < note2.frequency) return -1;
            if (note1.frequency > note2.frequency) return 1;
            return 0;
        });

        // Add those sorted keys to DOM
        for(var i = 0; i < sortedKeys.length; i++) {
            document.getElementById(containerId).appendChild(sortedKeys[i].key.html);
        }

        var playNote = function(event) {
            var keyCode = event.keyCode;

            if(typeof notesByKeyCode[keyCode] !== 'undefined') {
                // Pipe sound to output (AKA speakers)
                notesByKeyCode[keyCode].key.sound.play();
                // Highlight key playing
                notesByKeyCode[keyCode].key.html.className = 'key playing';
            }
        };

        var endNote = function(event) {
            var keyCode = event.keyCode;
            if(typeof notesByKeyCode[keyCode] !== 'undefined') {
                // Kill connection to output
                notesByKeyCode[keyCode].key.sound.stop();
                // Remove key highlight
                notesByKeyCode[keyCode].key.html.className = 'key';
            }
        };

        var setWaveform = function(event) {
            for(var keyCode in notes) {
                notes[keyCode].key.sound.osc.type = this.value;
            }

            // Unfocus selector so value is not accidentally updated again while playing keys
            this.blur();
        };

        // Check for changes in the waveform selector and update all oscillators with the selected type
        waveFormSelector.addEventListener('change', setWaveform);

        window.addEventListener('keydown', playNote);
        window.addEventListener('keyup', endNote);
    }
    window.addEventListener('load', function() {
        createKeyboard(notesByKeyCode, 'keyboard');
    });
})();

