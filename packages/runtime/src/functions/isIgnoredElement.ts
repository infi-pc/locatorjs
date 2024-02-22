/**
 * This function checks if the found element should be ignored.
 */
const isIgnoredElement = (element:HTMLElement):boolean => {
    // TODO: -add more options for ignoring elements if needed e.g. disable all elements with certain prefix
    if (element.dataset.locatorDisable) return true;
    return false
};

export default isIgnoredElement
