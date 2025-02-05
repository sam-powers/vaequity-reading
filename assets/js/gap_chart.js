const education = d3.csv("assets/data/educ_equity.csv");
var ed_data;
var ed_data_filtered;



education.then(function (d) {
        ed_data = d3.nest().key((d) => d.division_use).key((d) => d.cohort).key((d) => d.race).entries(d);
    })
    .then(function () {
        draw_viz(ed_data)
    })

function draw_viz(data) {

    var input_list = ["albemarle_county", "charlottesville_city", "fluvanna_county", "nelson_county", "orange_county", "greene_county"]

    for (i in data) {
        if (input_list.includes(data[i].key)) {
            data[i].name_filter = "keep";
        } else {
            data[i].name_filter = "remove";
        }
    };


    ed_data_filtered = data.filter(d => d.name_filter == "keep");

    var key = function (d) {
        return d.key;
    }

    var margin = {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50
        },
        width = 1000 - margin.left - margin.right,
        height = 1000 - margin.top - margin.bottom,
        usewidth = width + margin.left + margin.right,
        useheight = height + margin.top + margin.bottom;


    var viz_box = d3.select("#graph-container");

    var division_cols = viz_box.selectAll(".column")
        .data(ed_data_filtered, key)
        .enter()
        .append("div")
        .classed("column", true)
        //        .classed("col-sm-2", true)
        .attr("id", (d) => "column_" + d.key);

    division_cols.append("div").attr("class", "titledivs").append("h3").text((d) => d.values[[0]].values[[0]].values[[0]].division_name);

    var cohort_boxes = division_cols.selectAll(".cohort_box")
        .data(d => d.values)
        .enter()
        .append("div")
        .classed("cohort_box", true)
        .attr("id", (d) => "cohort" + d.key);

    var cohort_svg = cohort_boxes
        .append("svg")
        .attr("viewBox", "0 0 " + usewidth + " " + useheight)
        .attr("class", "svg-content")
        .attr("id", (d) => d.key)
        .attr("aria-labelledby", "title");


    // Create Color Scales
    number_scale = [];
    var N = 13

    for (var i = 0; i <= N; i++) {
        number_scale.push(i);
    }
    // Make the Red color Scale out of rectangles

    var negative_color = d3.scaleLinear().domain([0, N]).range(["rgb(194, 50, 10)", "rgb(253, 224, 216)"])
    var color_scale = d3.scaleLinear().domain([0, N]).range([height, 0])


    var graph_containers = cohort_svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")



    var gradient_containers = graph_containers.append("g")
        .classed("gradient_containers", true)
        .attr("id", function (d) {
            return "gradient_group" + d.key + d.values[[0]].values[[0]].division_use
        })
        .attr("clip-path", function (d) {
            return "url(#area" + d.key + d.values[[0]].values[[0]].division_use + ")"
        })
    //         .attr("clip-path", function (d) {
    //            return "url(#areaBlack" + d.key + d.values[[0]].values[[0]].division_use + ")"
    //        });

    var negative = gradient_containers.append("g")
        .attr("id", function (d) {
            return "gradientBlack" + d.key
        })
        .selectAll(".negative_rects")
        .data(number_scale)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d) => color_scale(d))
        .attr("width", width)
        .attr("height", height / N)
        .style("fill", (d) => negative_color(d))
        .classed("negative_rects backrect", true);


    var positive_color = d3.scaleLinear().domain([N, 2]).range(["#106DD1", "rgb(220,243,255)"])

    var positive = gradient_containers
        .append("g")
        .attr("id", function (d) {
            return "gradientWhite" + d.key
        })
        .attr("clip-path", function (d) {
            return "url(#pathAll" + d.key + d.values[[0]].values[[0]].division_use + ")"
        }) // Divide the positive from the negative gradient along the average line. 
        .selectAll(".positive_rects")
        .data(number_scale).enter().append("rect")
        .attr("x", 0)
        .attr("y", (d) => color_scale(d))
        .attr("width", width)
        .attr("height", height / N)
        .style("fill", (d) => positive_color(d))
        .classed("positive_rects backrect", true);

    var xScale = d3.scaleLinear().domain([2.5, 8.5]).range([0, width]);
    var yScale = d3.scaleLinear().domain([35, 100]).range([height, 0])

    // Create the path clippings to divide the positive from the negative gradient
    var gradient_area = d3.area()
        .defined(d => !isNaN(d.pass_rate))
        .x(function (d) {
            return xScale(+d.grade);
        })
        .y0(function (d) {
            return yScale(100);
        })
        .y1(function (d) {
            return yScale(+d.pass_rate);
        }).curve(d3.curveMonotoneX);



    gradient_containers
        .selectAll(".clip_sep")
        .data((d) => d.values.filter(function (el) {
            return el.key === "All"
        }))
        .enter()
        .append("clipPath")
        .attr("id", function (d) {
            return "path" + d.key + d.values[[0]].cohort + d.values[[0]].division_use
        })
        .append("path")
        //       .attr("class", function(d){ return "areas " + d.key})
        .attr("d", (d) => gradient_area(d.values))
        .attr("class", "seperators");


    // create the path clippings to define the race difference areas. 
    var gap_area = d3.area()
        .defined(d => !isNaN(d.pass_rate))

        .x(function (d) {
            return xScale(+d.grade);
        })
        .y0(function (d) {
            return yScale(+d.pass_rate);
        })
        .y1(function (d) {
            return yScale(+d.average);
        }).curve(d3.curveMonotoneX);



    // setting both to go from where they are at to the average line
    var masks =
        gradient_containers
        .append("clipPath")
        .attr("id", function (d) {
            return "area" + d.values[[0]].values[[0]].cohort + d.values[[0]].values[[0]].division_use
        })

    // Draw two paths within each clipping path boundary
    masks.selectAll("path")
        .data(
            (d) => d.values.filter(function (el) {
                return el.key !== "All"
            }))
        .enter()
        .append("path")
        .attr("d", (d) => gap_area(d.values))
        .attr("class", "gap_area")




    var race_color = d3.scaleOrdinal().domain(["White", "All", "Black"]).range(["#00008b", "black", "rgb(194, 50, 10)"])

    // Add in lines 

    // Create the line generation function
    var lines = d3.line()
        .defined(d => !isNaN(d.pass_rate))
        .x(function (d) {
            return xScale(+d.grade);
        })
        .y(function (d) {
            return yScale(+d.pass_rate);
        })
        .curve(d3.curveMonotoneX);

    graph_containers
        .selectAll(".linecontainer")
        .data((d) => d.values)
        .enter()
        .append("g")
        .attr("class", function (d) {
            return "linecontainer linescontainer" + d.key
        })
        .append("path")
        .attr("d", (d) => lines(d.values))
        .attr("class", function (d) {
            return "lines line" + d.key
        })
        .attr("stroke", function (d) {
            return race_color(d.key)
        });


    // Add in dots

    var dotcontainers = graph_containers
        .selectAll(".dotcontainer")
        .data((d) => d.values)
        .enter()
        .append("g")
        .attr("class", function (d) {
            return "dotcontainer dots" + d.key
        });

    var doty = function (d) {
        return yScale(+d.pass_rate);
    }

    dotcontainers.selectAll(".dots")
        .data((d) => d.values.filter(q => !isNaN(q.pass_rate)))
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            return xScale(+d.grade);
        })
        .attr("cy", doty)
        .attr("r", 12)
        .style("fill", function (d) {
            return race_color(d.race)
        }).attr("class", "dots")




    var xdata = ["3rd", "4th", "5th", "6th", "7th", "8th"]

    // Grades Scale
    graph_containers.append("g")
        .attr("class", "axis")
        .call(d3.axisBottom().scale(xScale).tickValues([3, 4, 5, 6, 7, 8]).tickFormat(function (d, i) {
            return xdata[i];
        }).tickSize(25))
        .attr("transform", "translate(" + 0 + "," + (height - 35) + ")");
    //    
    // graph_containers.append("g")
    //    .call(d3.axisLeft().scale(yScale))
    //    .attr("transform", "translate(" + 0 + "," + height + ")"); 


    // Add Gridlines

    yvals = [50, 90];

    //    graph_containers.selectAll(".gridlines")
    //        .data(yvals)
    //        .enter()
    //        .append("line")
    //        .attr("x1", xScale(2.95))
    //        .attr("x2", xScale(8.05))
    //        .attr("y1", (d) => yScale(d))
    //        .attr("y2", (d) => yScale(d))
    //        .attr("class", "gridline")
    //
    //    graph_containers.selectAll(".gridlabels")
    //        .data(yvals)
    //        .enter()
    //        .append("text")
    //        .attr("class", "gridlabels")
    //        .text((d) => d + "%")
    //        .attr("x", xScale(2.9))
    //        .attr("y", (d) => yScale(d));

    var start_labely = function (d) {
        return yScale(d.values[[0]].pass_rate)
    };
    var start_label_text = function (d) {
        return Math.round(d.values[[0]].pass_rate) + "%"
    }

    graph_containers.selectAll(".startlabels")
        .data((d) => d.values.filter((q) => !isNaN(q.values[[0]].pass_rate)))
        .enter()
        .append("text")
        .attr("class", "startlabels")
        .text(start_label_text)
        .attr("x", xScale(2.9))
        .attr("y", start_labely)


    // Add the Year text lables
    cohort_svg
        .append("text")
        .text((d) => d.key)
        .attr("class", "yeartext")
        .attr("transform", "translate(" + usewidth / 2 + "," + useheight / 2 + ")")



    // hover dot labels
    dotcontainers.selectAll(".hovertext")
        .data((d) => d.values.filter(q => !isNaN(q.pass_rate)))
        .enter()
        .append("text")
        .attr("class", "hovertext")
        .text((d) => Math.round(d.pass_rate) + "%")
        .attr("x", function (d) {
            return xScale(+d.grade);
        })
        .attr("y", doty);


    ///////////////////////////////////////////

    // create checkbox interfaces

    console.log(d3.nest().key((d) => d.values[[0]].values[[0]].values[[0]].region).entries(data))

    var region_nested = d3.nest().key((d) => d.values[[0]].values[[0]].values[[0]].region).entries(data);


    var checkboxcontainer = d3.select("#checkboxes");

    var checkboxgroups = checkboxcontainer
        .selectAll(".checkboxgroup")
        .data(region_nested)
        .enter()
        .append("div")
        .classed("checkboxgroup", true)

    checkboxgroups
        .append("div")
        .classed("grouptitlediv", true)
        .append("h3")
        .text(d => d.key)
        .classed("checkboxgrouptitle", true)


    var checkboxdivs = checkboxgroups.selectAll("checkbox")
        .data((d) => d.values)
        .enter()
        .append("div")
        .classed("checkdiv", true)

    // add the inputs
    checkboxdivs
        .append("input")
        .attr("type", "checkbox")
        .attr("class", function (d) {
            return d.key + "_checkbox checkbox"
        })
        .attr("value", function (d) {
            return d.key
        })
        .attr("name", function (d) {
            return d.key + "_checkbox"
        })
        .property("checked", function (d) {
            if (d.name_filter == "keep") {
                return true
            } else { // auto check the ones displayed
                return false
            }
        });


    ///////////////////////////////////////////
    // add the labels
    checkboxdivs.append("label")
        .attr("for", function (d) {
            return d.key + "_checkbox"
        })
        .text(function (d) {
            return " " + d.values[0].values[0].values[0].division_name
        }).attr("class", "checkboxlabels")

    // only select 6
    $('input[type=checkbox]').on('change', function (e) {
        if ($('input[type=checkbox]:checked').length > 10) {
            $(this).prop('checked', false);
            alert("Please Only Choose A Maximum of 10");
        }
    });

    ////////////////////////////////////////


    // Swap in and out columns
    //On click, update with new data			
    d3.selectAll("#submitchanges")
        .on("click", function () {

            var checkedboxes = $('input[type=checkbox]:checked')

            var checkboxlist = []
            for (var i = 0; i < checkedboxes.length; i++) {
                checkboxlist[i] = $(checkedboxes[[i]]).val()
            };
            console.log(checkboxlist);

            // update the dataset we are using          
            for (i in data) {
                if (checkboxlist.includes(data[i].key)) {
                    data[i].name_filter = "keep";
                } else {
                    data[i].name_filter = "remove";
                }
            };


            ed_data_filtered = data.filter(d => d.name_filter == "keep");


            var division_cols = viz_box.selectAll(".column")
                .data(ed_data_filtered, key);

            division_cols.exit()
                .transition()
                .duration(1000)
                .attr("width", 0)
                .remove();

            var entering_cols = division_cols.enter()
                .append("div")
                .classed("column", true)
                //        .classed("col-sm-2", true)
                .attr("id", (d) => "column_" + d.key);

            entering_cols.append("div").attr("class", "titledivs").append("h3").text((d) => d.values[[0]].values[[0]].values[[0]].division_name);

            var cohort_boxes = entering_cols.selectAll(".cohort_box")
                .data(d => d.values)
                .enter()
                .append("div")
                .classed("cohort_box", true)
                .attr("id", (d) => "cohort" + d.key);

            var cohort_svg = cohort_boxes
                .append("svg")
                .attr("viewBox", "0 0 " + usewidth + " " + useheight)
                .attr("class", "svg-content")
                .attr("id", (d) => d.key)
                .attr("aria-labelledby", "title");

            var graph_containers = cohort_svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            //
            //
            //
            var gradient_containers = graph_containers.append("g")
                .classed("gradient_containers", true)
                .attr("id", function (d) {
                    return "gradient_group" + d.key + d.values[[0]].values[[0]].division_use
                })
                .attr("clip-path", function (d) {
                    return "url(#area" + d.key + d.values[[0]].values[[0]].division_use + ")"
                });
            //

            var negative = gradient_containers.append("g")
                .attr("id", function (d) {
                    return "gradientBlack" + d.key
                })
                .selectAll(".negative_rects")
                .data(number_scale)
                .enter()
                .append("rect")
                .attr("x", 0)
                .attr("y", (d) => color_scale(d))
                .attr("width", width)
                .attr("height", height / N)
                .style("fill", (d) => negative_color(d))
                .classed("negative_rects backrect", true);



            var positive = gradient_containers
                .append("g")
                .attr("id", function (d) {
                    return "gradientWhite" + d.key
                })
                .attr("clip-path", function (d) {
                    return "url(#pathAll" + d.key + d.values[[0]].values[[0]].division_use + ")"
                }) // Divide the positive from the negative gradient along the average line. 
                .selectAll(".positive_rects")
                .data(number_scale).enter().append("rect")
                .attr("x", 0)
                .attr("y", (d) => color_scale(d))
                .attr("width", width)
                .attr("height", height / N)
                .style("fill", (d) => positive_color(d))
                .classed("positive_rects backrect", true);

            gradient_containers
                .selectAll(".clip_sep")
                .data((d) => d.values.filter(function (el) {
                    return el.key === "All"
                }))
                .enter()
                .append("clipPath")
                .attr("id", function (d) {
                    return "path" + d.key + d.values[[0]].cohort + d.values[[0]].division_use
                })
                .append("path")
                //       .attr("class", function(d){ return "areas " + d.key})
                .attr("d", (d) => gradient_area(d.values))
                .attr("class", "seperators");


            // setting both to go from where they are at to the average line
            var masks =
                gradient_containers
                .append("clipPath")
                .attr("id", function (d) {
                    return "area" + d.values[[0]].values[[0]].cohort + d.values[[0]].values[[0]].division_use
                })

            masks.selectAll("path")
                .data(
                    (d) => d.values.filter(function (el) {
                        return el.key !== "All"
                    }))
                .enter()
                .append("path")
                .attr("d", (d) => gap_area(d.values))
                .attr("class", "gap_area");


            // add in new lines

            graph_containers
                .selectAll(".linecontainer")
                .data((d) => d.values)
                .enter()
                .append("g")
                .attr("class", function (d) {
                    return "linecontainer linescontainer" + d.key
                })
                .append("path")
                .attr("d", (d) => lines(d.values))
                .attr("class", function (d) {
                    return "lines line" + d.key
                })
                .attr("stroke", function (d) {
                    return race_color(d.key)
                });


            // Add in dots

            var dotcontainers = graph_containers
                .selectAll(".dotcontainer")
                .data((d) => d.values)
                .enter()
                .append("g")
                .attr("class", function (d) {
                    return "dotcontainer dots" + d.key
                });

            dotcontainers.selectAll(".dots")
                .data((d) => d.values.filter(q => !isNaN(q.pass_rate)))
                .enter()
                .append("circle")
                .attr("cx", function (d) {
                    return xScale(+d.grade);
                })
                .attr("cy", doty)
                .attr("r", 12)
                .style("fill", function (d) {
                    return race_color(d.race)
                }).attr("class", "dots")


            //Grades SCale
            graph_containers.append("g")
                .attr("class", "axis")
                .call(d3.axisBottom().scale(xScale).tickValues([3, 4, 5, 6, 7, 8]).tickFormat(function (d, i) {
                    return xdata[i];
                }).tickSize(25))
                .attr("transform", "translate(" + 0 + "," + (height - 35) + ")");
            //    



            // Add Gridlines


            // Add Line Labels to the New ones 
            graph_containers.selectAll(".startlabels")
                .data((d) => d.values)
                .enter()
                .append("text")
                .attr("class", "startlabels")
                .text(start_label_text)
                .attr("x", xScale(2.9))
                .attr("y", start_labely)


            // hover dot labels
            dotcontainers.selectAll(".hovertext")
                .data((d) => d.values.filter(q => !isNaN(q.pass_rate)))
                .enter()
                .append("text")
                .attr("class", "hovertext")
                .text((d) => Math.round(d.pass_rate) + "%")
                .attr("x", function (d) {
                    return xScale(+d.grade);
                })
                .attr("y", doty);


            cohort_svg
                .append("text")
                .text((d) => d.key)
                .attr("class", "yeartext")
                .attr("transform", "translate(" + usewidth / 2 + "," + useheight / 2 + ")")


        });


    ////////////////////////////////////////
    // Normalize the charts


    $('#normalize').change(norm);

    function norm() {

        console.log("changed");

        if ($("#normalize")[[0]].checked == true) {

            console.log("on");


            yScale = d3.scaleLinear().domain([-35, 30]).range([height, 0])

            // Create the path clippings to divide the positive from the negative gradient
            gradient_area = d3.area()
                .defined(d => !isNaN(d.pass_rate))
                .x(function (d) {
                    return xScale(+d.grade);
                })
                .y0(function (d) {
                    return yScale(0);
                })
                .y1(function (d) {
                    return yScale(30);
                }).curve(d3.curveMonotoneX);


            // create the path clippings to define the race difference areas. 
            gap_area = d3.area()
                .defined(d => !isNaN(d.pass_rate))

                .x(function (d) {
                    return xScale(+d.grade);
                })
                .y0(function (d) {

                    return yScale(+d.diff);
                })
                .y1(function (d) {
                    return yScale(0);
                }).curve(d3.curveMonotoneX);

            var graph_area = d3.select("#graph-container");

            graph_area.selectAll(".seperators")
                .transition().duration(1000)
                .attr("d", (d) => gradient_area(d.values))


            graph_area.selectAll(".gap_area")
                .transition().duration(1000)
                .attr("d", (d) => gap_area(d.values))
                .attr("class", "gap_area");


            // add in new lines

            lines = d3.line()
                .defined(d => !isNaN(d.pass_rate))
                .x(function (d) {
                    return xScale(+d.grade);
                })
                .y(function (d) {
                    return yScale(+d.diff);
                })
                .curve(d3.curveMonotoneX);



            graph_area.selectAll(".lines")
                .transition().duration(1000)

                .attr("d", (d) => lines(d.values))


            doty = function (d) {
                return yScale(+d.diff);
            }


            graph_area.selectAll(".dots")
                .transition().duration(1000)
                .attr("cy", doty)

            start_labely = function (d) {
                return yScale(d.values[[0]].diff)
            };
            start_label_text = function (d) {
                return Math.round(d.values[[0]].diff) + "%"
            }

            graph_area.selectAll(".startlabels")
                .transition()
                .duration(1000)
                .text(start_label_text)
                .attr("y", start_labely)


            graph_area.selectAll(".hovertext")
                .transition()
                .duration(1000)
                .attr("y", doty)


        } else {

            var graph_area = d3.select("#graph-container");

            console.log("off");


            yScale = d3.scaleLinear().domain([35, 100]).range([height, 0])

            // Create the path clippings to divide the positive from the negative gradient
            gradient_area = d3.area()
                .defined(d => !isNaN(d.pass_rate))
                .x(function (d) {
                    return xScale(+d.grade);
                })
                .y0(function (d) {
                    return yScale(100);
                })
                .y1(function (d) {
                    return yScale(+d.pass_rate);
                }).curve(d3.curveMonotoneX);


            // create the path clippings to define the race difference areas. 

            // create the path clippings to define the race difference areas. 
            gap_area = d3.area()
                .defined(d => !isNaN(d.pass_rate))

                .x(function (d) {
                    return xScale(+d.grade);
                })
                .y0(function (d) {
                    return yScale(+d.pass_rate);
                })
                .y1(function (d) {
                    return yScale(+d.average);
                }).curve(d3.curveMonotoneX);


            graph_area.selectAll(".seperators")
                .transition().duration(500)
                .attr("d", (d) => gradient_area(d.values))


            graph_area.selectAll(".gap_area")
                .transition().duration(500)
                .attr("d", (d) => gap_area(d.values))
                .attr("class", "gap_area");


            // add in new lines

            lines = d3.line()
                .defined(d => !isNaN(d.pass_rate))
                .x(function (d) {
                    return xScale(+d.grade);
                })
                .y(function (d) {
                    return yScale(+d.pass_rate);
                })
                .curve(d3.curveMonotoneX);



            graph_area.selectAll(".lines")
                .transition().duration(500)

                .attr("d", (d) => lines(d.values))


            doty = function (d) {
                return yScale(+d.pass_rate);
            }

            graph_area.selectAll(".dots")
                .transition().duration(500)
                .attr("cy", doty)

            start_labely = function (d) {
                return yScale(d.values[[0]].pass_rate)
            };
            start_label_text = function (d) {
                return Math.round(d.values[[0]].pass_rate) + "%"
            }

            graph_area.selectAll(".startlabels")
                .transition()
                .duration(500)
                .text(start_label_text)
                .attr("y", start_labely)


            graph_area.selectAll(".hovertext")
                .transition()
                .duration(1000)
                .attr("y", doty)




        }

    };



};







var number_scale;

var yScale;
