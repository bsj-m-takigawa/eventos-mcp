# eventos MCP Server 配布ガイド

## 配布方法の選択肢

### 1. NPMパッケージとして公開（推奨）

最も標準的で使いやすい配布方法です。

#### 準備

1. **package.json の更新**
```json
{
  "name": "@your-org/eventos-mcp",
  "version": "1.0.0",
  "description": "MCP server for eventos API integration",
  "main": "dist/cli/server.js",
  "bin": {
    "eventos-mcp": "dist/cli/server.js"
  },
  "files": [
    "dist/",
    "README.md",
    "LICENSE"
  ],
  "keywords": ["mcp", "eventos", "claude", "ai"],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/eventos-mcp.git"
  }
}
```

2. **.npmignore の作成**
```
src/
tests/
*.ts
tsconfig.json
.env
.env.test
test-*.js
*.log
node_modules/
.git/
```

#### 公開手順

```bash
# NPMにログイン
npm login

# ビルド
npm run build

# ドライラン（実際には公開しない）
npm publish --dry-run

# 公開
npm publish --access public
```

#### ユーザーのインストール方法

```bash
# グローバルインストール
npm install -g @your-org/eventos-mcp

# またはnpxで直接実行
npx @your-org/eventos-mcp
```

### 2. GitHub Releases

ソースコードと一緒にバイナリを配布します。

#### リリース作成手順

1. **ビルドアーティファクトの準備**
```bash
# ビルド
npm run build

# 配布用アーカイブ作成
tar -czf eventos-mcp-v1.0.0.tar.gz \
  dist/ \
  package.json \
  package-lock.json \
  README.md \
  docs/ \
  LICENSE

# Windows用ZIP
zip -r eventos-mcp-v1.0.0.zip \
  dist/ \
  package.json \
  package-lock.json \
  README.md \
  docs/ \
  LICENSE
```

2. **GitHubでリリース作成**
- GitHubリポジトリの「Releases」タブ
- 「Create a new release」をクリック
- タグ（例: v1.0.0）を作成
- リリースノートを記述
- アーティファクトをアップロード

#### ユーザーのインストール方法

```bash
# ダウンロード
curl -L https://github.com/your-username/eventos-mcp/releases/download/v1.0.0/eventos-mcp-v1.0.0.tar.gz -o eventos-mcp.tar.gz

# 解凍
tar -xzf eventos-mcp.tar.gz

# インストール
cd eventos-mcp
npm install --production
```

### 3. スタンドアロン実行可能ファイル

Node.jsが不要な単一実行ファイルを作成します。

#### pkg を使用

1. **インストール**
```bash
npm install --save-dev pkg
```

2. **package.json に追加**
```json
{
  "pkg": {
    "targets": [
      "node20-macos-x64",
      "node20-macos-arm64",
      "node20-linux-x64",
      "node20-win-x64"
    ],
    "outputPath": "binaries"
  }
}
```

3. **ビルド**
```bash
# TypeScriptビルド
npm run build

# 実行可能ファイル作成
npx pkg dist/cli/server.js
```

#### 配布

作成されたバイナリをGitHub Releasesで配布：
- `eventos-mcp-macos-x64`
- `eventos-mcp-macos-arm64`
- `eventos-mcp-linux-x64`
- `eventos-mcp-win-x64.exe`

### 4. Docker イメージ

コンテナ化された配布方法です。

#### Dockerfile

```dockerfile
FROM node:20-slim

WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm ci --production

# アプリケーションのコピー
COPY dist/ ./dist/

# 環境変数の設定
ENV NODE_ENV=production

# MCPサーバー起動
CMD ["node", "dist/cli/server.js"]
```

#### ビルドと公開

```bash
# イメージビルド
docker build -t your-username/eventos-mcp:latest .

# Docker Hub へプッシュ
docker push your-username/eventos-mcp:latest
```

#### ユーザーの使用方法

```bash
docker run -e EVENTOS_API_KEY=your-key \
  your-username/eventos-mcp:latest
```

## Claude Desktop への統合

### NPM パッケージの場合

```json
{
  "mcpServers": {
    "eventos": {
      "command": "npx",
      "args": ["@your-org/eventos-mcp"],
      "env": {
        "EVENTOS_API_KEY": "your-api-key-here",
        "EVENTOS_TENANT": "ev-kensho"
      }
    }
  }
}
```

### ローカルインストールの場合

```json
{
  "mcpServers": {
    "eventos": {
      "command": "node",
      "args": ["/path/to/eventos-mcp/dist/cli/server.js"],
      "env": {
        "EVENTOS_API_KEY": "your-api-key-here",
        "EVENTOS_TENANT": "ev-kensho"
      }
    }
  }
}
```

### スタンドアロンバイナリの場合

```json
{
  "mcpServers": {
    "eventos": {
      "command": "/path/to/eventos-mcp-macos-arm64",
      "args": [],
      "env": {
        "EVENTOS_API_KEY": "your-api-key-here",
        "EVENTOS_TENANT": "ev-kensho"
      }
    }
  }
}
```

## 自動更新の実装

### package.json でのバージョン管理

```json
{
  "scripts": {
    "check-updates": "npm outdated",
    "update": "npm update"
  }
}
```

### 更新通知機能

```typescript
// src/lib/update-checker.ts
import { execSync } from 'child_process';
import { version } from '../../package.json';

export async function checkForUpdates(): Promise<void> {
  try {
    const latest = execSync('npm view @your-org/eventos-mcp version')
      .toString()
      .trim();
    
    if (latest !== version) {
      console.log(`📦 New version available: ${latest} (current: ${version})`);
      console.log(`   Run: npm update -g @your-org/eventos-mcp`);
    }
  } catch (error) {
    // 更新チェック失敗時は静かに失敗
  }
}
```

## セキュリティ考慮事項

### APIキーの取り扱い

1. **環境変数を推奨**
   - ハードコードしない
   - .envファイルは配布に含めない

2. **設定ファイルテンプレート**
```bash
# .env.example
EVENTOS_TENANT=your-tenant
EVENTOS_API_KEY=your-api-key-here
EVENTOS_API_URL=https://public-api.eventos.tokyo
```

3. **初回セットアップスクリプト**
```bash
#!/bin/bash
# setup.sh

echo "eventos MCP Server Setup"
echo "========================"

read -p "Enter your eventos tenant: " tenant
read -sp "Enter your API key: " apikey
echo

cat > .env <<EOF
EVENTOS_TENANT=$tenant
EVENTOS_API_KEY=$apikey
EVENTOS_API_URL=https://public-api.eventos.tokyo
EOF

echo "✅ Configuration saved to .env"
```

## リリースチェックリスト

- [ ] バージョン番号の更新（package.json）
- [ ] CHANGELOG.md の更新
- [ ] README.md の確認
- [ ] ビルドの実行（`npm run build`）
- [ ] テストの実行（`npm test`）
- [ ] .env.example の確認
- [ ] ライセンスファイルの確認
- [ ] 依存関係の脆弱性チェック（`npm audit`）
- [ ] Git タグの作成
- [ ] 配布パッケージの作成
- [ ] リリースノートの作成

## サポートとドキュメント

### 必須ドキュメント

1. **README.md** - 基本的な使い方
2. **INSTALL.md** - インストール手順
3. **API.md** - API仕様
4. **TROUBLESHOOTING.md** - トラブルシューティング
5. **CHANGELOG.md** - 変更履歴

### ユーザーサポート

1. **GitHub Issues** - バグ報告と機能要望
2. **Discussions** - Q&A とコミュニティ
3. **Wiki** - 詳細なドキュメント

## 推奨配布方法

### 初期リリース
1. GitHub Releases でソースコード配布
2. インストール手順を詳細に記載

### 安定版
1. NPMパッケージとして公開
2. 自動更新機能の実装

### エンタープライズ向け
1. Dockerイメージの提供
2. プライベートレジストリでの配布