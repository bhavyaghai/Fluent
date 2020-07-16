var color_mode = 0;
var bias_vals = {}, bias_val_list = [], min_thresh=0,max_thresh=0;
var thresh;
var temp;  

function populateSearchResults(data){
    $("#searchRes").empty();
    var obj = d3.select("#searchRes")
                .selectAll("div")
                .data(data).enter()
                .append('div')
                .html(function (d) { 
                    //console.log(d);
                    return  "<div><span style='text-align:left;'>"+d[0]+"</span><span style='float:right;'>"+d[1]+"</span></div>";
                })
                .append("div")
                .attr("class", "bar")
                .style('width',function(d){
                    return d[1]*(document.getElementById("search").offsetWidth);
                })
                .attr('fill', 'red') ;
     
    var restag = document.getElementById("searchRes");
    for (var i = 0; i < data.length; i++) {
        console.log(data[i][0]+"   "+data[i][1]);
    }
 }

/*
// color neutral points gray
function color_scatterplot() {
    console.log("cOLOR NEUTRAL fUNCTION");
    // get bias values for each word
    var data = bias_val_list;
    d3.selectAll(".dot")
            .style("fill", function(d,i) {
                if(data[i][1]<-thresh) {
                    return "green";
                }
                else if(data[i][1]>thresh) {
                    return "orangered";
                }
                else {
                    return "gray";
                }
            })
            .style("fill-opacity", function(d,i) {
                if(data[i][1]<-thresh) {
                    return 0.1+data[i][1]/min_thresh;
                }
                else if(data[i][1]>thresh) {
                    return 0.1+data[i][1]/max_thresh;
                }
                else {
                    return 0.5;
                }
            })
            .attr("r", function(d,i) {
                return 4;
            });
    d3.selectAll(".txt").style("display","none");
    $('#scatter_represent').bootstrapToggle('on');
}  
*/


function project_color_scatterplot() {
    var thresh = parseFloat($('#threshold').val());
    var bias_identify_type = $('#dropdown_identify_bias').val();
    var target = document.getElementById("target").value
    // loading icon works only with empty function commented
    
    $('#scatter').empty();
    //if(val==true) {
      $.get("/projectingAxis", {
        thresh: thresh,
        type: bias_identify_type,
        target: target
        }, res => {
        bias_vals = {};
        for(i=0;i<res.length;i++) {
            bias_vals[res[i][0]] = res[i][1];
            if(res[i][1]>max_thresh) {
                max_thresh = res[i][1];
            }
            if(res[i][1]<min_thresh) {
                min_thresh = res[i][1];
                }
            }
        bias_val_list = res;
        //console.log(res);
        createScatterplot('/get_proj_csv/');
        //d3.select("#xaxis").style("display","initial");
        //d3.select("#yaxis").style("display","initial");
      });
    //}
    //else{
    //    createScatterplot('/get_csv/');
    //}
}

// Toggle between dots and text
$('#scatter_represent').change(function() {
    var val = $(this).prop('checked');
    if(val==true) {    // means DOTs
        console.log('DOTs');
        d3.selectAll(".txt").style("display","none");

    }
    else{            // means TEXT
        console.log('Text');
        d3.selectAll(".txt").style("display","inline");
    }
});


function populateBiasResults(dict){
    // convert dictionary to list
    var data = [];
    for (var key in dict) {
        if (dict.hasOwnProperty(key)) {
            data.push( [ key, dict[key] ] );
        }
    }
     if(data.length==0) {
         return
     }
    $("#directBias").empty();
    var thresh = parseFloat($('#threshold').val());
    var obj = d3.select("#directBias")
                .selectAll("div")
                .data(data).enter()
                .append('div')
                .attr("class","biasResDiv")
                .html(function (d) { 
                    if(d[1]>thresh){
                        return  "<div><span style='background-color:green;text-align:left;color:white;'>"+d[0]+"</span><span style='float:right;'>"+d[1]+"</span></div>";
                    }
                    else if(d[1]<-thresh){
                        return  "<div><span style='background-color:orangered;text-align:left;color:white;'>"+d[0]+"</span><span style='float:right;'>"+d[1]+"</span></div>";
                    }
                    else{       // In case of NA
                        return  "<div><span style='text-align:left;'>"+d[0]+"</span><span style='float:right;'>"+d[1]+"</span></div>";
                    }
                });

    // on clicking bias results div toggle colors
    $(".biasResDiv").click(function () {
        //console.log("Bias result div clicked");
        $(this).toggleClass("selected");
    }); 

      
    var directBias = 0.00, cnt=0;
    for (var i = 0; i < data.length; i++) {
        //console.log(data[i][0]+"   "+data[i][1]);
        if(data[i][1]!="NA") {
            directBias = directBias + Math.abs(data[i][1]);
            cnt = cnt + 1;
        }
    }
    console.log(cnt,data.length);
    directBias = directBias/cnt;
    // rounding to 3 decimal places
    directBias = Math.round(directBias * 10000) / 10000
    $('#directBiasValue').text(directBias);
 }

/*
function drawLine(x,y) {
    console.log("Drawline function called !!!");
    console.log(x,y);
    slope = y/x;
    var xmin = xscale.domain()[0], xmax = xscale.domain()[1];
    console.log(x,y);
    d3.select('#scatter svg')
        .append("g")
        .attr("id","biasLine")
        .append("line")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr({
            "class":"arrow",
            "marker-end":"url(#triangle)",
            "x1": xscale(xmin),
            "y1": yscale(slope*xmin),
            "x2": xscale(xmax),
            "y2": yscale(slope*xmax),
            "stroke": "gray",
            "stroke-width": "3"
            //"stroke-dasharray":"10,10"
        });
}
*/

function addPoints(data) {
    var new_data = data_ori.concat(data);

    var circles = objects.selectAll(".dot").data(new_data);
    
        circles.enter().append("circle")
            .classed("dot", true)
            .attr({
                "r": function(d) {
                return 4;
            },
            cx: function(d) {
                return xscale(d["x"]);
            },
            cy: function(d) {
                return yscale(d["y"]);
            }
        });

    circles
        .enter().append("text")
        .classed("txt", true)
        .text(function(d) {return d["word"];})
        .attr("x", function(d) {return xscale(parseFloat(d["x"])+0.003);})
        .attr("y", function(d) {return yscale(d["y"]);});
}

function removePoints() {

    var circles = objects.selectAll(".dot").data(data_ori);
    circles.exit().remove();

    var text = objects.selectAll(".txt").data(data_ori);
    text.exit().remove();
}

function searchjs(callback) {
    var value = document.getElementById("searchBar").value;
    console.log("searched for " + value);
    $.ajax({
      url : "/search/"+value,
      type : "get",
      async: false,
      success : function(res) {
        addPoints(res);
        //populateSearchResults(res);  
        neigh = []
        for(i=0;i<res.length;i++) {
            neigh.push(res[i]["word"]);
        }    
        console.log(neigh);
        highlight(neigh,value);
        callback(neigh); 
      },
      error: function() {
         console.log("Error in searchjs function !!!");
      }
   });
}

function coeff_val_change(newVal){
  thresh = newVal;
  $('#coeff_slider_val').text(newVal);

  // update bias results div only if "Show bias" button was pressed
  if($('#directBias:empty').length==0) {
    var tar = document.getElementById("target").value;
    tar = tar.split(",");  
    var bias_identify_type = $('#dropdown_identify_bias').val();
  
    $.get("/groupDirectBias", {
      target: JSON.stringify(tar),
      type: bias_identify_type
    },res => {
      console.log("Direct bias success fn called !!!");
      populateBiasResults(res);
    });
  }

  change_scatter_thresh(newVal);
  /*
  if(color_mode==1) {
    trigger_color_scatterplot();
  } */
}

function change_scatter_thresh(thresh) {
    
    var xmin = xscale.domain()[0], xmax = xscale.domain()[1];
    var ymin = yscale.domain()[0], ymax = yscale.domain()[1];

    // Threshold left LINE
    d3.select("#left_thresh")
    .attr({
        "x1": xscale(-thresh),
        "y1": yscale(ymin),
        "x2": xscale(-thresh),
        "y2": yscale(ymax),
    });

    // Threshold right LINE
    d3.select("#right_thresh")
    .attr({
        "x1": xscale(thresh),
        "y1": yscale(ymin),
        "x2": xscale(thresh),
        "y2": yscale(ymax),
    });

    color_scatterplot();
}

  
// on clicking Debias button
$('#debias').on('click', function(event) {
    var selectedWords = [], txt;
    $(".biasResDiv").each(function(){
        var className = $(this).attr('class');
        if(className.indexOf("selected") >= 0) {
            txt = $(this).find("span:first").text();
            selectedWords.push(txt);
        }console.log(res);
    }); 

    $.get("/groupDebias/", {
        words: JSON.stringify(selectedWords),
      },res => {
        console.log("Debias worked fine !!!");
        console.log(res);
        
        // updating data to map debiased
        d3.json('/get_proj_csv/', function(data) {
            data.forEach(function(d) {
                d["x"] = +d.x;
                d["y"] = +d.y;
                d["word"] = d["word"];
            });
            objects.selectAll(".dot")
                .data(data);
            objects.selectAll(".txt")
                .data(data);
        });
        movePoints(res);

        // update bias div results
        var tar = document.getElementById("target").value;
        tar = tar.split(",");
        $.get("/groupDirectBias", {
            target: JSON.stringify(tar)
        },res => {
            console.log("Direct bias success fn called !!!");
            console.log(res);
            populateBiasResults(res);
        });
    });
});

// debiasing move points
function movePoints(res) {
    d3.selectAll(".dot")
        .filter(function(d) { return d["word"] in res })
        .transition().duration(5000)
        .attr("cx", function(d,i) {
            return xscale(res[d["word"]][0]);
        })
        .attr("cy", function(d,i) {
            return yscale(res[d["word"]][1]);
        });
    
    d3.selectAll(".txt")
        .filter(function(d) { return d["word"] in res })
        .transition().duration(5000)
        .attr({
            x: function(d) {
                return xscale(res[d["word"]][0])+(xmax-xmin)/220.0;
            },
            y: function(d) {
                return yscale(res[d["word"]][1]);
            }
        });
}