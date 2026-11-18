type SectionHeadingProps = {
  eyebrow: string
  title: string
  accent?: string
  children?: React.ReactNode
  id?: string
}

export default function SectionHeading({ eyebrow, title, accent, children, id }: SectionHeadingProps) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
      <div className="mb-4 flex justify-center">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-900">• {eyebrow}</span>
      </div>
      <h2 id={id} className="text-balance text-2xl font-bold leading-tight text-gray-900 sm:text-3xl lg:text-4xl">
        {title}
        {accent ? <span className="text-accent"> {accent}</span> : null}
      </h2>
      {children ? (
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-gray-600 lg:text-base">{children}</p>
      ) : null}
    </div>
  )
}
