var Gearman = require("node-gearman");

var gearman = new Gearman("pangalink.net");
var job = gearman.submitJob("lemma", "vanamehed, kolmandalt, korruselt");

job.on("data", function(data){
    console.log(data.toString("utf-8"));
});

job.on("end", function(){
    console.log("Job completed!");
});

job.on("error", function(error){
    console.log(error.message);
});