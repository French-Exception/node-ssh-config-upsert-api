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
                    key: {
                        required: true,
                        type: 'string'
                    }
                }
            },
            ApiHandler: (ctxEmitter) => {
                ctxEmitter.emit(
                    'done',
                    ctxEmitter.context.config.get(ctxEmitter.context.key)
                );
            }
        }
    )
})();
