$(document).ready(function () {
  //$('[data-toggle="tooltip"]').tooltip()
  // Load default content
  $.get("/get_default_content", (res) => {
    res = res.replace(/\n/g, "<br>");
    console.log(res);
    $("#summernote").summernote("code", res);

    // make sure popper is not blurred
    // https://github.com/twbs/bootstrap/issues/22610
    Popper.Defaults.modifiers.computeStyle.gpuAcceleration = !(
      window.devicePixelRatio < 1.5 && /Win/.test(navigator.platform)
    );

    // default highlighting -- clicking update button programmatically
    $("#update").click();
    //update_next_word();

    // update the highlighting after every 5 sec
    /*
    window.setInterval(function(){
      $("#update").click();
    }, 5000); */
  });
});

$("#update").click(function () {
  console.log("update button clicked !!!");
  $.get(
    "/update",
    {
      text: $(".note-editable").text().toLowerCase(),
      easy: $("#easy_words").val(),
      diff: $("#diff_words").val(),
      thresh: $("#threshold").val(),
    },
    (res) => {
      console.log(res);
      wrap_span(res["hard_words"]);
      // update next most uncertain word in the interface
      $("#al_word").text(res["next_word"].toLowerCase());
      // close the modal
      $("#preferences_modal").modal("hide");
    }
  );
});

// Replace all spans with their inner text
function reset_highlight() {
  var span_tags = $("span");
  for (i = 0; i < span_tags.length; i++) {
    innerWord = span_tags[i].innerText;
    span_tags[i].replaceWith(innerWord);
  }
}

// Input: given list of words along with their bias score
// wraps in a div then changes background colors of words accordingly
function wrap_span(res) {
  reset_highlight();
  thresh = parseFloat($("#threshold").val()) / 100;

  var s = $(".note-editable")[0].innerHTML; //.toLowerCase();
  console.log(res, res.length);
  for (index = 0; index < res.length; index++) {
    word = res[index][0].toLowerCase();
    bias_score = res[index][1];
    tag = res[index][2];
    console.log(word, bias_score, tag);
    // Regex to match text out of html tags [1]
    // https://stackoverflow.com/questions/18621568/regex-replace-text-outside-html-tags
    //var reg = new RegExp("<a.*?>|<span.*?<\/span>|(\\b"+word+"\\b)","igm");
    // match everything between < and > or the word precedded and succeded by word break
    var reg = new RegExp("<[^>]*>|(\\b" + word + "\\b)", "igm");
    console.log("reg:  ", reg);
    var span = null;

    if (bias_score >= thresh) {
      span = jQuery("<span></span>").attr({
        tabindex: "0",
        //title: "<b>" + word + ":  </b>" + bias_score * 100 + "%",
        title: "<b>" + word + ":</b>" + bias_score,
        "data-trigger": "hover",
        "data-placement": "bottom",
        "data-toggle": "popover",
        "data-content": fetch_content(word, tag),
      });
      span.addClass("hard_word");

      // replace multiple instances of the word (match, group1)
      s = s.replace(reg, function (mat, group1) {
        // match but no capture in group, so just return whatever it is
        if (typeof group1 === "undefined") {
          return mat;
        } else {
          span[0].innerText = group1;
          return span[0].outerHTML;
        }
      });
    }

    console.log("res length ", res.length);
  }

  $(".note-editable")[0].innerHTML = s;
  activate_popover();
}

// function is called when threshold value is changed
function coeff_val_change(newVal) {
  thresh = newVal;
  $("#coeff_slider_val").text(newVal + "%");
}

// Active learning buttons
$("#yes").click(function () {
  console.log("Yes button clicked!");
  word = $("#al_word").text();
  // yes => word is difficult
  add_to_list(word, "diff_words");
  // retrain classifier and update highlighting
  $("#update").click();
  // update next word
  //update_next_word()
});

$("#no").click(function () {
  console.log("No button clicked!");
  word = $("#al_word").text();
  // no => it means word is easy
  add_to_list(word, "easy_words");
  // retrain classifier and update highlighting
  $("#update").click();
  // update next word
  //update_next_word()
});

// fetech next most uncertain word and set in the interface
/*
function update_next_word() {
  $.get("/next_uncertain_word", {
      easy: $("#easy_words").val(),
      diff: $("#diff_words").val()
    }, res => {
      console.log("Next word:  ", res);
      $("#al_word").text(res.toLowerCase());
    });
}
*/
