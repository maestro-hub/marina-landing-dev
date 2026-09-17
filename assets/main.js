(function(){
  var bar = document.getElementById('stickyCta');

  if(!bar) return;

  var shown = false;

  function onScroll(){
    var shouldShow = window.scrollY > window.innerHeight * 0.9;

    if(shouldShow !== shown){
      shown = shouldShow;
      bar.classList.toggle('visible', shouldShow);
    }
  }

  document.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
})();

var reducedMotion = !!(
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

(function(){
  var eggs = [
    {
      btn:document.getElementById('anthemRecord'),
      audio:document.getElementById('anthemAudio')
    },
    {
      btn:document.getElementById('queenRecord'),
      audio:document.getElementById('queenAudio')
    },
    {
      btn:document.getElementById('beatRecord'),
      audio:document.getElementById('beatAudio')
    }
  ].filter(function(item){
    return item.btn && item.audio;
  });

  if(!eggs.length) return;

  function stopAll(except){
    eggs.forEach(function(egg){
      if(egg !== except && !egg.audio.paused){
        egg.audio.pause();
        egg.audio.currentTime = 0;
        egg.btn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  eggs.forEach(function(egg){
    egg.btn.addEventListener('click', function(){
      if(egg.audio.paused){
        stopAll(egg);
        egg.audio.currentTime = 0;
        egg.btn.setAttribute('aria-pressed', 'true');

        egg.audio.play().catch(function(){
          egg.btn.setAttribute('aria-pressed', 'false');
        });
      } else {
        egg.audio.pause();
        egg.btn.setAttribute('aria-pressed', 'false');
      }
    });

    egg.audio.addEventListener('ended', function(){
      egg.btn.setAttribute('aria-pressed', 'false');
      egg.audio.currentTime = 0;
    });
  });
})();


// Опыт ship / sheep. Столбики — огибающая самих записей word-ship.mp3 и
// word-sheep.mp3 (окна по 20 мс, тишина по краям обрезана, общая шкала).
(function(){
  var card = document.getElementById('soundCard');

  if(!card) return;

  var WAVES = {
    ship:{
      start:0.22,
      end:0.78,
      vowel:[12, 18],
      label:'ɪ',
      bars:[0,0,.07,.13,.14,.19,.21,.19,.22,.22,.23,.17,.62,.87,.8,.54,.37,.22,.03,0,.01,0,0,.03,.09,.07,.03,.02]
    },
    sheep:{
      start:0.26,
      end:0.94,
      vowel:[14, 21],
      label:'iː',
      bars:[0,.03,.08,.2,.21,.24,.23,.25,.29,.25,.36,.32,.37,.25,.45,1,.99,.74,.47,.33,.18,.08,0,0,0,0,.07,.09,.04,.08,.04,.04,.01,.01]
    }
  };
  var LONGEST = 34;

  var playBtn = document.getElementById('scPlay');
  var answers = card.querySelectorAll('.sc-answer');
  var teaser = document.getElementById('scTeaser');
  var mystery = document.getElementById('scMystery');
  var feedback = document.getElementById('scFeedback');
  var feedbackText = document.getElementById('scFeedbackText');
  var audioShip = document.getElementById('scAudioShip');
  var audioSheep = document.getElementById('scAudioSheep');
  var miniButtons = card.querySelectorAll('.sc-mini');

  if(!playBtn || !audioShip || !audioSheep) return;

  var target = Math.random() < 0.5 ? 'ship' : 'sheep';
  var answered = false;

  function audioFor(word){
    return word === 'ship' ? audioShip : audioSheep;
  }

  function buildWave(el, word, withVowel){
    var data = WAVES[word];

    el.innerHTML = '';
    el.style.setProperty('--len', (data.bars.length / LONGEST).toFixed(4));

    data.bars.forEach(function(value){
      var bar = document.createElement('i');
      bar.style.setProperty('--h', Math.max(0.04, value));
      el.appendChild(bar);
    });

    if(withVowel){
      var n = data.bars.length;
      var mark = document.createElement('span');
      var label = document.createElement('em');

      mark.className = 'sc-vowel';
      mark.style.left = (data.vowel[0] / n * 100) + '%';
      mark.style.width = ((data.vowel[1] - data.vowel[0]) / n * 100) + '%';
      label.textContent = data.label;
      mark.appendChild(label);
      el.appendChild(mark);
    }
  }

  function paint(el, progress){
    var bars = el.querySelectorAll('i');
    var lit = Math.round(progress * bars.length);

    for(var i = 0; i < bars.length; i++){
      bars[i].classList.toggle('on', i < lit);
      bars[i].classList.toggle('head', progress < 1 && i === lit - 1);
    }
  }

  var running = null;

  function track(audio, word, el){
    if(running) cancelAnimationFrame(running);

    var data = WAVES[word];

    function frame(){
      var p = (audio.currentTime - data.start) / (data.end - data.start);
      paint(el, Math.max(0, Math.min(1, p)));

      if(!audio.paused && !audio.ended){
        running = requestAnimationFrame(frame);
      } else {
        running = null;
        paint(el, 1);
      }
    }

    running = requestAnimationFrame(frame);
  }

  function stopOtherWordAudio(current){
    [audioShip, audioSheep].forEach(function(audio){
      if(audio !== current && !audio.paused){
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }

  function playWord(word, button, waveEl){
    var audio = audioFor(word);

    stopOtherWordAudio(audio);
    audio.currentTime = 0;

    if(button){
      button.disabled = true;
    }

    function restoreButton(){
      if(button){
        button.disabled = false;
      }

      audio.removeEventListener('ended', restoreButton);
      audio.removeEventListener('pause', restoreButton);
    }

    audio.addEventListener('ended', restoreButton);
    audio.addEventListener('pause', restoreButton);

    audio.play().then(function(){
      if(waveEl) track(audio, word, waveEl);
    }).catch(function(){
      restoreButton();
      if(waveEl) paint(waveEl, 1);
    });
  }

  if(mystery) buildWave(mystery, target, false);

  card.querySelectorAll('[data-wave]').forEach(function(el){
    buildWave(el, el.getAttribute('data-wave'), true);
  });

  playBtn.addEventListener('click', function(){
    if(mystery) paint(mystery, 0);
    playWord(target, playBtn, mystery);

    answers.forEach(function(button){
      if(!answered) button.disabled = false;
    });
  });

  answers.forEach(function(button){
    button.addEventListener('click', function(){
      if(answered) return;

      answered = true;

      answers.forEach(function(answerButton){
        answerButton.setAttribute(
          'aria-pressed',
          String(answerButton === button)
        );
        answerButton.classList.toggle(
          'is-target',
          answerButton.getAttribute('data-word') === target
        );
      });

      var chosenWord = button.getAttribute('data-word');

      feedbackText.textContent = chosenWord === target
        ? 'Да, здесь звучало «' + target + '».'
        : 'Эти гласные легко спутать. Здесь звучало «' + target + '».';

      if(teaser){
        teaser.hidden = true;
      }

      if(feedback){
        feedback.hidden = false;
      }
    });
  });

  miniButtons.forEach(function(button){
    var word = button.getAttribute('data-word');
    var waveEl = card.querySelector('[data-wave="' + word + '"]');

    button.addEventListener('click', function(){
      playWord(word, button, waveEl);
    });
  });
})();

// Атлас звуков: контур языка — одна линия, которая перетекает между
// артикуляциями; нижняя челюсть поворачивается вокруг сустава.
(function(){
  var row = document.querySelector('.sound-row');
  var tongue = document.getElementById('atlasTongue');
  var jaw = document.getElementById('atlasJaw');
  var glyph = document.getElementById('atlasGlyph');
  var text = document.getElementById('atlasText');

  if(!row || !tongue || !jaw) return;

  var neck = document.getElementById('atlasNeck');

  var SOUNDS = {
    i:{
      jaw:-1,
      glyph:'iː',
      caption:'/iː/ FLEECE: язык поднят высоко и продвинут вперёд, губы слегка растянуты. Звук долгий.',
      d:'M116.9 163.3 C124.9 159.3 119 154 113 140 C124 112 152 98 188 100 C224 104 248 134 254 176 C258 204 258 232 254 256'
    },
    ae:{
      jaw:-10,
      glyph:'æ',
      caption:'/æ/ TRAP: челюсть опущена, язык лежит низко и впереди, рот открыт широко.',
      d:'M126.5 183.5 C134.5 179.5 126 176 120 162 C140 154 170 150 202 154 C232 160 250 182 256 210 C258 228 258 242 254 256'
    },
    er:{
      jaw:-4,
      glyph:'ɜː',
      caption:'/ɜː/ NURSE: язык в центре рта, губы нейтральные, не округлены. Звук долгий.',
      d:'M119.7 170.2 C127.7 166.2 121 164 115 150 C136 134 166 122 198 124 C230 126 250 152 256 188 C258 212 258 234 254 256'
    },
    th:{
      jaw:-5,
      glyph:'θ',
      caption:'/θ/ THOUGHT: кончик языка между зубами, воздух проходит без участия голоса.',
      d:'M120.8 172.5 C128 157 106 143 92 137 C112 132 148 120 188 120 C226 122 248 148 256 188 C258 212 258 234 254 256'
    }
  };

  var NUM = /-?\d+(\.\d+)?/g;
  var template = SOUNDS.i.d.replace(NUM, '#');

  function numbers(d){
    return d.match(NUM).map(Number);
  }

  function toPath(values){
    var i = 0;
    return template.replace(/#/g, function(){
      return (Math.round(values[i++] * 10) / 10).toString();
    });
  }

  // cubic-bezier(.77,0,.175,1): сильный ease-in-out для движения внутри схемы
  function easeInOut(t){
    var x1 = .77, y1 = 0, x2 = .175, y2 = 1;
    var u = t;

    for(var i = 0; i < 6; i++){
      var x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u - t;
      var dx = 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);

      if(Math.abs(dx) < 1e-6) break;
      u = Math.min(1, Math.max(0, u - x / dx));
    }

    return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  }

  var current = { values:numbers(SOUNDS.i.d), jaw:SOUNDS.i.jaw };
  var anim = null;

  // Кожа шеи крепится к концу нижней челюсти, поэтому её начало
  // поворачивается вместе с челюстью вокруг сустава (250, 112).
  function draw(values, angle){
    tongue.setAttribute('d', toPath(values));
    jaw.setAttribute('transform', 'rotate(' + angle.toFixed(2) + ' 250 112)');

    if(neck){
      var a = angle * Math.PI / 180;
      var dx = 186 - 250;
      var dy = 222 - 112;
      var ex = 250 + dx * Math.cos(a) - dy * Math.sin(a);
      var ey = 112 + dx * Math.sin(a) + dy * Math.cos(a);
      neck.setAttribute('d', 'M' + ex.toFixed(1) + ' ' + ey.toFixed(1) + ' C' + (ex + 8).toFixed(1) + ' ' + (ey + 34).toFixed(1) + ' 206 296 204 334');
    }
  }

  function go(key){
    var next = SOUNDS[key];

    if(!next) return;

    var from = current.values.slice();
    var to = numbers(next.d);
    var jawFrom = current.jaw;
    var start = null;
    var DURATION = 480;

    if(anim) cancelAnimationFrame(anim);

    if(reducedMotion){
      current = { values:to, jaw:next.jaw };
      draw(to, next.jaw);
    } else {
      anim = requestAnimationFrame(function step(now){
        if(start === null) start = now;

        var t = Math.min(1, (now - start) / DURATION);
        var e = easeInOut(t);
        var values = from.map(function(v, i){ return v + (to[i] - v) * e; });
        var angle = jawFrom + (next.jaw - jawFrom) * e;

        current = { values:values, jaw:angle };
        draw(values, angle);

        if(t < 1){
          anim = requestAnimationFrame(step);
        } else {
          anim = null;
        }
      });
    }

    if(glyph){
      glyph.textContent = next.glyph;

      if(!reducedMotion && glyph.animate){
        glyph.animate(
          [{ opacity:.35, filter:'blur(2px)' }, { opacity:1, filter:'blur(0)' }],
          { duration:220, easing:'cubic-bezier(.23,1,.32,1)' }
        );
      }
    }

    if(text){
      text.textContent = next.caption;
    }
  }

  var keys = row.querySelectorAll('[data-sound]');

  keys.forEach(function(button){
    button.addEventListener('click', function(){
      keys.forEach(function(other){
        other.setAttribute('aria-pressed', String(other === button));
      });

      go(button.getAttribute('data-sound'));
    });
  });
})();
