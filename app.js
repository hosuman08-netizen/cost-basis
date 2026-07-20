(function(){
  var el=document.getElementById('tool');
  el.innerHTML='<input id="buy" type="number" placeholder="매수 단가"/><input id="sell" type="number" placeholder="매도 단가"/><input id="qty" type="number" placeholder="수량"/><button id="go">손익 계산</button><div id="out" style="margin-top:10px"></div>';
  document.getElementById('go').onclick=function(){
    var b=+document.getElementById('buy').value, s=+document.getElementById('sell').value, q=+document.getElementById('qty').value;
    var pnl=(s-b)*q;
    document.getElementById('out').innerHTML='추정 손익: <b style="color:'+(pnl>=0?'#67e8f9':'#f9a8d4')+'">'+pnl.toLocaleString()+'</b><br><span style="font-size:11px;color:#8a8398">참고용 · 세금·수수료 미포함 · 자문 아님</span>';
    try{legionTrack('activate',{pnl:pnl})}catch(e){}
  };
  try{legionTrack('session_start',{})}catch(e){}
})();
