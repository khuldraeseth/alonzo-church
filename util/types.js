const typeName = (value) => value == null ? 'null' : value.constructor.name || typeof value;

exports.typeName = typeName;