"use client"

export default () => {
  return (
    <div data-locator-disable={true}>
      Client! <div>Bam</div>

        <div>
            I'm parent

            <div>we're child</div>
           <div data-locator-disable={true}>
            <div  >im disabled </div>
            <div  >im disabled </div>
            <div  >im disabled </div>
            <div  >im disabled </div>

           </div>
            <div>we're child</div>
        </div>
    </div>
  )
}
