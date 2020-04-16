class StocksPlot extends Chart {

  initVis() {
    super.initVis();
    let vis = this;
    const m = vis.config.margin;

    vis.g = vis.svg.append('g')
      .attr('transform', `translate(${m.left},${m.top})`);

    // Append x-axis group, place at the bottom of the chart
    vis.xAxisG = vis.g.append('g')
      .attr("class", "x-axis text-secondary")
      .attr('transform', `translate(0,${vis.height})`);

    // Append y-axis group and append add a label to it (a text svg)
    vis.yAxisG = vis.g.append('g')
      .attr("class", "y-axis text-secondary");

    // Define scales and axes
    // Note: we need to define their domains in initVis() after data is available
    vis.xScale = d3.scaleTime().range([0, vis.width]);
    vis.yScale = d3.scaleLinear().range([vis.height, 0]);

    vis.xAxis = d3.axisBottom(vis.xScale)
      .tickFormat(d3.timeFormat("%m/%d/%y"));
    vis.yAxis = d3.axisLeft(vis.yScale)
      .tickFormat(d3.format(".0%"));

    // Add the brush
    const brushed = () => {
      const selection = d3.event.selection;
      if (!d3.event.sourceEvent || !selection) return;
      const [x0, x1] = selection.map(vis.xScale.invert);
      state.setStartDate(x0);
      state.setEndDate(x1);
    };
    const brushended = () => {
      const selection = d3.event.selection;
      if (!d3.event.sourceEvent || !selection) {
          state.setStartDate(DATE_START);
          state.setEndDate(DATE_END);
          return;
      }
    };
    vis.brushG = vis.g.append('g')
      .attr("class", "brush")
      .call(d3.brushX()
          .extent([[0,0], [vis.width, vis.height]])
          .on("brush", brushed)
          .on("end", brushended));

    // Promise chaining: dataset has its own initialize() method we wait for
    vis.config.dataset.initialize().then( dataset => {

      const initStockPlot1Axis = (mergedData) => {
        // Now that the data is available, we can set the domains for our scales and draw axes
        const dateExtent = d3.extent(mergedData.map( d => {
            return d["date"]
        }));
        vis.xScale.domain(dateExtent);

        // TODO: change this extent to be defined from multiple stock price data sources
        const highPriceExtent = d3.extent(mergedData.map( d => {
            return d["price"]
        }));
        vis.yScale.domain([highPriceExtent[0], highPriceExtent[1]]).nice();

        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
      }

      // Use all data as default
      vis.activeSnpData = dataset.snpData;
      vis.activeDjiData = dataset.djiData;
      vis.activeGoldData = dataset.goldData;
      vis.activeOilData = dataset.oilData;

      initStockPlot1Axis(d3.merge([vis.activeDjiData, vis.activeSnpData,
                                   vis.activeGoldData, vis.activeOilData ]));
      vis.render();
    });
  }

  render() {
    let vis = this;

    const draw_line = (data, cls_str, colo_str, text_label, text_label_pos) => {
      // Draw the lines, but use a transition! (see below)
      let line = vis.g.selectAll(cls_str)
        .data([data])
        .join('path')
          .attr('class', cls_str)
          .attr("fill", "none")
          .attr("stroke", colo_str)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", 2)
          .attr("d", d3.line()
            .x( d => { return vis.xScale(d['date'])} )
            .y( d => { return vis.yScale(d['price'])}));

      // Transition logic here:
      // (draw line left to right to emphasize time-series/sequential nature of data)
      const totalLength = line.node().getTotalLength();
      line.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(4000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

      // Add a text label for each line, placed on left hand side of the chart
      vis.g.append('text')
        .attr("x", 28)
        .attr("y", text_label_pos)
        .style("font-size", "14px")
        .style("font-weight", 500)
        .style("fill", colo_str)
        .text(text_label);
    }

    draw_line(vis.activeGoldData, ".goldline", "orange", "GOLD", 66);
    draw_line(vis.activeSnpData, ".snpline", "steelblue", "S&P 500", 86);
    draw_line(vis.activeDjiData, ".djiline", "red", "DOW JONES", 106);
    draw_line(vis.activeOilData, ".oilline", "green", "CRUDE OIL", 126);

    // Add 5 horizontal grid lines for readibility
    vis.g.append("g")
      .attr("class","stockgrid text-muted")
      .style("stroke-dasharray",("3,3"))
      .call( d3.axisLeft(vis.yScale)
        .ticks(5)
        .tickSize(-vis.width)
        .tickFormat("")
      );
  }
}
