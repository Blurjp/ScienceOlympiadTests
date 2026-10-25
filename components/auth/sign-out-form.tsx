"use client"

// Wraps the header sign-out form. Before submitting, tell Google that the
// user signed out explicitly so One Tap does not silently sign them back in
// on the next page load (Google policy: auto-select must stay off until the
// user interacts once again).

import { disableGoogleAutoSelect } from "./one-tap"

export function SignOutForm({
  action,
  children,
}: {
  action: () => Promise<void>
  children: React.ReactNode
}) {
  return (
    <form action={action} onSubmit={disableGoogleAutoSelect}>
      {children}
    </form>
  )
}
