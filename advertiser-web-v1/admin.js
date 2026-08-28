const payment=document.getElementById('payment');
const submission=document.getElementById('submission');
const internalReview=document.getElementById('internalReview');
const venueReview=document.getElementById('venueReview');
const gateResult=document.getElementById('gateResult');
const playableCount=document.getElementById('playableCount');
const waitingCount=document.getElementById('waitingCount');
const reviewCount=document.getElementById('reviewCount');

function updateGate(){
  const playable=payment.value==='CONFIRMED'&&submission.value==='ACCEPTED'&&internalReview.value==='APPROVED'&&['APPROVED','NOT_REQUIRED'].includes(venueReview.value);
  gateResult.innerHTML=playable?'<b>掲載可能</b><p class="note">全条件を満たしています。掲載開始操作へ進めます。</p>':'<b>掲載開始不可</b><p class="note">入金・入稿・社内審査・施設審査の条件を確認してください。</p>';
  playableCount.textContent=playable?'1':'0';
  waitingCount.textContent=payment.value==='WAITING'?'1':'0';
  reviewCount.textContent=submission.value==='ACCEPTED'&&internalReview.value==='WAITING'?'1':'0';
}
[payment,submission,internalReview,venueReview].forEach(el=>el.addEventListener('change',updateGate));
updateGate();

document.getElementById('calcRefund').addEventListener('click',()=>{
  const hours=Number(document.getElementById('stopHours').value||0);
  const fee=Number(document.getElementById('monthlyFee').value||0);
  const days=Number(document.getElementById('daysInMonth').value||30);
  const refundableDays=Math.floor(Math.max(0,hours-48)/24);
  const refund=Math.floor((fee/days)*refundableDays);
  const box=document.getElementById('refundResult');
  box.classList.remove('hidden');
  box.innerHTML=`<b>返金対象日数：${refundableDays}日</b><p>返金額（概算）：${refund.toLocaleString('ja-JP')}円</p><p class="note">48時間までは返金対象外。48時間経過後、さらに24時間停止するごとに1日分を算定します。</p>`;
});