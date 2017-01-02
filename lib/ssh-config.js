exports.Factory = function (SshConfigUpsertApiModule) {

    const SshConfig = SshConfigUpsertApiModule.Dependencies.Get('ssh-config');
    const EventEmitter = SshConfigUpsertApiModule.Dependencies.Get('events');
    const Fs = SshConfigUpsertApiModule.Dependencies.Get('fs');

    return {
        SshConfig: SshConfig,
        write: function (file, sshConfigObject) {
            const emitter = new EventEmitter();

            emitter.on('run', () => {
                const newSshConfigFileContent = SshConfig.stringify(sshConfigObject);

                Fs.writeFile(file, newSshConfigFileContent, 'utf-8', (err) => {
                    if (err) emitter.emit('err', err, 1);
                    else emitter.emit('done');

                });
            });

            return emitter;
        },
        read: function (file) {
            const emitter = new EventEmitter();

            emitter.on('run', () => {
                Fs.readFile(file, null, (err, data) => {
                    if (err) emitter.emit('err', err, 1);
                    else emitter.emit('data', SshConfig.parse(data.toString()));
                });
            });

            return emitter;
        }
    }
};
