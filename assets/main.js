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

(function(){
  if(!('IntersectionObserver' in window)) return;

  if(
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ){
    return;
  }

  var targets = document.querySelectorAll('section:not(.hero)');

  if(!targets.length) return;

  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold:0.08
  });

  targets.forEach(function(element){
    element.classList.add('reveal');
    observer.observe(element);
  });
})();

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

(function(){
  var card = document.getElementById('soundCard');

  if(!card) return;

  var playBtn = document.getElementById('scPlay');
  var answers = card.querySelectorAll('.sc-answer');
  var teaser = document.getElementById('scTeaser');
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

  function stopOtherWordAudio(current){
    [audioShip, audioSheep].forEach(function(audio){
      if(audio !== current && !audio.paused){
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }

  function playWord(word, button){
    var audio = audioFor(word);

    stopOtherWordAudio(audio);
    audio.currentTime = 0;

    if(button){
      button.disabled = true;
    }

    audio.play().catch(function(){
      if(button){
        button.disabled = false;
      }
    });

    function restoreButton(){
      if(button){
        button.disabled = false;
      }

      audio.removeEventListener('ended', restoreButton);
    }

    audio.addEventListener('ended', restoreButton);
  }

  playBtn.addEventListener('click', function(){
    playWord(target, playBtn);

    answers.forEach(function(button){
      button.disabled = false;
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
    button.addEventListener('click', function(){
      playWord(button.getAttribute('data-word'), button);
    });
  });
})();
