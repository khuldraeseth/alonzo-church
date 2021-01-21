const hasProperty = (obj, prop) => obj != null && Object.prototype.hasOwnProperty.call(obj, prop);

const shallowEquals = (a, b) => {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return keysA.length === keysB.length && keysA.every(key => hasProperty(b, key) && a[key] === b[key]);
}

exports.hasProperty = hasProperty;
exports.shallowEquals = shallowEquals;