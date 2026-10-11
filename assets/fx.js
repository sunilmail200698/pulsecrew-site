/* PulseCrew shared immersive effects. Every effect is purely visual and never touches links, buttons or forms. */
(function(){
  try{
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var root = document.documentElement;
    var hero = document.querySelector('.hero');

    if (reduce || !('IntersectionObserver' in window)) return;   /* no motion: page stays exactly as it was */

    /* ---- hero layer: network canvas, ECG line, chips ---- */
    var canvas = null;
    if (hero && !hero.querySelector('.fx-deco')){
      var d = document.createElement('div'); d.className='fx-deco'; d.setAttribute('aria-hidden','true');
      d.innerHTML =
        '<span class="fx-spot"></span><canvas class="fx-net"></canvas>'+
        '<svg class="fx-ecg" viewBox="0 0 1200 180" preserveAspectRatio="none"><defs><linearGradient id="fxEcgGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1200" y2="0"><stop offset="0" stop-color="#1e40af"/><stop offset=".3" stop-color="#2563eb"/><stop offset=".6" stop-color="#60a5fa"/><stop offset="1" stop-color="#e0f2fe"/></linearGradient></defs><path d="M0 100 L330 100 L370 100 L395 60 L420 140 L450 20 L485 165 L515 100 L1200 100"/></svg>'+
        '<span class="fx-chip c1"><i></i>ICU nurse matched</span>'+
        '<span class="fx-chip c2"><i></i>GNC verified</span>'+
        '<span class="fx-chip c3"><i></i>OT shift filled · 12 min</span>'+
        '<span class="fx-chip c4"><i></i>ER cover confirmed</span>'+
        '<span class="fx-chip c5"><i></i>Live matching</span>'+
        '<span class="fx-hint">'+((window.matchMedia&&matchMedia('(hover:none)').matches)?'Tap anywhere to send a shift':'Move your cursor · click to send a shift')+'</span>';
      hero.insertBefore(d, hero.firstChild);
      hero.classList.add('fx-dark');
      canvas = d.querySelector('canvas');
    }

    if (canvas){
      var ctx = canvas.getContext('2d'), W=0, H=0, dpr=1, nodes=[], pulses=[], rings=[], mouse={x:-999,y:-999}, run=false, vis=true, last=0, spawn=0;
      function size(){
        dpr = Math.min(window.devicePixelRatio||1, 2);
        W = hero.clientWidth; H = hero.clientHeight;
        canvas.width = W*dpr; canvas.height = H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
        var n = Math.max(34, Math.min(96, Math.round(W*H/11000)));
        nodes = [];
        for (var i=0;i<n;i++){ var bx=(Math.random()-.5)*.28, by=(Math.random()-.5)*.28; nodes.push({x:Math.random()*W,y:Math.random()*H,vx:bx,vy:by,bx:bx,by:by,r:1.2+Math.random()*1.6}); }
      }
      var LINK = 175;
      function frame(t){
        if (!run) return;
        var dt = Math.min(48, t-last||16); last = t;
        ctx.clearRect(0,0,W,H);
        var i,j,a,b,dx,dy,dist;
        for (i=0;i<nodes.length;i++){ a=nodes[i]; a.vx+=(a.bx-a.vx)*.03; a.vy+=(a.by-a.vy)*.03; a.x+=a.vx*dt/16; a.y+=a.vy*dt/16;
          if(a.x<0||a.x>W) a.vx*=-1; if(a.y<0||a.y>H) a.vy*=-1; }
        ctx.lineWidth=1;
        for (i=0;i<nodes.length;i++){ a=nodes[i];
          for (j=i+1;j<nodes.length;j++){ b=nodes[j]; dx=a.x-b.x; dy=a.y-b.y; dist=dx*dx+dy*dy;
            if (dist<LINK*LINK){ ctx.strokeStyle='rgba(147,197,253,'+(0.34*(1-Math.sqrt(dist)/LINK))+')';
              ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } }
          dx=a.x-mouse.x; dy=a.y-mouse.y; dist=Math.sqrt(dx*dx+dy*dy);
          if (dist<230){ ctx.strokeStyle='rgba(34,211,238,'+(0.75*(1-dist/230))+')'; ctx.lineWidth=1.3; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(mouse.x,mouse.y); ctx.stroke(); ctx.lineWidth=1;
            if (dist>60){ var f=(1-dist/230)*.035; a.vx-=dx/dist*f; a.vy-=dy/dist*f; } } }
        for (i=0;i<nodes.length;i++){ a=nodes[i]; dx=a.x-mouse.x; dy=a.y-mouse.y; var near=Math.sqrt(dx*dx+dy*dy)<230;
          ctx.fillStyle=a.own?'rgba(52,211,153,.95)':(near?'rgba(165,243,252,.98)':'rgba(191,219,254,.85)');
          ctx.beginPath(); ctx.arc(a.x,a.y,a.r+(near?.8:0)+(a.own?1:0),0,6.283); ctx.fill(); }
        /* "shift matched" pulses travelling along links */
        spawn+=dt; if (spawn>650 && pulses.length<9){ spawn=0;
          a=nodes[(Math.random()*nodes.length)|0];
          for (j=0;j<nodes.length;j++){ b=nodes[j]; dx=a.x-b.x; dy=a.y-b.y; if(b!==a && dx*dx+dy*dy<LINK*LINK){ pulses.push({a:a,b:b,p:0}); break; } } }
        for (i=pulses.length-1;i>=0;i--){ var p=pulses[i]; p.p+=dt/700; if(p.p>=1){ pulses.splice(i,1); continue; }
          if(p.p<0) continue; var x=p.a.x+(p.b.x-p.a.x)*p.p, y=p.a.y+(p.b.y-p.a.y)*p.p;
          var g=ctx.createRadialGradient(x,y,0,x,y,12); g.addColorStop(0,'rgba(52,211,153,.95)'); g.addColorStop(1,'rgba(52,211,153,0)');
          ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,12,0,6.283); ctx.fill(); }
        /* click / tap ripples */
        for (i=rings.length-1;i>=0;i--){ var rg=rings[i]; rg.p+=dt/650; if(rg.p>=1){ rings.splice(i,1); continue; }
          ctx.strokeStyle='rgba(96,165,250,'+(0.7*(1-rg.p))+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(rg.x,rg.y,rg.p*190,0,6.283); ctx.stroke(); }
        requestAnimationFrame(frame);
      }
      function burst(x,y){
        rings.push({x:x,y:y,p:0});
        var own={x:x,y:y,vx:0,vy:0,bx:0,by:0,r:2.4,own:true}; nodes.push(own);
        var mine=nodes.filter(function(n){return n.own;}); if(mine.length>14){ nodes.splice(nodes.indexOf(mine[0]),1); }
        var near=nodes.filter(function(n){return n!==own;}).sort(function(m,n){ return ((m.x-x)*(m.x-x)+(m.y-y)*(m.y-y))-((n.x-x)*(n.x-x)+(n.y-y)*(n.y-y)); }).slice(0,6);
        near.forEach(function(n,k){ pulses.push({a:own,b:n,p:-k*.1}); });
        if (pulses.length>40) pulses.splice(0,pulses.length-40);
      }
      function start(){ if(!run && vis && !document.hidden){ run=true; last=0; requestAnimationFrame(frame); } }
      function stop(){ run=false; }
      size();
      if (window.ResizeObserver) new ResizeObserver(function(){ size(); }).observe(hero); else addEventListener('resize', size);
      new IntersectionObserver(function(es){ vis=es[0].isIntersecting; vis?start():stop(); }).observe(hero);
      document.addEventListener('visibilitychange', function(){ document.hidden?stop():start(); });
      var hint = hero.querySelector('.fx-hint');
      function hideHint(){ if(hint){ hint.classList.add('gone'); hint=null; } }
      hero.addEventListener('pointermove', function(e){
        var r=hero.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top;
        hero.style.setProperty('--sx',mouse.x+'px'); hero.style.setProperty('--sy',mouse.y+'px');
        hero.style.setProperty('--px',((mouse.x/r.width)*2-1).toFixed(3)); hero.style.setProperty('--py',((mouse.y/r.height)*2-1).toFixed(3));
        hero.classList.add('fx-hover'); }, {passive:true});
      hero.addEventListener('pointerleave', function(){ mouse.x=mouse.y=-999; hero.classList.remove('fx-hover'); hero.style.setProperty('--px',0); hero.style.setProperty('--py',0); });
      /* click or tap on empty hero space sends a "shift"; real links, buttons and fields are left alone */
      hero.addEventListener('pointerdown', function(e){
        if (e.target.closest && e.target.closest('a,button,input,select,textarea,label,summary')) return;
        var r=hero.getBoundingClientRect(); burst(e.clientX-r.left, e.clientY-r.top); hideHint(); });
      start();
    }

    /* ---- progress bar ---- */
    var bar = document.createElement('div'); bar.className='fx-progress'; bar.setAttribute('aria-hidden','true'); document.body.appendChild(bar);
    var ticking=false;
    function upd(){ var h=document.documentElement.scrollHeight-innerHeight; bar.style.transform='scaleX('+(h>0?Math.min(1,scrollY/h):0)+')'; ticking=false; }
    addEventListener('scroll', function(){ if(!ticking){ ticking=true; requestAnimationFrame(upd);} }, {passive:true}); upd();

    /* ---- card spotlight follows the cursor ---- */
    if (window.matchMedia && matchMedia('(hover:hover)').matches){
      document.addEventListener('pointermove', function(e){
        var c = e.target.closest && e.target.closest('.feature-card,.compare-card'); if(!c) return;
        var r=c.getBoundingClientRect(); c.style.setProperty('--mx',(e.clientX-r.left)+'px'); c.style.setProperty('--my',(e.clientY-r.top)+'px');
      }, {passive:true});
    }

    /* ---- scroll reveal: content blocks only, never buttons/links/forms ---- */
    var sel = 'main > section:not(.site-page):not(.hero) .section-head, .compare-card, .feature-card, .step, .faq-item, .section-cta, .phone, .compliance-wrap > *, #about .wrap > *, .cta-band .wrap > *';
    var els = Array.prototype.slice.call(document.querySelectorAll(sel));
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('fx-in'); io.unobserve(e.target); } });
    }, {threshold:.12, rootMargin:'0px 0px -6% 0px'});
    els.forEach(function(el){
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty('--fx-d', Math.min(sib,5)*100+'ms');
      el.classList.add('fx-reveal'); io.observe(el);
    });

    /* ---- hero entrance ---- */
    var kids = hero ? hero.querySelectorAll('.hero-grid > *') : [];
    Array.prototype.forEach.call(kids, function(k,i){ k.style.setProperty('--i', i); });
    root.classList.add('fx');
    var go = function(){ root.classList.add('fx-go'); };
    var loader = document.getElementById('pageLoader');
    if (loader && !loader.classList.contains('hidden')){
      var mo = new MutationObserver(function(){ if(loader.classList.contains('hidden')){ mo.disconnect(); go(); } });
      mo.observe(loader,{attributes:true,attributeFilter:['class']});
      setTimeout(go, 6000);                                      /* failsafe */
    } else { requestAnimationFrame(go); }

    /* failsafe: never leave content hidden if the observer misbehaves */
    setTimeout(function(){ els.forEach(function(el){ if(!el.classList.contains('fx-in')){ var r=el.getBoundingClientRect(); if(r.top<innerHeight) el.classList.add('fx-in'); } }); }, 2500);
  }catch(err){ document.documentElement.classList.remove('fx'); }
})();

(function(){
  try{
    var root=document.documentElement;
    if(!root.classList.contains('fx')) return;               /* part 1 stood down (reduced motion etc.) */
    var $=function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
    var hoverOK = window.matchMedia && matchMedia('(hover:hover)').matches;

    /* ---- stats band with counters (figures taken from claims already on this page) ---- */
    var hero=document.querySelector('.hero');
    if(hero && !document.querySelector('.fx-stats')){
      var items=[['<',30,' min','Average shift match time'],['',100,'%','GNC-verified talent'],['',3,'','Critical-care specialties: ICU, OT, ER'],['',1,' flat fee','Per shift, no hidden markups']];
      var sec=document.createElement('section'); sec.className='fx-stats'; sec.setAttribute('aria-label','PulseCrew at a glance');
      sec.innerHTML='<div class="wrap fx-stats-grid">'+items.map(function(it){
        return '<div class="fx-stat"><b data-pre="'+it[0]+'" data-to="'+it[1]+'" data-suf="'+it[2]+'">'+it[0]+it[1]+it[2]+'</b><span>'+it[3]+'</span></div>'; }).join('')+'</div>';
      hero.parentNode.insertBefore(sec, hero.nextSibling);
      var cio=new IntersectionObserver(function(es){ es.forEach(function(e){ if(!e.isIntersecting) return; cio.unobserve(e.target);
        $('b',e.target).forEach(function(b){ var to=+b.dataset.to, pre=b.dataset.pre, suf=b.dataset.suf, t0=performance.now();
          (function tick(t){ var k=Math.min(1,(t-t0)/1500), v=Math.round(to*(1-Math.pow(1-k,3))); b.textContent=pre+v+suf; if(k<1) requestAnimationFrame(tick); })(t0); }); }); },{threshold:.4});
      cio.observe(sec);
    }

    /* ---- reveal list items one by one ---- */
    var li=$('.compare-list li, .check-list li'), seen=new Set();
    var lio=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('fx-in'); lio.unobserve(e.target); } }); },{threshold:.3});
    $('.compare-list, .check-list').forEach(function(ul){ $('li',ul).forEach(function(l,i){ l.classList.add('fx-reveal'); l.style.setProperty('--fx-d',(250+i*130)+'ms'); lio.observe(l); }); });

    /* ---- mark cards "done" once their reveal has settled, then allow tilt ---- */
    var dio=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting && e.target.classList.contains('fx-in') || e.isIntersecting){
        var el=e.target; dio.unobserve(el); setTimeout(function(){ el.classList.add('fx-done'); },1300); } }); },{threshold:.12});
    $('.feature-card, .compare-card').forEach(function(c){ dio.observe(c); });
    if(hoverOK){
      document.addEventListener('pointermove',function(e){
        var c=e.target.closest&&e.target.closest('.feature-card,.compare-card'); if(!c||!c.classList.contains('fx-done')) return;
        var r=c.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
        c.style.setProperty('--ry',(x*9).toFixed(2)+'deg'); c.style.setProperty('--rx',(-y*9).toFixed(2)+'deg'); c.classList.add('fx-tilting'); },{passive:true});
      document.addEventListener('pointerout',function(e){ var c=e.target.closest&&e.target.closest('.fx-tilting'); if(c && !(e.relatedTarget&&c.contains(e.relatedTarget))) c.classList.remove('fx-tilting'); });
    }

    /* ---- how it works: auto-cycling active step, hover to take over ---- */
    var steps=$('.steps .step');
    if(steps.length){
      var cur=-1, paused=false, inView=false, timer=null;
      var setA=function(i){ cur=i; steps.forEach(function(s,k){ s.classList.toggle('fx-active',k===i); }); };
      var next=function(){ if(!paused && inView) setA((cur+1)%steps.length); };
      steps.forEach(function(s,i){ if(hoverOK){ s.addEventListener('pointerenter',function(){ paused=true; setA(i); }); s.addEventListener('pointerleave',function(){ paused=false; }); } });
      new IntersectionObserver(function(es){ inView=es[0].isIntersecting; if(inView){ if(cur<0) setA(0); if(!timer) timer=setInterval(next,2600); } else { clearInterval(timer); timer=null; } },{threshold:.35}).observe($('.steps')[0]);
    }

    /* ---- parallax glow orbs behind the content sections ---- */
    var orbSecs=['hospitals','nurses','about','faq'].map(function(id){ return document.getElementById(id); }).filter(Boolean), orbs=[];
    orbSecs.forEach(function(s){ s.classList.add('fx-has-orb');
      ['l','r'].forEach(function(side){ var o=document.createElement('span'); o.className='fx-orb '+side; o.setAttribute('aria-hidden','true'); s.insertBefore(o,s.firstChild); orbs.push({el:o,sec:s,k:side==='l'?-.12:.16}); }); });
    var oT=false; function orbUpd(){ var h=innerHeight; orbs.forEach(function(o){ var r=o.sec.getBoundingClientRect(); if(r.bottom<-200||r.top>h+200) return; o.el.style.setProperty('--oy',((r.top+r.height/2-h/2)*o.k).toFixed(1)+'px'); }); oT=false; }
    addEventListener('scroll',function(){ if(!oT){ oT=true; requestAnimationFrame(orbUpd); } },{passive:true}); orbUpd();

    /* ---- compliance shield rings ---- */
    var sw=$('.shield-wrap')[0]; if(sw){ ['a','b'].forEach(function(c){ var r=document.createElement('span'); r.className='fx-ring '+c; r.setAttribute('aria-hidden','true'); sw.insertBefore(r,sw.firstChild); }); }

    /* ---- closing band spotlight ---- */
    var cta=$('.cta-band')[0];
    if(cta && hoverOK){
      var sp=document.createElement('span'); sp.className='fx-spot2'; sp.setAttribute('aria-hidden','true'); cta.insertBefore(sp,cta.firstChild);
      cta.addEventListener('pointermove',function(e){ var r=cta.getBoundingClientRect(); cta.style.setProperty('--sx',(e.clientX-r.left)+'px'); cta.style.setProperty('--sy',(e.clientY-r.top)+'px'); cta.classList.add('fx-hover'); },{passive:true});
      cta.addEventListener('pointerleave',function(){ cta.classList.remove('fx-hover'); });
    }
  }catch(err){ /* decorative only: ignore */ }
})();

(function(){
  try{
    var root=document.documentElement; if(!root.classList.contains('fx')) return;
    var $=function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };

    /* ---- ticker after "How it works" (every phrase is a claim already on this page) ---- */
    var steps=document.querySelector('.steps'), host=steps && steps.closest('section');
    if(host && !document.querySelector('.fx-ticker')){
      var words=['Real-time matching','GNC-verified nurses','ICU · OT · ER','One flat per-shift fee','No hidden markups','Compliance logged automatically'];
      var set='<div class="fx-ticker-set">'+words.map(function(w,i){ return '<span class="fx-ticker-item'+(i%2?' f':'')+'">'+w+'</span><span class="fx-ticker-dot"></span>'; }).join('')+'</div>';
      var t=document.createElement('div'); t.className='fx-ticker'; t.setAttribute('aria-hidden','true');
      t.innerHTML='<div class="fx-ticker-track">'+set+set+'</div>';
      host.parentNode.insertBefore(t, host.nextSibling);
    }

    /* ---- compliance panel goes dark ---- */
    var comp=document.getElementById('compliance'); if(comp) comp.classList.add('fx-dark');

    /* ---- cursor light (mouse devices only) ---- */
    if(window.matchMedia && matchMedia('(hover:hover)').matches){
      var g=document.createElement('div'); g.className='fx-glow-cursor'; g.setAttribute('aria-hidden','true'); document.body.appendChild(g);
      var tx=0,ty=0,x=0,y=0,run=false;
      function loop(){ x+=(tx-x)*.65; y+=(ty-y)*.65; g.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px)'; if(Math.abs(tx-x)>.3||Math.abs(ty-y)>.3) requestAnimationFrame(loop); else run=false; }
      document.addEventListener('pointermove',function(e){ tx=e.clientX; ty=e.clientY; g.classList.add('on'); if(!run){ run=true; requestAnimationFrame(loop); } },{passive:true});
      document.addEventListener('pointerleave',function(){ g.classList.remove('on'); });
    }

    /* ---- floating crosses ---- */
    var svg='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    var spots=[['l',4,12,26,15,0],['r',5,34,18,12,-3],['l',9,62,30,17,-6],['r',7,80,22,13,-2],['l',3,90,16,11,-8]];
    ['hospitals','nurses','about','faq'].forEach(function(id){
      var sec=document.getElementById(id); if(!sec) return;
      spots.forEach(function(sp){ var c=document.createElement('span'); c.className='fx-cross'; c.setAttribute('aria-hidden','true'); c.innerHTML=svg;
        c.style[sp[0]==='l'?'left':'right']=sp[1]+'%'; c.style.top=sp[2]+'%'; c.style.setProperty('--s',sp[3]+'px'); c.style.setProperty('--d',sp[4]+'s'); c.style.setProperty('--dl',sp[5]+'s'); sec.insertBefore(c,sec.firstChild); });
      sec.classList.add('fx-has-orb');
    });
  }catch(err){}
})();

(function(){
  try{
    var root=document.documentElement; if(!root.classList.contains('fx')) return;
    var f=document.querySelector('footer'); if(!f || f.querySelector('.fx-foot-mark')) return;
    f.classList.add('fx-foot');
    var m=document.createElement('div'); m.className='fx-foot-mark'; m.setAttribute('aria-hidden','true'); m.textContent='PULSECREW'; f.appendChild(m);
    if(window.matchMedia && matchMedia('(hover:hover)').matches){
      f.addEventListener('pointermove',function(e){ var r=m.getBoundingClientRect(); m.style.setProperty('--mx',(e.clientX-r.left)+'px'); m.style.setProperty('--my',(e.clientY-r.top)+'px'); },{passive:true});
      f.addEventListener('pointerleave',function(){ m.style.setProperty('--mx','-999px'); m.style.setProperty('--my','-999px'); });
    }
    var items=Array.prototype.slice.call(f.querySelectorAll('.footer-grid > *, .footer-bottom'));
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('fx-in'); io.unobserve(e.target); } }); },{threshold:.15});
    items.forEach(function(el,i){ el.classList.add('fx-reveal'); el.style.setProperty('--fx-d',(i*120)+'ms'); io.observe(el); });
    setTimeout(function(){ items.forEach(function(el){ if(!el.classList.contains('fx-in') && el.getBoundingClientRect().top<innerHeight) el.classList.add('fx-in'); }); },2500);
  }catch(err){}
})();
