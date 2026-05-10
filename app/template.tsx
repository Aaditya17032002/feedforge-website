export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 w-full animate-page-enter motion-reduce:animate-none">{children}</div>
  )
}
