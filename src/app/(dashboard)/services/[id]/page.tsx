export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Servicio {id}</h1>
    </div>
  )
}
