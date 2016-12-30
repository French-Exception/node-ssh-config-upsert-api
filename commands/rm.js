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
                    }
                }
            },
            ApiHandler: (ctxEmitter) => {
                const SshConfigReaderWriter = require('./../lib/ssh-config');

                ctxEmitter
                    .on('ssh.config.file.load', () => {
                        SshConfigReaderWriter
                            .read(ctxEmitter.context.file,)
                            .on('error', (err, fatal) => {
                                ctxEmitter.emit('error', err, fatal);
                            })
                            .on('data', (sshConfigObject) => {
                                ctxEmitter.emit('ssh.config.file.loaded', sshConfigObject);
                            })
                            .emit('run');

                    })
                    .on('ssh.config.file.loaded', (sshConfigObject) => {
                        sshConfigObject.remove({Host: ctxEmitter.context.basename + '.' + ctxEmitter.context.machine});

                        if (ctxEmitter.context.dry || ctxEmitter.context.show) {
                            ctxEmitter.emit('print', require('ssh-config').stringify(sshConfigObject));
                            ctxEmitter.context.dry && ctxEmitter.emit('done');
                        } else {
                            const writeEmitter = SshConfigReaderWriter.write(ctxEmitter.context.file, sshConfigObject);
                            writeEmitter
                                .on('error', (err, fatal) => {
                                    ctxEmitter.emit('error', err, fatal);
                                })
                                .on('done', () => {
                                    ctxEmitter.emit('done');
                                });
                        }
                    })
                    .emit('ssh.config.file.load');
            }
        }
    )
})();
