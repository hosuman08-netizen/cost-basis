
(function(){
  var root=document.getElementById('app');
  var SHARE_BASE='https://hosuman08-netizen.github.io/cost-basis/';
  function dayKey(off){
    var d=new Date(); d.setDate(d.getDate()+(off||0));
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function kId(){
    try{
      var id=localStorage.getItem('cb_k_id');
      if(!id){id='c'+Math.random().toString(36).slice(2,8);localStorage.setItem('cb_k_id',id);}
      return id;
    }catch(e){return 'share';}
  }
  function shareUrl(){return SHARE_BASE+'?utm_source=share&utm_medium=app&ref='+encodeURIComponent(kId());}
  function bumpStreak(){
    try{
      var st=JSON.parse(localStorage.getItem('cb_streak')||'{}');
      if(!st||typeof st!=='object')st={last:null,count:0};
      var t=dayKey(0);
      if(st.last===t) return st;
      var y=dayKey(-1),y2=dayKey(-2),froze=false;
      if(st.last && st.last!==y && st.last===y2 && (st.count||0)>=3){
        var ready=!st.shieldLast||((new Date(t)-new Date(st.shieldLast))/86400000)>=7;
        if(ready){st.shieldLast=t;st.last=y;froze=true;try{legionTrack('streak_freeze',{count:st.count})}catch(e){}}
      }
      st.count=(st.last===y)?(st.count||0)+1:1;
      st.last=t;
      localStorage.setItem('cb_streak',JSON.stringify(st));
      try{legionTrack('streak',{count:st.count,froze:froze})}catch(e){}
      return st;
    }catch(e){return {count:0};}
  }
  function fomoLeft(){
    var end=new Date(); end.setHours(24,0,0,0);
    var ms=Math.max(0,end-Date.now());
    return Math.floor(ms/3600000)+'h '+Math.floor((ms%3600000)/60000)+'m';
  }
  function todayCalcs(){try{return +(localStorage.getItem('cb_day_'+dayKey(0))||0);}catch(e){return 0;}}
  function bumpTodayCalc(){try{localStorage.setItem('cb_day_'+dayKey(0),String(todayCalcs()+1));}catch(e){}}
  var st=JSON.parse(localStorage.getItem('cb_streak')||'{}');
  var sc=st.count||0;
  var ready=!st.shieldLast||((new Date(dayKey(0))-new Date(st.shieldLast))/86400000)>=7;
  var tc=todayCalcs();
  var goal=2, gPct=Math.min(100,Math.round(tc/goal*100));
  var ydn=+(localStorage.getItem('cb_day_'+dayKey(-1))||0);
  root.innerHTML='<div class="card disclaimer" style="border-color:#67e8f9;color:#67e8f9;font-size:12px">투자 권유 아님. 본인 기록용 계산 · 로컬만</div>'
    +'<div class="card"><span class="chip">🔥 '+sc+'일'+(sc>=3&&ready?' · 🛡️':'')+'</span> <span class="chip">오늘 계산 '+tc+'/'+goal+'</span> <span class="chip">전일 '+(tc-ydn>=0?'+':'')+(tc-ydn)+'</span> <span class="chip">리셋 '+fomoLeft()+'</span>'
    +'<div style="height:6px;background:#1c1826;border-radius:4px;margin-top:8px;overflow:hidden"><i id="cbGoalBar" style="display:block;height:100%;width:'+gPct+'%;background:#67e8f9"></i></div></div>'
    +'<div class="card"><label class="sub">자산명(선택)</label><input id="asset" type="text" placeholder="예: BTC" value="'+(localStorage.getItem('cb_asset')||'')+'"/>'+'<label class="sub">보유 수량</label><input id="qty" type="number" step="any" placeholder="예: 0.5"/>'
    +'<label class="sub">총 매수 원금(원)</label><input id="cost" type="number" placeholder="예: 25000000"/>'
    +'<label class="sub">현재가(원)</label><input id="px" type="number" placeholder="예: 95000000"/>'
    +'<button id="go">계산</button><div id="out" class="sub" style="margin-top:10px">값을 넣고 계산하세요</div></div>'
    +'<div class="card" id="moneyPipe" style="text-align:center;font-size:12px">'
    +'<div style="color:#67e8f9;font-weight:700;margin-bottom:6px">💎 투명 금융 크로스</div>'
    +'<a style="color:#ece8f1;margin:0 6px" href="https://hosuman08-netizen.github.io/budget-pulse/?utm_source=costbasis&utm_medium=pipe">💓 Budget</a>'
    +'<a style="color:#ece8f1;margin:0 6px" href="https://hosuman08-netizen.github.io/etf-flow/?utm_source=costbasis&utm_medium=pipe">📈 ETF Flow</a>'
    +'<a style="color:#e0b552;margin:0 6px" href="https://hosuman08-netizen.github.io/legion-hub/?utm_source=costbasis&utm_medium=pipe">🎮 Arcade</a>'
    +'</div>'
    +'<button id="share" style="width:100%;margin-top:8px;padding:11px;border:0;border-radius:10px;background:#1c1826;color:#ece8f1;font-weight:700">결과 공유 문구</button>';
  var lastLine='';
  document.getElementById('go').onclick=function(){
    var q=+document.getElementById('qty').value||0,c=+document.getElementById('cost').value||0,p=+document.getElementById('px').value||0;
    if(!q){document.getElementById('out').textContent='수량 입력';return;}
    var avg=c/q, val=p*q, pnl=val-c, pct=c?Math.round(pnl/c*1000)/10:0;
    try{var asset=(document.getElementById('asset')&&document.getElementById('asset').value)||''; localStorage.setItem('cb_asset',asset); var hist=JSON.parse(localStorage.getItem('cb_hist')||'[]'); var prev=hist[0]; hist.unshift({q:q,c:c,p:p,pnl:pnl,asset:asset,ts:Date.now()}); localStorage.setItem('cb_hist',JSON.stringify(hist.slice(0,12))); if(prev){ var dlt=pnl-prev.pnl; lastLine=(asset?asset+' ':'')+'원가 손익 '+Math.round(pnl).toLocaleString()+'원 ('+pct+'%) · 직전대비 '+(dlt>=0?'+':'')+Math.round(dlt).toLocaleString(); } }catch(e){}
    var assetN=(document.getElementById('asset')&&document.getElementById('asset').value)||'';
    document.getElementById('out').innerHTML='평균단가 <b>'+Math.round(avg).toLocaleString()+'</b><br>평가액 <b>'+Math.round(val).toLocaleString()+'</b><br>손익 <b style="color:'+(pnl>=0?'var(--ok)':'var(--bad)')+'">'+Math.round(pnl).toLocaleString()+' ('+pct+'%)</b>'+(lastLine&&lastLine.indexOf('직전')>=0?'<br><span class="sub">'+lastLine+'</span>':'') + '<br><span class="sub">평단=손익분기 · +10% 목표 <b>'+Math.round(avg*1.1).toLocaleString()+'</b> · -10% <b>'+Math.round(avg*0.9).toLocaleString()+'</b></span>';
    if(!lastLine||lastLine.indexOf('직전')<0) lastLine=(assetN?assetN+' ':'')+'원가 손익 '+Math.round(pnl).toLocaleString()+'원 ('+pct+'%)';
    bumpStreak(); bumpTodayCalc();
    try{var n=+(localStorage.getItem('cb_calcs')||0)+1;localStorage.setItem('cb_calcs',n);
      var d=new Date(); var dk=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      localStorage.setItem('cb_day_'+dk,String((+(localStorage.getItem('cb_day_'+dk)||0))+1));
    }catch(e){}
    try{legionTrack('activate',{pct:pct})}catch(e){}
    try{legionTrack('money_pipe_shown',{app:'costbasis'})}catch(e){}
    try{legionTrack('share_peak_shown',{pct:pct})}catch(e){}
    try{
      var tcn=todayCalcs();
      Array.prototype.forEach.call(document.querySelectorAll('.chip'),function(ch){
        if(ch.textContent.indexOf('오늘 계산')===0) ch.textContent='오늘 계산 '+tcn+'/2';
        if(ch.textContent.indexOf('전일')===0){ var y=+(localStorage.getItem('cb_day_'+dayKey(-1))||0); ch.textContent='전일 '+(tcn-y>=0?'+':'')+(tcn-y); }
      });
      var bar=document.getElementById('cbGoalBar'); if(bar) bar.style.width=Math.min(100,Math.round(tcn/2*100))+'%';
      renderHist(); renderCbWeek();
    }catch(e){}
    renderHist(); renderCbWeek();
  };
  document.getElementById('share').onclick=function(){
    var text=(lastLine||'Cost Basis calc')+' · 투자권유 아님\n'+shareUrl();
    if(navigator.share) navigator.share({text:text,url:shareUrl()}).catch(function(){});
    else if(navigator.clipboard) navigator.clipboard.writeText(text);
    try{legionTrack('share_peak',{})}catch(e){}
  };
  function renderCbWeek(){
    try{
      var box=document.getElementById('cbWeekSpark');
      if(!box){
        box=document.createElement('div'); box.id='cbWeekSpark'; box.className='card';
        box.innerHTML='<b>7일 계산</b><div id="cbSparkBars" style="display:flex;align-items:flex-end;gap:3px;height:32px;margin-top:8px"></div>';
        var app=document.getElementById('app'); if(app) app.appendChild(box);
      }
      var bars=document.getElementById('cbSparkBars'); if(!bars)return;
      var vals=[],max=1;
      for(var i=6;i>=0;i--){
        var d=new Date(); d.setDate(d.getDate()-i);
        var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
        var n=+(localStorage.getItem('cb_day_'+k)||0); vals.push(n); if(n>max)max=n;
      }
      bars.innerHTML=vals.map(function(n){var h=Math.max(3,Math.round(n/max*28));return '<div style="flex:1;height:'+h+'px;background:'+(n>0?'#67e8f9':'#2a2438')+';border-radius:2px"></div>';}).join('');
    }catch(e){}
  }
  function renderHist(){
    try{
      var hist=JSON.parse(localStorage.getItem('cb_hist')||'[]');
      var old=document.getElementById('histShow'); if(old) old.remove();
      if(!hist.length)return;
      var d=document.createElement('div'); d.className='card'; d.id='histShow';
      var best=hist.reduce(function(a,h){return h.pnl>a?h.pnl:a;},-Infinity);
      var avgP=Math.round(hist.reduce(function(a,h){return a+(+h.pnl||0);},0)/hist.length);
      var n=+(localStorage.getItem('cb_calcs')||0);
      d.innerHTML='<b>최근 계산</b> <span class="chip">'+n+'회</span> <span class="chip">best '+Math.round(best).toLocaleString()+'</span> <span class="chip">avg '+avgP.toLocaleString()+'</span>'
        +'<div class="sub" style="margin-top:6px">'+hist.slice(0,5).map(function(h,i){
          return '<div data-hi="'+i+'" style="padding:4px 0;cursor:pointer;border-bottom:1px solid #2a2438">'+(h.asset?h.asset+' · ':'')+'PnL '+Math.round(h.pnl).toLocaleString()+' · q'+h.q+' <small style="opacity:.5">탭 복원</small></div>';
        }).join('')+'</div>';
      root.insertBefore(d, document.getElementById('moneyPipe')||null);
      Array.prototype.forEach.call(d.querySelectorAll('[data-hi]'),function(el){
        el.onclick=function(){
          var h=hist[+el.getAttribute('data-hi')]; if(!h)return;
          document.getElementById('qty').value=h.q;
          document.getElementById('cost').value=h.c;
          document.getElementById('px').value=h.p;
          document.getElementById('go').click();
        };
      });
    }catch(e){}
  }
  renderHist(); renderCbWeek();
  try{
    var q=new URLSearchParams(location.search||'');
    var ref=q.get('ref');
    if(ref && ref!=='share' && ref!==kId() && !localStorage.getItem('cb_k_from')){
      localStorage.setItem('cb_k_from',ref);
      try{legionTrack('k_link',{from:ref})}catch(e){}
    }
  }catch(e){}
  try{localStorage.setItem('cb_calcs',(+(localStorage.getItem('cb_calcs')||0)));}catch(e){}
  try{legionTrack('session_start',{calcs:+(localStorage.getItem('cb_calcs')||0)})}catch(e){}
  setTimeout(function(){
    if(document.getElementById('clearHist'))return;
    var b=document.createElement('button'); b.id='clearHist'; b.className='sec'; b.style.width='100%'; b.style.marginTop='8px';
    b.textContent='기록 지우기'; b.onclick=function(){localStorage.removeItem('cb_hist'); location.reload();};
    var u=document.createElement('button'); u.id='undoCb'; u.className='sec'; u.style.width='100%'; u.style.marginTop='8px';
    u.textContent='↩ 직전 계산 삭제'; u.onclick=function(){
      try{var hist=JSON.parse(localStorage.getItem('cb_hist')||'[]'); hist.shift(); localStorage.setItem('cb_hist',JSON.stringify(hist)); renderHist(); renderCbWeek(); try{legionTrack('undo',{})}catch(e){}}catch(e){}
    };
    if(app) app.appendChild(u);
    var app=document.getElementById('app'); if(app) app.appendChild(b);
  },100);
})();

/* LEGION_WAVE_36_pipe_ensure */ /* pipe already present wave 36 */

/* LEGION_WAVE_81_share_counter */
document.addEventListener('click',function(ev){try{var el=ev.target;if(!el)return;var tx=(el.textContent||'')+(el.id||'');if(/share|copy/i.test(tx)||/\uacf5\uc720|\ubcf5\uc0ac/.test(tx)){localStorage.setItem('lw_p41_crypto_c_share_counter',String((+(localStorage.getItem('lw_p41_crypto_c_share_counter')||0))+1));}}catch(e){}},true);
