var lemma = require("lemma"),
	Gearman = require("node-gearman"),
    pathlib = require("path"),
    argv = require('optimist').argv,
    fs = require("fs");

// display help message
if(argv.h){
    console.log("Usage: node lemmaserver.js --temp=[DIR] --morf=[DIR] --gm=[DOMAIN] --port=4730");
    process.exit();
}

// setup lemma paths
lemma.config.morfdir = argv.morf || pathlib.join("C:","APP", "estmorf");
lemma.config.tempdir = argv.temp || "F:";

var gearmanHostname = argv.gm || "pangalink.net",
    gearmanPort = argv.port || 4730,
    gearmanClient = new Gearman(gearmanHostname, gearmanPort),
    initialConnectTimeout = 15, // seconds
    nextTimeout = initialConnectTimeout;

var logfile;

if(argv.log){
    logfile = fs.createWriteStream(argv.log);
}

// add one or several workers
var workerList = [["lemma", processLemma]];

// Connect to the server
Log("Connecting to gearman");
gearmanClient.on("connect", function(){
    nextTimeout = initialConnectTimeout; // reset timer
    Log("Connected to gearman server");
});

// Connection to the server is closed, reconnect
gearmanClient.on("close", function(){
    Log("Lost connection to gearman server, reconnecting in " + nextTimeout + "sec");
    setTimeout(function(){
        Log("Reconnecting...");
        
        // try to reconnect
        gearmanClient.connect();
        
        // workers are removed on connection close, readd
        registerWorkers();
        
        nextTimeout *= 2; // if the connection still fails, wait 2x last interval
    }, nextTimeout * 1000);
});

registerWorkers();

function registerWorkers(){
    for(var i=0, len = workerList.length; i<len; i++){
        gearmanClient.registerWorker(workerList[i][0], workerList[i][1]);
    }
}

function processLemma(payload, worker){
    if(!payload){
        worker.error();
        return;
    }

    var words = (payload || "").toString("utf-8").trim().split(/\s*,\s*/);

    lemma.findLemmas(words, function(err, lemmas){
        if(err){
            worker.error();
            return;
        }

        returnWords = [];
        for(var i=0, len = words.length; i<len; i++){
            returnWords.push(lemmas[words[i]] && lemmas[words[i]][0] || words[i]);
        }

        var logMaxWords = 4;

        // display 
        Log("REQ " + 
            (words.length<logMaxWords?words:words.slice(0,logMaxWords).concat("["+words.length-logMaxWords+" more]")).join(", ") +
            "::" +
            (returnWords.length<logMaxWords?returnWords:returnWords.slice(0,logMaxWords).concat("["+returnWords.length-logMaxWords+" more]")).join(", ")
        )

        worker.end(returnWords.join(", "));
    });
}

function Log(msg){
    var time = new Date();
    msg = time.getFullYear()+       "-"+
          pad(time.getMonth()+1)+   "-"+
          pad(time.getDate())+      "T"+
          pad(time.getHours()+1)+   ":"+
          pad(time.getMinutes()+1)+ ":"+
          pad(time.getSeconds()+1)+ " "+
          msg.trim();
    
    if(logfile){
        logfile.write(new Buffer(msg+"\n","utf-8"));
    }
          
    console.log(msg);
}

function pad(nr){
    return nr<10?"0"+nr:nr;
}