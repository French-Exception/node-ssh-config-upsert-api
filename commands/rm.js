exports.Factory = function (SshConfigUpsertApiModule) {
    const ApiBuilder = SshConfigUpsertApiModule.Dependencies.Get('@frenchex/yargs-api-builder');


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
                const path = SshConfigUpsertApiModule.Dependencies.Get('path');
                const userHome = SshConfigUpsertApiModule.Dependencies.Get('user-home');

                return {
                    host: {
                        required: true,
                        type: 'string'
                    },
                    show: {
                        required: true,
                        default: false,
                        type: 'boolean'
                    },
                    dry: {
                        required: true,
                        default: false,
                        type: 'boolean'
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
                const SshConfigReaderWriter = SshConfigUpsertApiModule.Libs.SshConfig;

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
                        sshConfigObject.remove({Host: ctxEmitter.context.host});

                        if (ctxEmitter.context.dry || ctxEmitter.context.show) {
                            ctxEmitter.emit('print', SshConfigUpsertApiModule.Dependencies.Get('ssh-config').stringify(sshConfigObject));
                            ctxEmitter.context.dry && ctxEmitter.emit('done');
                        } else {
                            const writeEmitter = SshConfigReaderWriter.write(ctxEmitter.context.file, sshConfigObject);
                            writeEmitter
                                .on('error', (err, fatal) => {
                                    ctxEmitter.emit('error', err, fatal);
                                })
                                .on('done', () => {
                                    ctxEmitter.emit('done', {host: ctxEmitter.context.host, action: 'deleted'});
                                })
                                .emit('run');
                        }
                    })
                    .emit('ssh.config.file.load');
            }
        }
    )
};
