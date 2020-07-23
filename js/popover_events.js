// @input: given a word (which might be hard word to say)
// @output: html string which consists of list of alternates 
function fetch_content(word) {
    //return "<b>New</b> function <i>called</i>"
    var result = null;
    var scriptUrl = "http://localhost:5999/alternates/"+word;
    $.ajax({
       url: scriptUrl,
       dataType: "json",
       type: 'get',
       async: false,
       data: {
        thresh: thresh,
       },
       success: function(res) {
            console.log(res);
            var pop = $(".popover-content li")
            for(i=0; i<pop.length-1; i++) {
                // If number of list items are more than alternate word list, then substitute ''
                if(i>=res.length) {
                    pop[i].innerText = "";    
                }
                else {
                pop[i].innerText = res[i][0];
                }
            }
            result = $(".popover-content").html().trim()
       } 
    });
    return result;
}

// Make sure that popover stays visible when we hover over popover
function activate_popover() {
    $('[data-toggle="popover"]').popover({
        trigger: 'manual',
        html: true,
        animation: false,
        container: 'body'
    })
    .on('mouseenter', function () {
        var _this = this;
        $(this).popover('show');
        bind_list_click_handler(this);
        $('.popover').on('mouseleave', function () {
            $(_this).popover('hide');
            unbind_list_click_handler()
        });
    }).on('mouseleave', function () {
        var _this = this;
        setTimeout(function () {
            if (!$('.popover:hover').length) {
                $(_this).popover('hide');
                unbind_list_click_handler()
            }
        }, 300);
    });
}


// onClick handler for any alternate word
function bind_list_click_handler(parent_tag) {  
    var word = parent_tag.innerText;
    $(".popover.bottom.in li").bind("click", function(){
        var new_word = $(this).text();
        console.log(word, new_word);
        // finding selected span tag
        span_tag = $("span:contains("+word+")")
        // color coding after substitution
        span_tag.removeClass("male female");
        // replace word
        for(i=0;i<span_tag.length;i++) {
            // In case "Ignore" option is chosen, replace the tag with the same text
            if(new_word=="Ignore") {
                span_tag[i].replaceWith(word);
            }
            else {
                span_tag[i].replaceWith(new_word);
            }
        }
        // hide popover
        $(".popover").popover('hide');
    });
}


// unbind handler when popover is closed
function unbind_list_click_handler() {
    $(".popover.bottom.in li").unbind( "click" );
}