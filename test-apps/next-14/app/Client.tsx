"use client"

import ClientNested from "./ClientNested"

export default () => {
  return (
    <section>
      Client!{" "}
      <div>
        Bam<span>Bam</span>
        <ClientNested />
      </div>
    </section>
  )
}
