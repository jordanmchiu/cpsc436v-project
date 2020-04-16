class VirusPlot extends Chart
{
    initVis()
    {
        super.initVis();
        let vis = this;

        vis.selected_countries_array  = ["Mainland China"];
        vis.selected_countries_color  = "#4cb082";
        vis.selected_countries_length = 1;
        vis.number_of_days            = 10;

        vis.visualize_confirmed       = true;
        vis.visualize_dead            = false;
        vis.visualize_recovered       = false;

        vis.show_x_domain_border      = false;
        vis.show_y_domain_border      = false;

        // Promise chaining: dataset has its own initialize() method we wait for
        vis.config.dataset.initialize().then(dataset =>
        {
            vis.virgin_dataset = dataset;

            vis.render(dataset);
        });
    }

    update()
    {
        let vis = this;

        let dataset = {...vis.virgin_dataset};

        vis.render(dataset);
    }

    render(dataset)
    {
        let vis = this;

        vis.handle_chart_state();
        vis.handle_dropdown_state();

        // the following code is used to extract dataset
        if (vis.visualize_confirmed)
        {
            dataset                      = dataset.cleanedCovidDataConfirmed;
            vis.selected_countries_color = "#fec44f";
        }

        if (vis.visualize_dead)
        {
            dataset                      = dataset.cleanedCovidDataDeaths;
            vis.selected_countries_color = "#e72525";
        }

        if (vis.visualize_recovered)
        {
            dataset                      = dataset.cleanedCovidDataRecovered;
            vis.selected_countries_color = "#4cb082";
        }

        // the following code is used to extract countries
        var countries = [];

        vis.selected_countries_array.forEach(selection =>
        {
            dataset.forEach(data =>
            {
                if (data.name === selection)
                {
                    countries.push({...data});
                }
            });
        });

        // the following code is used to bound countries
        var abs_min = 0;
        var abs_max = 0;

        var index_start  = vis.virgin_dataset.availableDates.indexOf(state.getStartDateAsStr()) + 0;
        var index_end    = vis.virgin_dataset.availableDates.indexOf(state.getEndDateAsStr())   + 1;
        var index_scaled = false;

        if ((index_end - index_start) >= vis.number_of_days)
        {
            index_start  = index_end - vis.number_of_days;
            index_scaled = false;
        }
        else
        {
            index_start  = index_start;
            index_scaled = false;
        }

        countries.forEach(country =>
        {
            if (index_scaled)
            {
                var scale_number = country.data[index_start-1][1];

                country.data = country.data.slice(index_start, index_end);

                country.data.forEach(d =>
                {
                    d = d.slice();
                });

                for (var i=0; i<country.data.length; i++)
                {
                    country.data[i][0] = country.data[i][0];
                    country.data[i][1] = country.data[i][1];
                }

                if (abs_max < country.max)
                {
                    abs_max = country.max;
                }
            }
            else
            {
                country.data = country.data.slice(index_start, index_end);

                country.data.forEach(d =>
                {
                    d = d.slice();
                });

                for (var i=0; i<country.data.length; i++)
                {
                    country.data[i][0] = country.data[i][0];
                    country.data[i][1] = country.data[i][1];
                }

                if (abs_max < country.max)
                {
                    abs_max = country.max;
                }
            }
        });

        if (countries.length === 0)
        {
            var graft_country = {...dataset[0]};

            graft_country.name = vis.selected_countries_array[0];
            graft_country.data = graft_country.data.slice(Math.max(graft_country.data.length - vis.number_of_days, 0));

            graft_country.data.forEach(d =>
            {
                d    = d.slice();
                d[1] = 0;
            });

            countries.push(graft_country);
        }

        // the following code is used to draw our graph
        var target_svg    = d3.select("#virus_plot");
        var target_width  = +target_svg.attr("width")  || 1200;
        var target_height = +target_svg.attr("height") || 600;

        var margin = { top    : 0,
                       bottom : 100,
                       left   : 100,
                       right  : 25};

        var innerWidth  = target_width  - margin.left - margin.right;
        var innerHeight = target_height - margin.top  - margin.bottom;

        const xValue     = d => d[0];
        const yValue     = d => d[1];

        // here we are currently rendering the charts
        const chart = target_svg.selectAll("#virus_chart").data([null])
            .enter().append("g")
            .merge(target_svg.selectAll("#virus_chart").data([null]))
                .attr("transform", `translate(${margin.left},${margin.top})`)
                .attr("id",        "virus_chart");

        // here we are currently rendering the axes
        const AxisScaleX = d3.scaleBand()
            .domain(countries[0].data.map(xValue))
            .range([0, innerWidth])
            .padding(0.25);

        const AxisScaleY = d3.scaleLinear()
            .domain([0, Math.max(abs_max, 1)])
            .range([innerHeight, 0])
            .nice();

        const AxisX = d3.axisBottom(AxisScaleX)
            .tickSize(-innerHeight)
            .tickPadding(15);

        const AxisY = d3.axisLeft(AxisScaleY)
            .tickSize(-innerWidth)
            .tickPadding(5);

        const chartAxisX = chart.selectAll("#virus_axis_x").data([null])
            .enter().append("g")
            .merge(chart.selectAll("#virus_axis_x").data([null]))
            .call(AxisX)
            .attr("transform", `translate(0,${innerHeight})`)
            .attr("id",        "virus_axis_x");

        if (!vis.show_x_domain_border)
        {
            chartAxisX.selectAll(".domain").remove();
        }

        chartAxisX.selectAll(".virus_axis_label").data([null])
            .enter().append("text")
            .merge(chartAxisX.selectAll(".virus_axis_label").data([null]))
            .attr("class", "virus_axis_label")
            .attr("x",     innerWidth/2)
            .attr("y",     70);


        const chartAxisY = chart.selectAll("#virus_axis_y").data([null])
            .enter().append("g")
            .merge(chart.selectAll("#virus_axis_y").data([null]))
            .call(AxisY)
            .attr("id", "virus_axis_y");

        if (!vis.show_y_domain_border)
        {
            chartAxisY.selectAll(".domain").remove();
        }

        chartAxisY.selectAll(".virus_axis_label").data([null])
            .enter().append("text")
            .merge(chartAxisY.selectAll(".virus_axis_label").data([null]))
            .attr("class", "virus_axis_label")
            .attr("x",     -innerHeight/2)
            .attr("y",     -90);

        // here we are currently rendering the countries
        for (var i=0; i<vis.selected_countries_length; i++)
        {
            let cn_selection = chart.selectAll(".virus_rect_c" + i).data(countries[i].data);
            let cn_division  = vis.selected_countries_length;

            cn_selection.enter().append("rect")
                .merge(cn_selection)
                .attr("fill",   vis.selected_countries_color)
                .attr("class",  "virus_rect_c" + i)
                .transition().duration(150)
                .attr("x",      (d) => AxisScaleX(xValue(d)) + AxisScaleX.bandwidth()/cn_division*i)
                .attr("width",  (d) => AxisScaleX.bandwidth()/cn_division)
                .transition().duration(150)
                .attr("y",      (d) => abs_max === 0 ? innerHeight : AxisScaleY(yValue(d)))
                .attr("height", (d) => abs_max === 0 ? 0           : innerHeight - AxisScaleY(yValue(d)));

            cn_selection.exit().remove();
        }

        var title_pt_1 = "Cumulative COVID-19 cases from ";
        var title_pt_2 = state.startDate.toLocaleDateString();
        var title_pt_3 = " to ";
        var title_pt_4 = state.endDate.toLocaleDateString();
        var title      = title_pt_1 + title_pt_2 + title_pt_3 + title_pt_4;

        $("#virus-title").text(title);
    }

    handle_chart_state()
    {
        let vis = this;

        var regular_name_array   = vis.virgin_dataset.availableCountries;
        var reversed_name_object = swap(MapDict);

        // the following logic is for when 0 selected countries
        if (state.selectedCountry === null)
        {
            vis.selected_countries_array = ["Worldwide"];

            return;
        }

        // the following logic is for when 1 selected countries
        else
        {
            var regular_name  = state.selectedCountry;
            var reversed_name = null;
            var unfound_name  = null;

            if (regular_name === "China")
            {
                regular_name = "Mainland China";
            }

            if (regular_name === "Russia")
            {
                regular_name = "Russian Federation";
            }

            if (regular_name === "Iran")
            {
                regular_name = "Iran (Islamic Republic of)";
            }

            var name_in_reg_array  = regular_name_array.includes(regular_name);
            var name_in_rev_object = reversed_name_object.hasOwnProperty(regular_name);

            // here we have logic handling selected regular name
            if (name_in_reg_array)
            {
                vis.selected_countries_array = [regular_name];

                return;
            }

            // here we have logic handling selected reversed name
            if (name_in_rev_object)
            {
                reversed_name = reversed_name_object[regular_name];

                vis.selected_countries_array = [reversed_name];

                return;
            }

            // here we have logic handling selected unfound name
            else
            {
                unfound_name = state.selectedCountry;

                vis.selected_countries_array = [unfound_name];

                return;
            }
        }
    }

    handle_dropdown_state()
    {
        let vis = this;

        var virus_country_1 = $("#virus_country_1");

        if (vis.selected_countries_array[0] !== "Worldwide")
        {
            virus_country_1.val(vis.selected_countries_array[0]);

            if (virus_country_1.val() === null)
            {
                var option_1 = document.createElement("option");
                option_1.value     = vis.selected_countries_array[0];
                option_1.innerHTML = vis.selected_countries_array[0];
                virus_country_1[0].appendChild(option_1);

                virus_country_1.val(vis.selected_countries_array[0]);
            }
        }
        else
        {
            virus_country_1.val("Worldwide");

            if (virus_country_1.val() === null)
            {
                var option_1 = document.createElement("option");
                option_1.value     = "Worldwide";
                option_1.innerHTML = "Worldwide";
                virus_country_1[0].appendChild(option_1);

                virus_country_1.val("Worldwide");
            }
        }
    }
}
