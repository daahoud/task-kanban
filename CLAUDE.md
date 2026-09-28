# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 概要
タスク管理カンバン。タスクの追加・編集・削除・一覧表示とステータス管理（Todo / InProgress / Done）ができる。
Next.js + Supabase で構築し、Vercel にデプロイする
`create-next-app` で作成したタスクカンバンアプリです。構成は Next.js 16（App Router）、React 19、TypeScript（strict）、Tailwind CSS v4、shadcn/ui です。トップページ（`/`）にカンバンがあり、タスクの一覧・追加・編集・削除とステータス変更ができます。認証はまだありません。

Next.js 16 は学習データ上の Next.js と API や規約が異なります。コードを書く前に `node_modules/next/dist/docs/` の該当ガイドを確認してください（上記 AGENTS.md 参照）。

## 技術スタック
- Next.js (App Router)
- TypeScript
- Supabase (データベース)
- shadcn/ui（Base UI ベース）+ Tailwind CSS v4 (UI)
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
npx shadcn@latest add <name>      # shadcn/ui コンポーネントを src/components/ui/ に追加
```

## 構成と規約

- **ソースは `src/` 配下:** App Router のルートは `src/app/` にあります。パスエイリアス `@/*` は `./src/*` を指します。
- **型付きルートヘルパー:** `LayoutProps<"/">` などは Next.js が `.next/types` に生成するグローバル型で、import は不要です。`next dev` か `next build` を実行すると生成・更新されます。
- **スタイル（Tailwind v4）:** `tailwind.config.*` はありません。テーマは `src/app/globals.css` の `@theme inline` と CSS 変数で定義し、PostCSS プラグインは `@tailwindcss/postcss` です。CSS 変数は shadcn/ui のトークン（`--background` / `--foreground` / `--primary` / `--muted` / `--border` / `--radius` など、値は oklch）です。ダークモードは `prefers-color-scheme` の `@media` 内で `:root` の変数を上書きしており、`.dark` クラスは使いません。フォントは `next/font` の Geist を `layout.tsx` で CSS 変数（`--font-geist-sans` / `--font-geist-mono`）として読み込み、`@theme inline` の `--font-sans` / `--font-mono` に割り当てています。
- **shadcn/ui:**
  - 設定は `components.json` にあります。スタイルは `base-nova`（プリミティブは Radix ではなく `@base-ui/react`）、ベースカラーは neutral、アイコンは `lucide-react` です。
  - コンポーネントは `npx shadcn@latest add <name>` で `src/components/ui/` に追加します。生成されたファイルは自分のコードとして編集して構いません。アプリ固有のコンポーネント（`KanbanBoard` など）は `src/components/` 直下に置き、`ui/` と混ぜないでください。
  - クラス名の結合には `@/lib/utils` の `cn()` を使います（shadcn 公式の `cn` パッケージの再エクスポートで、clsx + tailwind-merge の代わりです）。
  - バリアントは `class-variance-authority`（`cva`）で定義します。アニメーションは `tw-animate-css` です。
  - `shadcn init` を再実行すると `globals.css` が上書きされ、`--font-sans: var(--font-sans)` という自己参照と `.dark` クラス方式のダークモードに戻ります。再実行したら、この2点を直してください。
  - カンバンのコンポーネントは shadcn/ui で組んでいます。見た目のルールは下記「デザインルール」を参照してください。見た目を変えるときも、テストが依存するロールとアクセシブルネーム（下記）は変えないでください。
- **カンバンの構成:**
  - `src/app/page.tsx` は見出しと `<KanbanBoard />` を並べるだけの Server Component（`async` なし）です。
  - `src/components/KanbanBoard.tsx`（`"use client"`）が、マウント時に `fetchTasks()` でタスクを読み込み、`useState` で一覧を持ちます。追加・更新・削除のあとは API が返した行でローカルの一覧を書き換えるので、再取得しなくても画面にすぐ反映されます。この方針を崩さないでください。
  - `TaskForm.tsx` は追加フォームと編集フォームで共用します。`onCancel` がなければ追加用として扱い、成功すると入力欄を空に戻します。`TaskCard.tsx` はカードの中で表示と編集フォームを切り替えます。`ConfirmDialog.tsx` は shadcn/ui の `AlertDialog`（`role="alertdialog"`）を包んだ確認ダイアログです（`window.confirm` は使いません）。呼び出し側が条件付きで描画し、描画中は常に `open` です。
  - ステータスの表示名（Todo / InProgress / Done）は `src/components/statusLabels.ts` の `STATUS_LABELS` にまとめています。
  - エラーメッセージは「タスクの◯◯に失敗しました」の形で `role="alert"` に表示します。
- **データアクセス層（`src/lib/tasks.ts`）:**
  - タスクの読み書きはすべてここを通します。関数は `fetchTasks` / `createTask` / `updateTask` / `deleteTask` です。コンポーネントから Supabase クライアントを直接呼ばないでください。
  - `TaskStatus` の値の一覧（`TASK_STATUSES`）と文字数上限（`TITLE_MAX_LENGTH` = 100、`DESCRIPTION_MAX_LENGTH` = 1000）もここで定義しています。上限は DB の check 制約と同じ値なので、どちらかを変えるときは両方を変えてください。
  - DB の `status` 列は `text` 型なので、生成される型では `string` になります。`toTask()` で `TaskStatus` に絞り込み、想定外の値なら例外を投げます。
  - 追加・更新の前に `normalizeInput()` でタイトルの前後の空白を取り除いて検証します。検証に失敗した場合は通信しません。
- **テスト:** Vitest と React Testing Library を jsdom 上で使います。設定は `vitest.config.mts` で、`@/*` は Vite の `resolve.tsconfigPaths` で解決します（`vite-tsconfig-paths` プラグインは不要）。テストは `__tests__/` に置いています（`src/app` 内へのコロケーションも可）。
  - **データアクセス層のテスト**（`__tests__/tasks.test.ts`）では、`fetch` をモックして PostgREST へのリクエスト（`/rest/v1/tasks`、メソッド、`id=eq.<id>` などのクエリ、ボディ）を確認します。
  - **コンポーネントのテスト**（`__tests__/KanbanBoard.test.tsx`）では、外部依存である `@/lib/tasks` だけを `vi.mock` でモックします。定数や型は本物を使うため、`importOriginal` で残りを引き継いでください。`fetchTasks` を持つコンポーネントを描画するテスト（`page.test.tsx` など）でも同じようにモックが必要です。
  - 操作は `@testing-library/user-event` で行い、要素はロールとアクセシブルネームで探します。テストが次のラベルや文言に依存しているので、変えるときはテストも合わせて直してください。
    - 列: `region`（"Todo" / "InProgress" / "Done"）
    - カード: `article`（名前はタスクのタイトル）
    - 追加フォーム: `form`（"タスクを追加"）
    - 削除ダイアログ: `alertdialog`（"タスクの削除"）
  - Vitest の `globals` が無効なので、Testing Library の自動クリーンアップは動きません。複数回描画するテストでは `afterEach(cleanup)` を書いてください。
- **テストの制約:** Vitest は `async` Server Components を扱えません。非同期のサーバーコンポーネントは E2E テストで検証する必要があります。
- **Supabase:**
  - プロジェクトは `task-kanban`（ref: `ivgpcxkvieanjqjfrkdi`、リージョン ap-northeast-1）です。プロジェクト情報やテーブル構成は Supabase MCP で確認してください。
  - 環境変数は `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` の2つです。キー名は `.env.example` に、実際の値は `.env.local`（git 管理外）に書きます。キーは legacy の anon キーではなく publishable キー（`sb_publishable_...`）を使います。
  - DB へのアクセスは `@/lib/supabase/client` の `createSupabaseClient()` で行います。環境変数は `@/lib/supabase/env` の `getSupabaseEnv()` から読み、未設定なら例外を投げます。モジュールのトップレベルでクライアントを作ると、環境変数がないテストやビルドで失敗するため、関数の中で作ってください。
  - サーバー起動時に `src/instrumentation.ts` の `register()` が `checkSupabaseConnection()` を実行します。これは `/auth/v1/health` に publishable キーを付けて問い合わせ、URL とキーが有効かを確認します（無効なキーなら 401）。ログは接続失敗時だけ `console.error` で出し、成功時は何も出しません。
  - テストでは `vi.stubEnv` で環境変数を、`vi.stubGlobal("fetch", ...)` で通信をモックします（`__tests__/checkConnection.test.ts` を参照）。
  - **テーブル `public.tasks`**（マイグレーション `create_tasks_table`）の列は次のとおりです。
    - `id`: uuid の主キー。`gen_random_uuid()` で自動採番します。
    - `title`: text 型。check 制約で、前後の空白を除いて1〜100文字に制限しています。
    - `description`: text 型。既定値は `''` で、1000文字以内です。
    - `status`: text 型。既定値は `'todo'` で、値は `'todo'` / `'in_progress'` / `'done'` のいずれかです。
    - `created_at` / `updated_at`: timestamptz 型。`updated_at` はトリガー `tasks_set_updated_at`（関数 `public.set_updated_at()`）が更新時に自動で書き換えます。
    - インデックスは `(status, created_at)` に張っています。
  - **RLS:** 有効にしてあります。認証がないため、`anon` と `authenticated` に SELECT / INSERT / UPDATE / DELETE をすべて許可しています（誰でも全タスクを操作できる状態です）。認証を入れるときは `user_id` 列を追加し、`auth.uid()` でポリシーを絞ってください。
  - **スキーマを変える手順:**
    1. Supabase MCP の `apply_migration` で DDL を適用します（名前は snake_case）。
    2. `get_advisors` の security と performance を確認します。
    3. `generate_typescript_types` の出力で `src/lib/supabase/database.types.ts` を上書きします。このファイルは手で編集しないでください。
    4. 必要に応じて `src/lib/tasks.ts` の型、定数、テストを更新します。
    - 関数を作るときは Advisor の警告を避けるため `set search_path = ''` を付けてください。
  - `createSupabaseClient()` は `createClient<Database>` で型付けされています。
- **`@types/node` のバージョン:** `vitest@5` の peer 依存に合わせて `^24` にしています（Node v24 を使用）。下げると `npm install` が ERESOLVE で失敗します。

## デザインルール
- **部品は shadcn/ui を使う:** ボタン・入力欄・カード・ダイアログ・通知などは `src/components/ui/` のコンポーネントを使い、素の `<button>` や `<input>` に独自のクラスを書かないでください。必要な部品がなければ `npx shadcn@latest add <name>` で追加します。
  - ボタン: 主要な操作は `Button`（default）、キャンセルなど副次的な操作は `variant="outline"`、カード内のアイコン操作は `variant="ghost" size="icon-sm"`、削除の確定は `variant="destructive"` です。
  - エラーメッセージ: 画面全体のエラーは `Alert variant="destructive"`（`role="alert"` 付き）、入力欄の検証エラーは入力欄の直下に `text-destructive` の `<p role="alert">` を置き、入力欄に `aria-invalid` と `aria-describedby` を付けます。
  - セレクトボックス: テストが `user.selectOptions` で操作するため、ブラウザ標準の `<select>` を使う `NativeSelect` を使います。Base UI の `Select` は使わないでください。
  - 確認ダイアログ: `AlertDialog` を使います。モーダルの表示中は背景がアクセシビリティツリーから隠れるので、テストで背景の要素を探すときは `{ hidden: true }` を付けてください。
- **色はトークンで指定する:** `bg-background` / `bg-card` / `bg-muted` / `text-muted-foreground` / `text-destructive` / `border` など shadcn/ui のトークンを使います。`zinc-*` などのパレットの色を直書きしたり、`dark:` バリアントで色を切り替えたりしないでください（ダークモードは `globals.css` の CSS 変数で切り替わります）。例外として、ステータスの色の点だけはパレットの中間色（`sky-500` / `amber-500` / `emerald-500`）を使い、`statusLabels.ts` の `STATUS_DOT_CLASSES` にまとめています。
- **アイコン:** `lucide-react` を使い、装飾目的なら `aria-hidden="true"` を付けます。アイコンだけのボタンには `aria-label` と `title` で名前を付けます（例: カードの「編集」「削除」）。ボタン内でテキストの前に置くアイコンには `data-icon="inline-start"` を付けます。
- **レイアウトと見た目:**
  - ページ全体の背景は `bg-muted/40`、最大幅は `max-w-6xl` です。
  - カンバンの列は `rounded-2xl border bg-muted/60` のパネル、タスクは `Card size="sm"` で表し、マウスを載せると影を強める（`shadow-xs` → `hover:shadow-md`）程度の控えめな動きにとどめます。
  - 列の見出しはステータスの色の点・表示名・件数の `Badge variant="secondary"` を並べます。空の列は破線の枠（`border-dashed`）で「タスクはありません」と表示します。
  - 列はモバイルでは縦に並べ、`md` 以上で3列にします。幅 375px で横スクロールが出ないことを確認してください。
- **確認方法:** 見た目を変えたら、`npm run dev` で起動し、Playwright MCP でライト・ダーク（`browser_emulate_media` の `colorScheme`）と幅 375px のスクリーンショットを撮って確認します。確認用に作ったタスクは最後に削除して、DB を元の状態に戻してください。

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
