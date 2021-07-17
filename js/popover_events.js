// https://www.encodedna.com/jquery/make-jquery-contains-selector-case-insensitive.htm
// CASE INSENSITIVE FUNCTION.
$.expr[":"].contains = $.expr.createPseudo(function (arg) {
  return function (elem) {
    return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
  };
});

// @input: given a word (which might be hard word to say)
// @output: html string which consists of list of alternates
function fetch_content(word, tag) {
  var syn = [];
  // checking if word isn't a named entity
  if (!["PERSON", "MONEY", "GPE"].includes(tag)) {
    syn = fetch_synonyms(word);
  }
  var list_syn = [];
  for (i = 0; i < syn.length; i++) {
    if ("word" in syn[i]) {
      w = syn[i]["word"];
      if (/^[a-zA-Z]+$/.test(w)) {
        list_syn.push(w);
      }
    }
  }
  console.log(word, "    ", list_syn);
  var result = null;
  $.ajax({
    url: "/check_if_word_difficult",
    dataType: "json",
    type: "get",
    async: false,
    data: {
      synonyms: list_syn,
      thresh: $("#threshold").val(),
    },
    success: function (res) {
      console.log(res);
      //var pop = $(".popover-content li")
      var pop = $(".popover-content ul");
      pop.empty();
      var num_alternatives = res.length;
      if (num_alternatives > 5) {
        num_alternatives = 5;
      }
      for (i = 0; i < num_alternatives; i++) {
        //    pop[i].innerText = res[i][0];
        pop.append("<li>" + res[i][0].toLowerCase() + "</li>");
      }
      pop.append("<li id='ignore_item'>Ignore</li>");
      result = $("#popover")[0].outerHTML;
      //result  = "<ul><li>chota pica</li><li>bhalu</li><li>Rai chu</li></ul>"
      console.log("result: ", result);
      //result = '<div class="popover-content" style="display: none"><ul><li>abc</li><li>sdf</li><li>fsd</li><li>df</li><li>dfsdf</li><li id="ignore_item">Ignore</li></ul></div>';
    },
  });
  return result;
}

// we will fetch synonyms from: https://www.datamuse.com/api/
function fetch_synonyms(word) {
  var result = null;
  var scriptUrl = "https://api.datamuse.com/words?ml=" + word;
  $.ajax({
    url: scriptUrl,
    type: "get",
    dataType: "json",
    async: false,
    success: function (data) {
      result = data;
    },
  });
  return result;
}

// Make sure that popover stays visible when we hover over popover
function activate_popover() {
  $('[data-toggle="popover"]')
    .popover({
      trigger: "manual",
      html: true,
      animation: false,
      container: "body",
    })
    .on("mouseenter", function () {
      var _this = this;
      $(this).popover("show");
      bind_list_click_handler(this);
      $(".popover").on("mouseleave", function () {
        $(_this).popover("hide");
        unbind_list_click_handler();
      });
    })
    .on("mouseleave", function () {
      var _this = this;
      setTimeout(function () {
        if (!$(".popover:hover").length) {
          $(_this).popover("hide");
          unbind_list_click_handler();
        }
      }, 300);
    });
}

// add to easy/difficult word list if not already present
function add_to_list(word, list_name) {
  var words_string = $("#" + list_name).val();
  // get rid of all white spaces
  words_string = words_string.replace(/ |\n|\t/g, "");
  var list_words = words_string.split(",");
  var searchIndex = list_words.indexOf(word);
  // word is not present so add it
  if (searchIndex < 0) {
    $("#" + list_name).val(words_string + ", " + word);
    // update classifier and updating
    //$("#update").click();
  }
}

// onClick handler for any alternate word
function bind_list_click_handler(parent_tag) {
  var word = parent_tag.innerText;
  //$(".popover.bottom.in li").bind("click", function(){
  $(".popover li").bind("click", function () {
    var new_word = $(this).text();
    console.log(word, new_word);
    // finding selected span tag
    span_tag = $("span:contains(" + word + ")");
    // color coding after substitution
    span_tag.removeClass("hard_word");
    // replace word
    for (i = 0; i < span_tag.length; i++) {
      // In case "Ignore" option is chosen, replace the tag with the same text
      if (new_word == "Ignore") {
        span_tag[i].replaceWith(word);
        // it means that the word was easy (so add to easy list)
        add_to_list(word, "easy_words");
      } else {
        span_tag[i].replaceWith(new_word);
        // it means the word was really difficult (so add to difficult if not already)
        add_to_list(word, "diff_words");
        // add the alternative to easy list
        add_to_list(new_word, "easy_words");
      }
    }
    // hide popover
    $(".popover").popover("hide");
    $("#update").click();
  });
}

// unbind handler when popover is closed
function unbind_list_click_handler() {
  $(".popover.bottom.in li").unbind("click");
}
