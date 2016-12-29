exports.has_data = (argv, data, sshConfigObject, emitter, SshConfigReaderWriter) => {
    sshConfigObject = update_ssh_config_object(data, sshConfigObject, argv.prefix);
    const writer_emitter = SshConfigReaderWriter.write(argv.file, sshConfigObject, argv.dry);
    if (argv.show) console.log(data);

    writer_emitter
        .on('done', () => {
            emitter.emit('done');
        })
        .on('error', (err) => {
            emitter.emit('err', err);
        });

};

exports.update_ssh_config_object = (host_entry, sshConfigObject, SshConfig, prefix) => {
    let newHost = SshConfig.parse(host_entry);

    newHost = newHost.map((entry) => {
        entry.value = prefix + entry.value;

        return entry;
    });

    if (newHost.length > 0) {
        const existingHost = sshConfigObject.find({Host: newHost[0].value});
        if (existingHost) {
            sshConfigObject.remove({Host: newHost[0].value});
        }
        return sshConfigObject.concat(newHost);
    }

    return sshConfigObject;

};

exports.get_data_from_exec = (exec, path) => {
    const Cp = require('child_process');
    const emitter = new EventEmitter();

    emitter.on('run', () => {
        Cp.exec(exec.trim(), {
            env: process.env,
            cwd: path,
            timeout: 50000
        }, function (error, stdout, stderr) {
            if (error) emitter.emit('error', error, stdout, stderr, exec, path);
            else emitter.emit('data', stdout, exec, path);
        });

    });
    return emitter;
};