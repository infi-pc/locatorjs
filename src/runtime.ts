const dataByFilename: {[filename: string]: any} = {}

export function register(input: any) {
    console.log(input)
    dataByFilename[input.filePath] = input
}

if (typeof window !== 'undefined') {
    // add style tag to head
    const style = document.createElement('style')
    style.innerHTML = `
        [data-vispr-id]:hover {
            outline: 1px solid red;
        }
    `
    document.head.appendChild(style)

    document.addEventListener("click", function(e){
        if (e.target) {
            // @ts-ignore
            const found = e.target.closest('[data-vispr-id]')
            console.log(found)
            const [filePath, id] = found.dataset.visprId.split("::")
            const data = dataByFilename[filePath]
            console.log(data)
            console.log()
            const exp = data.expressions[Number(id)]
            // window.location.href = 
            const link = `vscode://file${filePath}:${exp.loc.start.line}:${exp.loc.start.column + 1}`
            console.log(link)
            var win = window.open(link, '_blank');
        }
    });
}