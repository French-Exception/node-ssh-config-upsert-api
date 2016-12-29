exports.Package = require('./package.json');
exports.Commands = {
    Dependencies: (() => {
        return Object.keys(exports.Package.dependencies).map((dependency) => {
            return require(dependency);
        })
    })(),
    Add: require('./commands/add'),
    Rm: require('./commands/rm')
};
