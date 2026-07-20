
(function(){
  var root=document.getElementById('app');
  root.innerHTML='<div class="card disclaimer" style="border-color:#67e8f9;color:#67e8f9;font-size:12px">투자 권유 아님. 본인 기록용 계산.</div>'
    +'<div class="card"><label class="sub">보유 수량</label><input id="qty" type="number" step="any" placeholder="예: 0.5"/>'
    +'<label class="sub">총 매수 원금(원)</label><input id="cost" type="number" placeholder="예: 25000000"/>'
    +'<label class="sub">현재가(원)</label><input id="px" type="number" placeholder="예: 95000000"/>'
    +'<button id="go">계산</button><div id="out"></div></div>';
  document.getElementById('go').onclick=function(){
    var q=+document.getElementById('qty').value||0,c=+document.getElementById('cost').value||0,p=+document.getElementById('px').value||0;
    if(!q){document.getElementById('out').textContent='수량 입력';return;}
    var avg=c/q, val=p*q, pnl=val-c, pct=c?Math.round(pnl/c*1000)/10:0;
    document.getElementById('out').innerHTML='평균단가 <b>'+Math.round(avg).toLocaleString()+'</b><br>평가액 <b>'+Math.round(val).toLocaleString()+'</b><br>손익 <b style="color:'+(pnl>=0?'var(--ok)':'var(--bad)')+'">'+Math.round(pnl).toLocaleString()+' ('+pct+'%)</b>';
    try{legionTrack('activate',{pct:pct})}catch(e){}
  };
  try{legionTrack('session_start',{})}catch(e){}
})();
