(function(){
  var scene = document.querySelector('.scene');

  if(!scene) return;

  var reducedMotion = !!(
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // стрелки Биг-Бена идут по лондонскому времени
  var CX = 120;
  var CY = 575;
  var hourHand = scene.querySelector('[data-hand="hour"]');
  var minuteHand = scene.querySelector('[data-hand="minute"]');
  var clock = new Intl.DateTimeFormat('en-GB', {
    timeZone:'Europe/London', hour:'numeric', minute:'numeric', second:'numeric', hourCycle:'h23'
  });

  function tick(){
    var t = {};

    clock.formatToParts(new Date()).forEach(function(part){
      t[part.type] = Number(part.value);
    });

    var minutes = t.minute + t.second / 60;
    var hours = (t.hour % 12) + minutes / 60;

    minuteHand.setAttribute('transform', 'rotate(' + (minutes * 6).toFixed(2) + ' ' + CX + ' ' + CY + ')');
    hourHand.setAttribute('transform', 'rotate(' + (hours * 30).toFixed(2) + ' ' + CX + ' ' + CY + ')');
  }

  tick();
  setInterval(tick, reducedMotion ? 60000 : 1000);

  if(reducedMotion) return;

  // при прокрутке башня поднимается и приближается, дальние планы отстают, к финалу светлеет горизонт
  var layers = Array.prototype.slice.call(scene.querySelectorAll('.scene-layer'));
  var tower = scene.querySelector('.scene-tower');
  var glint = scene.querySelector('.scene-glint');
  var pending = false;

  function place(){
    pending = false;

    var vh = window.innerHeight;
    var y = window.scrollY;
    var hero = Math.min(1, y / vh);
    var page = Math.min(1, y / Math.max(1, document.documentElement.scrollHeight - vh));

    // башня уходит к правому краю, чтобы не лечь под текст: на широком экране — после первого экрана, на узком — сразу
    var wide = window.innerWidth > 980;
    var visible = Math.min(1600, 1000 * window.innerWidth / vh);
    var edge = 800 + visible * (wide ? 0.26 : 0.4) - 889;
    var drift = wide ? hero * edge : edge;

    layers.forEach(function(layer){
      var depth = Number(layer.getAttribute('data-depth')) || 0;
      var shift = -(hero * 70 + page * 120) * depth;
      var isTower = layer === tower;
      var follows = isTower || layer === glint;
      var scale = isTower ? 1 + hero * 0.06 + page * 0.08 : 1;

      layer.style.transform = 'translate(' + (follows ? drift : 0).toFixed(1) + 'px,' + shift.toFixed(1) + 'px) scale(' + scale.toFixed(4) + ')';
    });

    scene.style.setProperty('--dawn', Math.max(0, (page - 0.7) / 0.3).toFixed(3));
  }

  function request(){
    if(!pending){
      pending = true;
      requestAnimationFrame(place);
    }
  }

  document.addEventListener('scroll', request, { passive:true });
  window.addEventListener('resize', request);
  place();
})();
