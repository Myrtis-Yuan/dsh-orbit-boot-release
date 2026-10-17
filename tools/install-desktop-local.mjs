#!/usr/bin/env node
/* ============================================================================
 * 把 dsh-orbit-boot 装进 DeepSeek Harness Desktop 的 desktop profile。
 * ----------------------------------------------------------------------------
 * 1) 包体放进 ~/.dsh/extensions/<name>（源）与 <profile>/node_modules/<name>
 * 2) profile 清单登记 file: 依赖，并把包名并进 dsh.profile.bundles
 *    —— bundles 决定 Host 会应用插件自带的 cordis.patch.yml，客户端半侧也靠它装配
 * 3) 全程持 <profile>/lock，避免和桌面端自己的插件操作打架
 *
 * 同一个 profile 里只能有一个开屏插件生效，所以顺手可以把冲突的插件从
 * bundles 里摘掉（--disable <包名>，包体与依赖都保留，随时能加回来）。
 *
 * 用法：
 *   node tools/install-desktop-local.mjs [--source <包体目录>] [--home <DSH_HOME>]
 *                                        [--profile desktop] [--disable dsh-startup-screen]
 *                                        [--dry-run]
 *
 * 装完必须**完全退出桌面端再打开**才会生效。
 * ========================================================================== */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const COPY = [
  'lib', 'test', 'preview',
  'package.json', 'cordis.patch.yml',
  'README.md', 'INSTALL.md', 'THIRD-PARTY.md', 'LICENSE'
]

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}
function fail(msg) { console.error('错误：' + msg); process.exit(1) }

const here = path.dirname(fileURLToPath(import.meta.url))
/* 仓库根目录就是包体（package.json 在根上），所以默认往上一层 */
const source = path.resolve(arg('--source', path.join(here, '..')))
const home = path.resolve(arg('--home', process.env.DSH_HOME || path.join(os.homedir(), '.dsh')))
const profileName = arg('--profile', 'desktop')
const dryRun = process.argv.includes('--dry-run')

/* 要顺手停用的插件名（逗号分隔）：只从 bundles 里摘掉，包体与依赖不动 */
const disable = String(arg('--disable', 'dsh-startup-screen'))
  .split(',').map((s) => s.trim()).filter(Boolean)

if (!fs.existsSync(path.join(source, 'package.json'))) fail('找不到包体：' + source)

const pkg = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8'))
const NAME = pkg.name
if (!/^[a-z0-9][a-z0-9-]*$/.test(String(NAME))) fail('包名不合法：' + NAME)

const profile = path.join(home, 'profiles', profileName)
const manifest = path.join(profile, 'package.json')
const lockPath = path.join(profile, 'lock')
const extDir = path.join(home, 'extensions', NAME)
const modDir = path.join(profile, 'node_modules', NAME)

if (!fs.existsSync(manifest)) fail('profile 还没初始化：' + manifest + '（先打开一次 DeepSeek Harness）')

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')) }
function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8') }
function copyInto(dest) {
  fs.rmSync(dest, { recursive: true, force: true })
  fs.mkdirSync(dest, { recursive: true })
  for (const item of COPY) {
    const from = path.join(source, item)
    if (fs.existsSync(from)) fs.cpSync(from, path.join(dest, item), { recursive: true })
  }
}

console.log(`安装 ${NAME} v${pkg.version}`)
console.log('  源          : ' + source)
console.log('  extensions  : ' + extDir)
console.log('  node_modules: ' + modDir)
if (disable.length) console.log('  顺手停用    : ' + disable.join(', '))
if (dryRun) { console.log('DryRun：未改动任何文件。'); process.exit(0) }

let lockFd
try {
  lockFd = fs.openSync(lockPath, 'wx')
  fs.writeSync(lockFd, String(process.pid) + '\n')
} catch {
  fail('profile 被占用，先退出 DSH 和其它插件安装器。锁文件：' + lockPath)
}

const original = fs.readFileSync(manifest)
let manifestTouched = false
try {
  fs.writeFileSync(manifest + '.bak-' + NAME, original)

  copyInto(extDir)
  copyInto(modDir)
  console.log('  包体已复制到 extensions 与 node_modules')

  const json = readJson(manifest)
  json.dependencies = json.dependencies || {}
  json.dependencies[NAME] = 'file:' + extDir.replace(/\\/g, '/')
  json.dsh = json.dsh || {}
  json.dsh.profile = json.dsh.profile || {}
  let bundles = Array.isArray(json.dsh.profile.bundles) ? json.dsh.profile.bundles.slice() : []
  for (const other of disable) {
    if (other === NAME) continue
    if (bundles.includes(other)) {
      bundles = bundles.filter((b) => b !== other)
      console.log('  已从 bundles 摘掉冲突插件：' + other + '（包体保留，加回去即可恢复）')
    }
  }
  if (!bundles.includes(NAME)) bundles.push(NAME)
  json.dsh.profile.bundles = bundles
  writeJson(manifest, json)
  manifestTouched = true
  console.log('  profile 清单已登记（dependencies + dsh.profile.bundles）')
} catch (err) {
  if (manifestTouched) fs.writeFileSync(manifest, original)
  throw err
} finally {
  try { fs.closeSync(lockFd) } catch { /* noop */ }
  try { fs.rmSync(lockPath, { force: true }) } catch { /* noop */ }
}

/* ── 复核 ─────────────────────────────────────────────────────────────── */
const check = readJson(manifest)
const bundles = check.dsh && check.dsh.profile ? check.dsh.profile.bundles || [] : []
const okDep = Object.prototype.hasOwnProperty.call(check.dependencies || {}, NAME)
const okBundle = bundles.includes(NAME)
const noConflict = disable.filter((n) => n !== NAME).every((n) => !bundles.includes(n))
const okFiles = ['lib/index.js', 'lib/splash.js', 'lib/splash.css', 'lib/client.js',
  'lib/assets/logo.mp4', 'lib/assets/logo-plate.png', 'cordis.patch.yml']
  .every((f) => fs.existsSync(path.join(modDir, f)))
console.log(`  复核：依赖 ${okDep} / bundles ${okBundle} / 无冲突插件 ${noConflict} / 包体完整 ${okFiles}`)
if (!(okDep && okBundle && noConflict && okFiles)) fail('安装复核未通过，请把上面这行发回给我。')

console.log('')
console.log('安装完成。请完全退出 DeepSeek Harness（含托盘）再重新打开。')
console.log('设置页 →「开屏动画」可以改主题、文案、身份资料。')
