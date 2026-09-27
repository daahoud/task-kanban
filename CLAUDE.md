# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 概要
タスク管理カンバン。タスクの追加・編集・削除・一覧表示とステータス管理（Todo / InProgress / Done）ができる。
Next.js + Supabase で構築し、Vercel にデプロイする
`create-next-app` で作成したタスクカンバンアプリです。構成は Next.js 16（App Router）、React 19、TypeScript（strict）、Tailwind CSS v4 です。現状はテンプレートのトップページのみで、カンバン機能はまだ実装されていません。

Next.js 16 は学習データ上の Next.js と API や規約が異なります。コードを書く前に `node_modules/next/dist/docs/` の該当ガイドを確認してください（上記 AGENTS.md 参照）。

## 技術スタック
- Next.js (App Router)
- TypeScript
- Supabase (データベース)
- Vitest + Testing Library (テスト)
- Vercel (デプロイ)

## コマンド

```bash
npm run dev                       # 開発サーバー (http://localhost:3000)
npm run build                     # 本番ビルド
npm run lint                      # ESLint（flat config）
npx tsc --noEmit                  # 型チェック
npm test                          # Vitest（ウォッチモード）
npx vitest run                    # 全テストを1回実行
npx vitest run __tests__/page.test.tsx   # 単一ファイル
npx vitest run -t "テスト名の一部"         # テスト名で絞り込み
```

## 構成と規約

- **ソースは `src/` 配下:** App Router のルートは `src/app/` にあります。パスエイリアス `@/*` は `./src/*` を指します。
- **型付きルートヘルパー:** `LayoutProps<"/">` などは Next.js が `.next/types` に生成するグローバル型で、import は不要です。`next dev` か `next build` を実行すると生成・更新されます。
- **スタイル（Tailwind v4）:** `tailwind.config.*` はありません。テーマは `src/app/globals.css` の `@theme inline` と CSS 変数（`--background` / `--foreground`、ダークモードは `prefers-color-scheme`）で定義し、PostCSS プラグインは `@tailwindcss/postcss` です。フォントは `next/font` の Geist を `layout.tsx` で CSS 変数として読み込んでいます。
- **テスト:** Vitest と React Testing Library を jsdom 上で使います。設定は `vitest.config.mts` で、`@/*` は Vite の `resolve.tsconfigPaths` で解決します（`vite-tsconfig-paths` プラグインは不要）。テストは `__tests__/` に置いています（`src/app` 内へのコロケーションも可）。
- **テストの制約:** Vitest は `async` Server Components を扱えません。非同期のサーバーコンポーネントは E2E テストで検証する必要があります。
- **`@types/node` のバージョン:** `vitest@5` の peer 依存に合わせて `^24` にしています（Node v24 を使用）。下げると `npm install` が ERESOLVE で失敗します。

## コーディングルール
- 変更後は必ず `npm test` でテストが通ることを確認してください。
- 変更は1つの関心事に絞り、小さい単位で行ってください
- 指示された範囲以外のコードを変更しないでください

## コーディング規約
- コンポーネントは関数コンポーネントで記述してください
- 変数名・関数名はキャメルケースで書いてください
- コミットメッセージは日本語で書いてください

## テストルール
- 網羅性: 正常系・異常系・境界値を検討してください
- 可読性: テスト名に条件と期待する結果を明示してください
- 保守性: 実装の内部構造ではなくユーザーから見た振る舞いをテストしてください
- 独立性: テスト間で状態を共有しないでください
- 状態遷移: 画面遷移の順方向、逆方向を検証してください
- モック方針: 外部依存のみモック化してください

## 禁止事項
- console.log を本番コードに残さないでください。
- 既存のテストを削除しないでください
- any 型を使用しないでください

## MCP 活用ルール
- Next.js・Supabase・Vitest などの最新仕様は Context7 MCP を使って公式ドキュメントを確認してください。
