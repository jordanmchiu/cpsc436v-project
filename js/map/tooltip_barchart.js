class TooltipBarchart extends Chart {

  initVis() {
    super.initVis();
    let vis = this;

    vis.g = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append country name to the top of the chart; change this in update();
    vis.g.append('text')
        .attr('class', 'tooltip-title-text')
        .attr('x', vis.width / 2)
        .attr('y', - vis.config.margin.top / 3)
        .attr('text-anchor', 'middle')
        .style('font-size', '1rem')
        .style('font-weight', 'bold')
        .text('Country Name');

    // Define axis titles and labels
    const xAxisLabel = 'Cases';
    vis.xAxisTickFormat = number =>
      d3.format('.1s')(number);
    const yAxisLabel = 'Status';

    // Define axis values
    vis.yValue = d => d.key;
    vis.xValue = d => d.value;

    // Set fill colours: color scheme was chosen using Colorgorical to
    // maximize perceptual distance within a moderate lightness range
    // http://vrl.cs.brown.edu/color
    const statuses = ['confirmed', 'deaths', 'recovered'];
    vis.barColor = d3.scaleOrdinal()
      .domain(statuses)
      .range(['#fec44f', '#e72525', '#4cb082'])
    vis.colorValue = d => d.key;

    // Set up y-axis, with the expected keys: confirmed, deaths, and recovered
    vis.yScale = d3.scaleBand()
      .domain(statuses)
      .range([vis.height, 0])
      .padding(0.2);
    vis.yAxis = d3.axisLeft(vis.yScale)
        .tickValues([])
        .tickSize(-vis.height)
        .tickPadding(5);
    vis.barHeight = vis.yScale.bandwidth();
    // Add labels for y-axis
    const yAxisG = vis.g.append('g').call(vis.yAxis);
    yAxisG.selectAll('.domain').remove();
    yAxisG.append('text')
        .attr('class', 'tooltip-axis-label')
        .attr('y', -vis.config.margin.left /  2)
        .attr('x', -vis.height / 2)
        .attr('transform', `rotate(-90)`)
        .attr('text-anchor', 'middle')
        .text(yAxisLabel);

    // We will use this x-scale for our bar chart.
    vis.xScale = d3.scaleLinear()
        .domain([0, 0]) // The domain of the x-axis will change depending on the data rendered
                        // This change is handled in the update() method.
        .range([0, vis.width - vis.config.margin.right])
        .nice();
    // Temporary labels for x axis
    const xAxisG = vis.g.append('g')
        .attr('class', 'tooltip-barchart-x-axis')
      .call(d3.axisBottom(vis.xScale))
        .attr('transform', `translate(0,${vis.height})`);
    xAxisG.select('.domain').remove();
    xAxisG.append('text')
        .attr('class', 'tooltip-axis-label')
        .attr('y', vis.config.margin.bottom)
        .attr('x', vis.width / 2)
        .text(xAxisLabel);

    // Initialize a dummy country to render with the proper structure.
    vis.countryToRender = {
      'key': 'N/A',
      'value': {
        'confirmed': 0,
        'deaths': 0,
        'recovered': 0
      }
    };

    vis.update();
  }

  update() {
    let vis = this;

    // The parent sets vis.dataToRender to be the data of the country to be
    // represented in the barchart.  The object will have the format:
    // {
    //   key: 'Australia',
    //   value: {
    //     confirmed: 128,
    //     deaths: 3,
    //     recovered: 21
    //   }
    // }

    // First, update the title text
    d3.select('.tooltip-title-text').text(vis.countryToRender.key);

    // Update the max x-value to allow for proper scaling of the axis
    vis.maxXValue = Math.max(
      vis.countryToRender.value.confirmed,
      vis.countryToRender.value.deaths,
      vis.countryToRender.value.recovered
    );
    vis.xScale.domain([0, vis.maxXValue]);
    vis.g.select('.tooltip-barchart-x-axis')
      .call(d3.axisBottom(d3.scaleLinear()
                            .domain([0, vis.maxXValue])
                            .range([0, vis.width])
                            .nice()
                            )
              .ticks(2)
              .tickFormat(vis.xAxisTickFormat));

    // Parse data into render-friendly format
    vis.dataToRender = 
    [
      { 'key': 'confirmed', 'value': vis.countryToRender.value.confirmed },
      { 'key': 'deaths', 'value': vis.countryToRender.value.deaths },
      { 'key': 'recovered', 'value': vis.countryToRender.value.recovered },
    ];

    vis.render();
  }

  render() {
    let vis = this;

    // Render bars
    let bars = vis.g.selectAll('.tooltip-bar')
        .data(vis.dataToRender);

    bars.enter().append('rect')
      .merge(bars)
        .attr('class', 'tooltip-bar')
        .attr('fill', d => vis.barColor(vis.colorValue(d)))
        .attr('height', vis.barHeight)
        .attr('x', 0)
        .attr('y', d => vis.yScale(vis.yValue(d)))
      .transition().duration(200)
        .attr('width', d => (vis.maxXValue === 0) ? 0 : vis.xScale(vis.xValue(d)))

    bars.exit().remove();

    // Render text
    let barText = vis.g.selectAll('.tooltip-bar-label')
        .data(vis.dataToRender);

    barText.enter().append('text')
      .merge(barText)
        .attr('class', 'tooltip-bar-label')
        .attr('x', 2)
        .attr('y', d => vis.yScale(vis.yValue(d)) + vis.barHeight / 2)
        .attr('dy', '.35em')
        .attr('fill', 'black')
        .text(d =>
          d.key === 'confirmed'
            ? 'Confirmed: ' + d.value
            : d.key === 'deaths'
              ? 'Deaths: ' + d.value
              : 'Recovered: ' + d.value);
  }
}