const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'}});
const cors=()=>new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,PATCH,OPTIONS','access-control-allow-headers':'content-type'}});

function caseNumber(){
  const d=new Date();
  const date=d.toISOString().slice(0,10).replaceAll('-','');
  const rand=crypto.getRandomValues(new Uint32Array(1))[0].toString().slice(-6).padStart(6,'0');
  return `AD-${date}-${rand}`;
}

function refundableDays(stoppedHours){return Math.floor(Math.max(0,Number(stoppedHours)-48)/24)}

export default {
  async fetch(request,env){
    if(request.method==='OPTIONS') return cors();
    const url=new URL(request.url);
    try{
      if(url.pathname==='/api/health') return json({ok:true,service:'advertiser-web-v1'});

      if(url.pathname==='/api/plans' && request.method==='GET'){
        const {results}=await env.DB.prepare('SELECT code,name,duration_type,duration_value,one_time_price,monthly_price,monthly_payment_enabled FROM plans WHERE active=1 ORDER BY id').all();
        return json(results);
      }

      if(url.pathname==='/api/applications' && request.method==='POST'){
        const body=await request.json();
        const required=['companyName','companyAddress','companyPhone','contactName','contactPhone','email','mediaId','planId','paymentType','adContent'];
        const missing=required.filter(k=>!body[k]);
        if(missing.length) return json({error:'MISSING_FIELDS',fields:missing},400);
        const caseNo=caseNumber();
        const adv=await env.DB.prepare('INSERT INTO advertisers(company_name,company_address,company_phone,contact_name,contact_phone,email) VALUES(?,?,?,?,?,?)')
          .bind(body.companyName,body.companyAddress,body.companyPhone,body.contactName,body.contactPhone,body.email).run();
        await env.DB.prepare(`INSERT INTO applications(case_number,advertiser_id,media_id,plan_id,payment_type,desired_start_date,ad_content,agency_referral,agency_name,referral_code) VALUES(?,?,?,?,?,?,?,?,?,?)`)
          .bind(caseNo,adv.meta.last_row_id,body.mediaId,body.planId,body.paymentType,body.startDate||null,body.adContent,body.agencyReferral?1:0,body.agencyName||null,body.referralCode||null).run();
        return json({ok:true,caseNumber:caseNo},201);
      }

      const paymentMatch=url.pathname.match(/^\/api\/applications\/(.+)\/payment-confirm$/);
      if(paymentMatch && request.method==='PATCH'){
        const caseNo=decodeURIComponent(paymentMatch[1]);
        const app=await env.DB.prepare('SELECT id FROM applications WHERE case_number=?').bind(caseNo).first();
        if(!app) return json({error:'NOT_FOUND'},404);
        await env.DB.prepare("UPDATE payments SET status='CONFIRMED', confirmed_at=CURRENT_TIMESTAMP WHERE application_id=? AND status!='CONFIRMED'").bind(app.id).run();
        return json({ok:true});
      }

      const gateMatch=url.pathname.match(/^\/api\/applications\/(.+)\/gate$/);
      if(gateMatch && request.method==='GET'){
        const caseNo=decodeURIComponent(gateMatch[1]);
        const row=await env.DB.prepare(`SELECT a.id,a.case_number,
          EXISTS(SELECT 1 FROM payments p WHERE p.application_id=a.id AND p.status='CONFIRMED') payment_ok,
          EXISTS(SELECT 1 FROM submissions s WHERE s.application_id=a.id AND s.status='ACCEPTED') submission_ok,
          COALESCE(r.internal_review_status='APPROVED',0) internal_ok,
          COALESCE(r.venue_review_status IN ('APPROVED','NOT_REQUIRED'),0) venue_ok
          FROM applications a LEFT JOIN reviews r ON r.application_id=a.id WHERE a.case_number=?`).bind(caseNo).first();
        if(!row) return json({error:'NOT_FOUND'},404);
        const playable=Boolean(row.payment_ok&&row.submission_ok&&row.internal_ok&&row.venue_ok);
        return json({...row,playable});
      }

      if(url.pathname==='/api/refund-calc' && request.method==='POST'){
        const body=await request.json();
        const days=refundableDays(body.stoppedHours);
        const fee=Number(body.monthlyFee||0); const dim=Number(body.daysInMonth||30);
        const amount=Math.floor((fee/dim)*days);
        return json({refundableDays:days,refundAmount:amount});
      }

      return json({error:'NOT_FOUND'},404);
    }catch(err){
      return json({error:'SERVER_ERROR',message:String(err?.message||err)},500);
    }
  },

  async scheduled(event,env,ctx){
    const now=new Date(event.scheduledTime||Date.now());
    const day=now.getUTCDate();
    if(day>=19 && day<=21){
      // 本番では翌月分請求生成→メール送信→reminder_20_sent_atを記録する。
      console.log('monthly-reminder-window');
    }
    if(day===25){
      await env.DB.prepare("UPDATE payments SET status='OVERDUE' WHERE due_date<=date('now') AND status='WAITING'").run();
    }
  }
};
