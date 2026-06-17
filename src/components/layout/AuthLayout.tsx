import { BarChart3 } from 'lucide-react'
import AuthVisualPanel from '../AuthVisualPanel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

export function AuthLayout({
  mode,
  title,
  description,
  children,
  footer,
}: {
  mode: 'login' | 'register' | 'forgot'
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[1.12fr_0.88fr]">
      <AuthVisualPanel mode={mode} />

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.08),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]" />
        <div className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-10 h-48 w-48 rounded-full bg-violet-200/20 blur-3xl" />

        <Card className="relative z-10 w-full max-w-[420px] border-0 bg-white/90 shadow-elevated backdrop-blur-sm fade-in-up">
          <CardHeader className="space-y-3 pb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/25 lg:hidden">
              <BarChart3 className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-950">{title}</CardTitle>
            <CardDescription className="text-base">{description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {children}
            {footer && <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">{footer}</div>}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
