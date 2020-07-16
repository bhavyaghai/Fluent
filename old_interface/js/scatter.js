var margin = {
        top: 20,
        right: 70,
        bottom: 50,
        left: 70
    },
    outerWidth = $("#scatter").width(),
    outerHeight = $(document).height()-$("#navbar").height()-$("#scatter_options").height()-100,   // $("#scatter").height()
    width = outerWidth - margin.left - margin.right,
    height = outerHeight - margin.top - margin.bottom;

var aspect = width/height;
var xscale = d3.scale.linear()
    .range([0, width]).nice();

var yscale = d3.scale.linear()
    .range([height, 0]).nice();

var xAxis = d3.svg.axis()
    .scale(xscale)
    .orient("bottom")
    .tickSize(-height);

var yAxis = d3.svg.axis()
    .scale(yscale)
    .orient("left")
    .tickSize(-width);

var tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-10, 0])
    .html(function(d) {
        return "<strong><span style='color:white'>" + d["word"] + "</span></strong><br><span style='color:white'>" + d["x"] + "</span>";
    });


var zoomBeh, xmin, xmax, ymin, ymax, objects, svg, data_ori;
var word_clicked = '', is_clicked=0, neigh = [];
var xMin, xMax, yMin, yMax;   // min & max values of data 

function createScatterplot(url_csv) {
    // spinner.stop();
    var load = document.getElementById('scatter');

    d3.json(url_csv, function(data) {
        data.forEach(function(d) {
            d["x"] = +d.x;
            d["y"] = +d.y;
            d["word"] = d["word"];
        });
        
        data_ori = data;
        spinner.stop(); // loading icon stops once data is loaded

        xMax = d3.max(data, function(d) {
                return d["x"];
            }),
            xMin = d3.min(data, function(d) {
                return d["x"];
            }),
            //xMin = xMin > 0 ? 0 : xMin,
            yMax = d3.max(data, function(d) {
                return d["y"];
            }),
            yMin = d3.min(data, function(d) {
                return d["y"];
            });
            //yMin = yMin > 0 ? 0 : yMin;
        xscale.domain([xMin, xMax]);
        yscale.domain([yMin, yMax]);

        zoomBeh = d3.behavior.zoom()
            .x(xscale)
            .y(yscale)
            .scaleExtent([0, 100])
            .on("zoom", zoom);
    
        svg = d3.select("#scatter")
            .append("svg")
            .attr("width", outerWidth)
            .attr("height", outerHeight)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(zoomBeh);
        svg.call(tip);

        xmin = xscale.domain()[0], xmax = xscale.domain()[1];
        //ymin = yscale.domain()[0], ymax = yscale.domain()[1];
        ymin = yMin > 0 ? 0 : yMin;
        
        var mouseMove = false;
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "white")
            .attr("cursor","crosshair")
            .on("mousedown", function(d) {
                mouseMove = false;
            })
            .on("mousemove", function(d) {
                mouseMove = true;
            })
            .on("mouseup", function(d) {
                if(mouseMove == false){
                    console.log("click");
                    unclick();
                    //color_scatterplot();
                }
            });
        
        svg.append("g")
            .classed("x axis", true)
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .append("text")
            .classed("label", true)
            .attr("x", width)
            .attr("y", margin.bottom - 10)
            .style("text-anchor", "end")
            .text("x axis");
        svg.append("g")
            .classed("y axis", true)
            .call(yAxis)
            .append("text")
            .classed("label", true)
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left)
            .attr("dy", "1.5em")
            .style("text-anchor", "end")
            .text("y axis");
    
        // x-axis LINE
        svg.append("line")
            .attr("id", "xaxis")
            .attr({
                "class":"arrow",
                "marker-end":"url(#triangle)",
                "x1": xscale(xMin),
                "y1": yscale(0),
                "x2": xscale(xMax),
                "y2": yscale(0),
                "stroke": "gray",
                "stroke-width": "3"
                //"stroke-dasharray":"10,10"
            })
            //.style("display","none");

        // y-axis LINE
        svg.append("line")
            .attr("id", "yaxis")
            .attr({
                "class":"arrow",
                "marker-end":"url(#triangle)",
                "x1": xscale(0),
                "y1": yscale(ymin),
                "x2": xscale(0),
                "y2": yscale(yMax),
                "stroke": "gray",
                "stroke-width": "3"
                //"stroke-dasharray":"10,10"
            })
            //.style("display","none");

        // Threshold left axis
        svg.append("line")
            .attr("id", "left_thresh")
            .attr({
                "class":"arrow",
                "marker-end":"url(#triangle)",
                "x1": xscale(-thresh),
                "y1": yscale(ymin),
                "x2": xscale(-thresh),
                "y2": yscale(yMax),
                "stroke": "gray",
                "stroke-width": "3",
                "stroke-dasharray":"10,10"
            })
            //.style("display","none");

        // Threshold right axis
        svg.append("line")
            .attr("id", "right_thresh")
            .attr({
                "class":"arrow",
                "marker-end":"url(#triangle)",
                "x1": xscale(thresh),
                "y1": yscale(ymin),
                "x2": xscale(thresh),
                "y2": yscale(yMax),
                "stroke": "gray",
                "stroke-width": "3",
                "stroke-dasharray":"10,10"
            })
            //.style("display","none");

        // Right Limit
        svg.append("line")
            .attr("id", "right_limit")
            .attr({
                "class":"arrow",
                "marker-end":"url(#triangle)",
                "x1": xscale(1),
                "y1": yscale(ymin),
                "x2": xscale(1),
                "y2": yscale(yMax),
                "stroke": "orangered",
                "stroke-width": "3",
                "stroke-dasharray":"10,10"
            })
        
        // Left Limit
        svg.append("line")
            .attr("id", "left_limit")
            .attr({
                "class":"arrow",
                "marker-end":"url(#triangle)",
                "x1": xscale(-1),
                "y1": yscale(ymin),
                "x2": xscale(-1),
                "y2": yscale(yMax),
                "stroke": "green",
                "stroke-width": "3",
                "stroke-dasharray":"10,10"
            })

        objects = svg.append("svg")
            .classed("objects", true)
            .attr("width", width)
            .attr("height", height);
            
        objects.append("svg:line")
            .classed("axisLine hAxisLine", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", width)
            .attr("y2", 0)
            .attr("transform", "translate(0," + height + ")");
        objects.append("svg:line")
            .classed("axisLine vAxisLine", true)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", height);
    
        objects.selectAll(".txt")
            .data(data)
            .enter().append("text")
            .classed("txt", true)
            .text(function(d) {return d["word"];})
            .attr("x", function(d) {return xscale(parseFloat(d["x"])+0.003);})
            .attr("y", function(d) {return yscale(d["y"]);})
            //.style("display","none");

        objects.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .classed("dot", true)
            .attr({
                r: function(d) {
                    return 4;
                },
                cx: function(d) {
                    return xscale(d["x"]);
                },
                cy: function(d) {
                    return yscale(d["y"]);
                }
            })
            .attr("cursor","crosshair")
            .on("mouseover", function(d) {
                // show x,y co-ordinates and word in scatterplot options
                $("#x").text(round(d["x"]))
                $("#y").text(round(d["y"]))
                $("#word").text(d["word"]);
                tip.show(d);
              })                  
            .on("mouseout", function(d) {
                $("#x").text('');
                $("#y").text('');
                $("#word").text('');
                tip.hide(d);
            })
            .on("click", function(d) {
                if(is_clicked==1) {
                    unclick();
                }
                
                //d3.select(this).attr("r", 7).style("fill", "red").style("fill-opacity", 1).each   (function(d){ tip.show(d)});
                word_clicked=d["word"];
                is_clicked=1;
                d3.event.stopPropagation();
                // set search bar text as word clicked
                $("#searchBar").val(d["word"]);
                // empty current search results
                $("#searchRes").empty();
                // load and populate similar words
    
                searchjs(function(res){
                    // here you use the output
                    neigh = res;
                    //console.log(neigh);
                });
            });
    
        
        function transform(d) {
            return "translate(" + xscale(d["x"]) + "," + yscale(d["y"]) + ")";
        }
    
        changeZoom();

        // To make svg responsive to different screen sizes
        d3.select(window)
            .on("resize", function() {
                var chart = d3.select('#scatter');
                var targetWidth = chart.node().getBoundingClientRect().width;
                console.log(targetWidth);
                d3.select('#scatter svg').attr("width", targetWidth);
                d3.select('#scatter svg').attr("height", targetWidth / aspect);
            });
        
        // To color scatterplot
        //color_scatterplot();
    });
}

function onclick(word) {
    if(is_clicked==1) {
        unclick();
    }
    /*
    d3.selectAll(".dot")
            .filter(function(d) { return d["word"] == word })
            .attr("r", 10).style("fill", "red").style("fill-opacity", 1); //.each   (function(d){ tip.show(d)});
    */
    word_clicked=word;
    is_clicked=1;
    //d3.event.stopPropagation();
    // set search bar text as word clicked
    $("#searchBar").val(word);
    // empty current search results
    $("#searchRes").empty();
    // load and populate similar words

    searchjs(function(res){
        // here you use the output
        neigh = res;
        //console.log(neigh);
    });
    /*
    d3.selectAll(".dot")
    .filter(function(d) { return neigh.indexOf(d["word"])>-1 })
    .attr("r", 7)
    .style("fill", "orange")
    .style("fill-opacity", 1.0);
    //.each(function(d){ tip.show(d)}); 
    */
}

function uncolor() {
    console.log("uncolor called");
    console.log(word_clicked);
    
    d3.selectAll(".dot")
                //.filter(function(d) { return d["word"] == word_clicked })
                .attr("r", 4)
                .style("fill", "steelblue").style("fill-opacity", 0.5); 
    /*
    if(neigh.length>0) {
        d3.selectAll(".dot")
        .filter(function(d) { return neigh.indexOf(d["word"])>-1 })
        .attr("r", 4)
        .style("fill", "steelblue").style("fill-opacity", 0.5); 
    } */
}

function unclick() {
    removePoints()
    console.log("Unclicked !!!")
    uncolor();
    word_clicked='';
    is_clicked=0;
    // set search bar text as word clicked
    $("#searchBar").val('');
    // empty current search results
    $("#searchRes").empty();
    neigh = [];
    d3.selectAll(".txt").style("display","initial");
}


// round to 2 decimal places
function round(x) {
    return Math.round(x * 100) / 100
}

function highlight(words, target='') {
    console.log(words);
    console.log(target);
    d3.selectAll(".dot")
        .attr("r", function(d) {
            if(target!='' && d["word"]==target){
                return 8;
            }
            else if($.inArray(d["word"], words)!=-1) {
                return 6;
            }
            else {
                return 4;
            }
        })
        .style("fill", function(d) {
            if(target!='' && d["word"]==target){
                return "red";
            }
            else if($.inArray(d["word"], words)!=-1){
                if(d["x"]<-thresh) {
                    return "steelblue";
                }
                else if(d["x"]>thresh) {
                    return "steelblue";
                }
                else {
                    return "steelblue";
                }
            }
            else {
                return "steelblue"; 
            }
        })
        .style("fill-opacity", function(d) {
            if($.inArray(d["word"], words)!=-1 || (target!='' && d["word"]==target)) {
                return 1;
            }
            else {
                return 0.1; 
            }
        });
    
    d3.selectAll(".txt")
        .style("display",function(d) {
            if($.inArray(d["word"], words)!=-1 || (target!='' && d["word"]==target)) {
                return "inline";
            }
            else {
                return "none"; 
            }
        });
}

// set default zoom
function changeZoom() {
    zoomBeh.x(xscale.domain([xMin*1.05, xMax*1.05])).y(yscale.domain([yMin, yMax*1.02]));
    zoom();
}

function zoom() {
    var xmin = xscale.domain()[0], xmax = xscale.domain()[1];
    svg.select(".x.axis").call(xAxis);
    svg.select(".y.axis").call(yAxis);
    //console.log(zoomBeh.translate()+"   "+ zoomBeh.scale());
    svg.selectAll(".dot")
        .attr({
            cx: function(d) {
                return xscale(d["x"]);
            },
            cy: function(d) {
                return yscale(d["y"]);
            }
        });

    svg.selectAll(".txt")
        .attr({
            x: function(d) {
                return xscale(parseFloat(d["x"])+(xmax-xmin)/220.0);
            },
            y: function(d) {
                return yscale(d["y"]);
            }
        });
    
    // x-axis LINE
    d3.select("#xaxis")
    .attr({
        "x1": xscale(xmin),
        "y1": yscale(0),
        "x2": xscale(xmax),
        "y2": yscale(0),
    });

    // y-axis LINE
    d3.select("#yaxis")
    .attr({
        "x1": xscale(0),
        "y1": yscale(ymin),
        "x2": xscale(0),
        "y2": yscale(yMax),
    });

    // Threshold left LINE
    d3.select("#left_thresh")
    .attr({
        "x1": xscale(-thresh),
        "y1": yscale(ymin),
        "x2": xscale(-thresh),
        "y2": yscale(yMax),
    });

    // Threshold right LINE
    d3.select("#right_thresh")
    .attr({
        "x1": xscale(thresh),
        "y1": yscale(ymin),
        "x2": xscale(thresh),
        "y2": yscale(yMax),
    });

    // Left Limit
    d3.select("#left_limit")
    .attr({
        "x1": xscale(-1),
        "y1": yscale(ymin),
        "x2": xscale(-1),
        "y2": yscale(yMax),
    });

    // Right Limit
    d3.select("#right_limit")
    .attr({
        "x1": xscale(1),
        "y1": yscale(ymin),
        "x2": xscale(1),
        "y2": yscale(yMax),
    });

}
