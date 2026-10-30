import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_layout/me/files')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout/me/file"!</div>
}
