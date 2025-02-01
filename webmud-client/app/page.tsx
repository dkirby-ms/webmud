import { auth } from "auth"

export default async function Index() {
  const session = await auth()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">webmud client</h1>
      <div>

      </div>
      <div className="flex flex-col rounded-md bg-neutral-100">
        <div className="p-4 font-bold rounded-t-md bg-neutral-200">
          Current Session
        </div>
        <pre className="py-6 px-4 whitespace-pre-wrap break-all">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
    </div>
  )
}
