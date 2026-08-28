const plans=[{id:'7d',name:'7日',price:null,monthly:false},{id:'14d',name:'2週間',price:null,monthly:false},{id:'1m',name:'1ヶ月',price:null,monthly:true},{id:'3m',name:'3ヶ月',price:null,monthly:true},{id:'6m',name:'6ヶ月',price:null,monthly:true},{id:'12m',name:'12ヶ月',price:null,monthly:true}];

const yen=v=>v==null?'料金未設定':new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY'}).format(v);
const planGrid=document.getElementById('planGrid');
const planSelect=document.getElementById('planSelect');
plans.forEach(p=>{const card=document.createElement('article');card.className='card';card.innerHTML=`<h3>${p.name}プラン</h3><div class="plan-price">${yen(p.price)}</div><p>${p.monthly?'一括払い／月払い設定可':'一括払い'}</p><div class="tag">管理画面で料金変更</div>`;planGrid.appendChild(card);const opt=document.createElement('option');opt.value=p.id;opt.textContent=p.name;planSelect.appendChild(opt)});

document.querySelector('[name="agencyReferral"]').addEventListener('change',e=>document.getElementById('agencyFields').classList.toggle('hidden',!e.target.checked));

function issueCaseId(){const now=new Date();const date=now.toISOString().slice(0,10).replaceAll('-','');const rand=Math.floor(1000+Math.random()*9000);return `AD-${date}-${rand}`}

document.getElementById('applicationForm').addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget).entries());const caseId=issueCaseId();const result=document.getElementById('applicationResult');result.classList.remove('hidden');result.innerHTML=`<h3>申込み内容（デモ）</h3><p><b>案件管理番号：${caseId}</b></p><p>${data.companyName} / ${data.contactName} 様</p><p>希望プラン：${plans.find(p=>p.id===data.plan)?.name||'-'} / ${data.paymentType}</p><p>本番版では申込み確定後、この番号を振込名義の末尾に追加していただきます。</p><p class="note">現在はフロント画面の初期実装です。実際の保存・メール・入金確認・MP4入稿はバックエンド接続後に有効化します。</p>`;result.scrollIntoView({behavior:'smooth',block:'center'})});