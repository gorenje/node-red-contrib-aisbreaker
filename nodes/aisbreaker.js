module.exports = function(RED) {
  function CoreAIsBreakerFunctionality(config) {
    RED.nodes.createNode(this,config);

    var node = this;
    var cfg = config;

    node.on('close', function() {
      node.status({});
    });

    /* msg handler, in this case pass the message on unchanged */
    node.on("input", function(msg, send, done) {
      import('aisbreaker-api-js').then(module => {

        RED.util.evaluateNodeProperty(cfg.apiToken, cfg.apiTokenType, node, msg, (err, result) => {
          if (err) {
            node.status({
              fill: "red",
              shape: "dot",
              text: "Failed, no API TOKEN provided."
            });

            node.error({ ...msg, error: err })
            done();
            return;
          }

          let auth = {
            secret: result
          }

          try {
            const aisService = module.api.AIsBreaker.getRemoteAIsService(cfg.endpoint, JSON.parse(cfg.servicejson), auth);

            aisService.process({
              inputs: [{
                text: {
                  role: 'user',
                  content: msg.payload,
                },
              }],
            }).then( resp => {
              send({
                ...msg,
                payload: resp
              })
              done()
            }).catch( err => {
              node.error({ ...msg, error: err })
              done();
            })

          } catch( err ) {
            node.error({ ...msg, error: err })
            done();
          }
        })

      }).catch( err => {
        node.error({ ...msg, error: err })
        done();
      })
    });
  }

  RED.nodes.registerType("AIsBreaker", CoreAIsBreakerFunctionality);

}
