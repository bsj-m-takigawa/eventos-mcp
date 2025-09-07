# eventos API 詳細仕様書

## 目次
1. [認証](#認証)
2. [チケットAPI](#チケットapi)
3. [データモデル](#データモデル)
4. [エラーコード](#エラーコード)
5. [制限事項](#制限事項)

---

## 認証

### トークン取得

eventos APIへのアクセスには、まずAPIキーを使用してアクセストークンを取得する必要があります。

#### エンドポイント
```
GET https://public-api.eventos.tokyo/api/v1/token
```

#### リクエストヘッダー
| ヘッダー名 | 値 | 説明 |
|-----------|-----|------|
| x-api-key | string | 提供されたAPIキー（小文字のx） |

#### レスポンス
```json
{
  "access_token": "c50aa6fa-7a4a-4a1d-acef-4cb2cb314f8d",
  "expired_at": "2025-09-07 22:26:08"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| access_token | string | APIアクセス用のトークン |
| expired_at | string | トークンの有効期限（YYYY-MM-DD HH:mm:ss形式） |

### トークンリフレッシュ（オプション）

#### エンドポイント
```
POST https://public-api.eventos.tokyo/api/v1/token/refresh
```

#### リクエストボディ
```json
{
  "refresh_token": "リフレッシュトークン"
}
```

---

## チケットAPI

### 共通ヘッダー

すべてのチケットAPIリクエストには以下のヘッダーが必要です：

| ヘッダー名 | 値 | 説明 |
|-----------|-----|------|
| X-API-Key | string | APIキー（大文字のX） |
| Token | string | アクセストークン |
| Content-Type | application/json | POSTまたはPUTの場合 |

### 1. チケット一覧取得

#### エンドポイント
```
GET /api/v1/ticket/normal/master/{content_id}
```

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| content_id | string | ✓ | コンテンツID |

#### クエリパラメータ
| パラメータ | 型 | 必須 | 説明 | デフォルト |
|-----------|-----|------|------|----------|
| limit | number | - | 取得件数 | 20 |
| offset | number | - | 開始位置 | 0 |
| is_publish | boolean | - | 公開状態でフィルタ | - |

#### レスポンス
```json
{
  "tickets": [
    {
      "id": 661431,
      "common": { /* 共通設定 */ },
      "language_data": [ /* 言語別データ */ ],
      "multiple_prices": [ /* 複数価格設定 */ ]
    }
  ]
}
```

### 2. チケット詳細取得

#### エンドポイント
```
GET /api/v1/ticket/normal/master/{content_id}/{ticket_id}
```

#### パスパラメータ
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| content_id | string | ✓ | コンテンツID |
| ticket_id | string | ✓ | チケットID |

### 3. チケット作成

#### エンドポイント
```
POST /api/v1/ticket/normal/master/{content_id}
```

#### リクエストボディ
```json
{
  "ticket": {
    "common": {
      "visible_period": true,
      "visible_start_date": "2025-01-07 12:00:00",
      "visible_end_date": "2026-01-07 12:00:00",
      "enable_sales_period": true,
      "sales_period_start": "2025-01-07 12:00:00",
      "sales_period_end": "2026-01-07 12:00:00",
      "is_pay": true,
      "priority": 1,
      "enable_purchasable_number": true,
      "purchasable_number": 1,
      "enable_cancel_period": true,
      "cancel_period_start": "2025-01-07 12:00:00",
      "cancel_period_end": "2026-01-07 12:00:00",
      "checkin_method": {
        "qr": true,
        "manual": false
      },
      "enable_unlimit_checkin": false,
      "enable_multiple_price": false,
      "remarks": "備考",
      "hide_checkin_expiration_ticket": false,
      "enable_external_qr": false,
      "price": 5000,
      "enable_number_sold": true,
      "number_sold": 100,
      "enable_remaining_number": true,
      "border_remaining_number": 20,
      "enable_remaining_text": true,
      "checkin_period_start": "2025-01-07 12:00:00",
      "checkin_period_end": "2026-01-07 12:00:00",
      "dynamic_checkin_period": false,
      "checkin_period_days": 0,
      "enable_checkin_user_form": false,
      "enable_entry_user_form": true
    },
    "language_data": [
      {
        "language_id": 1,
        "title": "チケット名",
        "image": null,
        "description": "チケットの説明",
        "my_ticket_description": "マイチケット説明",
        "remaining_text": [
          {
            "number": 50,
            "label": null
          },
          {
            "number": 10,
            "label": "残りわずか"
          }
        ],
        "cancel_policy": "キャンセルポリシー"
      }
    ],
    "multiple_prices": []
  }
}
```

#### レスポンス
```json
{
  "id": 661431
}
```

### 4. チケット更新

#### エンドポイント
```
PUT /api/v1/ticket/normal/master/{content_id}/{ticket_id}
```

#### 注意事項
- `enable_multiple_price`は作成後変更できません
- リクエストボディは作成時と同じ形式

### 5. チケット削除

#### エンドポイント
```
DELETE /api/v1/ticket/normal/master/{content_id}/{ticket_id}
```

#### レスポンス
```json
[]
```

---

## データモデル

### TicketCommon（共通設定）

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| visible_period | boolean | ✓ | 表示期間を設定するか |
| visible_start_date | string | - | 表示開始日時（YYYY-MM-DD HH:mm:ss） |
| visible_end_date | string | - | 表示終了日時 |
| enable_sales_period | boolean | ✓ | 販売期間を設定するか |
| sales_period_start | string | - | 販売開始日時 |
| sales_period_end | string | - | 販売終了日時 |
| is_pay | boolean | ✓ | 有料チケットか |
| priority | number | ✓ | 優先順位（1以上） |
| price | number | ✓ | 価格（0以上） |
| enable_number_sold | boolean | ✓ | 販売数制限を設定するか |
| number_sold | number | - | 販売数上限 |
| enable_purchasable_number | boolean | ✓ | 購入可能数を設定するか |
| purchasable_number | number | - | 一人あたりの購入可能数 |
| enable_cancel_period | boolean | ✓ | キャンセル期間を設定するか |
| cancel_period_start | string | - | キャンセル期間開始 |
| cancel_period_end | string | - | キャンセル期間終了 |
| checkin_method | object | ✓ | チェックイン方法 |
| checkin_method.qr | boolean | ✓ | QRコード使用 |
| checkin_method.manual | boolean | ✓ | 手動チェックイン |
| enable_unlimit_checkin | boolean | ✓ | 無制限チェックイン |
| enable_multiple_price | boolean | ✓ | 複数価格設定（作成後変更不可） |
| remarks | string/null | - | 備考 |
| hide_checkin_expiration_ticket | boolean | ✓ | 期限切れチケット非表示 |
| enable_external_qr | boolean | ✓ | 外部QRコード使用 |
| enable_remaining_number | boolean | ✓ | 残数表示設定 |
| border_remaining_number | number | - | 残数境界値 |
| enable_remaining_text | boolean | ✓ | 残数テキスト表示 |
| checkin_period_start | string | - | チェックイン期間開始 |
| checkin_period_end | string | - | チェックイン期間終了 |
| dynamic_checkin_period | boolean | ✓ | 動的チェックイン期間 |
| checkin_period_days | number | - | チェックイン期間（日数） |
| enable_checkin_user_form | boolean | ✓ | チェックイン時フォーム |
| enable_entry_user_form | boolean | ✓ | エントリー時フォーム |

### TicketLanguageData（言語別データ）

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| language_id | number | ✓ | 言語ID（1:日本語） |
| title | string | ✓ | チケット名 |
| image | object/null | - | 画像情報 |
| description | string | - | 説明文 |
| my_ticket_description | string | - | マイチケット説明 |
| remaining_text | array | - | 残数表示テキスト |
| cancel_policy | string | - | キャンセルポリシー |

### RemainingText（残数表示）

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| number | number | ✓ | 残数の閾値 |
| label | string/null | - | 表示ラベル |

### MultiplePrice（複数価格設定）

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| ticket_multiple_price_id | number/null | - | 価格ID |
| price | number | ✓ | 価格 |
| language_data | array | ✓ | 言語別ラベル |

---

## エラーコード

### HTTPステータスコード

| コード | 説明 | 対処法 |
|--------|------|--------|
| 200 | 成功 | - |
| 400 | 不正なリクエスト | リクエストパラメータを確認 |
| 401 | 認証エラー | トークンの有効期限を確認 |
| 403 | 権限なし | APIキーまたはトークンを確認 |
| 404 | リソースが見つからない | IDやパスを確認 |
| 422 | 処理できないエンティティ | ビジネスルール違反を確認 |
| 500 | サーバーエラー | しばらく待って再試行 |

### アプリケーションエラーコード

| エラーコード | メッセージ | 説明 |
|-------------|-----------|------|
| 404003 | 該当のデータがみつかりません | 指定されたリソースが存在しない |
| 422110 | 登録後の料金種別を変更することはできません | enable_multiple_priceは変更不可 |

---

## 制限事項

### レート制限
- 詳細な制限値は公開されていません
- 過度なリクエストは避けてください

### データ制限
- チケット名: 最大100文字
- 説明文: 最大1000文字（推定）
- 価格: 0以上の整数

### ビジネスルール
1. **content_id必須**: すべてのチケット操作にはcontent_idが必要
2. **価格種別変更不可**: `enable_multiple_price`は作成後変更できません
3. **日時形式**: すべての日時は`YYYY-MM-DD HH:mm:ss`形式
4. **言語ID**: 現在は日本語（language_id: 1）のみサポート

### 推奨事項
1. **トークン管理**: トークンの有効期限を監視し、期限切れ前に更新
2. **エラーハンドリング**: 422エラーの詳細メッセージを確認
3. **バックオフ戦略**: エラー時は指数バックオフで再試行
4. **バリデーション**: APIコール前にローカルでデータ検証

---

## サンプルコード

### Node.js（TypeScript）

```typescript
// トークン取得
async function getToken(apiKey: string): Promise<string> {
  const response = await fetch('https://public-api.eventos.tokyo/api/v1/token', {
    method: 'GET',
    headers: { 'x-api-key': apiKey }
  });
  const data = await response.json();
  return data.access_token;
}

// チケット作成
async function createTicket(
  token: string, 
  apiKey: string,
  contentId: string,
  ticketData: any
): Promise<number> {
  const response = await fetch(
    `https://public-api.eventos.tokyo/api/v1/ticket/normal/master/${contentId}`,
    {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketData)
    }
  );
  const data = await response.json();
  return data.id;
}
```

### cURL

```bash
# トークン取得
curl -X GET 'https://public-api.eventos.tokyo/api/v1/token' \
  -H 'x-api-key: YOUR_API_KEY'

# チケット一覧取得
curl -X GET 'https://public-api.eventos.tokyo/api/v1/ticket/normal/master/101103' \
  -H 'X-API-Key: YOUR_API_KEY' \
  -H 'Token: YOUR_ACCESS_TOKEN'
```

---

## 更新履歴

- 2025-01-07: 初版作成
- 認証方式: GET /api/v1/token（x-api-key使用）
- チケットAPI: CRUD操作完全対応
- 制限事項: enable_multiple_price変更不可を明記