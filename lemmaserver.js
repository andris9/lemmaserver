var lemma = require("lemma"),
	Gearman = require("node-gearman"),
    pathlib = require("path"),
    argv = require('optimist').argv;

if(argv.h){
    console.log("Usage: node lemmaserver.js --temp=[DIR] --morf=[DIR] --gm=[DOMAIN] --port=4730");
    process.exit();
}

lemma.config.morfdir = argv.morf || pathlib.join("C:","APP", "estmorf");
lemma.config.tempdir = argv.temp || "F:";

var gearmanHost = argv.gm || "pangalink.net";  

var gearman = new Gearman(gearmanHost);

gearman.registerWorker("lemma", function(payload, worker){
	if(!payload){
        worker.error();
        return;
    }

    var words = (payload || "").toString("utf-8").trim().split(/\s*,\s*/);

    lemma.findLemmas(words, function(err, lemmas){
	    if(err){
	    	worker.error();
	    	return;
	    }

	    returnWords = [];
	    for(var i=0, len = words.length; i<len; i++){
	    	returnWords.push(lemmas[words[i]] && lemmas[words[i]][0] || words[i]);
	    }

	    worker.end(returnWords.join(", "));
	});
});