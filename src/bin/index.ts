#!/usr/bin/env node

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as fse from "fs-extra";

/**
 * `create-rext` コマンドのエントリーポイント
 */
function main() {
  // ユーザが指定したプロジェクト名を取得
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: npx create-rext <project-name>");
    process.exit(1);
  }

  const projectName = args[0]; // プロジェクト名
  const projectPath = path.resolve(process.cwd(), projectName); // 作成先ディレクトリの絶対パス

  // プロジェクト用フォルダが既に存在していればエラーにする
  if (fs.existsSync(projectPath)) {
    console.error(`Directory "${projectName}" already exists.`);
    process.exit(1);
  }

  // テンプレートのパスを取得 (自身のプロジェクト内 template/ を想定)
  const templatePath = path.resolve(__dirname, "../../", "template");

  // テンプレート一式をコピー
  fse.copySync(templatePath, projectPath);

  // プロジェクト名を package.json の name フィールドに反映
  updatePackageJson(projectPath, projectName);

  // npm install を実行して依存関係をインストール
  try {
    console.log("Installing dependencies. This may take a while...");
    execSync("npm install", { cwd: projectPath, stdio: "inherit" });
    console.log("Dependencies installed successfully.");
  } catch (err) {
    console.error("Failed to install dependencies:", err);
    process.exit(1);
  }

  // 完了メッセージを表示
  console.log(`\nProject "${projectName}" has been created successfully!`);
  console.log(`Navigate to the project directory with:\n  cd ${projectName}`);
  console.log(`Then start using the rext CLI tool.`);
}

/**
 * 指定されたプロジェクトディレクトリ内の `package.json` を更新し、
 * プロジェクト名を設定します。
 *
 * この関数は、テンプレートからコピーされた `package.json` を
 * ユーザ指定のプロジェクト名にカスタマイズします。
 *
 * @param projectPath - `package.json` が存在するプロジェクトディレクトリの絶対パス
 * @param projectName - `package.json` に設定するプロジェクト名
 *
 * @throws `package.json` が指定されたディレクトリに存在しない場合、エラーをスローします。
 *
 * @example
 * ```ts
 * updatePackageJson('/path/to/project', 'my-new-project')
 * ```
 */
function updatePackageJson(projectPath: string, projectName: string): void {
  const packageJsonPath = path.join(projectPath, "package.json");
  // package.json が存在するか確認
  if (!fs.existsSync(packageJsonPath)) {
    console.error("package.json not found in template. Exiting...");
    process.exit(1);
  }

  // package.json を読み込み、JSON オブジェクトとして解析
  const raw = fs.readFileSync(packageJsonPath, "utf-8");
  const obj = JSON.parse(raw);

  // プロジェクト名を上書き
  obj.name = projectName;

  // 更新された JSON オブジェクトをファイルに上書き保存
  const updated = JSON.stringify(obj, null, 2);
  fs.writeFileSync(packageJsonPath, updated);
}

main();
