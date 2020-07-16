var thresh;

$(document).ready(function() {
  // Load default content
  $.get("/get_default_content",res => {
    console.log(res);
    quill.setText(res);

    // Make all existing text size large
    var len = quill.getLength();
    quill.formatText(0, len, 'size', 'large'); 
  });

  // set text size large for all incoming text
  quill.format('size', 'large');

  // By deafult, highlight button off
  $('#highlight').bootstrapToggle('off')

  // set value of thresh
  thresh = parseFloat($('#threshold').val());
});


// Input: Text in editor
// Output: Each word with corresponding bias score  
function get_biases() {
  var text = quill.getText();
  console.log(text);
  $.get("/controller", {
    text: text
  },res => {
    console.log(res);
    evaluate_bias(res);
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
    get_biases(thresh);
  }
});

// Make background color for all text white
function reset_highlight() {
    var len = quill.getLength();
    quill.formatText(0, len, 'background', 'white'); 
}

// Input: given list of words along with their index,length & bias score
// determines if bias is significant 
// then changes background colors of words accordingly
function evaluate_bias(res) {
  for (index = 0; index < res.length; index++) { 
    bias_score = res[index][3];
    if(bias_score>thresh) {
      quill.formatText(res[index][1], res[index][2], {'background': 'lightblue'});
    }
    else if(bias_score<-thresh) {
      quill.formatText(res[index][1], res[index][2], {'background': 'pink'});
    }
  }
}


// function is called when threshold value is changed
function coeff_val_change(newVal){
  thresh = newVal;
  $('#coeff_slider_val').text(newVal);
  var val = $('#highlight').prop('checked');
  if(val==true) {
    reset_highlight();
    get_biases();
  }
}

function getAlternates() {
  selection = quill.getSelection();
  start_ind = selection["index"];
  sel_len = selection["length"];
  var word_selected = quill.getText().substring(start_ind,start_ind+sel_len);
  $.get("/alternates/"+word_selected,res => {
    console.log(res);
    console.log("Populate results")
  });
  alert(word_selected);
}