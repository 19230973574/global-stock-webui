import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { AuthLayout } from '../components/layout/AuthLayout'
import { AlertBanner } from '../components/ui/page-elements'
import { activateAccount } from '../lib/authApi'
import { CheckCircle2, Loader2 } from 'lucide-react'

export default function ActivatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const email = searchParams.get('email') ?? ''
    const code = searchParams.get('code') ?? ''
    if (!email || !code) {
      setError('激活链接无效，缺少邮箱或激活码')
      setLoading(false)
      return
    }
    activateAccount({ email, code })
      .then(() => setSuccess(true))
      .catch((err) => setError(err instanceof Error ? err.message : '激活失败'))
      .finally(() => setLoading(false))
  }, [searchParams])

  return (
    <AuthLayout mode="register" title="账号激活" description="正在验证您的邮箱激活链接">
      {loading && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">激活中，请稍候...</p>
        </div>
      )}
      {!loading && success && (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <AlertBanner type="success" message="账号已激活，现在可以登录了" />
          <Button className="btn-primary h-11 w-full rounded-xl" onClick={() => navigate('/login')}>
            前往登录
          </Button>
        </div>
      )}
      {!loading && error && <AlertBanner type="error" message={error} />}
    </AuthLayout>
  )
}
