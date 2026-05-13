(function(){
  function qs(sel, root){ return (root||document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }

  function hideLoader(){
    document.body.classList.remove('is-loading');
    qsa('.loader').forEach(function(loader){
      loader.classList.add('hide');
      setTimeout(function(){ if(loader && loader.parentNode) loader.parentNode.removeChild(loader); }, 800);
    });
  }
  window.addEventListener('load', function(){ setTimeout(hideLoader, 650); });
  setTimeout(hideLoader, 3200);

  var nav = qs('.nav');
  var hamb = qs('.hamb');
  if(hamb && nav){
    hamb.addEventListener('click', function(){ nav.classList.toggle('open'); });
    qsa('.nav-links a').forEach(function(a){ a.addEventListener('click', function(){ nav.classList.remove('open'); }); });
  }

  var reveal = qsa('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    reveal.forEach(function(el){ io.observe(el); });
  } else { reveal.forEach(function(el){ el.classList.add('in'); }); }

  qsa('video').forEach(function(v){
    v.addEventListener('error', function(){
      var note = document.createElement('div');
      note.style.padding = '18px';
      note.style.color = '#fff';
      note.style.background = '#111';
      note.textContent = 'Video could not load. Please open the live link or refresh the page.';
      if(v.parentNode && !v.parentNode.querySelector('.video-error')){
        note.className = 'video-error';
        v.parentNode.appendChild(note);
      }
    });
  });

  function initVanta(){
    if(!window.VANTA) return;
    try{
      if(qs('#home-vanta') && window.VANTA.BIRDS){
        window.VANTA.BIRDS({el:'#home-vanta',mouseControls:true,touchControls:true,gyroControls:false,minHeight:200,minWidth:200,scale:1,scaleMobile:1,backgroundColor:0xffffff,color1:0xcb8c42,color2:0x1a1a1c,birdSize:0.8,wingSpan:18,speedLimit:3,separation:40,alignment:28,cohesion:22,quantity:3});
      }
      if(qs('#portfolio-vanta') && window.VANTA.NET){
        window.VANTA.NET({el:'#portfolio-vanta',mouseControls:true,touchControls:true,gyroControls:false,minHeight:200,minWidth:200,scale:1,scaleMobile:1,color:0x5e5e5e,backgroundColor:0x0,points:10,maxDistance:20,spacing:18});
      }
      if(qs('#automation-vanta') && window.VANTA.WAVES){
        window.VANTA.WAVES({el:'#automation-vanta',mouseControls:true,touchControls:true,gyroControls:false,minHeight:200,minWidth:200,scale:1,scaleMobile:1,color:0x0,shininess:150,waveHeight:20,waveSpeed:1.15,zoom:0.84});
      }
      if(qs('#contact-vanta') && window.VANTA.NET){
        window.VANTA.NET({el:'#contact-vanta',mouseControls:true,touchControls:true,gyroControls:false,minHeight:200,minWidth:200,scale:1,scaleMobile:1,color:0xcb8c42,backgroundColor:0xffffff,points:8,maxDistance:18,spacing:20});
      }
    }catch(e){ console.warn('Vanta fallback active:', e); }
  }
  window.addEventListener('load', initVanta);
})();
