export function LoadingSpinner({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  )
}
