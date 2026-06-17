import { BarChart3, CheckCircle2, Globe2, RefreshCw, ShieldCheck, Zap } from 'lucide-react'

const stocks = [
  { symbol: 'AAPL', name: 'Apple', price: '196.45', change: '+1.28%', positive: true },
  { symbol: 'TSLA', name: 'Tesla', price: '182.09', change: '-0.64%', positive: false },
  { symbol: 'NVDA', name: 'Nvidia', price: '128.76', change: '+3.82%', positive: true },
  { symbol: 'BABA', name: 'Alibaba', price: '86.31', change: '+0.91%', positive: true },
]

const markets = ['美股', 'A股', 'ETF', '基金', '指数']

interface AuthVisualPanelProps {
  mode: 'login' | 'register' | 'forgot'
}

export default function AuthVisualPanel({ mode }: AuthVisualPanelProps) {
  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'

  const headline = isRegister
    ? { line1: '加入数据平台，', line2: '开启全球行情能力' }
    : isForgot
      ? { line1: '安全找回权限，', line2: '继续连接市场数据' }
      : { line1: '欢迎回到控制台，', line2: '继续掌控市场脉搏' }

  return (
    <section className="gridbg relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#0a0f1a] px-10 py-10 text-white lg:flex xl:px-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.35),transparent_32%),radial-gradient(circle_at_85%_75%,rgba(6,182,212,0.15),transparent_35%)]" />
      <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px]" />
      <div className="absolute -right-32 bottom-16 h-80 w-80 rounded-full bg-cyan-500/10 blur-[80px]" />

      <div className="relative z-10 flex items-center justify-between fade-in">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-600/30">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">Global Stock</p>
            <p className="text-[11px] uppercase tracking-[0.28em] text-blue-300/80">Market Data Platform</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          实时数据在线
        </span>
      </div>

      <div className="relative z-10 grid flex-1 items-center gap-10 py-10 xl:grid-cols-[1fr_1.05fr]">
        <div className="fade-in-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 backdrop-blur-sm">
            <Zap className="h-4 w-4 text-amber-400" />
            机构级市场数据后台
          </div>
          <h1 className="text-4xl font-bold leading-[1.15] tracking-tight xl:text-5xl">
            {headline.line1}
            <span className="mt-1 block bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              {headline.line2}
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
            面向投资者、开发者和研究团队，统一管理美股、A股、ETF 与量化数据 API，支持角色权限与 Token 访问控制。
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {markets.map((market) => (
              <span
                key={market}
                className="rounded-lg border border-white/8 bg-white/5 px-3.5 py-1.5 text-sm text-slate-300 backdrop-blur-sm transition-colors hover:border-blue-500/30 hover:bg-blue-500/10"
              >
                {market}
              </span>
            ))}
          </div>
        </div>

        <div className="glow relative rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl fade-in-up stagger-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">实时行情</h3>
              <p className="text-xs text-slate-500">Live market snapshots</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-400">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              同步中
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stocks.map((stock) => (
              <div
                key={stock.symbol}
                className="group rounded-xl border border-white/5 bg-slate-800/50 p-4 transition-all hover:border-blue-500/20 hover:bg-slate-800/80"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold text-white">{stock.symbol}</span>
                  <span className="text-[11px] text-slate-500">{stock.name}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-mono text-xl font-bold text-white">${stock.price}</span>
                  <span className={stock.positive ? 'text-sm font-semibold text-emerald-400' : 'text-sm font-semibold text-rose-400'}>
                    {stock.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-3 fade-in-up stagger-3">
        {[
          { icon: Globe2, value: '5+', label: '市场覆盖', color: 'text-blue-400' },
          { icon: ShieldCheck, value: '99.9%', label: '服务可用性', color: 'text-emerald-400' },
          { icon: CheckCircle2, value: 'REST', label: '统一 API', color: 'text-cyan-300' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/8 bg-white/5 p-4 backdrop-blur-sm">
            <item.icon className={`mb-2 h-5 w-5 ${item.color}`} />
            <p className="text-xl font-bold">{item.value}</p>
            <p className="text-xs text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
