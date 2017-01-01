module.exports = exports = (() => {

    const ApiBuilder = require('@frenchex/yargs-api-builder');

    /**
     *  return {
        RequestDescriptor: requestDescriptor,
        Request: requestImpl,
        Api: apiImpl,
        ApiHandler: apiHandlerImpl
    };
     */
    return ApiBuilder(
        {
            ApiRequestDescriptor: (config) => {
                const path = require('path');
                const userHome = require('user-home');

                return {
                    prefix: {
                        alias: 'x',
                        default: null,
                        type: 'string',
                        describe: 'Prefix host'
                    },
                    exec: {
                        required: true,
                        type: 'string'
                    },
                    path: {
                        alias: 'p',
                        default: process.cwd(),
                        describe: 'Path to execute command'
                    },
                    dry: {
                        default: false,
                        alias: 'd',
                        describe: 'Shows what would be done'
                    },
                    show: {
                        default: false,
                        alias: 's',
                        describe: 'Shows the generated ssh config file'
                    },
                    file: {
                        alias: 'f',
                        describe: 'Ssh config file path',
                        global: true,
                        default: path.join(userHome, '.ssh', 'config')
                    }
                }
            },
            ApiHandler: (ctxEmitter) => {

                if (!ctxEmitter.context.file) {
                    ctxEmitter.emit('error', new Error('No .ssh/config file given'), 1);
                    return;
                }
                const SshConfigReaderWriter = require('./../lib/ssh-config');

                ctxEmitter
                    .on('ssh.config.file.load', () => {
                        SshConfigReaderWriter
                            .read(ctxEmitter.context.file)
                            .on('error', (err, fatal) => {
                                ctxEmitter.emit('error', err, fatal);
                            })
                            .on('data', (sshConfigObject) => {
                                ctxEmitter.emit('ssh.config.file.loaded', sshConfigObject);
                            })
                            .emit('run');

                    })
                    .on('ssh.config.file.loaded', (sshConfigObject) => {
                        if (ctxEmitter.context.data) {
                            ctxEmitter.emit('data.from-context', sshConfigObject);
                        } else {
                            ctxEmitter.emit('data.from-pipe', sshConfigObject);
                        }
                    })
                    .on('data.from-context', (sshConfigObject) => {
                        has_data(ctxEmitter.context, ctxEmitter.context.data, sshConfigObject, ctxEmitter, SshConfigReaderWriter);
                    })
                    .on('data.from-pipe', (sshConfigObject) => {
                        get_data_from_exec(ctxEmitter.context.exec, ctxEmitter.context.path)
                            .on('error', (error) => {
                                ctxEmitter.emit('error', error);
                            })
                            .on('data', (data) => {
                                has_data(ctxEmitter.context, data, sshConfigObject, ctxEmitter, SshConfigReaderWriter)
                            })
                            .emit('run');
                    })
                    .emit('ssh.config.file.load');


                function get_data_from_exec(exec, path) {
                    const Cp = require('child_process');
                    const EventEmitter = require('events');
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
                }

                function has_data(argv, data, sshConfigObject, emitter, SshConfigReaderWriter) {
                    sshConfigObject = update_ssh_config_object(data, sshConfigObject, argv.prefix, SshConfigReaderWriter.SshConfig);
                    const writer_emitter = SshConfigReaderWriter.write(argv.file, sshConfigObject, argv.dry);
                    if (argv.show) emitter.emit('print', data);

                    writer_emitter
                        .on('done', () => {
                            emitter.emit('done', {action: 'added'});
                        })
                        .on('error', (err) => {
                            emitter.emit('err', err, 1);
                        })
                        .emit('run');
                }

                function update_ssh_config_object(host_entry, sshConfigObject, prefix, SshConfig) {
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
                }
            }
        }
    )
})();
