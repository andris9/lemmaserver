var lemma = require("lemma"),
    pathlib = require("path");

lemma.config.morfdir = pathlib.join("C:","APP", "estmorf");
lemma.config.tempdir = "F:";

lemma.findLemmas(["vanamehed", "kolmandalt", "korruselt"], function(error, words){
    console.log(error || words);
});