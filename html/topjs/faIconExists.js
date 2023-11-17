var faIconExists = (faType, name, returnIcon, iconStyle) => {
    if(faType && typeof faType == `string`) {
        const exists = scripts.misc.fa[faType]?.querySelector(`glyph[glyph-name="${name}"]`) ? true : false;

        if(exists && returnIcon) {
            const tempElement = document.createElement(`i`);
            console.log(`objToDOM: icon2 (${faType} / ${name})`)
            
            tempElement.className = `${faType} fa-${name}`;
    
            if(iconStyle) for(const key of Object.keys(iconStyle)) {
                tempElement.style[key] = iconStyle[key];
            }
    
            return tempElement;
        } else return exists;
    } else {
        const fallbacks = Array.isArray(faType) && faType || [`fas`, `far`, `fab`]

        const found = fallbacks.map(f => faIconExists(f, name, returnIcon, iconStyle));

        console.log(`objToDOM: icon3 (${faType} / ${name})`, found)

        return found.find(Boolean);
    }
}