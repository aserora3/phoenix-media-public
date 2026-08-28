# 広告主向けWeb システム設計 v1

## 目的
広告主が、媒体確認 → 申込み → 銀行振込 → MP4入稿 → 審査 → 掲載開始 → 更新まで進められるWebポータル。

## 公開構成（予定）
- Frontend: Cloudflare Pages
- API / Scheduled jobs: Cloudflare Workers
- DB: Cloudflare D1
- Video storage: Cloudflare R2
- Source of truth: GitHub

初期段階は無料枠優先。銀行API連携は行わず、入金確認は管理者が銀行アプリを確認して手動で「入金確認済み」に変更する。

## 主要データ
### advertisers
- id
- company_name
- company_address
- company_phone
- contact_name
- contact_phone
- email
- created_at

### media
- id
- name
- active
- specification_json
- prohibited_categories_json
- venue_approval_required

### plans
- id
- name
- duration_type
- duration_value
- one_time_price
- monthly_price
- monthly_payment_enabled
- active

料金はコードへ固定せずDBで管理する。

### applications
- id / case_number
- advertiser_id
- media_id
- plan_id
- payment_type
- desired_start_date
- ad_content
- agency_referral
- agency_name
- referral_code
- status
- created_at

### payments
- id
- application_id
- billing_month
- amount
- due_date
- status (WAITING / CONFIRMED / OVERDUE)
- confirmed_at
- reminder_20_sent_at
- reminder_24_sent_at

### submissions
- id
- application_id
- file_key
- mime_type
- duration_seconds
- width
- height
- file_size
- status
- submitted_at

### reviews
- id
- application_id
- internal_review_status
- venue_review_status
- correction_reason
- approved_at

### playback_incidents
- id
- application_id
- started_at
- ended_at
- cause
- force_majeure
- advertiser_fault
- refundable_days
- refund_amount

## 掲載開始ゲート
PLAYABLE =
- payment.status == CONFIRMED
- submission.status == ACCEPTED
- internal_review_status == APPROVED
- venue_review_status in (APPROVED, NOT_REQUIRED)

どれか1つでも満たさない場合は掲載開始不可。

## 月払い自動メール
対象: monthly_payment_enabled=true かつ契約継続中。

毎月20日前後:
- 翌月請求を生成
- 支払期限を当月25日に設定
- 支払案内メール送信
- reminder_20_sent_at記録

任意設定:
- 24日時点で未入金なら前日リマインド

25日締め:
- 未入金案件を OVERDUE に変更
- 翌月再生状態を HOLD_PAYMENT に変更

入金後:
- 管理者がCONFIRMED
- 他の掲載条件も満たせばPLAYABLEへ復帰

## 途中解約精算
長期割引契約の途中解約時は、利用済み期間の通常料金合計 - 既支払額を基本精算額とする。

## 不可抗力返金
連続停止48時間までは返金対象外。
48時間経過後、さらに24時間継続するごとに返金1日を加算。

refundable_days = floor(max(0, stopped_hours - 48) / 24)
refund_amount = (monthly_fee / days_in_month) * refundable_days

広告主の未払い・入稿遅延・修正遅延等、広告主責任の停止は対象外。

## 管理画面利益計算 初版
税込契約額
→ 税抜売上
→ 代理店報酬
→ 設置場所取り分
→ 銀行/決済関連実費
→ その他直接経費
→ 自社粗利益

料率・計算順は将来変更可能にする。

## 広告主に見せない項目
- 代理店報酬率・金額
- 設置場所取り分
- 内部原価
- 粗利益
- 管理者メモ

## 初期実装フェーズ
### Phase 1
- 公開トップ
- 媒体・プラン表示
- 申込フォーム
- 案件番号発行
- 銀行振込案内
- 契約条件表示

### Phase 2
- D1保存
- 広告主マイページ
- 管理画面
- 入金手動確認
- MP4入稿/R2
- 審査フロー

### Phase 3
- 月払い20日自動通知
- 25日未入金停止
- 停止事故・返金自動計算
- 掲載更新/延長

### Phase 4
- 必要に応じ銀行API
- AI一次審査
- 配信機器との自動連携
