# 安装说明

## 一、本地目录安装（推荐）

在仓库根目录执行：

```bash
node tools/install-desktop-local.mjs
```

它会做三件事，全程持有 `<profile>/lock`：

1. 把包体复制到 `~/.dsh/extensions/dsh-orbit-boot`
   与 `~/.dsh/profiles/desktop/node_modules/dsh-orbit-boot`
2. 在 `~/.dsh/profiles/desktop/package.json` 里登记 `file:` 依赖
3. 把 `dsh-orbit-boot` 并进 `dsh.profile.bundles`（这一步决定 Host 会应用
   插件自带的 `cordis.patch.yml`，客户端半侧也靠它装配）

**装完完全退出 DeepSeek Harness（含托盘）再重新打开。**
设置页里会多出一项「开屏动画」。

常用参数：

| 参数 | 作用 |
|---|---|
| `--profile web` | 装进 web profile（默认 desktop） |
| `--source <目录>` | 指定包体目录（默认本仓库根） |
| `--home <目录>` | 指定 DSH_HOME（默认 `~/.dsh`） |
| `--disable a,b` | 顺手把别的开屏插件从 bundles 里摘掉（默认 `dsh-startup-screen`） |
| `--dry-run` | 只打印会做什么，不改任何文件 |

卸载：

```bash
node tools/uninstall-desktop-local.mjs
# 想把之前停用的插件放回来：
node tools/uninstall-desktop-local.mjs --restore dsh-startup-screen
```

## 二、走 DSH 官方插件命令

```bash
dsh plugin --profile desktop add ./            # 本地目录
dsh plugin --profile desktop add github:<user>/dsh-orbit-boot
```

装完同样要重启。**别和上面那条混用**，否则插件会被注册两次。

## 三、验证装好了

重启后刷新页面：应该先看到黑幕上的标识动效与机构名，然后是转场，
再进入六步序列。设置 →「开屏动画」里能看到版本号。

想确认路由活着：打开开发者工具的「网络」面板刷新一次，应当能看到
`/dsh-orbit/splash.js` 与 `/dsh-orbit/splash.css` 两条请求。

## 四、和别的开屏插件冲突时

同一个 profile 里**只能有一个开屏插件生效**。如果同时装了
`dsh-startup-screen` 之类同样会注入整屏开屏层的插件，两层会叠在一起。

停用其中一个：编辑 `~/.dsh/profiles/desktop/package.json`，把它从
`dsh.profile.bundles` 数组里删掉（`dependencies` 里的那行可以留着，不影响），
重启即可。想再启用就把它加回数组。

## 五、开发时改完怎么生效

| 改了什么 | 怎么生效 |
|---|---|
| `lib/splash.js` / `lib/splash.css` / `lib/assets/*` | 刷新页面即可（按请求实时下发，按 mtime 缓存） |
| `lib/index.js`（宿主半侧） / `lib/client.js`（设置面板） | 完全退出桌面端再打开 |
| `test/*` | 直接 `npm test`，不需要装 |

## 六、想先离线看效果

双击 `打开预览.cmd`（Windows）或 `./open-preview.sh`（POSIX），
会打开 `preview/index.html`。这个页面不依赖 DSH，直接加载 `lib/splash.js` 与
`lib/splash.css`，右上角控制台可以改身份、主题、动效风格、速度。

## 七、环境要求

| 项 | 要求 |
|---|---|
| 平台 | DSH **web** profile 或 **desktop** profile |
| Node | **>= 20** |
| 运行时依赖 | **零**（不需要 `npm install`） |
| 音频 | 包内自带；缺素材时自动回落到浏览器合成 |
