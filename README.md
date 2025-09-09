# eventos MCP Server

eventos APIと統合するためのModel Context Protocol (MCP)サーバー実装です。

## 概要

このMCPサーバーは、eventos イベント管理プラットフォームのAPIと通信し、AIアシスタントがイベントやチケットの管理を行えるようにします。

## 機能

- 🔐 **認証管理**: APIキーによる自動認証とトークン管理
- 🎫 **チケット管理**: チケットの作成、取得、更新、削除
- 📋 **一覧取得**: チケット一覧の取得（ページネーション対応）

## セットアップ

### 必要条件

- Node.js 20以上
- npm または yarn
- eventos APIキー

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/bsj-m-takigawa/eventos-mcp.git
cd eventos-mcp

# 依存関係のインストール
npm install

# ビルド
npm run build
```

### 環境変数の設定

`.env`ファイルを作成し、以下の情報を設定してください：

```env
# eventos設定
EVENTOS_TENANT=your-subdomain(今後指定のドメイン対応できるようにする/認証方式を変えてロールによって取得範囲が変わるとかも検討)
EVENTOS_API_KEY=your-api-key-here
EVENTOS_API_URL=https://public-api.eventos.tokyo
```

## 使用方法

### MCPサーバーの起動

```bash
npm start
```

### MCP設定 (Claude Desktop)

Claude Desktopの設定ファイル（`claude_desktop_config.json`）に以下を追加：

```json
{
  "mcpServers": {
    "eventos": {
      "command": "node",
      "args": ["/path/to/eventos-mcp/dist/cli/server.js"],
      "env": {
        "EVENTOS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## 利用可能なMCPツール

### 認証

#### `eventos_authenticate`
eventos APIの認証を行い、アクセストークンを取得します。

```json
{
  "name": "eventos_authenticate",
  "arguments": {}
}
```

### チケット管理

#### `eventos_list_tickets`
チケット一覧を取得します。

```json
{
  "name": "eventos_list_tickets",
  "arguments": {
    "content_id": "101103",
    "limit": 10,
    "offset": 0
  }
}
```

#### `eventos_get_ticket`
特定のチケット情報を取得します。

```json
{
  "name": "eventos_get_ticket",
  "arguments": {
    "ticketId": "661431",
    "content_id": "101103"
  }
}
```

#### `eventos_create_ticket`
新しいチケットを作成します。

```json
{
  "name": "eventos_create_ticket",
  "arguments": {
    "content_id": "101103",
    "eventId": "event-001",
    "type": "general",
    "name": "一般チケット",
    "description": "イベント参加用チケット",
    "price": 5000,
    "currency": "JPY",
    "quantity": 100
  }
}
```

#### `eventos_update_ticket`
既存のチケットを更新します。

```json
{
  "name": "eventos_update_ticket",
  "arguments": {
    "ticketId": "661431",
    "content_id": "101103",
    "eventId": "event-001",
    "type": "general",
    "name": "更新後のチケット名",
    "price": 3000,
    "currency": "JPY",
    "quantity": 50
  }
}
```

#### `eventos_delete_ticket`
チケットを削除します。

```json
{
  "name": "eventos_delete_ticket",
  "arguments": {
    "ticketId": "661431",
    "content_id": "101103"
  }
}
```

### ユーザー管理

#### `eventos_list_users`
イベントに紐づくユーザー一覧を取得します。

```json
{
  "name": "eventos_list_users",
  "arguments": {
    "event_id": "YOUR_EVENT_ID",
    "per_page": 25,
    "page": 1
  }
}
```

## API仕様

### 認証方式
- **エンドポイント**: `GET /api/v1/token`
- **ヘッダー**: `x-api-key: {API_KEY}`
- **レスポンス**: `{ "access_token": "...", "expired_at": "..." }`

### チケットAPI
- **ベースURL**: `https://public-api.eventos.tokyo/api/v1/ticket/normal/master/{content_id}`
- **認証ヘッダー**: 
  - `X-API-Key: {API_KEY}`
  - `Token: {ACCESS_TOKEN}`

### チケットデータ形式

チケットは複雑な構造を持ちます：

```javascript
{
  "ticket": {
    "common": {
      // 共通設定（販売期間、価格、在庫数など）
    },
    "language_data": [
      // 言語別の情報（タイトル、説明など）
    ],
    "multiple_prices": [
      // 複数価格設定（オプション）
    ]
  }
}
```

## 開発

### テストの実行

```bash
# 全テストの実行
npm test

# 単体テストのみ
npm test -- tests/unit/

# MCPサーバーの動作確認
node test-mcp-server.cjs
```

### ビルド

```bash
npm run build
```

### 開発モード

```bash
npm run dev
```

### サーバーの起動確認

```bash
# MCPサーバーを直接起動
npm start

# 別ターミナルでテストスクリプトを実行
node test-mcp-server.cjs
```

## トラブルシューティング

### 403 Forbidden エラー
- APIキーが正しいか確認してください
- APIキーの有効期限を確認してください

### 422 Unprocessable Entity エラー
- `enable_multiple_price`は作成後変更できません
- 必須フィールドがすべて含まれているか確認してください

### content_idが必要
- eventos APIのチケット操作には`content_id`が必須です
- 正しいcontent_idを使用しているか確認してください

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## サポート

問題が発生した場合は、[GitHubのissue](https://github.com/your-username/eventos-mcp/issues)を作成してください。
