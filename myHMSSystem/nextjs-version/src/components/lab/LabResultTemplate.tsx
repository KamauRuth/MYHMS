type LabResultParam = {
  parameter: string
  result: string
  units?: string | null
  reference_range?: string | null
  abnormal?: boolean | null
}

type LabResultTemplateProps = {
  hospitalName?: string
  hospitalAddress?: string
  hospitalPhone?: string
  patientName: string
  patientNumber?: string | null
  age?: string | number | null
  gender?: string | null
  requestId?: string | null
  testName?: string | null
  requestingDoctor?: string | null
  clinicName?: string | null
  collectionDate?: string | null
  receivedDate?: string | null
  reportDate?: string | null
  releasedDate?: string | null
  results: LabResultParam[]
  comments?: string | null
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "—"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString()
}

export function LabResultTemplate({
  hospitalName = "LIFEPOINT HOSPITAL",
  hospitalAddress = "123 Wellness Blvd, Suite 456, New York, NY 10001",
  hospitalPhone = "(555) 987-6543",
  patientName,
  patientNumber,
  age,
  gender,
  requestId,
  testName,
  requestingDoctor,
  clinicName,
  collectionDate,
  receivedDate,
  reportDate,
  releasedDate,
  results,
  comments,
}: LabResultTemplateProps) {
  const hasAbnormal = results.some((item) => item.abnormal)

  return (
    <article className="bg-white text-slate-900 print:shadow-none">
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-slate-950 to-slate-800 text-white px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Medical Laboratory Report</p>
              <h2 className="mt-2 text-2xl font-bold">{hospitalName}</h2>
              <p className="mt-1 text-sm text-slate-300">{hospitalAddress}</p>
              <p className="text-sm text-slate-300">Tel: {hospitalPhone}</p>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm lg:text-right">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Report Reference</p>
              <p className="mt-1 font-semibold">{requestId || "—"}</p>
              <p className="text-slate-300">Report date: {formatDateTime(reportDate || releasedDate)}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-slate-200">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoBlock label="Patient" value={patientName} />
            <InfoBlock label="Patient Number" value={patientNumber || "—"} />
            <InfoBlock label="Age / Gender" value={`${age || "—"}${gender ? ` / ${gender}` : ""}`} />
            <InfoBlock label="Clinic" value={clinicName || "—"} />
            <InfoBlock label="Requesting Doctor" value={requestingDoctor || "—"} />
            <InfoBlock label="Test" value={testName || "—"} />
            <InfoBlock label="Collection Date" value={formatDateTime(collectionDate)} />
            <InfoBlock label="Received Date" value={formatDateTime(receivedDate)} />
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <section>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Laboratory Results</p>
                <h3 className="text-lg font-semibold text-slate-900">{testName || "Analysis Summary"}</h3>
              </div>

              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  hasAbnormal ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {hasAbnormal ? "Review Required" : "Within Normal Limits"}
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Category / Parameter</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Result</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Normal Range</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item, index) => (
                    <tr key={`${item.parameter}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                      <td className="border-b border-slate-200 px-4 py-3 font-medium text-slate-900">{item.parameter}</td>
                      <td className="border-b border-slate-200 px-4 py-3 text-slate-700">
                        {item.result} {item.units ? <span className="text-slate-500">{item.units}</span> : null}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3 text-slate-600">{item.reference_range || "—"}</td>
                      <td className="border-b border-slate-200 px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.abnormal ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {item.abnormal ? "Abnormal" : "Normal"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">General Impression</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {comments?.trim()
                  ? comments
                  : hasAbnormal
                    ? "Some values are outside the normal range and should be reviewed in the context of the full clinical picture."
                    : "All results are within normal limits."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Report Details</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Detail label="Report date" value={formatDateTime(reportDate || releasedDate)} />
                <Detail label="Received" value={formatDateTime(receivedDate)} />
                <Detail label="Released" value={formatDateTime(releasedDate)} />
                <Detail label="Reference" value={requestId || "—"} />
              </dl>
            </div>
          </section>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            The isolated analysis of this exam has no diagnostic value unless evaluated together with clinical, epidemiological,
            and complementary examination data.
          </div>
        </div>
      </div>
    </article>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900 text-right">{value}</dd>
    </>
  )
}