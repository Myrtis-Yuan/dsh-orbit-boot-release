/* ============================================================================
 * dsh-orbit-boot — 开屏动画运行时（浏览器端，零依赖）
 * ----------------------------------------------------------------------------
 * 由 Host 半侧注入到 index.html，在 React 应用挂载之前接管首屏：
 *
 *   第一幕  黑幕 + 标识动效视频；机构名与英文副标题以「乱码收敛」解码成形
 *   过场    光速拉丝 + 光晕绽放（46 条径向光条从中心甩出，把整幕抽走）
 *   第二幕  深色底板：星野点亮、扫描带扫过时品牌三行解码、页脚与进度条入场
 *   序列    需要访问许可 → 身份资料确认 → 接收访问需求 → 开始读取权限
 *           → 读取完毕 · 核验通过 → 欢迎 <身份名称> 访问
 *           步骤切换用横向故障带原地换词，新字再乱码收敛
 *   交互    第 1、2 步等待用户确认（按钮 / Enter / 空格 / 点击），可跳过
 *   终幕    WELCOME TO + 标志板 + 同心轨道环 + 薄椭圆轨道 + 星野，
 *           三行解码后拉丝与光晕一起炸开
 *
 * 四条动效语汇（decodeText / bandSweep / warpBurst / 轨道环）见下方动效层；
 * 配置来自 window.__DSH_ORBIT__（Host 侧注入），也可用
 * window.__DSH_ORBIT_API__.replay() 重播。
 * ========================================================================== */
(function () {
  'use strict'

  if (window.__DSH_ORBIT_LOADED__) return
  window.__DSH_ORBIT_LOADED__ = true

  var ROOT_ID = 'dsh-orbit-root'
  var ROUTE_BASE = '/dsh-orbit'

  /* 素材走 Host 半侧注册的只读路由（lib/index.js 的 /dsh-orbit/asset/*）。
     两个新素材：
       logo.mp4        —— 开场黑幕上的标识动效（节点连线装配出两个机构标志）
       logo-plate.png  —— 授权序列中央的静态标志板（已抠掉底板，只剩标志本体）
     素材缺失时两处都会自动回落到原来的内置 SVG 鲸鱼标识。
     离线预览页（preview/index.html）用 file:// 打开时取不到绝对路由，
     所以基址允许被 window.__DSH_ORBIT__.assetBase 覆盖。 */
  var DEFAULT_ASSET_BASE = '/dsh-orbit/asset/'

  function assetUrl(name) {
    var base = (C && C.assetBase) || DEFAULT_ASSET_BASE
    return String(base).replace(/\/?$/, '/') + name
  }

  /* ── DeepSeek 官方鲸鱼标识（取自 DSH 自带 favicon.svg 的路径数据）──────── */
  var WHALE_PATH =
    'M48.8354 10.0479C48.3232 9.79199 48.1025 10.2798 47.8032 10.5278C47.7007 10.6079 ' +
    '47.6143 10.7119 47.5273 10.8076C46.7793 11.624 45.9048 12.1597 44.7622 12.0957C43.0923 ' +
    '12 41.666 12.5356 40.4058 13.8398C40.1377 12.2319 39.2476 11.272 37.8926 10.6558C37.1836 ' +
    '10.3359 36.4668 10.0156 35.9702 9.31982C35.6235 8.82373 35.5293 8.27197 35.356 ' +
    '7.72754C35.2456 7.3999 35.1353 7.06396 34.7651 7.00781C34.3633 6.94385 34.2056 7.2876 ' +
    '34.0479 7.57568C33.418 8.75195 33.1733 10.0479 33.1973 11.3599C33.2524 14.312 34.4736 ' +
    '16.6641 36.8999 18.3359C37.1758 18.5278 37.2466 18.7197 37.1597 19C36.9946 19.5757 ' +
    '36.7974 20.1357 36.624 20.7119C36.5137 21.0801 36.3486 21.1597 35.9624 21C34.6309 ' +
    '20.4321 33.481 19.5918 32.4644 18.5757C30.7393 16.8721 29.1792 14.9917 27.2334 ' +
    '13.52C26.7764 13.1758 26.3193 12.856 25.8467 12.5518C23.8618 10.584 26.1069 8.96777 ' +
    '26.627 8.77588C27.1704 8.57568 26.8159 7.8877 25.0591 7.896C23.3022 7.90381 21.6953 ' +
    '8.50391 19.647 9.30371C19.3477 9.42383 19.0322 9.51172 18.7095 9.58398C16.8501 9.22363 ' +
    '14.9199 9.14355 12.9033 9.37598C9.10596 9.80762 6.07275 11.6396 3.84326 14.7681C1.16455 ' +
    '18.5278 0.53418 22.7998 1.30664 27.2559C2.11768 31.9521 4.46582 35.8398 8.07373 ' +
    '38.8799C11.8159 42.0322 16.1255 43.5762 21.041 43.2803C24.0269 43.104 27.3516 42.6963 ' +
    '31.1016 39.4561C32.0469 39.936 33.0396 40.1279 34.686 40.272C35.9546 40.3921 37.1758 ' +
    '40.208 38.1211 40.0078C39.6021 39.688 39.4995 38.2881 38.9639 38.0322C34.623 35.9678 ' +
    '35.5762 36.8081 34.71 36.1279C36.9155 33.4639 40.2402 30.6958 41.54 21.728C41.6426 ' +
    '21.0161 41.5557 20.5679 41.54 19.9917C41.5322 19.6396 41.6108 19.5039 42.0049 ' +
    '19.4639C43.0923 19.3359 44.1479 19.0317 45.1167 18.4878C47.9292 16.9199 49.064 14.3438 ' +
    '49.3315 11.2559C49.3711 10.7837 49.3237 10.2959 48.8354 10.0479ZM24.3262 ' +
    '37.8398C20.1196 34.4639 18.0791 33.3521 17.2358 33.3999C16.4482 33.4482 16.5898 ' +
    '34.3682 16.7632 34.9678C16.9443 35.5601 17.1812 35.9683 17.5117 36.4878C17.7402 ' +
    '36.832 17.8979 37.3442 17.2832 37.728C15.9282 38.584 13.5728 37.4399 13.4624 ' +
    '37.3838C10.7207 35.7358 8.42822 33.5601 6.81348 30.584C5.25342 27.7197 4.34766 ' +
    '24.6479 4.19775 21.3677C4.1582 20.5757 4.38672 20.2959 5.15869 20.1519C6.17529 ' +
    '19.96 7.22314 19.9199 8.23926 20.0718C12.5327 20.7119 16.1885 22.6719 19.2529 ' +
    '25.7759C21.002 27.5439 22.3252 29.6558 23.6885 31.7202C25.1377 33.9121 26.6978 36 ' +
    '28.6831 37.7119C29.3843 38.312 29.9434 38.7681 30.479 39.104C28.8643 39.2881 26.1699 ' +
    '39.3281 24.3262 37.8398ZM26.3433 24.6001C26.3433 24.248 26.6191 23.9678 26.9658 ' +
    '23.9678C27.0444 23.9678 27.1152 23.9839 27.1782 24.0078C27.2651 24.04 27.3438 ' +
    '24.0879 27.4067 24.1602C27.5171 24.272 27.5801 24.4321 27.5801 24.6001C27.5801 ' +
    '24.9521 27.3042 25.2319 26.9575 25.2319C26.6108 25.2319 26.3433 24.9521 26.3433 ' +
    '24.6001ZM32.6064 27.8799C32.2046 28.0479 31.8027 28.1919 31.4165 28.208C30.8179 ' +
    '28.2397 30.1641 27.9922 29.8096 27.688C29.2583 27.2158 28.8643 26.9521 28.6987 ' +
    '26.1279C28.6279 25.7759 28.6675 25.2319 28.7305 24.9199C28.8721 24.248 28.7144 ' +
    '23.8159 28.2495 23.4238C27.8716 23.104 27.3911 23.0161 26.8633 23.0161C26.666 ' +
    '23.0161 26.4849 22.9277 26.3511 22.856C26.1304 22.7441 25.9492 22.4639 26.1226 ' +
    '22.1201C26.1777 22.0078 26.4458 21.7358 26.5088 21.688C27.2256 21.272 28.0527 ' +
    '21.4077 28.8169 21.7197C29.5259 22.0161 30.0615 22.5601 30.834 23.3281C31.6216 ' +
    '24.2559 31.7632 24.5117 32.2124 25.208C32.5669 25.752 32.8901 26.312 33.1104 ' +
    '26.9521C33.2446 27.3521 33.0713 27.6802 32.6064 27.8799Z'

  /* ── 默认配置（与 Host 侧 lib/index.js 的 DEFAULTS 保持一致）──────────── */
  var DEFAULTS = {
    enabled: true,
    mode: 'session',            // always | session | daily
    theme: 'dark',              // dark（复古未来主义深色，默认）| light（暖白档案底板）
    motion: 'orbit',            // orbit=轨道（新版动效）| classic=经典（第一版动效）
    speed: 1,
    requireInteraction: true,   // 第 1、2 步等待用户确认
    allowSkip: true,
    sound: true,                // 界面音效（WebAudio 合成，无音频文件）
    soundVolume: 0.5,
    voice: true,                // 女声播报
    voiceLang: 'en',            // en | zh | both
    voiceName: '',              // '' = 自动挑女声（见 FEMALE_HINTS）
    voiceRate: 0.88,            // 电影旁白档：比朗读慢，字与字之间才有重量
    voicePitch: 0.85,           // 压低音调，深沉的 AI 女声
    voiceVolume: 0.9,
    voiceCue: true,             // 念台词前的一声轻提示
    sfx: 'audio',               // audio=真素材（包内 lib/assets）/ synth=现场合成
    voiceSource: 'asset',       // asset=优先用真声素材 / tts=全部 TTS 合成
    voiceLead: 240,             // 提示音之后留一小段空白再开口
    identity: 'ROVER',          // ← 设置页可改的「身份名称」
    identityId: '0001',
    accessLevel: '3',
    brand1: '深空联合 · 星炬学院',
    brand2: 'SPACETREK COLLECTIVE · STARTORCH ACADEMY',
    brand3a: '综合任务处理系统',
    brand3b: '',
    orgZh: '深空联合',
    orgEn: 'SPACETREK COLLECTIVE',
    orgSub: '星炬学院',
    welcomeBox: '深空联合&星炬学院综合任务处理系统',
    footer: 'POWERED BY 深空联合 · 星炬学院',
    accent: '#c8b184',
    glitchA: '#cf8f6a',
    glitchB: '#7f9c8e'
  }

  /* ── 序列脚本 ──────────────────────────────────────────────────────────
     文字与真声素材一一对应（素材沿用原包体）：
       line-1.mp3 = V1 需要访问许可
       line-2.mp3 = V2 身份资料确认
       line-3.mp3 = V4 接收访问需求
       line-4.mp3 = V5 开始读取权限
       line-5.mp3 = V6 读取完毕 · 核验通过
     `say` 是素材拿不到时的 TTS 兜底文本；`audio` 是素材文件名（不含扩展名）。 */
  var STEPS = [
    {
      zh: '需要访问许可',
      en: 'ACCESS PERMISSION REQUIRED',
      say: 'Access permission required.',
      audio: 'line-1',
      log: '等待用户授权…',
      logEn: 'AWAITING OPERATOR CONSENT',
      badge: 'AUTHORIZATION',
      action: 'grant',
      btnZh: '授予访问权限',
      btnEn: 'GRANT ACCESS',
      hold: 900,
      progress: 0.34
    },
    {
      zh: '身份资料确认',
      en: 'IDENTITY VERIFICATION',
      say: 'Identity verification.',
      audio: 'line-2',
      log: '核对身份资料…',
      logEn: 'MATCHING OPERATOR RECORD',
      badge: 'IDENTITY',
      action: 'confirm',
      btnZh: '确认身份',
      btnEn: 'CONFIRM IDENTITY',
      hold: 700,
      progress: 0.5
    },
    {
      zh: '接收访问需求',
      en: 'ACCESS REQUEST RECEIVED',
      say: 'Access request received.',
      audio: 'line-3',
      log: '接收访问需求，建立会话通道…',
      logEn: 'HANDSHAKE ESTABLISHED',
      badge: 'REQUEST',
      action: 'auto',
      hold: 1200,
      progress: 0.66,
      assembleLogo: true
    },
    {
      zh: '开始读取权限',
      en: 'PERMISSION READ STARTED',
      say: 'Beginning permission read.',
      audio: 'line-4',
      log: '开始读取权限，索引工作区与会话…',
      logEn: 'READING PERMISSION SET',
      badge: 'READ',
      action: 'auto',
      hold: 1200,
      progress: 0.8,
      hex: true
    },
    {
      zh: '读取完毕 · 核验通过',
      en: 'READ COMPLETE · VERIFIED',
      say: 'Read complete. Verification passed.',
      audio: 'line-5',
      log: '读取完毕，核验通过，权限已授予',
      logEn: 'PERMISSION AUTHORIZED',
      badge: 'VERIFY',
      action: 'auto',
      hold: 1600,
      progress: 0.93,
      reticle: true
    }
  ]

  function cfg() {
    var raw = (window.__DSH_ORBIT__ && typeof window.__DSH_ORBIT__ === 'object')
      ? window.__DSH_ORBIT__
      : {}
    var out = {}
    for (var k in DEFAULTS) if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) out[k] = DEFAULTS[k]
    for (var k2 in raw) {
      if (Object.prototype.hasOwnProperty.call(raw, k2) && raw[k2] !== undefined && raw[k2] !== null) {
        out[k2] = raw[k2]
      }
    }
    out.speed = Math.min(3, Math.max(0.35, Number(out.speed) || 1))
    out.identity = String(out.identity || DEFAULTS.identity).slice(0, 48)
    /* 代号取身份名称里的字母数字；纯中文名字取不到时退回 OPERATOR */
    out.identityId = String(out.identityId || out.identity).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
    if (!out.identityId) out.identityId = 'OPERATOR'
    return out
  }

  var C = cfg()

  /* ── 配置同步 ───────────────────────────────────────────────────────────
     index.html 里注入的那份 window.__DSH_ORBIT__ 是「页面加载那一刻」的快照。
     浏览器会把 index.html 缓存住，于是设置页刚改完的值（最典型的就是动效风格）
     刷新页面也未必拿得到，用户体感就是"必须重启 DSH 才能切换"。

     这里在每次开场（以及每次重播）之前，先向 Host 拉一次最新配置。
     那条路由是 no-store 的，拿到就盖掉快照；拿不到（离线预览、路由不可用）
     就继续用注入的那份，绝不因为拉配置失败而卡住开屏。 */
  var skinApplied = false
  function reapplySkin() {
    if (!root || !root.style) return
    root.classList.toggle('dob-light', C.theme === 'light')
    root.classList.toggle('dob-dark', C.theme !== 'light')
    root.style.setProperty('--dob-speed', String(C.speed))
    root.style.setProperty('--dob-accent', C.accent)
    root.style.setProperty('--dob-glitch-a', C.glitchA)
    root.style.setProperty('--dob-glitch-b', C.glitchB)
    if (ui.idline) ui.idline.textContent = '· ID CONFIRMED : ' + C.identityId
    skinApplied = true
  }

  function applyConfigPatch(patch) {
    if (!patch || typeof patch !== 'object') return
    if (!window.__DSH_ORBIT__ || typeof window.__DSH_ORBIT__ !== 'object') window.__DSH_ORBIT__ = {}
    for (var k in patch) {
      if (!Object.prototype.hasOwnProperty.call(patch, k)) continue
      if (patch[k] === undefined || patch[k] === null) continue
      C[k] = patch[k]
      window.__DSH_ORBIT__[k] = patch[k]
    }
    reapplySkin()
    try { window.dispatchEvent(new CustomEvent('dsh-orbit:config')) } catch (err) { /* noop */ }
  }

  /** 拉一次 Host 上的最新配置；done 一定会在成功、失败、超时三种情况下被调用一次。 */
  function syncConfig(done) {
    var called = false
    function fin() { if (called) return; called = true; if (done) done() }
    /* 离线预览（file://）取不到插件路由，直接用注入的那份 */
    if (window.__DSH_ORBIT_SCRIPT_URL__ || typeof fetch !== 'function') { fin(); return }
    var settled = false
    var timer = setTimeout(function () { if (!settled) { settled = true; fin() } }, 1200)
    try {
      fetch(ROUTE_BASE + '/config', { cache: 'no-store' })
        .then(function (r) { return r && r.ok ? r.json() : null })
        .then(function (j) { if (j && j.ok && j.config) applyConfigPatch(j.config) })
        .catch(function () { /* 拿不到就用注入的 */ })
        .then(function () {
          if (settled) return
          settled = true
          clearTimeout(timer)
          fin()
        })
    } catch (err) {
      clearTimeout(timer)
      fin()
    }
  }

  /** 重播：先拉一次最新配置，再把运行时脚本重新挂一遍。
   *  （设置页「保存」之后点「立即预览」要走这条路，否则播的还是页面加载时的旧配置。） */
  function injectSelf() {
    syncConfig(reinjectSelf)
  }

  function reinjectSelf() {
    window.__DSH_ORBIT_LOADED__ = false
    var old = document.getElementById(ROOT_ID)
    if (old && old.parentNode) old.parentNode.removeChild(old)
    window.__DSH_ORBIT_SKIP__ = false
    var s = document.createElement('script')
    /* 正式运行时由 Host 路由提供（加时间戳绕开缓存）；
       离线预览页会把相对路径写进 __DSH_ORBIT_SCRIPT_URL__，file:// 下不加查询串。 */
    if (window.__DSH_ORBIT_SCRIPT_URL__) {
      s.src = window.__DSH_ORBIT_SCRIPT_URL__
    } else {
      s.src = ROUTE_BASE + '/splash.js?t=' + Date.now()
    }
    document.head.appendChild(s)
  }

  /* Host 侧的首屏兜底脚本已经判定"这次不播"（未启用 / 本会话已播 / 今日已播）：
     这里不再建 DOM，但仍然暴露 API，方便设置页按需重播。 */
  if (window.__DSH_ORBIT_SKIP__ === true) {
    window.__DSH_ORBIT_API__ = {
      replay: injectSelf,
      skip: function () {},
      finish: function () {},
      config: C
    }
    return
  }

  /* 最后一道保险：无论前面哪一步抛异常，都不许把用户留在黑幕里 */
  setTimeout(function () {
    try {
      var r = document.getElementById(ROOT_ID)
      if (r && r.classList && r.classList.contains('dob-boot')) {
        if (r.parentNode) r.parentNode.removeChild(r)
        document.documentElement.classList.remove('dob-lock')
        if (document.body) document.body.style.overflow = ''
        window.__DSH_ORBIT_FAILED__ = true
      }
    } catch (e) { /* 兜底本身不许再抛 */ }
  }, 9000)

  /* ── 小工具 ───────────────────────────────────────────────────────────── */
  function el(tag, cls, text) {
    var n = document.createElement(tag)
    if (cls) n.className = cls
    if (text != null) n.textContent = text
    return n
  }

  function svgWhale(cls) {
    var ns = 'http://www.w3.org/2000/svg'
    var svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('viewBox', '0 0 50 50')
    svg.setAttribute('aria-hidden', 'true')
    if (cls) svg.setAttribute('class', cls)
    var p = document.createElementNS(ns, 'path')
    p.setAttribute('d', WHALE_PATH)
    p.setAttribute('fill-rule', 'nonzero')
    svg.appendChild(p)
    return svg
  }

  function setIn(node, on, cls) {
    if (!node) return
    node.classList.toggle(cls || 'dob-in', !!on)
  }

  /* ══ 动效层 ══════════════════════════════════════════════════════════════
     按「动效参考」那五段素材重做的四条语汇：
       ① decodeText  文字乱码解码 —— 先以不相干的字形出现，再逐位收敛成正确的字
       ② bandSweep   横向故障带   —— 一条亮带扫过，带子压住的瞬间整句原地换掉
       ③ warpBurst   光速拉丝     —— 从中心径向甩出的拉丝 + 光晕绽放
       ④ 同心虚线轨道环 + 沿环运行的光点（纯 CSS，见 splash.css 的 .dob-ring/.dob-runner）
     ──────────────────────────────────────────────────────────────────────── */

  /* 乱码要用同一套字：中文从这串里取，拉丁从 A-Z0-9 取。
     池子刻意只收本插件文案里出现过的字，看起来才像"同一台机器在解析"。 */
  var CJK_POOL = '需要访问许可身份资料确认接收需求开始读取权限完毕核验通过等待用户授权核对建立会话通道索引工作区与验证授予已状态进度系统自检编号等级名称操作员终端星炬学院深空联合综合任务处理'
  var LATIN_POOL = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'

  var decodeJobs = []

  function poolFor(ch) {
    if (ch >= '0' && ch <= '9') return '0123456789'
    if (/[A-Za-z]/.test(ch)) return LATIN_POOL
    if (/[\u4e00-\u9fff]/.test(ch)) return CJK_POOL
    if (ch === ' ') return ''
    return '·-—/'
  }

  /**
   * 乱码解码：把 text 写进 host，并让它从乱码收敛到正确字形。
   *
   * 三个刻意的设计：
   *  - **先落正确答案再打乱**。定时器万一不跑（测试桩、极端环境），屏幕上留下的
   *    是正确文案，而不是永远解不开的乱码。
   *  - **每一处文字各自一个定时器**。品牌块还在解码、状态行就换了新词 —— 如果共用
   *    一个定时器，后一次调用会把前一处永久停在乱码上。
   *  - 空格与标点不参与乱码，直接从正确字形开始，读起来才像"逐字解析"。
   *
   * @returns 这段动画的基准时长（毫秒，未按 speed 折算），方便调用方接着排时间线。
   */
  function decodeText(host, text, opts) {
    if (!host) return 0
    text = String(text == null ? '' : text)
    opts = opts || {}
    var stagger = opts.stagger == null ? 44 : opts.stagger
    var tick = opts.tick == null ? 40 : opts.tick

    host.textContent = ''
    var items = []
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i)
      var pool = poolFor(ch)
      var s = el('span', 'dob-glyph', ch === ' ' ? '\u00a0' : ch)
      s.setAttribute('data-final', ch)
      host.appendChild(s)
      items.push({
        node: s,
        ch: ch,
        pool: pool,
        at: items.length * stagger,
        done: pool === '' || ch === ' '
      })
      if (items[items.length - 1].done) items[items.length - 1].node.classList.add('dob-locked')
    }
    /* 全部都是标点/空格（极端情况）：没什么可解码的 */
    if (!items.some(function (it) { return !it.done })) return 0

    var job = { items: items, timer: null, guard: null }
    decodeJobs.push(job)

    function lockAll() {
      for (var k = 0; k < items.length; k++) {
        if (!items[k].done) {
          items[k].node.textContent = items[k].ch
          items[k].done = true
          items[k].node.classList.add('dob-locked')
        }
      }
      if (job.timer !== null) { clearInterval(job.timer); job.timer = null }
      if (job.guard !== null) { clearTimeout(job.guard); job.guard = null }
      var idx = decodeJobs.indexOf(job)
      if (idx >= 0) decodeJobs.splice(idx, 1)
    }
    job.lock = lockAll

    var t0 = Date.now()
    function step() {
      var now = Date.now() - t0
      var left = 0
      for (var k = 0; k < items.length; k++) {
        var it = items[k]
        if (it.done) continue
        if (now >= it.at) {
          it.node.textContent = it.ch
          it.done = true
          it.node.classList.add('dob-locked')
        } else {
          it.node.textContent = it.pool.charAt(Math.floor(Math.random() * it.pool.length))
          left++
        }
      }
      return left
    }
    step()                                       /* 立刻打乱一次，避免先闪一下答案 */
    var total = items.length * stagger + tick * 2
    job.timer = setInterval(function () {
      if (step() === 0) lockAll()
    }, tick)
    /* 兜底：万一 interval 被环境吞掉，也保证最后是正确文案 */
    job.guard = setTimeout(lockAll, total + 320)
    return total
  }

  /** 跳过 / 揭幕：把所有还在抖的文字一次性落定，别让谁停在乱码上 */
  function lockAllDecodes() {
    var jobs = decodeJobs.slice()
    for (var i = 0; i < jobs.length; i++) { try { jobs[i].lock() } catch (e) { /* noop */ } }
    decodeJobs.length = 0
  }

  /* ── 经典风格（第一版）的逐字渐显 ────────────────────────────────────────
     不做乱码，每个字只是按左→右的节奏淡入上浮。样式在 CSS 的 .dob-ch 里，
     这里只负责铺 span 并按索引错开 transition-delay。 */
  function typeInClassic(host, text, stagger) {
    if (!host) return 0
    text = String(text == null ? '' : text)
    stagger = stagger == null ? 46 : stagger
    host.textContent = ''
    var spans = []
    var n = 0
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i)
      var s = el('span', 'dob-ch', ch === ' ' ? '\u00a0' : ch)
      s.style.transitionDelay = Math.round(n * stagger) + 'ms'
      host.appendChild(s)
      spans.push(s)
      n++
    }
    /* 先让浏览器把初态（opacity:0）算出来，再上 dob-on，过渡才会真的跑 */
    void host.offsetWidth
    for (var k = 0; k < spans.length; k++) spans[k].classList.add('dob-on')
    return n * stagger + 380
  }

  /**
   * 文字出场：按设置里的「动效风格」分派。
   *   orbit   —— 乱码收敛解码（新版）
   *   classic —— 逐字渐显（第一版）
   * 两边的调用点都只认这一个入口，切换风格不用改时间线。
   */
  function revealText(host, text, opts) {
    opts = opts || {}
    if (C.motion === 'classic') {
      return typeInClassic(host, text, opts.fade == null ? 46 : opts.fade)
    }
    return decodeText(host, text, opts)
  }

  /**
   * 横向故障带：一条细亮带从上往下扫过，扫过的瞬间把整句原地换掉。
   * onMid 落在带子正好压住文字的那一刻，观感上就是"带子把字改写了"。
   */
  function bandSweep(band, base, onMid) {
    return new Promise(function (resolve) {
      if (skipped) { if (onMid) onMid(); return resolve() }
      if (band) {
        band.classList.remove('dob-go')
        void band.offsetWidth
        band.classList.add('dob-go')
      }
      var mid = Math.round(base * 0.34)
      timers.push(setTimeout(function () { if (onMid) onMid() }, Math.max(0, ms(mid))))
      timers.push(setTimeout(resolve, Math.max(0, ms(base))))
    })
  }

  /** 光速拉丝：从中心朝所有方向甩出细光条，配合光晕绽放用 */
  function warpBurst(base) {
    if (!ui.warp || skipped) return
    ui.warp.classList.remove('dob-go')
    void ui.warp.offsetWidth
    ui.warp.classList.add('dob-go')
    timers.push(setTimeout(function () {
      /* 收掉 class，下次还能再放一次 */
      ui.warp.classList.remove('dob-go')
    }, Math.max(0, ms(base))))
  }

  /** 光晕绽放：从中心炸开一朵暖光，和拉丝是同一次"跃迁"的两半 */
  function bloomBurst(base) {
    if (!ui.bloom || skipped) return
    ui.bloom.classList.remove('dob-go')
    void ui.bloom.offsetWidth
    ui.bloom.classList.add('dob-go')
    timers.push(setTimeout(function () {
      ui.bloom.classList.remove('dob-go')
    }, Math.max(0, ms(base))))
  }

  /* 星野与拉丝的 DOM 在下面（DOM 建好之后）一次性铺出来，
     这里只留构建函数，避免和 ui.* 的赋值顺序打架。 */
  function buildStars() {
    if (!ui.stars) return
    var NS = 'http://www.w3.org/2000/svg'
    var svg = document.createElementNS(NS, 'svg')
    svg.setAttribute('viewBox', '0 0 1600 900')
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice')
    svg.setAttribute('aria-hidden', 'true')
    var stars = 150
    for (var i = 0; i < stars; i++) {
      var c = document.createElementNS(NS, 'circle')
      c.setAttribute('cx', (Math.random() * 1600).toFixed(1))
      c.setAttribute('cy', (Math.random() * 900).toFixed(1))
      c.setAttribute('r', (0.5 + Math.random() * 1.15).toFixed(2))
      c.setAttribute('class', 'dob-star')
      c.style.animationDelay = (Math.random() * 5).toFixed(2) + 's'
      c.style.opacity = (0.22 + Math.random() * 0.62).toFixed(2)
      svg.appendChild(c)
    }
    ui.stars.appendChild(svg)
  }

  /* 拉丝：46 条，角度均分，长度和延迟各带一点随机，避免像风扇 */
  function buildWarp() {
    if (!ui.warp) return
    var n = 46
    for (var i = 0; i < n; i++) {
      var arm = el('i')
      arm.style.transform = 'rotate(' + (i * (360 / n) + (Math.random() * 5 - 2.5)).toFixed(2) + 'deg)'
      var bar = el('b')
      bar.style.width = (38 + Math.random() * 44).toFixed(0) + 'vmax'
      bar.style.animationDelay = (Math.random() * 200).toFixed(0) + 'ms'
      arm.appendChild(bar)
      ui.warp.appendChild(arm)
    }
  }

  /* ── DOM 搭建 ─────────────────────────────────────────────────────────── */
  var root = document.getElementById(ROOT_ID)
  if (!root) {
    root = el('div')
    root.id = ROOT_ID
    root.className = 'dob-root'
    document.body.appendChild(root)
  }
  /* 默认外观是复古未来主义深色底板；设置里选「暖白」时才换成 dob-light。
     dob-dark 仍然照旧挂着，老版本样式表用得上。 */
  root.classList.toggle('dob-light', C.theme === 'light')
  root.classList.toggle('dob-dark', C.theme !== 'light')
  root.style.setProperty('--dob-speed', String(C.speed))
  root.style.setProperty('--dob-accent', C.accent)
  root.style.setProperty('--dob-glitch-a', C.glitchA)
  root.style.setProperty('--dob-glitch-b', C.glitchB)

  var ui = {}
  var clockTimer = null
  var html =
    '<div class="dob-plate"></div>' +
    '<div class="dob-stars"></div>' +
    '<div class="dob-deco">' +
      '<div class="dob-grid"></div>' +
      '<div class="dob-orbit dob-orbit-1"></div>' +
      '<div class="dob-orbit dob-orbit-2"></div>' +
      '<div class="dob-ticks"></div>' +
      '<div class="dob-motif"><i></i><i></i><i></i><i></i></div>' +
      '<div class="dob-diamond dob-d-tl"></div>' +
      '<div class="dob-diamond dob-d-br"></div>' +
    '</div>' +
    '<div class="dob-vignette"></div>' +
    '<div class="dob-watermark"></div>' +
    '<div class="dob-grain"></div>' +
    '<div class="dob-black">' +
      '<div class="dob-black-inner"></div>' +
      '<div class="dob-sweep"></div>' +
      '<div class="dob-glitchband"></div>' +
    '</div>' +
    '<div class="dob-wash"></div>' +
    '<div class="dob-warp"></div>' +
    '<header class="dob-brand">' +
      '<div class="dob-brand-1"></div><div class="dob-brand-2"></div>' +
      '<div class="dob-brand-3"><b></b><span></span></div>' +
    '</header>' +
    '<div class="dob-stepcount">[ 00 / 06 ] BOOT</div>' +
    '<div class="dob-center">' +
      '<div class="dob-status"><span class="dob-status-zh"></span><i class="dob-caret"></i>' +
        '<div class="dob-band"></div></div>' +
      '<div class="dob-sub-en"></div>' +
      '<div class="dob-rule"></div>' +
      '<div class="dob-logo"></div>' +
      '<div class="dob-dots" hidden></div>' +
    '</div>' +
    '<div class="dob-idline"></div>' +
    '<div class="dob-reticle"></div>' +
    '<div class="dob-rings">' +
      '<i class="dob-ring dob-ring-a"></i>' +
      '<i class="dob-ring dob-ring-b"></i>' +
      '<i class="dob-ring dob-ring-c"></i>' +
      '<b class="dob-runner dob-runner-a"><s></s></b>' +
      '<b class="dob-runner dob-runner-b"><s></s></b>' +
      '<b class="dob-runner dob-runner-c"><s></s></b>' +
    '</div>' +
    '<div class="dob-ellipse"></div>' +
    '<div class="dob-hex"></div>' +
    '<div class="dob-welcome">' +
      '<div class="dob-w1">WELCOME TO</div>' +
      '<div class="dob-w2"></div>' +
      '<div class="dob-w3"></div>' +
      '<div class="dob-w4"></div>' +
    '</div>' +
    '<div class="dob-action">' +
      '<div class="dob-card" hidden></div>' +
      '<button class="dob-btn" type="button">' +
        '<span class="dob-btn-zh"></span><span class="dob-btn-en"></span>' +
      '</button>' +
      '<div class="dob-hint"></div>' +
    '</div>' +
    '<div class="dob-frame">' +
      '<i class="dob-corner dob-c-tl"></i><i class="dob-corner dob-c-tr"></i>' +
      '<i class="dob-corner dob-c-bl"></i><i class="dob-corner dob-c-br"></i>' +
      '<div class="dob-scanline"></div>' +
    '</div>' +
    '<div class="dob-slats"></div>' +
    '<div class="dob-voice"><i></i><i></i><i></i><i></i><i></i></div>' +
    '<div class="dob-meta"><span class="dob-meta-1"></span><span class="dob-meta-2"></span></div>' +
    '<div class="dob-skip">SKIP ▸</div>' +
    '<footer class="dob-foot"><span></span><i></i></footer>' +
    '<div class="dob-subtitle">' +
      '<span class="dob-sub-zh"></span><span class="dob-sub-en2"></span>' +
    '</div>' +
    '<div class="dob-progress"><i></i></div>' +
    '<div class="dob-bloom"></div>' +
    '<div class="dob-streak"></div>' +
    '<div class="dob-flash"></div>'

  root.innerHTML = html

  function q(sel) { return root.querySelector(sel) }
  ui.plate = q('.dob-plate')
  ui.deco = q('.dob-deco')
  ui.stars = q('.dob-stars')
  ui.warp = q('.dob-warp')
  ui.rings = q('.dob-rings')
  ui.ellipse = q('.dob-ellipse')
  ui.band = q('.dob-band')
  ui.glitchband = q('.dob-glitchband')
  ui.watermark = q('.dob-watermark')
  ui.black = q('.dob-black')
  ui.blackInner = q('.dob-black-inner')
  ui.sweep = q('.dob-sweep')
  ui.wash = q('.dob-wash')
  ui.flash = q('.dob-flash')
  ui.bloom = q('.dob-bloom')
  ui.streak = q('.dob-streak')
  ui.vignette = q('.dob-vignette')
  ui.brand = q('.dob-brand')
  ui.center = q('.dob-center')
  ui.brand1 = q('.dob-brand-1')
  ui.brand2 = q('.dob-brand-2')
  ui.brand3b = q('.dob-brand-3 b')
  ui.brand3s = q('.dob-brand-3 span')
  ui.stepcount = q('.dob-stepcount')
  ui.status = q('.dob-status')
  ui.statusZh = q('.dob-status-zh')
  ui.caret = q('.dob-caret')
  ui.subEn = q('.dob-sub-en')
  ui.rule = q('.dob-rule')
  ui.logo = q('.dob-logo')
  ui.dots = q('.dob-dots')
  ui.idline = q('.dob-idline')
  ui.reticle = q('.dob-reticle')
  ui.hex = q('.dob-hex')
  ui.welcome = q('.dob-welcome')
  ui.w1 = q('.dob-w1')
  ui.w2 = q('.dob-w2')
  ui.w3 = q('.dob-w3')
  ui.w4 = q('.dob-w4')
  ui.action = q('.dob-action')
  ui.card = q('.dob-card')
  ui.btn = q('.dob-btn')
  ui.btnZh = q('.dob-btn-zh')
  ui.btnEn = q('.dob-btn-en')
  ui.hint = q('.dob-hint')
  ui.skip = q('.dob-skip')
  ui.foot = q('.dob-foot')
  ui.footText = q('.dob-foot span')
  ui.subZh = q('.dob-sub-zh')
  ui.subEn2 = q('.dob-sub-en2')
  ui.progress = q('.dob-progress')
  ui.bar = q('.dob-progress i')
  ui.frame = q('.dob-frame')
  ui.scanline = q('.dob-scanline')
  ui.slats = q('.dob-slats')
  ui.voice = q('.dob-voice')
  ui.meta = q('.dob-meta')
  ui.meta1 = q('.dob-meta-1')
  ui.meta2 = q('.dob-meta-2')

  /* 星野与拉丝一次性铺好；之后再动它们只改 class，不重建 DOM */
  buildStars()
  buildWarp()

  /* 开场前把配置对到最新（尤其是设置页刚改过的「动效风格」）。
     不阻塞：拉不到就用注入的那份继续播，时间线里读的是 C，拿到就会生效。 */
  syncConfig()

  /* 内容填充 */
  ui.brand1.textContent = C.brand1
  ui.brand2.textContent = C.brand2
  ui.brand3b.textContent = C.brand3a
  ui.brand3s.textContent = C.brand3b
  ui.footText.textContent = C.footer
  ui.w2.textContent = C.welcomeBox
  ui.w4.textContent = '欢迎 ' + C.identity + ' 访问'
  ui.idline.textContent = '· ID CONFIRMED : ' + C.identityId

  ;(function blackStage() {
    var inner = ui.blackInner
    /* 原来的内置鲸鱼标识留作兜底：视频能播就把它摘掉，播不了就还是它。 */
    var whale = svgWhale('dob-whale')
    var video = el('video', 'dob-black-video')
    video.setAttribute('playsinline', '')
    video.setAttribute('muted', '')
    video.setAttribute('preload', 'auto')
    video.setAttribute('aria-hidden', 'true')
    video.muted = true
    video.loop = false
    var src = el('source')
    src.setAttribute('src', assetUrl('logo.mp4'))
    src.setAttribute('type', 'video/mp4')
    video.appendChild(src)
    video.addEventListener('loadeddata', function () {
      /* 首帧已经解码出来了才换，避免先黑一下再出画 */
      inner.classList.add('dob-has-video')
    })
    video.addEventListener('error', function () {
      inner.classList.remove('dob-has-video')
      if (video.parentNode) video.parentNode.removeChild(video)
    })
    inner.appendChild(video)
    inner.appendChild(whale)
    ui.blackVideo = video
    /* 中文机构名：两个名字同一套字（同一字号 / 字重 / 字距），中间用「·」连接。 */
    var zh = el('div', 'dob-black-zh', C.orgZh + ' · ' + C.orgSub)
    inner.appendChild(zh)
    ui.blackZh = zh
    var en = el('div', 'dob-black-en', C.orgEn)
    inner.appendChild(en)
    ui.blackEn = en
    /* 两行字下面跟一句 loading······（原来这个位置是一枚圆圈加载指示，
       按使用者的要求把圆圈去掉，让这行字顶上来）。跟着黑幕一起退场。 */
    var bootLoad = el('div', 'dob-bootload', 'loading')
    for (var k = 0; k < 6; k++) bootLoad.appendChild(el('i', null, '·'))
    inner.appendChild(bootLoad)
    ui.bootLoad = bootLoad
  })()

  ;(function logoStage() {
    /* 中央的静态标志板：素材拿不到就回落到内置鲸鱼标识。 */
    var plate = el('img', 'dob-plate-img')
    plate.setAttribute('src', assetUrl('logo-plate.png'))
    plate.setAttribute('alt', '')
    plate.setAttribute('draggable', 'false')
    plate.addEventListener('error', function () {
      plate.hidden = true
      if (!ui.logo.querySelector('svg')) ui.logo.insertBefore(svgWhale(), plate)
    })
    ui.logo.appendChild(plate)
    ui.logoLabel = el('div', 'dob-logolabel', C.brand2)
    ui.logo.appendChild(ui.logoLabel)
  })()

  ;(function welcomeLogo() {
    /* 终幕的标志和授权序列用同一块静态标志板（素材拿不到时回落到内置鲸鱼）。 */
    var plate = el('img', 'dob-w3-plate')
    plate.setAttribute('src', assetUrl('logo-plate.png'))
    plate.setAttribute('alt', '')
    plate.setAttribute('draggable', 'false')
    plate.addEventListener('error', function () {
      if (!plate.parentNode) return
      plate.parentNode.replaceChild(svgWhale(), plate)
    })
    ui.w3.appendChild(plate)
    ui.w3.appendChild(el('span', 'dob-w3label', C.brand1 + '  ·  ' + C.brand3a))
  })()

  ;(function watermark() {
    var boxes = [
      [0.60, 0.02, 0.16, 0.96], [0.78, 0.02, 0.16, 0.96], [0.96, 0.02, 0.16, 0.96],
      [0.05, 0.02, 0.10, 0.5]
    ]
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i]
      var n = el('div', 'dob-wm')
      n.style.left = (b[0] * 100) + '%'
      n.style.top = (b[1] * 100) + '%'
      n.style.width = (b[2] * 100) + '%'
      n.style.height = (b[3] * 100) + '%'
      ui.watermark.appendChild(n)
    }
  })()

  /* 左侧六格阶段柱 + 品牌块下方的小字数据行 + 实时时钟 */
  ;(function slatsAndMeta() {
    for (var i = 0; i < STEPS.length + 1; i++) ui.slats.appendChild(el('i', 'dob-slat'))
    ui.meta1.textContent = 'REV 0.2.0 · WEB PROFILE'
    paintClock()
    clockTimer = setInterval(paintClock, 1000)
  })()

  ;(function reticle() {
    var ns = 'http://www.w3.org/2000/svg'
    var svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('viewBox', '0 0 400 400')
    function arc(cx, cy, r, a0, a1, cls, cap) {
      var rad = function (d) { return (d - 90) * Math.PI / 180 }
      var x0 = cx + r * Math.cos(rad(a0)), y0 = cy + r * Math.sin(rad(a0))
      var x1 = cx + r * Math.cos(rad(a1)), y1 = cy + r * Math.sin(rad(a1))
      var large = (a1 - a0) > 180 ? 1 : 0
      var p = document.createElementNS(ns, 'path')
      p.setAttribute('d', 'M' + x0.toFixed(2) + ' ' + y0.toFixed(2) +
        ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2))
      p.setAttribute('class', cls)
      if (cap) p.setAttribute('stroke-linecap', cap)
      return { node: p, x: x1, y: y1, x0: x0, y0: y0 }
    }
    var gA = document.createElementNS(ns, 'g')
    gA.setAttribute('class', 'dob-ret-rot-a')
    /* 300° 弧，缺口留在正下方 6 点钟方向：底部字幕永远不会被压到，
       弧末端圆点落在 5 点钟位置，和原片一致。 */
    var a = arc(200, 200, 150, 215, 505, 'dob-ring-a', 'round')
    gA.appendChild(a.node)
    var da = document.createElementNS(ns, 'circle')
    da.setAttribute('class', 'dob-dot-a')
    da.setAttribute('cx', a.x.toFixed(2)); da.setAttribute('cy', a.y.toFixed(2)); da.setAttribute('r', '7')
    gA.appendChild(da)
    svg.appendChild(gA)

    var gB = document.createElementNS(ns, 'g')
    gB.setAttribute('class', 'dob-ret-rot-b')
    var b = arc(200, 200, 104, 200, 490, 'dob-ring-b', 'round')
    gB.appendChild(b.node)
    var db = document.createElementNS(ns, 'circle')
    db.setAttribute('class', 'dob-dot-b')
    db.setAttribute('cx', b.x0.toFixed(2)); db.setAttribute('cy', b.y0.toFixed(2)); db.setAttribute('r', '4')
    gB.appendChild(db)
    svg.appendChild(gB)

    var gC = document.createElementNS(ns, 'g')
    var bl = arc(200, 200, 62, 118, 242, 'dob-bracket', 'round')
    var br = arc(200, 200, 62, 298, 62, 'dob-bracket', 'round')
    gC.appendChild(bl.node); gC.appendChild(br.node)
    svg.appendChild(gC)

    var pts = [[152, 132], [252, 268], [278, 150]]
    for (var i = 0; i < pts.length; i++) {
      var c = document.createElementNS(ns, 'circle')
      c.setAttribute('class', 'dob-dot-o')
      c.setAttribute('cx', pts[i][0]); c.setAttribute('cy', pts[i][1]); c.setAttribute('r', '2.8')
      svg.appendChild(c)
    }
    ui.reticle.appendChild(svg)
  })()

  /* ── 时间线引擎 ───────────────────────────────────────────────────────── */
  var timers = []
  var waiters = []
  var skipped = false
  var finished = false
  var hexTimer = null

  function ms(base) { return Math.round(base / C.speed) }

  function wait(base) {
    return new Promise(function (resolve) {
      if (skipped) return resolve()
      var done = false
      function fin() {
        if (done) return
        done = true
        var i = waiters.indexOf(fin)
        if (i >= 0) waiters.splice(i, 1)
        resolve()
      }
      var t = setTimeout(fin, Math.max(0, ms(base)))
      timers.push(t)
      waiters.push(fin)
    })
  }

  /** 播媒体并等它放完。
   *
   * 「等实际时长」而不是「定死一个 wait」：视频有多长就停多久。元数据里读得到
   * duration 就按 duration / speed 算上限，多留 900ms 收尾；读不到（还没加载完、
   * 解码失败、自动播放被拦）就退回 fallbackMs。无论如何都不会把用户留在黑幕里。
   * 跳过 / 揭幕时 waiters 会一起释放，不需要额外处理。 */
  function waitMedia(node, fallbackMs) {
    return new Promise(function (resolve) {
      if (skipped || !node) return resolve()
      var done = false
      function fin() {
        if (done) return
        done = true
        node.removeEventListener('ended', fin)
        node.removeEventListener('error', fin)
        var i = waiters.indexOf(fin)
        if (i >= 0) waiters.splice(i, 1)
        resolve()
      }
      waiters.push(fin)
      node.addEventListener('ended', fin)
      node.addEventListener('error', fin)
      /* 整段动画的速度倍率要一并作用在视频上，否则调快调慢时它会跟其余部分脱节 */
      var rate = Math.min(4, Math.max(0.25, C.speed))
      try {
        if (typeof node.playbackRate === 'number') node.playbackRate = rate
      } catch (e) { /* playbackRate 不可写就按原速播 */ }
      var limit = fallbackMs
      try {
        var d = Number(node.duration)
        if (isFinite(d) && d > 0.2) limit = Math.max(limit, d * 1000 / rate + 900)
      } catch (e) { /* 拿不到时长就用 fallbackMs */ }
      timers.push(setTimeout(fin, Math.max(0, limit)))
      try {
        var p = typeof node.play === 'function' ? node.play() : null
        if (p && typeof p.catch === 'function') p.catch(function () { /* 自动播放被拦：交给兜底计时 */ })
      } catch (e) { /* 播不动就交给兜底计时 */ }
    })
  }

  function waitAction() {
    return new Promise(function (resolve) {
      if (skipped || !C.requireInteraction) return resolve()
      var done = false
      function fin() {
        if (done) return
        done = true
        cleanup()
        resolve()
      }
      function onKey(e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); fin() }
      }
      function onClick(e) { e.preventDefault(); fin() }
      function cleanup() {
        ui.btn.removeEventListener('click', onClick)
        ui.action.removeEventListener('click', onClick)
        document.removeEventListener('keydown', onKey)
        var i = waiters.indexOf(fin)
        if (i >= 0) waiters.splice(i, 1)
      }
      ui.btn.addEventListener('click', onClick)
      ui.action.addEventListener('click', onClick)
      document.addEventListener('keydown', onKey)
      waiters.push(fin)
    })
  }

  function releaseAll() {
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i])
    timers.length = 0
    lockAllDecodes()
    var list = waiters.slice()
    waiters.length = 0
    for (var j = 0; j < list.length; j++) { try { list[j]() } catch (err) { /* noop */ } }
  }

  function setProgress(p) {
    var pct = Math.max(0, Math.min(1, p))
    ui.bar.style.width = Math.round(pct * 100) + '%'
  }

  /** 六格阶段柱：走过的压暗、当前的拉满并点亮主题橙 */
  function setSlats(active) {
    var items = ui.slats.children
    for (var i = 0; i < items.length; i++) {
      var idx = i + 1
      items[i].classList.toggle('dob-on', idx === active)
      items[i].classList.toggle('dob-past', idx < active)
    }
  }

  /** 扫描线自上而下扫一遍（底板洗白后一次，验准时再一次） */
  function sweep() {
    if (!ui.scanline) return
    ui.scanline.classList.remove('dob-go')
    void ui.scanline.offsetWidth
    ui.scanline.classList.add('dob-go')
  }

  function paintClock() {
    var d = new Date()
    var pad = function (n) { return (n < 10 ? '0' : '') + n }
    ui.meta2.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
  }

  function setSubtitle(zh, en) {
    ui.subZh.classList.remove('dob-in')
    ui.subEn2.classList.remove('dob-in')
    setTimeout(function () {
      ui.subZh.textContent = zh || ''
      ui.subEn2.textContent = en || ''
      ui.subZh.classList.add('dob-in')
      if (en) ui.subEn2.classList.add('dob-in')
    }, ms(140))
  }

  function setStepCount(i, code) {
    var totalSteps = STEPS.length + 1
    ui.stepcount.textContent = '[ ' + String(i).padStart(2, '0') + ' / ' +
      String(totalSteps).padStart(2, '0') + ' ] ' + code
  }

  function startHex() {
    var lines = 12
    function line() {
      var s = ''
      for (var i = 0; i < 26; i++) {
        s += '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16))
        if (i % 2 === 1) s += ' '
      }
      return s
    }
    function paint() {
      var out = []
      for (var i = 0; i < lines; i++) out.push(line())
      ui.hex.innerHTML = out.join('<br>')
    }
    paint()
    ui.hex.classList.add('dob-in')
    audio.tickRun()
    hexTimer = setInterval(paint, 110)
  }
  function stopHex() {
    if (hexTimer) { clearInterval(hexTimer); hexTimer = null }
    ui.hex.classList.remove('dob-in')
  }

  /* ── 声音 ──────────────────────────────────────────────────────────────
   * 两条独立的通道，都不依赖任何音频文件：
   *   audio —— 界面音效，WebAudio 现场合成（咔哒 / 双音确认 / 噪声扫频 / 和声钟）
   *   voice —— 女声播报，Web Speech API 念每一行的英文（照参考片的女声节奏：
   *            7.3-9.3s 念状态行、19.6-21.2s 念 PERMISSION AUTHORIZED）
   * 浏览器策略要求"先有用户手势"，所以第一次点击/按键会补一次解锁 + 补播。 */
  function clamp01(v, lo, hi) {
    var n = Number(v)
    return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo
  }

  var audio = (function () {
    var ctx = null
    function ac(force) {
      /* 语音素材要独立于「界面音效」开关：force=true 时无视 C.sound */
      if (!C.sound && !force) return null
      try {
        var AC = window.AudioContext || window.webkitAudioContext
        if (!AC) return null
        if (!ctx) ctx = new AC()
        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') ctx.resume()
        return ctx
      } catch (e) { return null }
    }
    function vol(gain) { return Math.max(0.0002, (gain == null ? 0.05 : gain) * clamp01(C.soundVolume, 0, 1) * 2) }
    function tone(freq, dur, type, gain, delay, glideTo) {
      var c = ac(); if (!c) return
      try {
        var t0 = c.currentTime + (delay || 0)
        var o = c.createOscillator(), g = c.createGain()
        o.type = type || 'sine'
        o.frequency.setValueAtTime(freq, t0)
        if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur)
        g.gain.setValueAtTime(0.0001, t0)
        g.gain.exponentialRampToValueAtTime(vol(gain), t0 + Math.min(0.02, dur * 0.3))
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
        o.connect(g); g.connect(c.destination)
        o.start(t0); o.stop(t0 + dur + 0.03)
      } catch (e) { /* 静默降级 */ }
    }
    function noise(dur, gain) {
      var c = ac(); if (!c) return
      try {
        var n = Math.floor(c.sampleRate * dur)
        var buf = c.createBuffer(1, n, c.sampleRate)
        var d = buf.getChannelData(0)
        for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
        var src = c.createBufferSource(); src.buffer = buf
        var f = c.createBiquadFilter(); f.type = 'bandpass'
        f.frequency.value = 1500; f.Q.value = 0.6
        var g = c.createGain(); g.gain.value = vol(gain)
        src.connect(f); f.connect(g); g.connect(c.destination)
        src.start()
      } catch (e) { /* 静默降级 */ }
    }
    /* 从 /dsh-orbit/asset/ 拉真素材（用户音频里抠出来的"哒"）并解码缓存；
       拿不到就自动回落到下面合成的音，功能不依赖网络/素材存在与否。 */
    var buffers = {}
    var fetching = {}
    function loadAsset(name) {
      if (C.sfx === 'synth') return
      if (buffers[name] || fetching[name]) return
      fetching[name] = true
      try {
        fetch('/dsh-orbit/asset/' + name + '.mp3')
          .then(function (r) { return r.ok ? r.arrayBuffer() : null })
          .then(function (ab) { return ab ? ac().decodeAudioData(ab) : null })
          .then(function (buf) { if (buf) buffers[name] = buf })
          .catch(function () { /* 没素材就走合成音 */ })
      } catch (e) { /* fetch 不存在也一样降级 */ }
    }
    /* 素材预加载：fetch + decodeAudioData 不需要用户手势，所以加载时就拉，
       这样第一步就能用真声，而不用等用户第一次点击。 */
    var pending = {}
    function ensureAsset(name) {
      if (buffers[name]) return Promise.resolve(true)
      if (pending[name]) return pending[name]
      if (C.voiceSource === 'tts') return Promise.resolve(false)
      pending[name] = new Promise(function (resolve) {
        try {
          fetch('/dsh-orbit/asset/' + name + '.mp3')
            .then(function (r) { return r.ok ? r.arrayBuffer() : null })
            .then(function (ab) { if (!ab) return null; return ac(true).decodeAudioData(ab) })
            .then(function (buf) {
              if (buf) { buffers[name] = buf; resolve(true) } else { resolve(false) }
            })
            .catch(function () { resolve(false) })
        } catch (e) { resolve(false) }
      })
      return pending[name]
    }

    /** 播素材并等它播完，resolve 实际时长(ms)。拿不到素材 resolve 0。 */
    function playAssetAndWait(name, gain) {
      return new Promise(function (resolve) {
        var c = ac(true)
        var buf = buffers[name]
        if (!c || !buf) { resolve(0); return }
        try {
          var src = c.createBufferSource()
          src.buffer = buf
          var g = c.createGain()
          g.gain.value = Math.min(1, (gain == null ? 0.85 : gain) * clamp01(C.voiceVolume, 0, 1) * 1.6)
          src.connect(g); g.connect(c.destination)
          src.onended = function () { resolve(Math.round(buf.duration * 1000)) }
          src.start()
        } catch (e) { resolve(0) }
      })
    }

    function playAsset(name, gain) {
      var c = ac(); if (!c) return false
      var buf = buffers[name]
      if (!buf) { loadAsset(name); return false }
      try {
        var src = c.createBufferSource()
        src.buffer = buf
        var g = c.createGain()
        g.gain.value = Math.min(1, (gain == null ? 0.55 : gain) * clamp01(C.soundVolume, 0, 1) * 2)
        src.connect(g); g.connect(c.destination)
        src.start()
        return true
      } catch (e) { return false }
    }

    return {
      resume: function () { ac(); loadAsset('sfx-tick'); loadAsset('sfx-ticks-run') },
      preload: function () { loadAsset('sfx-tick'); loadAsset('sfx-ticks-run') },
      ensureAsset: ensureAsset,
      playAssetAndWait: playAssetAndWait,
      /* 文字渐显 / 阶段推进 / 按钮确认 —— 优先用真素材 */
      tick: function () { if (!playAsset('sfx-tick', 0.45)) tone(1760, 0.035, 'square', 0.022) },
      confirm: function () { if (!playAsset('sfx-tick', 0.85)) { tone(660, 0.09, 'triangle', 0.07); tone(990, 0.17, 'triangle', 0.055, 0.085) } },
      tickRun: function () { playAsset('sfx-ticks-run', 0.5) },
      step: function () { if (!playAsset('sfx-tick', 0.6)) { tone(880, 0.05, 'sine', 0.05); tone(1320, 0.07, 'sine', 0.028, 0.045) } },
      hover: function () { tone(2200, 0.02, 'sine', 0.018) },
      confirm: function () { tone(660, 0.09, 'triangle', 0.07); tone(990, 0.17, 'triangle', 0.055, 0.085) },
      sweep: function () { noise(0.75, 0.035) },
      /* 念台词之前的两声轻提示：这一笔让 TTS 从"浏览器念字"变成"系统播报" */
      cue: function () { tone(1046.5, 0.05, 'sine', 0.028); tone(1568, 0.06, 'sine', 0.02, 0.075) },
      rise: function () { tone(220, 1.1, 'sine', 0.032, 0, 990) },
      chime: function () {
        tone(659.25, 0.9, 'sine', 0.055)
        tone(830.61, 0.9, 'sine', 0.04, 0.09)
        tone(987.77, 1.3, 'sine', 0.045, 0.18)
      }
    }
  })()

  var voice = (function () {
    var supported = typeof window !== 'undefined' && !!window.speechSynthesis &&
      typeof window.SpeechSynthesisUtterance === 'function'
    var voices = []
    var picked = { en: null, zh: null }
    var meter = null
    var saidOnce = false
    var pending = { en: '', zh: '' }

    /* 想让它听起来像"AI 播报"，音色本身比什么都重要。
       同一台机器上，"Microsoft Zira Desktop" 是上世纪拼接合成，念长句塑料味很重；
       Edge 的 "... Online (Natural)"、Chrome 的 "Google ..."、macOS 的 Siri 才是神经网络音色。
       所以这里按分数挑，而不是挨个名字第一个命中。 */
    var NATURAL_HINTS = ['natural', 'neural', 'online', 'premium', 'enhanced', 'siri', 'google']
    var FEMALE_HINTS = [
      'aria', 'jenny', 'michelle', 'emma', 'ava', 'libby', 'sonia', 'maisie',
      'zira', 'samantha', 'karen', 'moira', 'tessa', 'victoria', 'serena', 'allison',
      'susan', 'fiona', 'hazel', 'female', 'woman',
      'xiaoxiao', 'xiaoyi', 'xiaomo', 'huihui', 'yaoyao', '晓晓', '晓伊', '女声'
    ]
    var MALE_HINTS = ['david', 'mark', 'guy', 'ryan', 'george', 'daniel', 'alex', 'fred',
      'male', 'yunxi', 'yunjian', 'kangkang']

    /** 给一个音色打分：神经网络 > 女声 > 语种吻合 > 本地 */
    function score(v, want) {
      var name = String(v.name || '').toLowerCase()
      var lang = String(v.lang || '').toLowerCase()
      var sc = 0
      for (var i = 0; i < NATURAL_HINTS.length; i++) {
        if (name.indexOf(NATURAL_HINTS[i]) !== -1) { sc += 60; break }
      }
      for (var j = 0; j < FEMALE_HINTS.length; j++) {
        if (name.indexOf(FEMALE_HINTS[j]) !== -1) { sc += 40; break }
      }
      for (var k = 0; k < MALE_HINTS.length; k++) {
        if (name.indexOf(MALE_HINTS[k]) !== -1) { sc -= 45; break }
      }
      if (lang.indexOf(want) === 0) sc += 25
      if (v.localService) sc += 4          /* 本地音色起播快，不会先卡半秒 */
      if (v.default) sc += 3
      return sc
    }

    /** 挑某语种最合适的一个音色（want 传 'en' / 'zh' 这样的两字母前缀） */
    function bestFor(want) {
      if (!voices.length) return null
      if (C.voiceName) {
        for (var i = 0; i < voices.length; i++) {
          var v = voices[i]
          if (v.name === C.voiceName && String(v.lang || '').toLowerCase().indexOf(want) === 0) return v
        }
      }
      var pool = []
      for (var j = 0; j < voices.length; j++) {
        if (String(voices[j].lang || '').toLowerCase().indexOf(want) === 0) pool.push(voices[j])
      }
      if (!pool.length) pool = voices.slice()
      var best = null
      var bs = -1e9
      for (var n = 0; n < pool.length; n++) {
        var sc = score(pool[n], want)
        if (sc > bs) { bs = sc; best = pool[n] }
      }
      return best
    }

    function setMeter(on) { if (meter) meter.classList.toggle('dob-on', !!on) }

    function load() {
      if (!supported) return
      try { voices = window.speechSynthesis.getVoices() || [] } catch (e) { voices = [] }
      picked.en = bestFor('en')
      picked.zh = bestFor('zh')
    }

    /** 全大写名字有些引擎会一个字母一个字母念，转成 Title Case 更像在叫名字 */
    function spokenName(name) {
      return String(name || '').replace(/\S+/g, function (w) {
        return (/^[A-Z0-9.\-]+$/.test(w) && w.length > 1) ? w.charAt(0) + w.slice(1).toLowerCase() : w
      })
    }

    function utter(text, lang) {
      try {
        var u = new window.SpeechSynthesisUtterance(text)
        var v = lang.indexOf('zh') === 0 ? picked.zh : picked.en
        if (v) { u.voice = v; u.lang = v.lang || lang } else u.lang = lang
        /* 神经网络音色在 .95 / 1.02 这个档位最像"系统在播报"：
           再快就赶，再慢就假；音调略抬一点显得干净利落 */
        u.rate = clamp01(C.voiceRate, 0.5, 2)
        u.pitch = clamp01(C.voicePitch, 0, 2)
        u.volume = clamp01(C.voiceVolume, 0, 1)
        u.onstart = function () { setMeter(true) }
        u.onend = function () { setMeter(false) }
        u.onerror = function () { setMeter(false) }
        window.speechSynthesis.speak(u)
        return true
      } catch (e) { return false }
    }

    /** 一句话的时长估算（个别引擎不触发 onend 时兜底；中文按字、英文按字符） */
    function estimateMs(items) {
      var chars = 0
      var rate = clamp01(C.voiceRate, 0.5, 2) || 1
      for (var i = 0; i < items.length; i++) {
        var t = String(items[i].t || '')
        chars += /[\u4e00-\u9fa5]/.test(t) ? t.length * 1.7 : t.length
      }
      return Math.round((chars / 13) * 1000 / rate) + 460
    }

    function buildUtter(text, lang) {
      var u = new window.SpeechSynthesisUtterance(text)
      var v = lang.indexOf('zh') === 0 ? picked.zh : picked.en
      if (v) { u.voice = v; u.lang = v.lang || lang } else u.lang = lang
      u.rate = clamp01(C.voiceRate, 0.5, 2)
      u.pitch = clamp01(C.voicePitch, 0, 2)
      u.volume = clamp01(C.voiceVolume, 0, 1)
      return u
    }

    return {
      supported: supported,
      load: load,
      attach: function (node) { meter = node },

      /**
       * 念一行，返回"这一行实际花了多久(ms)"的 Promise。
       *
       * 三个关键决定：
       *  - **不 cancel 上一句**。原来每步都 cancel，用户点快一点、或者
       *    hold 短于台词长度，语音就被硬生生掐断 —— 那正是要避免的。
       *    speechSynthesis 本身是队列，不 cancel 就是顺序播报。
       *  - 提示音响过之后留 `voiceLead` 的空白再开口，这是旁白的呼吸感。
       *  - 等 `onend` 才 resolve，动画据此决定这一步停多久；个别引擎不触发
       *    onend 时按估算兜底，绝不把动画卡死。
       */
      line: function (en, zh, asset) {
        /* 有真声素材就优先用素材（音色就是你给的那个）；拿不到再回落 TTS */
        if (asset && C.voice && C.voiceSource !== 'tts' && !finished) {
          return audio.ensureAsset(asset).then(function (ok) {
            if (!ok || finished) return 0
            if (C.voiceCue !== false) audio.cue()
            return audio.playAssetAndWait(asset, 0.85).then(function (ms) {
              if (ms > 0) setMeter(true)
              return ms
            })
          }).then(function (ms) {
            if (ms > 0) { saidOnce = true; return ms }
            return ttsLine(en, zh)
          })
        }
        return ttsLine(en, zh)
      },

      /** TTS 路径：素材缺失 / voiceSource=tts / 终幕那条动态名字 */
      tts: function (en, zh) { return ttsLine(en, zh) },

      /** 不等待的版本：设置页试听 / 任何"念完就行"的场合 */
      say: function (en, zh) { return this.line(en, zh) },

      /** 浏览器要求"先有用户手势"才放声：第一次点击/按键解锁 + 补播当前行 */
      unlock: function () {
        try { if (supported) window.speechSynthesis.resume() } catch (e) {}
        audio.resume()
        /* 预热：先无声念一个空格，把引擎唤醒，避免第一句被吃掉开头半个字 */
        if (supported && !saidOnce) {
          try {
            var w = new window.SpeechSynthesisUtterance(' ')
            w.volume = 0
            var v = picked.en || picked.zh
            if (v) { w.voice = v; w.lang = v.lang }
            window.speechSynthesis.speak(w)
          } catch (e) { /* noop */ }
        }
        if (!saidOnce && C.voice && (pending.en || pending.zh)) this.say(pending.en, pending.zh)
      },
      speakName: spokenName,
      current: function () {
        var a = picked.en ? picked.en.name : ''
        var b = picked.zh ? picked.zh.name : ''
        return a === b ? a : (a + (b ? '  /  ' + b : ''))
      },
      listVoices: function () { return voices.slice() },
      /** 只有这里才真的掐断语音（跳过 / 揭幕） */
      stop: function () { try { if (supported) window.speechSynthesis.cancel() } catch (e) {} setMeter(false) }
    }

    /** TTS 合成并等它念完，resolve 实际时长(ms)；拿不到引擎时 resolve 0。 */
    function ttsLine(en, zh) {
      return new Promise(function (resolve) {
        if (!supported || !C.voice || finished) { resolve(0); return }
        pending = { en: en || '', zh: zh || '' }
        var items = []
        var mode = C.voiceLang
        if (mode === 'zh') { if (zh) items.push({ t: zh, l: 'zh-CN' }) }
        else if (mode === 'both') {
          if (zh) items.push({ t: zh, l: 'zh-CN' })
          if (en) items.push({ t: en, l: 'en-US' })
        } else if (en) { items.push({ t: en, l: 'en-US' }) }
        if (!items.length) { resolve(0); return }

        saidOnce = true
        if (C.voiceCue !== false) audio.cue()

        var startedAt = Date.now()
        var est = estimateMs(items)
        var lead = clamp01(C.voiceLead, 0, 1200)
        var settled = false
        var watchdog = null

        function settle() {
          if (settled) return
          settled = true
          if (watchdog) clearTimeout(watchdog)
          setMeter(false)
          resolve(Math.max(0, Date.now() - startedAt))
        }

        setTimeout(function () {
          if (finished) { settle(); return }
          var last = items.length - 1
          for (var i = 0; i <= last; i++) {
            var u = buildUtter(items[i].t, items[i].l)
            if (i === last) {
              u.onstart = function () { setMeter(true) }
              u.onend = settle
              u.onerror = settle
            }
            try { window.speechSynthesis.speak(u) } catch (e) { if (i === last) settle() }
          }
          watchdog = setTimeout(settle, est + 900)
        }, lead)
      })
    }
  })()

  /* 语音/音效接线：声卡要等用户手势才能出声，这里挂一次性解锁 */
  voice.attach(q('.dob-voice'))
  ;(function preloadVoices() {
    if (C.voiceSource === 'tts') return
    for (var i = 0; i < STEPS.length; i++) if (STEPS[i].audio) audio.ensureAsset(STEPS[i].audio)
    audio.ensureAsset('line-6')   /* 终幕欢迎语 */
  })()
  ;(function wireSound() {
    voice.load()
    if (voice.supported && typeof window.speechSynthesis.addEventListener === 'function') {
      try { window.speechSynthesis.addEventListener('voiceschanged', function () { voice.load() }) } catch (e) {}
    }
    var unlocked = false
    function unlock() {
      if (unlocked) return
      unlocked = true
      voice.unlock()
      document.removeEventListener('pointerdown', unlock, true)
      document.removeEventListener('keydown', unlock, true)
      document.removeEventListener('touchstart', unlock, true)
    }
    document.addEventListener('pointerdown', unlock, true)
    document.addEventListener('keydown', unlock, true)
    document.addEventListener('touchstart', unlock, true)
  })()

  /* ── 时间线 ───────────────────────────────────────────────────────────── */
  function run() {
    return Promise.resolve()
      /* ── 第一幕：黑幕 + 标识动效 ────────────────────────────────────────
         视频素材原样保留（纯黑底，和黑幕同色，看不到接缝）；这一版重做的是
         文字：两个机构名与英文副标题都是「乱码收敛」地解码出来的。 */
      .then(function () { return wait(620) })
      .then(function () {
        ui.blackInner.classList.add('dob-in')
        audio.rise()
        revealText(ui.blackZh, C.orgZh + ' · ' + C.orgSub, { stagger: 64, fade: 60 })
        return wait(240)
      })
      .then(function () {
        ui.blackEn.classList.add('dob-tighten')
        revealText(ui.blackEn, C.orgEn, { stagger: 46, fade: 44 })
        /* 停多久由标识动效的实际长度决定（4.7s 素材；读不到时长时按 5.6s 兜底） */
        return waitMedia(ui.blackVideo, 5600)
      })
      /* 一幕收尾：轨道风格是横向故障带扫过标题，经典风格是一道掠光 */
      .then(function () {
        if (C.motion === 'classic') {
          ui.sweep.classList.add('dob-go')
          audio.sweep()
          return wait(760)
        }
        if (ui.glitchband) {
          ui.glitchband.classList.remove('dob-go')
          void ui.glitchband.offsetWidth
          ui.glitchband.classList.add('dob-go')
        }
        audio.sweep()
        return wait(560)
      })
      /* ── 过场 ──────────────────────────────────────────────────────────
         轨道风格：光速拉丝 + 光晕绽放，从中心径向甩出来把整幕抽走。
         经典风格：过曝洗白（黑 → 灰 → 底板）。
         前者先让拉丝甩出来再撤黑幕，否则中间会空出一小段全黑。 */
      .then(function () {
        if (C.motion === 'classic') {
          ui.wash.style.transition = 'opacity ' + ms(220) + 'ms linear'
          ui.wash.style.opacity = '1'
          return wait(260)
        }
        warpBurst(1700)
        bloomBurst(1250)
        return wait(160)
      })
      .then(function () {
        ui.blackInner.classList.add('dob-out')
        if (C.motion !== 'classic') {
          ui.black.style.transition = 'opacity ' + ms(820) + 'ms cubic-bezier(.2,.78,.2,1)'
          ui.black.style.opacity = '0'
          return wait(120)
        }
        return wait(0)
      })
      .then(function () {
        ui.plate.style.transition = 'opacity ' + ms(900) + 'ms ease'
        ui.plate.style.opacity = '1'
        ui.deco.style.transition = 'opacity ' + ms(1100) + 'ms ease'
        ui.deco.style.opacity = '1'
        ui.watermark.style.transition = 'opacity ' + ms(1100) + 'ms ease'
        ui.watermark.style.opacity = '1'
        if (C.motion === 'classic') {
          ui.wash.style.transition = 'opacity ' + ms(720) + 'ms cubic-bezier(.2,.9,.2,1)'
          ui.wash.style.opacity = '0'
          ui.black.style.transition = 'opacity ' + ms(720) + 'ms ease'
          ui.black.style.opacity = '0'
          return wait(760)
        }
        ui.stars.style.transition = 'opacity ' + ms(1400) + 'ms ease'
        ui.stars.style.opacity = '1'
        return wait(820)
      })
      /* ── 第二幕：品牌块 / 页脚 / 进度条 ─────────────────────────────────
         轨道风格：扫描带自上而下扫过，品牌三行在带子压过的那一刻解码成形。
         经典风格：交给 .dob-in 的滑入过渡，不做逐字动画。 */
      .then(function () {
        ui.brand.classList.add('dob-in')
        ui.foot.classList.add('dob-in')
        ui.stepcount.classList.add('dob-in')
        ui.idline.classList.add('dob-in')
        ui.frame.classList.add('dob-in')
        ui.slats.classList.add('dob-in')
        ui.meta.classList.add('dob-in')
        ui.vignette.classList.add('dob-in')
        ui.voice.classList.add('dob-in')
        setProgress(0.12)
        setStepCount(0, 'BOOT')
        setSlats(0)
        setSubtitle('系统自检中…', 'SYSTEM SELF-CHECK')
        if (C.allowSkip) ui.skip.classList.add('dob-in')
        if (C.motion === 'classic') return wait(700)
        sweep()
        return wait(240)
      })
      .then(function () {
        if (C.motion === 'classic') return
        revealText(ui.brand1, C.brand1, { stagger: 78, fade: 70 })
        revealText(ui.brand3b, C.brand3a, { stagger: 52, fade: 50 })
        return wait(220)
      })
      .then(function () {
        if (C.motion === 'classic') return
        revealText(ui.brand2, C.brand2, { stagger: 18, tick: 34, fade: 18 })
        revealText(ui.footText, C.footer, { stagger: 22, tick: 34, fade: 22 })
        return wait(560)
      })
      .then(function () { ui.black.style.display = 'none' })
      /* 六个阶段 */
      .then(function () { return stepLoop() })
      /* 终幕 */
      .then(function () { return finale() })
      .catch(function (err) {
        try { console.warn('[dsh-orbit-boot] 动画异常，直接揭幕：', err) } catch (e2) {}
        return finish()
      })
  }

  function stepLoop() {
    var chain = Promise.resolve()
    STEPS.forEach(function (step, i) {
      chain = chain.then(function () {
        if (finished) return
        var n = i + 1
        setStepCount(n, step.badge)
        setSlats(n)
        setProgress(step.progress)
        setSubtitle(step.log, step.logEn)
        audio.step()
        /* 语音在这里起头，但**不阻塞**下面的文字渐显 —— 两者同时发生 */
        var spoke = voice.line(step.say, step.zh, step.audio)

        ui.status.classList.toggle('dob-zhline', true)
        ui.subEn.classList.add('dob-in')
        ui.rule.classList.add('dob-in')
        ui.caret.classList.toggle('dob-on', !!step.action && step.action !== 'auto')

        var applyText = function () {
          revealText(ui.statusZh, step.zh, { stagger: 54, fade: 46 })
          revealText(ui.subEn, step.en, { stagger: 17, tick: 34, fade: 14 })
        }
        if (C.motion === 'classic') {
          /* 经典风格：先把 dob-in 摘掉并强制一次样式计算，新的逐字 span 才会重新渐显 */
          ui.status.classList.remove('dob-in')
          void ui.status.offsetWidth
          applyText()
          ui.status.classList.add('dob-in')
        } else {
          /* 轨道风格：一条横向故障带扫过状态行，带子压住文字的那一刻整句原地换掉，
             新字再以乱码收敛成形。第一步没有"旧句"要换，直接解码。 */
          ui.status.classList.add('dob-in')
          if (n === 1) applyText()
          else bandSweep(ui.band, 400, applyText)
        }

        if (step.assembleLogo) assembleLogo()
        if (step.reticle) {
          /* 校验阶段：中央标志板收掉，换成同心虚线轨道环 + 沿环运行的光点
             （经典风格没有轨道环，只留准星） */
          ui.logo.classList.remove('dob-in')
          ui.dots.hidden = true
          ui.reticle.classList.add('dob-in')
          if (C.motion !== 'classic') {
            if (ui.rings) ui.rings.classList.add('dob-in')
            if (ui.ellipse) ui.ellipse.classList.add('dob-in')
          }
          sweep()
        }
        if (step.hex) startHex()

        /* 这一步停多久 = max(视觉基准, 实际播报时长 + 收尾留白) —— 台词长就多停，
           台词短也不会干等。用户点得快时同样等这一句念完，不掐断。 */
        function holdFor(spoken) {
          var target = Math.max(ms(step.hold), (spoken || 0) + ms(240))
          return wait(Math.max(0, target - (spoken || 0)))
        }

        if (step.action === 'grant' || step.action === 'confirm') {
          showAction(step)
          return wait(520).then(function () { return waitAction() }).then(function () {
            hideAction()
            audio.confirm()
            ui.caret.classList.remove('dob-on')
            return spoke
          }).then(function () { return wait(ms(320)) })
        }
        if (step.hex) {
          return spoke.then(holdFor).then(function () { stopHex() })
        }
        return spoke.then(holdFor)
      })
    })
    return chain
  }

  /* 中央标志板的出场：素材是位图，做不了"一笔画成"的勾线动画，
     改成横向擦出 + 轻微放大，读起来仍然像被逐段写入的档案图。 */
  function assembleLogo() {
    ui.logo.classList.add('dob-in')
    ui.dots.hidden = false
    /* 标志出现的同时，同心轨道环也从背景里浮起来（经典风格没有这一层） */
    if (C.motion !== 'classic' && ui.rings) ui.rings.classList.add('dob-in')
    var img = ui.logo.querySelector('.dob-plate-img')
    var path = ui.logo.querySelector('path')
    if (img && !img.hidden && typeof img.animate === 'function') {
      try {
        img.animate(
          [
            { clipPath: 'inset(0 100% 0 0)', opacity: 0.15, transform: 'scale(0.985)' },
            { clipPath: 'inset(0 0% 0 0)', opacity: 1, transform: 'none' }
          ],
          { duration: ms(1400), easing: 'cubic-bezier(.55,.06,.24,1)', fill: 'both' }
        )
      } catch (err) { /* Web Animations 不可用时直接出现 */ }
      return wait(300)
    }
    /* 兜底：素材缺失时还是走原来那条 SVG 鲸鱼的勾线动画 */
    if (path && typeof path.getTotalLength === 'function') {
      try {
        var len = path.getTotalLength()
        path.style.fill = 'none'
        path.style.stroke = 'currentColor'
        path.style.strokeWidth = '1.1'
        path.style.strokeDasharray = len
        path.style.strokeDashoffset = len
        /* 参考片的"一笔画成"：先勾线，再落墨成面 */
        path.animate(
          [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
          { duration: ms(1400), easing: 'cubic-bezier(.55,.06,.24,1)', fill: 'forwards' }
        )
        setTimeout(function () {
          path.style.transition = 'fill ' + ms(420) + 'ms ease, stroke-width ' + ms(420) + 'ms ease'
          path.style.fill = ''
          path.style.strokeWidth = '0'
        }, ms(1450))
      } catch (err) { /* Web Animations 不可用时直接落墨 */ }
    }
    return wait(300)
  }

  function showAction(step) {
    ui.btnZh.textContent = step.btnZh
    ui.btnEn.textContent = step.btnEn
    ui.card.hidden = step.action !== 'confirm'
    if (step.action === 'confirm') {
      ui.card.innerHTML = ''
      /* 纯中文标签 + 数字/名称，去掉英文双写与主机行，别堆信息 */
      var rows = [
        ['身份名称', C.identity, true],
        ['身份编号', C.identityId, false],
        ['权限等级', C.accessLevel, false]
      ]
      rows.forEach(function (r) {
        var row = el('div', 'dob-card-row')
        row.appendChild(el('span', null, r[0]))
        row.appendChild(el('b', r[2] ? 'dob-zhname' : null, r[1]))
        ui.card.appendChild(row)
      })
    }
    ui.hint.innerHTML = '按 <kbd>Enter</kbd> / <kbd>Space</kbd>，或点击按钮继续'
    ui.action.classList.add('dob-in')
    ui.btn.classList.add('dob-pulse')
  }

  function hideAction() {
    ui.action.classList.remove('dob-in')
    ui.btn.classList.remove('dob-pulse')
  }

  function finale() {
    if (finished) return Promise.resolve()
    setStepCount(6, 'WELCOME')
    setSlats(6)
    setProgress(1)
    /* 底部日志和终幕里的「欢迎 xxx 访问」区分开，避免同一句出现两遍 */
    setSubtitle('身份验证完成，会话已建立', 'IDENTITY VERIFIED · SESSION ESTABLISHED')
    audio.chime()
    /* 终幕欢迎语用真声素材（line-6）。素材缺失 / voiceSource=tts / voice 关闭时
       自动静音，不会退回 TTS 念白 —— 因为这条素材是「欢迎访问」整句，
       和动态身份名称无关。 */
    var welcome = voice.line(null, null, 'line-6')

    ui.status.classList.remove('dob-in')
    ui.subEn.classList.remove('dob-in')
    ui.rule.classList.remove('dob-in')
    ui.reticle.classList.remove('dob-in')
    stopHex()
    /* 中央区（状态行/分隔线/标志板/虚线）整体退场：不清掉会和终幕版式叠字 */
    ui.center.classList.add('dob-off')
    ui.dots.hidden = true
    /* 终幕的动效：轨道环亮起来、星野推到最亮、薄椭圆轨道扫入
       （经典风格没有这三层） */
    if (C.motion !== 'classic') {
      if (ui.rings) ui.rings.classList.add('dob-in')
      if (ui.stars) ui.stars.classList.add('dob-bright')
      if (ui.ellipse) ui.ellipse.classList.add('dob-in')
    }

    return wait(360)
      .then(function () {
        ui.welcome.classList.add('dob-in')
        ui.idline.classList.remove('dob-in')
        return wait(180)
      })
      /* 终幕三行同样是乱码收敛出来的 —— 和序列里是同一套语汇 */
      .then(function () {
        revealText(ui.w1, 'WELCOME TO', { stagger: 46, fade: 46 })
        revealText(ui.w2, C.welcomeBox, { stagger: 36, tick: 34, fade: 36 })
        revealText(ui.w4, '欢迎 ' + C.identity + ' 访问', { stagger: 40, fade: 40 })
        return wait(820)
      })
      .then(function () {
        /* 结尾色散故障：分片位移 + 0.5px 模糊 + 混合模式，读起来像镜头色散 */
        var targets = [ui.w1, ui.w2, ui.w4]
        targets.forEach(function (t) {
          t.classList.add('dob-glitch')
          t.setAttribute('data-text', t.textContent)
        })
        ui.w2.classList.add('dob-glitch-box')   /* 深底浅字那块换加色混合 */
        void ui.welcome.offsetWidth
        targets.forEach(function (t) { t.classList.add('dob-on') })
        return wait(640)
      })
      /* 星野与光速拉丝一起炸开 + 薄椭圆轨道扫过 + 文字冷色 halation */
      .then(function () {
        root.classList.add('dob-peak')
        bloomBurst(1250)
        warpBurst(1500)
        ui.streak.classList.add('dob-go')
        return wait(430)
      })
      /* 光晕最亮那一下补一记极短高光（是"眨一下"，不是长时间糊白） */
      .then(function () {
        ui.flash.style.transition = 'opacity ' + ms(70) + 'ms linear'
        ui.flash.style.opacity = '0.72'
        return wait(90)
      })
      .then(function () {
        ui.flash.style.transition = 'opacity ' + ms(340) + 'ms cubic-bezier(0.4, 0, 0.2, 1)'
        ui.flash.style.opacity = '0'
        return wait(320)
      })
      /* 欢迎语没播完就不揭幕（素材缺失时这个 Promise 立刻 resolve，不影响节奏） */
      .then(function () { return welcome })
      /* 揭幕：整个机位后撤 + 轻微失焦，比单纯淡出更有镜头感 */
      .then(function () {
        root.classList.add('dob-handoff')
        return wait(780)
      })
      .then(function () { return finish() })
  }

  function finish() {
    if (finished) return
    finished = true
    releaseAll()
    lockAllDecodes()
    stopHex()
    voice.stop()
    if (clockTimer) { clearInterval(clockTimer); clockTimer = null }
    try {
      if (C.mode === 'session') window.sessionStorage.setItem('dsh-orbit-boot:shown', '1')
      if (C.mode === 'daily') {
        window.localStorage.setItem('dsh-orbit-boot:day', new Date().toISOString().slice(0, 10))
      }
    } catch (err) { /* 隐私模式下不可写，忽略 */ }
    /* 解锁：Host 注入的关键样式用 html.dob-lock 锁滚动，这里必须一并摘掉，
       否则揭幕后主界面会永远滚不动。 */
    document.documentElement.classList.remove('dob-lock')
    document.documentElement.style.overflow = ''
    if (document.body) document.body.style.overflow = ''
    root.classList.remove('dob-boot')
    root.classList.add('dob-gone')
    setTimeout(function () {
      if (root && root.parentNode) root.parentNode.removeChild(root)
      try { window.dispatchEvent(new CustomEvent('dsh-orbit:done')) } catch (err) { /* noop */ }
    }, ms(900))
  }

  function requestSkip() {
    if (skipped || finished) return
    skipped = true
    releaseAll()
    finish()
  }

  if (C.allowSkip && ui.skip) {
    ui.skip.hidden = false
    ui.skip.addEventListener('click', function (e) { e.stopPropagation(); requestSkip() })
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') requestSkip()
    })
  } else if (ui.skip) {
    ui.skip.hidden = true
  }

  /* 对外 API：settings 面板里的"立即预览"按钮和重播都走它 */
  window.__DSH_ORBIT_API__ = {
    /* 设置页试听与冒烟测试用：直接念一行 */
    speak: function (en, zh) { voice.say(en, zh) },
    speakName: function (n) { return voice.speakName(n) },
    get voice() { return voice.current() },
    replay: injectSelf,
    skip: requestSkip,
    finish: finish,
    config: C
  }

  /* 锁滚动，动画期间不露出下面的应用 */
  document.documentElement.classList.add('dob-lock')
  document.documentElement.style.overflow = 'hidden'
  if (document.body) document.body.style.overflow = 'hidden'
  setProgress(0.05)
  root.classList.remove('dob-boot')

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { run() })
  } else {
    run()
  }
})()
