import { createLazyFileRoute } from '@tanstack/react-router'
import UserSet from '../../../pages/UserSet/UserSet'

export const Route = createLazyFileRoute('/_layout/me/set')({
  component: UserSet,
})
