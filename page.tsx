import { SignInButton } from '@clerk/nextjs'


export default function Page() {
  return (
    <div className="text-center">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
        Introducing, AutoDocs.
      </h1>
      <div className="mt-4">
        <SignInButton />
      </div>
    </div>
  )
}
