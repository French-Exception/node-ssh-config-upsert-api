const SshConfig = require('ssh-config');
const Fs = require('fs');
const EventEmitter = require('events');

exports.write = function (file, sshConfigObject, dry) {
    const emitter = new EventEmitter();

    emitter.on('run', () => {
        const newSshConfigFileContent = SshConfig.stringify(sshConfigObject);

        if (dry) {
            emitter.emit('print', newSshConfigFileContent);
        } else {
            Fs.writeFile(file, newSshConfigFileContent, 'utf-8', (err) => {
                if (err) emitter.emit('err', err, 1);
                else emitter.emit('done');

            });
        }

    });


    return emitter;
};

exports.read = function (file) {
    const emitter = new EventEmitter();

    emitter.on('run', () => {
        Fs.readFile(file, null, (err, data) => {
            if (err) emitter.emit('err', err, 1);
            else emitter.emit('data', SshConfig.parse(data.toString()));

        });

    });

    return emitter;
};
