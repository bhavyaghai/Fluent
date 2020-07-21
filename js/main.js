var thresh;

$(document).ready(function() {
   //$('[data-toggle="tooltip"]').tooltip()
  // Load default content
  $.get("/get_default_content",res => {
    console.log(res);
    $("#summernote").summernote("code", res);

    // Make all existing text size large
    //var len = quill.getLength();
    //quill.formatText(0, len, 'size', 'large'); 
  });

  // By deafult, highlight button off
  $('#highlight').bootstrapToggle('off')

  // set value of thresh
  thresh = parseFloat($('#threshold').val());
});


// Input: Text in editor
// Output: Each word with corresponding bias score  
function get_biases() {
  //var html = $('.note-editable')[0].innerHTML;
  //var text = jQuery(html).text();
  var text = $('.note-editable').text();
  console.log(text);
  $.get("/controller", {
    text: text
  },res => {
    console.log(res);
    wrap_span(res);
  });
}

// Event handler for highlight toggle
$('#highlight').change(function() {
  var val = $('#highlight').prop('checked');
  if(val==false) {
    // Make all background color white
    reset_highlight();
  }
  else {
    get_biases();
  }
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
// determines if bias is significant 
// then changes background colors of words accordingly
function wrap_span(res) {
  var s = $('.note-editable')[0].innerHTML;
  for (index = 0; index < res.length; index++) { 
    bias_score = res[index][1];
    word = res[index][0];
    console.log(word,bias_score);
    // Regex to match text out of html tags [1]
    var reg = new RegExp("<a.*?>|<span.*?<\/span>|(\\b"+word+"\\b)","g");
    var span = null;

    if(bias_score>thresh || bias_score<-thresh) 
    {
        span = jQuery("<span></span>")
          .attr({"tabindex":"0",
                "title":"<b>"+word+":</b>"+bias_score, 
                "data-trigger":"hover", 
                "data-placement":"bottom",
                "data-toggle":"popover", 
                "data-content":fetch_content(word)
              });
        span[0].innerText = word;

      if(bias_score>thresh) {
        console.log("IF statement");
        console.log(reg);
        console.log(span[0].outerHTML);
        span.addClass("male");
      }
      else if(bias_score<-thresh) {
        span.addClass("female");
      }
      s = s.replace(reg, function(m, group1) {
        if (group1 != word ) return m;
        else return span[0].outerHTML;
      });
    }
    //console.log(word);
    //console.log(s);
  }
  $('.note-editable')[0].innerHTML = s;
  //$('[data-toggle="popover"]').popover();
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