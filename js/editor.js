$(document).ready(function() {
  console.log("Document loaded !!!");
  $('#summernote').summernote({
    placeholder: "Let's start writing ...",
    tabsize: 4,
    height: 700,
    disableGrammar: false,
    spellCheck: false
  });
});