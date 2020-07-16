$(window).load(function(){
  // By default, load word2vec model
  //url_csv = "/get_csv/";
  //createScatterplot(url_csv);
  
  // Populate list of Group & Target words
  $.get( '/getFileNames/', function(res) {
    var group = res[0];     // List of file names for group
    var target = res[1];   // List of file names for target
    $('#gp1_dropdown').append(populateDropDownList(group));
    $('#gp2_dropdown').append(populateDropDownList(group));
    $('#dropdown_target').append(populateDropDownList(target));


    // Choose default target : Paragraph
    $('#dropdown_target option[value="Paragraph"]').attr("selected",true);
    changeTarget("Paragraph");

    // Choose default groups
    $('#gp1_dropdown option[value="Gender - Female"]').attr("selected",true);
    changeBiastype("gp1_dropdown"); 
    $('#gp2_dropdown option[value="Gender - Male"]').attr("selected",true);
    changeBiastype("gp2_dropdown"); 
  });

  // by default scatterplot should be disabled
  //$('#scatterplot_bias').bootstrapToggle('disable');

  //load default model
  $.get( "/setModel/Glove (wiki 300d)", function( data ) {
    console.log("default model loaded");
  })
  .fail(function() {
    alert( "Unable to load default model !!!" );
  });

  //set value of global parameter
  thresh = parseFloat($('#threshold').val());

  // showBias button disabled
  $('#showBias').prop('disabled', true);

  // debias button disabled
  $('#debias').prop('disabled', true);
});

// Given a list as input, populate drop down menu with each element as an option
function populateDropDownList(data) {
  var option = '';
  for (var i=0;i<data.length;i++){
   option += '<option value="'+ data[i] + '">' + data[i] + '</option>';
  }
  return option;
}

var spinner;

function getPairsofGroups() {

  var load = document.getElementById('scatter');
  spinner = new Spinner(opts).spin(load); // loading icon starts here

  var gp1 = document.getElementById("gp1").value;
  var gp2 = document.getElementById("gp2").value;

  gp1 = gp1.split(",");
  gp2 = gp2.split(",");

  var pairs = [];
  for(i=0;i<gp1.length;i++) {
      pairs.push([gp1[i],gp2[i]]);
  }
  console.log(pairs);
  return pairs
}

// on clicking ShowBias button
$('#showBias').on('click', function(event) {
  var tar = document.getElementById("target").value;
  tar = tar.split(/[ ,]+/).filter(Boolean);
  $.get("/groupDirectBias", {
    target: JSON.stringify(tar)
    //type: bias_identify_type
  },res => {
    console.log("Direct bias success fn called !!!");
    console.log(res);
    populateBiasResults(res);
  });
  highlight(tar);
  // Debias button enabled
  $('#debias').prop('disabled', false);
});

// properties of loading icon

var opts = {
  lines: 13, // The number of lines to draw
  length: 5, // The length of each line
  width: 2, // The line thickness
  radius: 10, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  color: '#0000', // CSS color or array of colors
  fadeColor: 'transparent', // CSS color or array of colors
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  className: 'spinner', // The CSS class to assign to the spinner
  top: '50%', // Top position relative to parent
  left: '50%', // Left position relative to parent
  shadow: '0 0 1px transparent', // Box-shadow for the lines
  position: 'fixed' // Element positioning
};

// on clicking Plot button
$('#submitButton').on('click', function(event) {
    bias_vals = {};
    debias_called=0;
    // clear bias results
    $('#directBias').empty();
    // fetch words from textboxes Group1 & Group2
    var pairs = getPairsofGroups();
    var bias_identify_type = $('#dropdown_identify_bias').val();
    var embedding_type = $('#dropdown_embedding').val();
    //color_mode = 1;
    var group1 = $("#gp1").val().split(",");
    var group2 = $("#gp2").val().split(",");
    
    $.get("/biasDirection", {
      //pairs: JSON.stringify(pairs),
      //type: bias_identify_type,
      gp1: JSON.stringify(group1),
      gp2: JSON.stringify(group2),
      embedding: embedding_type 
    },res => {
      console.log("Success biasDirection fn called !!!");
      console.log(res);

      project_color_scatterplot();  

      // showBias button enabled
      //$('#showBias').prop('disabled', false);
    });  
});


$('#searchBar').on('keyup', (event) => {
  var key = (event.keyCode ? event.keyCode : event.which);
  let dataList = document.getElementById('json-datalist');
  var option ;
  if(event.target.value != ''){
    if(key === 'Enter' || key === 13){
      dataList.innerHTML = '';
    }
    else{
      $.get('/autocomplete/' + event.target.value, res => {

        console.log('We successfully called autocomplete:', res);
        if(dataList.hasChildNodes()){
          dataList.innerHTML = '';
        }
        res.forEach(element => {
          option = document.createElement('option');
          option.value = element;
          dataList.appendChild(option);
          console.log("el: ", element) ;
        });
        var val = document.getElementById('searchBar').value;
        var opts = dataList.childNodes;
        for (var i = 0; i < opts.length; i++) {
          if (opts[i].value === val) {
            dataList.innerHTML = '';
            searchjs(val);
            break;
          }
        }
      });
    }
  }
  else{
    if(dataList.hasChildNodes()){
      dataList.innerHTML = '';
    }
  }
});

function searchbox() {
  var value = document.getElementById("searchBar").value;
  onclick(value);
}

function changeTarget(selVal) {
  path = './data/wordList/target/'+selVal
  
  if(selVal=='Custom') {
    $('#target').val("");
    return;
  }
  $.get("/getWords", {
    path: path
    }, res => {
    console.log(res);
    $('#target').val(res["target"].join());
  });
  // clear bias results
  $('#directBias').empty();
  // Debias button enabled
  $('#debias').prop('disabled', true);
}

function changeBiastype(id) {
  var selectedOption = $('#'+id).val();
  path = './data/wordList/groups/'+selectedOption;
  console.log(path);
  if(selectedOption=='Custom') {
    $('#gp1').val("");
    $('#gp2').val("");
    return;
  }
  $.get("/getWords", {
    path: path
    }, res => {
    //console.log(res);
    if(id=="gp1_dropdown") {
      $('#gp1').val(res["target"].join());
    }
    else if(id=="gp2_dropdown"){
      $('#gp2').val(res["target"].join());
    }
  });
}

// on choosing new word embedding from drop down menu
$('#dropdown_embedding').on('change', function() {
  var selText = this.value; 
  $("#dropdownMenu1").text(selText);
  console.log(selText);
  /*if(selText=="Custom") {
    chooseFile()
  }*/
  $.get("/setModel/"+selText,
  res => {
    console.log("Successfully change model called !!!");
    $('#scatter').empty();
    word_clicked = '';
    is_clicked=0; 
    neigh = [];
    //createScatterplot('/get_csv/');
    $('#directBias').empty();
    $('#directBiasValue').text('');
    // set search bar text as word clicked
    $("#searchBar").val('');
    // empty current search results
    $("#searchRes").empty();
  });

  // disable scatterplot
  //$('#scatterplot_bias').bootstrapToggle('off');
  //$('#scatterplot_bias').bootstrapToggle('disable');
  // by default color mode is disabled
  //color_mode = 0;
  // by default bias values should be none
  bias_vals= {};
});
