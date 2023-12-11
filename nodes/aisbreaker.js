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

            node.error("error occurred", { ...msg, error: err })
            done();
            return;
          }

          let auth = {
            secret: result
          }

          try {
            const aisService = module.api.AIsBreaker.getAIsService(cfg.endpoint, JSON.parse(cfg.servicejson), auth);

            node.status({ fill:"yellow",shape:"ring",text:RED._("aisbreaker.status.asking") });

            let data = {
              inputs: [{
                text: {
                  role: 'user',
                  content: msg.payload,
                },
              }]
            }

            if (msg.conversationState) {
              data["conversationState"] = msg.conversationState
            }

            aisService.process(
              data
            ).then( resp => {
              node.status({});

              send({ 
                ...msg, 
                payload: (resp.outputs && resp.outputs[0] && resp.outputs[0].text && resp.outputs[0].text.content ) || undefined,
                conversationState: resp.conversationState
              })
              
              done()
            }).catch( err => {
              node.status({ fill: "red", shape: "ring", text: RED._("aisbreaker.status.error") });
              setTimeout( () => { node.status({}) }, 3000);

              node.error("error occurred", { ...msg, error: err })
              done();
            })
          } catch( err ) {
            node.error("error occurred", { ...msg, error: err })
            done();
          }
        })
      }).catch( err => {
        node.error("error occurred", { ...msg, error: err })
        done();
      })
    });
  }

  RED.nodes.registerType("AIsBreaker", CoreAIsBreakerFunctionality);

}
