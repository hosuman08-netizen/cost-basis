
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
  function loadLots(){
    try{var a=JSON.parse(localStorage.getItem('cb_lots')||'[]'); return Array.isArray(a)?a:[];}catch(e){return [];}
  }
  function saveLots(a){try{localStorage.setItem('cb_lots',JSON.stringify(a));}catch(e){}}
  function movingAvgLots(lots){
    var qty=0, cost=0, realized=0, skipped=0;
    var log=[];
    for(var i=0;i<lots.length;i++){
      var L=lots[i]||{};
      var q=+L.q||0, px=+L.px||0;
      if(q<=0){ skipped++; continue; }
      var side=L.side==='sell'?'sell':'buy';
      var avg=qty?cost/qty:0;
      if(side==='sell'){
        if(q>qty+1e-12){ skipped++; log.push({i:i,err:'매도>잔량 · 행 스킵(잔고 발명 없음)'}); continue; }
        realized += (px-avg)*q;
        qty -= q;
        cost = avg*qty;
        if(qty<=1e-12){ qty=0; cost=0; avg=0; }
        else avg=cost/qty;
      }else{
        cost += q*px;
        qty += q;
        avg=qty?cost/qty:0;
      }
      log.push({i:i,side:side,q:q,px:px,qty:qty,cost:cost,avg:avg});
    }
    return {qty:qty,cost:cost,avg:qty?cost/qty:0,realized:realized,skipped:skipped,log:log};
  }
  var st=JSON.parse(localStorage.getItem('cb_streak')||'{}');
  var sc=st.count||0;
  var ready=!st.shieldLast||((new Date(dayKey(0))-new Date(st.shieldLast))/86400000)>=7;
  var tc=todayCalcs();
  var goal=2, gPct=Math.min(100,Math.round(tc/goal*100));
  var ydn=+(localStorage.getItem('cb_day_'+dayKey(-1))||0);
  root.innerHTML='<div class="card disclaimer" style="border-color:#67e8f9;color:#67e8f9;font-size:12px">투자 권유 아님. 본인 기록용 계산 · 로컬만</div>'
    +'<div class="card" id="srcStamp" style="font-size:12px;color:#fde68a">사용자 입력 · 시세 API 없음 · 신고용 아님 · 세무자문 아님</div>'
    +'<div class="card"><span class="chip">🔥 '+sc+'일'+(sc>=3&&ready?' · 🛡️':'')+'</span> <span class="chip">오늘 계산 '+tc+'/'+goal+'</span> <span class="chip">전일 '+(tc-ydn>=0?'+':'')+(tc-ydn)+'</span> <span class="chip">리셋 '+fomoLeft()+'</span>'
    +'<div style="height:6px;background:#1c1826;border-radius:4px;margin-top:8px;overflow:hidden"><i id="cbGoalBar" style="display:block;height:100%;width:'+gPct+'%;background:#67e8f9"></i></div></div>'
    +'<div class="card"><label class="sub">자산명(선택)</label><input id="asset" type="text" placeholder="예: BTC" value="'+(localStorage.getItem('cb_asset')||'')+'"/>'+'<label class="sub">보유 수량</label><input id="qty" type="number" step="any" placeholder="예: 0.5"/>'
    +'<label class="sub">총 매수 원금(원)</label><input id="cost" type="number" placeholder="예: 25000000"/>'
    +'<label class="sub">현재가(원)</label><input id="px" type="number" placeholder="예: 95000000"/>'
    +'<div class="row" id="cbMethod" style="margin:8px 0">'
    +'<button type="button" class="sec mchip on" data-m="avg">이동평균</button>'
    +'<button type="button" class="sec mchip" data-m="fifo">FIFO</button>'
    +'<button type="button" class="sec mchip" data-m="lifo">LIFO</button>'
    +'<button type="button" class="sec mchip" data-m="hifo">HIFO</button></div>'
    +'<p class="sub" id="cbMethodNote">KR 이동평균법(교육) · 평단 = (기존원금 + 신규원금) ÷ (기존수량 + 신규수량)<br>매도원가 = 당시 평단 × 매도수량 · 세무자문 아님 · 신고서 아님 · 시세API 없음</p>'
    +'<div id="cbLotBox" style="margin:8px 0;padding:10px;border:1px solid #2a2438;border-radius:10px">'
    +'<b style="font-size:13px">이동평균 행</b> <span class="chip">사용자 입력만</span>'
    +'<div class="row" style="margin:6px 0">'
    +'<button type="button" class="sec mchip on" id="lotSideBuy" data-side="buy">매수</button>'
    +'<button type="button" class="sec mchip" id="lotSideSell" data-side="sell">매도</button></div>'
    +'<input id="lotQty" type="number" step="any" placeholder="수량"/><input id="lotPx" type="number" step="any" placeholder="단가(원)"/>'
    +'<button type="button" class="sec" id="addLot">행 추가</button>'
    +'<div id="lotList" class="sub" style="margin-top:8px"></div>'
    +'<div id="lotOut" class="sub" style="margin-top:6px">행 0 · 위 한 덩어리(원금÷수량)만 씁니다. 잔고 발명 없음.</div>'
    +'</div>'
    +'<div id="csvImportBox" class="card" style="border-color:#fde68a;margin:8px 0">'
    +'<div class="row" style="justify-content:space-between;align-items:baseline"><b>CSV 가져오기</b><span class="chip" style="background:#fde68a;color:#111;font-weight:800">신고폼 아님</span></div>'
    +'<p class="sub" style="color:#fde68a;font-weight:700;margin:6px 0">신고폼 아님 · 세무자문 아님 · 사용자 행만 · 손익 발명 없음</p>'
    +'<p class="sub">형식: side,qty,px · buy/sell 또는 매수/매도. 헤더 있으면 스킵. 빈칸·숫자없음=스킵(잔고 안 채움).</p>'
    +'<textarea id="csvIn" rows="3" placeholder="buy,1,10000000&#10;sell,0.5,12000000"></textarea>'
    +'<div class="row" style="margin-top:6px">'
    +'<label class="sec" style="display:inline-block;padding:11px 14px;border-radius:10px;cursor:pointer;font-weight:700">파일 선택<input id="csvFile" type="file" accept=".csv,text/csv,text/plain" style="display:none"/></label>'
    +'<button type="button" class="sec" id="csvImport">행으로 넣기</button>'
    +'<button type="button" class="sec" id="csvExport">CSV보내기</button></div>'
    +'<div id="csvOut" class="sub" style="margin-top:6px">CSV 없음 · 허위잔고 없음 · 신고폼 아님 · 손익열 없음</div>'
    +'<div id="csvSentN" class="sub" style="margin-top:4px"></div>'
    +'<div id="csvSentName" class="sub" style="margin-top:2px"></div>'
    +'<div id="csvSentAt" class="sub" role="button" tabindex="0" style="margin-top:2px;cursor:pointer" title="탭=이동평균 행 점프 · 신고폼 아님"></div></div>'
    +'<button id="go">계산</button><div id="out" class="sub" style="margin-top:10px">값을 넣고 계산하세요</div></div>'
    +'<div class="card" id="pnlSplit"><div class="row" style="justify-content:space-between;align-items:baseline"><b>실현 vs 미실현</b><span class="chip">신고용 아님</span></div>'
    +'<p class="sub">현재가 입력 → 미실현. 매도 행 없으면 실현 0. 잔고·시세 발명 없음.</p>'
    +'<div id="splitBody" class="sub">수량·원금·현재가를 넣거나 행을 추가하세요</div></div>'
    +'<div class="card" id="jurCard"><div class="row" style="justify-content:space-between;align-items:baseline"><b>법역</b><span class="chip">세무사 아님</span></div>'
    +'<p class="sub">교육 링크아웃 · 신고서·세금계산 없음 · 평단 숫자 불변</p>'
    +'<div class="row" id="jurChips">'
    +'<button type="button" class="sec mchip" data-jur="KR">KR</button>'
    +'<button type="button" class="sec mchip" data-jur="US">US</button>'
    +'<button type="button" class="sec mchip" data-jur="기타">기타</button></div>'
    +'<p class="sub" id="jurNote"></p></div>'
    +'<div class="card" id="moneyPipe" style="text-align:center;font-size:12px">'
    +'<div style="color:#67e8f9;font-weight:700;margin-bottom:6px">💎 투명 금융 크로스</div>'
    +'<a style="color:#ece8f1;margin:0 6px" href="https://hosuman08-netizen.github.io/budget-pulse/?utm_source=costbasis&utm_medium=pipe">💓 Budget</a>'
    +'<a style="color:#ece8f1;margin:0 6px" href="https://hosuman08-netizen.github.io/etf-flow/?utm_source=costbasis&utm_medium=pipe">📈 ETF Flow</a>'
    +'<a style="color:#e0b552;margin:0 6px" href="https://hosuman08-netizen.github.io/legion-hub/?utm_source=costbasis&utm_medium=pipe">🎮 Arcade</a>'
    +'</div>'
    +'<button id="share" style="width:100%;margin-top:8px;padding:11px;border:0;border-radius:10px;background:#1c1826;color:#ece8f1;font-weight:700">결과 공유 문구</button>';
  var lastLine='';
  var cbMethod='avg';
  var lotSide='buy';
  /* GOLD50 TOP5: 법역 칩 KR/US/기타. 교육 링크만. 세무자문 아님 · 숫자 불변 */
  var JUR_INFO={
    KR:{txt:'KR · 가상자산 과세는 국세청·세무사 영역. 본 앱은 평단 계산기만 · 세무자문 아님.', href:'https://www.hometax.go.kr/', lab:'홈택스'},
    US:{txt:'US · IRS virtual currency FAQ. 본 앱은 Form 생성 없음 · 세무자문 아님.', href:'https://www.irs.gov/individuals/international-taxpayers/frequently-asked-questions-on-virtual-currency-transactions', lab:'IRS FAQ'},
    '기타':{txt:'기타 · 법역마다 규칙이 다름. 본 앱은 세무사 아님 · 신고서 생성 없음.', href:'https://www.oecd.org/tax/exchange-of-tax-information/', lab:'OECD'}
  };
  function jurKey(){try{return localStorage.getItem('cb_jur')||'KR';}catch(e){return 'KR';}}
  function applyJur(j){
    if(!JUR_INFO[j]) j='KR';
    try{localStorage.setItem('cb_jur',j);}catch(e){}
    Array.prototype.forEach.call(document.querySelectorAll('#jurChips [data-jur]'),function(x){
      x.classList.toggle('on', x.getAttribute('data-jur')===j);
    });
    var info=JUR_INFO[j];
    var note=document.getElementById('jurNote');
    if(note) note.innerHTML=info.txt+' <a href="'+info.href+'" target="_blank" rel="noopener">'+info.lab+'</a>';
  }
  var jurBox=document.getElementById('jurChips');
  if(jurBox) jurBox.onclick=function(ev){
    var b=ev.target.closest('[data-jur]'); if(!b) return;
    applyJur(b.getAttribute('data-jur'));
    try{legionTrack('jur',{j:b.getAttribute('data-jur')})}catch(e){}
  };
  applyJur(jurKey());
  document.getElementById('cbMethod').onclick=function(ev){
    var b=ev.target.closest('[data-m]'); if(!b) return;
    cbMethod=b.getAttribute('data-m');
    Array.prototype.forEach.call(document.querySelectorAll('#cbMethod .mchip'),function(x){ x.classList.toggle('on', x===b); });
    var note=document.getElementById('cbMethodNote');
    if(note){
      if(cbMethod==='avg') note.innerHTML='KR 이동평균법(교육) · 평단 = (기존원금 + 신규원금) ÷ (기존수량 + 신규수량)<br>매도원가 = 당시 평단 × 매도수량 · 세무자문 아님 · 신고서 아님 · 시세API 없음';
      else note.textContent='한 덩어리 입력 = FIFO/LIFO/HIFO 숫자 같음. 롯 장부 아님 · 교육용 근사 · 세무자문 아님';
    }
    renderSplit();
  };
  function renderSplit(){
    var body=document.getElementById('splitBody');
    if(!body) return;
    var lots=loadLots();
    var ma=lots.length?movingAvgLots(lots):null;
    var qEl=document.getElementById('qty');
    var cEl=document.getElementById('cost');
    var pEl=document.getElementById('px');
    var q=qEl?(+qEl.value||0):0;
    var c=cEl?(+cEl.value||0):0;
    var pRaw=pEl?pEl.value:'';
    var p=(pRaw===''||pRaw==null)?null:+pRaw;
    if(p!=null && !isFinite(p)) p=null;
    var usedLots=cbMethod==='avg' && lots.length && ma;
    if(usedLots){ q=ma.qty; c=ma.cost; }
    var hasSell=lots.some(function(L){return L.side==='sell';});
    var real=hasSell&&ma?ma.realized:0;
    var avg=q?c/q:0;
    var unreal=(p==null||!q)?null:(p-avg)*q;
    var realLine=hasSell
      ?('실현 <b>'+Math.round(real).toLocaleString()+'</b>원 · 입력가 기준 · 신고용 아님')
      :'실현 <b>0</b>원 · 매도 행 없음';
    var unLine=unreal==null
      ?(q?'미실현 미확인 · 현재가 없음 · 시세 API 없음':'미실현 미확인 · 수량 없음 · 허위잔고 없음')
      :('미실현 <b style="color:'+(unreal>=0?'var(--ok)':'var(--bad)')+'">'+Math.round(unreal).toLocaleString()+'</b>원 · 평가손익');
    body.innerHTML=unLine+'<br>'+realLine+'<br><span class="sub">사용자 입력 · 시세 API 없음 · 세무자문 아님</span>';
  }
  function renderLots(){
    var lots=loadLots();
    var list=document.getElementById('lotList');
    var out=document.getElementById('lotOut');
    if(!list||!out) return;
    if(!lots.length){
      list.innerHTML='행 없음 — 빈 장부. 허위잔고 없음.';
      out.textContent='행 0 · 위 한 덩어리(원금÷수량)만 씁니다. 잔고 발명 없음.';
      renderSplit();
      return;
    }
    var ma=movingAvgLots(lots);
    list.innerHTML=lots.map(function(L,i){
      var side=L.side==='sell'?'매도':'매수';
      return '<div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px solid #2a2438">'
        +'<span>'+(i+1)+'. '+side+' '+((+L.q)||0)+' × '+((+L.px)||0).toLocaleString()+'원</span>'
        +'<button type="button" class="sec" data-lotdel="'+i+'" style="padding:2px 8px;font-size:11px">삭제</button></div>';
    }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('[data-lotdel]'),function(b){
      b.onclick=function(){
        var arr=loadLots(); arr.splice(+b.getAttribute('data-lotdel'),1); saveLots(arr); renderLots();
      };
    });
    out.innerHTML='이동평균 잔량 <b>'+(Math.round(ma.qty*1e8)/1e8)+'</b> · 원금 <b>'+Math.round(ma.cost).toLocaleString()+'</b>원 · 평단 <b>'+Math.round(ma.avg).toLocaleString()+'</b>원'
      +(ma.realized?'<br>실현(입력가 기준) '+Math.round(ma.realized).toLocaleString()+'원 · 신고용 아님':'')
      +(ma.skipped?'<br>스킵 '+ma.skipped+'행 (매도>잔량 등)':'')
      +'<br><span class="sub">세무자문 아님 · 넣은 행만 계산</span>';
    renderSplit();
  }
  document.getElementById('lotSideBuy').onclick=function(){
    lotSide='buy';
    document.getElementById('lotSideBuy').classList.add('on');
    document.getElementById('lotSideSell').classList.remove('on');
  };
  document.getElementById('lotSideSell').onclick=function(){
    lotSide='sell';
    document.getElementById('lotSideSell').classList.add('on');
    document.getElementById('lotSideBuy').classList.remove('on');
  };
  document.getElementById('addLot').onclick=function(){
    var q=+document.getElementById('lotQty').value||0;
    var pxRaw=document.getElementById('lotPx').value;
    var px=+pxRaw||0;
    if(!q){document.getElementById('lotOut').textContent='수량 입력';return;}
    if(pxRaw==='' || px<0){document.getElementById('lotOut').textContent='단가 입력';return;}
    var arr=loadLots();
    arr.push({side:lotSide,q:q,px:px,t:Date.now()});
    saveLots(arr);
    document.getElementById('lotQty').value='';
    document.getElementById('lotPx').value='';
    renderLots();
    try{legionTrack('lot_add',{side:lotSide})}catch(e){}
  };
  /* WAVE109: CSV 임포트 · 신고폼 아님 · 사용자 행만 · 손익 발명 없음 */
  function parseLotCsv(text){
    var rows=[], skip=0;
    var lines=String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/);
    for(var i=0;i<lines.length;i++){
      var line=lines[i].trim();
      if(!line) continue;
      var parts=line.split(/[,;\t]/).map(function(x){return String(x||'').trim().replace(/^["']|["']$/g,'');});
      if(parts.length<3){ skip++; continue; }
      var a0=parts[0].toLowerCase();
      var a1=(parts[1]||'').toLowerCase();
      if(/^(side|type|구분|매수매도)$/.test(a0) || /^(qty|q|수량)$/.test(a1) || /^(px|price|단가|가격)$/.test((parts[2]||'').toLowerCase())) continue;
      var side=null;
      if(/^(buy|b|매수|long)$/i.test(parts[0])) side='buy';
      else if(/^(sell|s|매도|short)$/i.test(parts[0])) side='sell';
      else { skip++; continue; }
      var q=+parts[1], px=+parts[2];
      if(!(q>0) || !isFinite(q)){ skip++; continue; }
      if(parts[2]==='' || !(px>=0) || !isFinite(px)){ skip++; continue; }
      rows.push({side:side,q:q,px:px,t:Date.now()+i});
    }
    return {rows:rows,skip:skip};
  }
  function applyLotCsv(text){
    var out=document.getElementById('csvOut');
    var parsed=parseLotCsv(text);
    if(!parsed.rows.length){
      if(out) out.textContent='유효 행 0 · 스킵 '+parsed.skip+' · 잔고 발명 없음 · 신고폼 아님';
      return;
    }
    var arr=loadLots();
    parsed.rows.forEach(function(r){ arr.push(r); });
    saveLots(arr);
    renderLots();
    if(out) out.textContent='넣음 '+parsed.rows.length+'행 · 스킵 '+parsed.skip+' · 사용자 데이터만 · 손익 발명 없음 · 신고폼 아님';
    try{legionTrack('csv_import',{n:parsed.rows.length,skip:parsed.skip})}catch(e){}
  }
  var csvBtn=document.getElementById('csvImport');
  if(csvBtn) csvBtn.onclick=function(){
    var ta=document.getElementById('csvIn');
    applyLotCsv(ta?ta.value:'');
  };
  var csvFile=document.getElementById('csvFile');
  if(csvFile) csvFile.onchange=function(){
    if(!csvFile.files||!csvFile.files[0]) return;
    var r=new FileReader();
    r.onload=function(){
      var ta=document.getElementById('csvIn');
      if(ta) ta.value=String(r.result||'');
      applyLotCsv(String(r.result||''));
    };
    r.readAsText(csvFile.files[0]);
    csvFile.value='';
  };
  /* WAVE118: CSV보내기 · 사용자 행만(side,qty,px) · P/L 열 없음 · 신고폼 아님 */
  function csvCell(v){
    var s=String(v==null?'':v);
    if(/[",\n]/.test(s)) return '"'+s.replace(/"/g,'""')+'"';
    return s;
  }
  function exportLotCsv(lots){
    lots=Array.isArray(lots)?lots:loadLots();
    var lines=['side,qty,px'];
    for(var i=0;i<lots.length;i++){
      var L=lots[i]||{};
      var side=L.side==='sell'?'sell':'buy';
      var q=+L.q, px=+L.px;
      if(!(q>0) || !isFinite(q)) continue;
      if(L.px==='' || !(px>=0) || !isFinite(px)) continue;
      lines.push([csvCell(side),csvCell(q),csvCell(px)].join(','));
    }
    return lines.join('\n');
  }
  function lotCsvName(day){
    return 'cb-lots-'+(day||dayKey(0))+'.csv';
  }
  /* WAVE128: 보낸행수 1줄 · 사용자 행만 · P/L 발명 0 · 신고폼 아님 */
  function lotCsvSentN(csv){
    var lines=String(csv==null?'':csv).split(/\r?\n/).filter(function(x){ return String(x).length; });
    if(!lines.length) return 0;
    return Math.max(0, lines.length-1);
  }
  function lotCsvSentNLine(n){
    return '보낸 '+(+n||0)+'행 · 사용자 행만 · 손익 발명 없음 · 신고폼 아님';
  }
  function paintCsvSentN(n){
    var nEl=document.getElementById('csvSentN');
    if(nEl) nEl.textContent=lotCsvSentNLine(n);
    return nEl?nEl.textContent:'';
  }
  /* WAVE138: 보낸파일명 1줄 · 사용자 행만 · P/L 발명 0 · 신고폼 아님 */
  function lotCsvSentNameLine(name){
    name=String(name==null?'':name);
    if(!name) return '';
    return '보낸파일 '+name+' · 사용자 행만 · 신고폼 아님';
  }
  function paintCsvSentName(name){
    var el=document.getElementById('csvSentName');
    if(el) el.textContent=lotCsvSentNameLine(name);
    return el?el.textContent:'';
  }
  /* WAVE144: 보낸시각 1줄 · 사용자 행만 · P/L 발명 0 · 신고폼 아님 */
  function lotCsvSentAt(ts){
    var d=(ts==null||ts==='')?new Date():new Date(ts);
    if(isNaN(d.getTime())) d=new Date();
    function z(n){return String(n).padStart(2,'0');}
    return z(d.getHours())+':'+z(d.getMinutes())+':'+z(d.getSeconds());
  }
  function lotCsvSentAtLine(ts){
    if(ts==null||ts==='') return '';
    return '보낸시각 '+lotCsvSentAt(ts)+' · 사용자 행만 · 신고폼 아님';
  }
  function paintCsvSentAt(ts){
    var el=document.getElementById('csvSentAt');
    if(el) el.textContent=lotCsvSentAtLine(ts);
    return el?el.textContent:'';
  }
  /* WAVE153: 보낸시각 탭=#lotList 점프 · P/L 발명 0 · 신고폼 아님 */
  function csvSentAtJumpId(){ return 'lotList'; }
  function jumpCsvSentAt(){
    var id=csvSentAtJumpId();
    var el=typeof document!=='undefined'?document.getElementById(id):null;
    if(!el) return '';
    try{el.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){try{el.scrollIntoView();}catch(e2){}}
    if(el.setAttribute) el.setAttribute('data-jump-from','csvSentAt');
    return id;
  }
  function bindCsvSentAtJump(){
    var el=typeof document!=='undefined'?document.getElementById('csvSentAt'):null;
    if(!el||el._jumpBound) return false;
    el._jumpBound=1;
    el.setAttribute('role','button');
    el.setAttribute('tabindex','0');
    el.style.cursor='pointer';
    el.title='탭=이동평균 행 점프 · 신고폼 아님';
    el.onclick=function(){ jumpCsvSentAt(); };
    el.onkeydown=function(ev){
      if(!ev) return;
      if(ev.key==='Enter'||ev.key===' '){ if(ev.preventDefault) ev.preventDefault(); jumpCsvSentAt(); }
    };
    return true;
  }
  function sendLotCsv(){
    var lots=loadLots();
    var csv=exportLotCsv(lots);
    var n=lotCsvSentN(csv);
    var name=lotCsvName();
    var sentAt=Date.now();
    var out=document.getElementById('csvOut');
    try{
      if(typeof Blob!=='undefined' && typeof document!=='undefined'){
        var blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
        var url=(typeof URL!=='undefined'&&URL.createObjectURL)?URL.createObjectURL(blob):'';
        if(url){
          var a=document.createElement('a');
          a.href=url; a.download=name;
          if(document.body) document.body.appendChild(a);
          a.click();
          if(a.parentNode) a.parentNode.removeChild(a);
          setTimeout(function(){ try{ URL.revokeObjectURL(url); }catch(e){} },400);
        }
      }
    }catch(e){
      try{ if(navigator&&navigator.clipboard) navigator.clipboard.writeText(csv); }catch(e2){}
    }
    if(out) out.textContent='보냄 '+n+'행 · '+name+' · 사용자 행만 · 손익 발명 없음 · 신고폼 아님';
    paintCsvSentN(n);
    paintCsvSentName(name);
    paintCsvSentAt(sentAt);
    try{bindCsvSentAtJump();}catch(e3){}
    try{legionTrack('csv_export',{n:n})}catch(e){}
    return csv;
  }
  var csvExp=document.getElementById('csvExport');
  if(csvExp) csvExp.onclick=function(){ sendLotCsv(); };
  try{bindCsvSentAtJump();}catch(eBind){}
  renderLots();
  ['qty','cost','px'].forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.addEventListener('input', renderSplit);
  });
  renderSplit();
  document.getElementById('go').onclick=function(){
    var q=+document.getElementById('qty').value||0,c=+document.getElementById('cost').value||0;
    var pRaw=document.getElementById('px').value;
    var hasPx=pRaw!=='' && isFinite(+pRaw);
    var p=hasPx?(+pRaw):0;
    var lots=loadLots();
    var usedLots=cbMethod==='avg' && lots.length;
    var ma=usedLots?movingAvgLots(lots):null;
    if(usedLots){
      q=ma.qty; c=ma.cost;
      if(document.getElementById('qty')) document.getElementById('qty').value=q;
      if(document.getElementById('cost')) document.getElementById('cost').value=Math.round(c);
    }
    if(!q){document.getElementById('out').textContent=usedLots?'잔량 0 — 허위잔고 없음':'수량 입력'; renderSplit(); return;}
    var avg=c/q, val=hasPx?p*q:null, pnl=hasPx?val-c:null, pct=(hasPx&&c)?Math.round(pnl/c*1000)/10:null;
    try{var asset=(document.getElementById('asset')&&document.getElementById('asset').value)||''; localStorage.setItem('cb_asset',asset); if(hasPx){ var hist=JSON.parse(localStorage.getItem('cb_hist')||'[]'); var prev=hist[0]; hist.unshift({q:q,c:c,p:p,pnl:pnl,asset:asset,ts:Date.now()}); localStorage.setItem('cb_hist',JSON.stringify(hist.slice(0,12))); if(prev&&prev.pnl!=null){ var dlt=pnl-prev.pnl; lastLine=(asset?asset+' ':'')+'미실현 '+Math.round(pnl).toLocaleString()+'원 ('+pct+'%) · 직전대비 '+(dlt>=0?'+':'')+Math.round(dlt).toLocaleString(); } } }catch(e){}
    var assetN=(document.getElementById('asset')&&document.getElementById('asset').value)||'';
    var methodLine=usedLots
      ? 'KR 이동평균법 · 행 '+lots.length+'개 · 평단=(원금÷수량) · 세무자문 아님'
      : (cbMethod==='avg'?'KR 이동평균법 · 한 덩어리 평단=원금÷수량 · 세무자문 아님':'메서드 '+cbMethod.toUpperCase()+' · 한 덩어리라 FIFO/LIFO/HIFO=평균. 롯 아님 · 교육용 근사');
    var hasSell=lots.some(function(L){return L.side==='sell';});
    var realN=hasSell&&ma?ma.realized:0;
    document.getElementById('out').innerHTML='평균단가 <b>'+Math.round(avg).toLocaleString()+'</b>'
      +(hasPx?'<br>평가액 <b>'+Math.round(val).toLocaleString()+'</b><br>미실현 <b style="color:'+(pnl>=0?'var(--ok)':'var(--bad)')+'">'+Math.round(pnl).toLocaleString()+' ('+pct+'%)</b>':'<br>미실현 미확인 · 현재가 없음 · 시세 API 없음')
      +'<br><span class="sub">실현 '+(hasSell?Math.round(realN).toLocaleString()+'원 · 입력가 기준':'0원 · 매도 행 없음')+' · 신고용 아님</span>'
      +(lastLine&&lastLine.indexOf('직전')>=0?'<br><span class="sub">'+lastLine+'</span>':'')
      +'<br><span class="sub">'+methodLine+'</span>'
      +'<br><span class="sub">평단=손익분기 · +10% 목표 <b>'+Math.round(avg*1.1).toLocaleString()+'</b> · -10% <b>'+Math.round(avg*0.9).toLocaleString()+'</b></span>';
    renderSplit();
    if(hasPx && (!lastLine||lastLine.indexOf('직전')<0)) lastLine=(assetN?assetN+' ':'')+'미실현 '+Math.round(pnl).toLocaleString()+'원 ('+pct+'%)';
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
