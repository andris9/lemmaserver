var lemma = require("lemma"),
	Gearman = require("node-gearman"),
    pathlib = require("path");

lemma.config.morfdir = pathlib.join("C:","APP", "estmorf");
lemma.config.tempdir = "F:";

var gearman = new Gearman("pangalink.net");

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