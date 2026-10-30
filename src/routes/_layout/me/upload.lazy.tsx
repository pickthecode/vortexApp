import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_layout/me/upload')({
  component: RouteComponent,
})

function RouteComponent() {
   return <div>Hello "/_layout/me/upload"!</div>
}
