import Link from "next/link"
import { ArrowRight, Banknote, CircleCheck, Clock3, CreditCard, ReceiptText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

type PaymentRow = {
  id: string
  amount_paid: number | null
  payment_method: string | null
  created_at: string
}

async function getBillingReport() {
  const supabase = await createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [unpaid, paidToday, paymentsToday, recentPayments] = await Promise.all([
    supabase.from("invoices").select("balance").eq("status", "unpaid"),
    supabase
      .from("invoices")
      .select("paid_amount")
      .eq("status", "paid")
      .gte("created_at", today.toISOString()),
    supabase
      .from("payments")
      .select("amount_paid")
      .gte("created_at", today.toISOString()),
    supabase
      .from("payments")
      .select("id,amount_paid,payment_method,created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  const outstanding = (unpaid.data ?? []).reduce(
    (total, invoice) => total + Number(invoice.balance ?? 0),
    0
  )
  const collectedToday = (paymentsToday.data ?? []).reduce(
    (total, payment) => total + Number(payment.amount_paid ?? 0),
    0
  )

  return {
    outstanding,
    unpaidCount: unpaid.data?.length ?? 0,
    paidTodayCount: paidToday.data?.length ?? 0,
    collectedToday,
    recentPayments: (recentPayments.data ?? []) as PaymentRow[],
  }
}

const formatKes = (amount: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount)

export default async function BillingDashboardPage() {
  const report = await getBillingReport()

  return (
    <main className="space-y-6 px-4 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge variant="outline" className="mb-3">Finance operations</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Payments dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Collections, outstanding balances, and recent payment activity.</p>
        </div>
        <Button asChild><Link href="/unpaid-patients">Process payments <ArrowRight className="ml-2 size-4" /></Link></Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Collected today" value={formatKes(report.collectedToday)} detail="Recorded payment transactions" icon={Banknote} />
        <Metric title="Payments completed" value={String(report.paidTodayCount)} detail="Invoices closed today" icon={CircleCheck} />
        <Metric title="Outstanding" value={formatKes(report.outstanding)} detail="Across open invoices" icon={CreditCard} />
        <Metric title="Awaiting payment" value={String(report.unpaidCount)} detail="Invoices requiring action" icon={Clock3} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader><CardTitle>Recent payments</CardTitle></CardHeader>
          <CardContent>
            {report.recentPayments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <div className="divide-y">
                {report.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{payment.payment_method || "Unspecified method"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(payment.created_at).toLocaleString("en-KE")}</p>
                    </div>
                    <p className="font-semibold text-emerald-600">{formatKes(Number(payment.amount_paid ?? 0))}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Finance shortcuts</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="outline" className="justify-start"><Link href="/unpaid-patients"><ReceiptText className="mr-2 size-4" />Unpaid accounts</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link href="/paid-patients"><CircleCheck className="mr-2 size-4" />Paid accounts</Link></Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function Metric({ title, value, detail, icon: Icon }: { title: string; value: string; detail: string; icon: typeof CreditCard }) {
  return (
    <Card><CardContent className="flex items-start justify-between p-5"><div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Icon className="size-5" /></div></CardContent></Card>
  )
}
