#!/usr/bin/env node
/* ============================================================================
 * 卸载 install-desktop-local.mjs 装进去的 dsh-orbit-boot。
 * 只删自己登记的包名对应目录，别的依赖一律不碰。
 * 用法：node tools/uninstall-desktop-local.mjs [--home <DSH_HOME>] [--restore dsh-startup-screen]
 * ========================================================================== */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const NAME = 'dsh-orbit-boot'
function arg(flag, fallback) {
  const i = process.argv.indexOf(flag)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const home = path.resolve(arg('--home', process.env.DSH_HOME || path.join(os.homedir(), '.dsh')))
const profileName = arg('--profile', 'desktop')
const restore = String(arg('--restore', '')).split(',').map((s) => s.trim()).filter(Boolean)

const profile = path.join(home, 'profiles', profileName)
const manifest = path.join(profile, 'package.json')
const lockPath = path.join(profile, 'lock')
const extDir = path.join(home, 'extensions', NAME)
const modDir = path.join(profile, 'node_modules', NAME)

if (!fs.existsSync(manifest)) { console.error('找不到 profile 清单：' + manifest); process.exit(1) }

let lockFd
try { lockFd = fs.openSync(lockPath, 'wx') } catch {
  console.error('profile 被占用，先退出 DSH 和其它插件安装器。锁文件：' + lockPath)
  process.exit(1)
}

const original = fs.readFileSync(manifest)
try {
  const json = JSON.parse(original.toString('utf8'))
  if (json.dependencies) delete json.dependencies[NAME]
  const bundles = Array.isArray(json.dsh?.profile?.bundles) ? json.dsh.profile.bundles : []
  let next = bundles.filter((b) => b !== NAME)
  for (const other of restore) {
    if (fs.existsSync(path.join(profile, 'node_modules', other)) && !next.includes(other)) next.push(other)
  }
  json.dsh.profile.bundles = next
  fs.writeFileSync(manifest, JSON.stringify(json, null, 2) + '\n', 'utf8')
  fs.rmSync(extDir, { recursive: true, force: true })
  fs.rmSync(modDir, { recursive: true, force: true })
  fs.rmSync(manifest + '.bak-' + NAME, { force: true })
  console.log('已卸载 ' + NAME + '。')
  if (restore.length) console.log('已把 ' + restore.join(', ') + ' 放回 bundles。')
  console.log('完全退出 DeepSeek Harness 再打开即可生效。')
} catch (err) {
  fs.writeFileSync(manifest, original)
  throw err
} finally {
  try { fs.closeSync(lockFd) } catch { /* noop */ }
  try { fs.rmSync(lockPath, { force: true }) } catch { /* noop */ }
}
