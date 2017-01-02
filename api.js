exports.Package = require('./package.json');
exports.Dependencies = (() => {
    const loaded = {};

    return {
        Get: (dependency, _require) => {
            if (!loaded[dependency]) {
                _require = _require || require;
                loaded[dependency] = _require(dependency);
            }

            return loaded[dependency];
        }
    };
})();

exports.Libs = {
    SshConfig: require('./lib/ssh-config').Factory(exports)
};

exports.Commands = {
    Add: require('./commands/add').Factory(exports),
    Rm: require('./commands/rm').Factory(exports),
};