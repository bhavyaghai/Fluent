$(document).ready(function() {
   //$('[data-toggle="tooltip"]').tooltip()
  // Load default content
  $.get("/get_default_content",res => {
    console.log(res);
    $("#summernote").summernote("code", res);
  });
});


$("#update").click(function() {
    console.log("update button clicked !!!");
    $.get("/update", {
      text: $('.note-editable').text(),
      easy: $("#easy_words").val(),
      diff: $("#diff_words").val(),
      thresh: $('#threshold').val()
    },res => {
      console.log(res);
      wrap_span(res);

      // close the modal
      $('#preferences_modal').modal('hide');
    });  
});


// Replace all spans with their inner text
function reset_highlight() {
    var span_tags = $("span");
    for(i=0;i<span_tags.length;i++) {
          innerWord = span_tags[i].innerText;
          span_tags[i].replaceWith(innerWord);
    }
}


// Input: given list of words along with their bias score
// then changes background colors of words accordingly
function wrap_span(res) {
  reset_highlight();
  thresh = parseFloat($('#threshold').val())/100;

  var s = $('.note-editable')[0].innerHTML.toLowerCase();
  console.log(res, res.length);
  for (index = 0; index < res.length; index++) { 
    word = res[index][0].toLowerCase();
    bias_score = res[index][1];
    console.log(word,bias_score);
    // Regex to match text out of html tags [1]
    var reg = new RegExp("<a.*?>|<span.*?<\/span>|(\\b"+word+"\\b)","ig");
    var span = null;

    if(bias_score>=thresh) 
    {
        span = jQuery("<span></span>")
          .attr({"tabindex":"0",
                "title":"<b>"+word+":</b>"+bias_score, 
                "data-trigger":"hover", 
                "data-placement":"bottom",
                "data-toggle":"popover", 
                "data-content": "alternatives" //fetch_content(word)
              });
        span[0].innerText = word;
        span.addClass("male");
      
      // replace multiple instances of the word
      s = s.replace(reg, function(m, group1) {
        if (group1 != word ) return m;
        else return span[0].outerHTML;
      });
    }

    console.log("res length ", res.length);
  }

  $('.note-editable')[0].innerHTML = s;
  activate_popover();
}


// function is called when threshold value is changed
function coeff_val_change(newVal){
  thresh = newVal;
  $('#coeff_slider_val').text(newVal+'%');
  /*
  var val = $('#highlight').prop('checked');
  if(val==true) {
    reset_highlight();
    get_biases();
  } */
}

/*
References
[1]  https://stackoverflow.com/questions/18621568/regex-replace-text-outside-html-tags
*/