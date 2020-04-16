class Map extends Chart {

  initVis() {
    super.initVis();
    let vis = this;

    vis.g = vis.svg.append('g');

    // Declare group for colour legend
    vis.colorLegendG = vis.svg.append('g')
      .attr('class', 'map-color-legend')
      .attr('transform', `translate(30, 350)`);

    // Initialize projection and paths for map
    vis.projection = d3.geoNaturalEarth1();
    vis.path = d3.geoPath().projection(vis.projection);

    // How to get your background to be a different colour from water
    // Taken from Choropleth map tutorial:
    // https://vizhub.com/jordanmchiu/72c1473eb5ff449ca7910be1e12fcd63?edit=files&file=index.js
    vis.g.append('path')
        .attr('class', 'map-background')
        .attr('d', vis.path({type: 'Sphere'}));

    vis.visualize_confirmed = true;
    vis.visualize_dead      = false;
    vis.visualize_recovered = false;

    // Set thresholds for colour value
    // Adapted from Mike Bostock's threshold choropleth:
    // https://observablehq.com/@d3/threshold-choropleth
    vis.thresholds = [0,1,11,101,1001,10001];
    vis.colorValue = d => {
      if (!d) { return 0; }
      else if (vis.visualize_recovered) { return d.value.recovered; }
      else if (vis.visualize_dead) { return d.value.deaths; }
      else { return d.value.confirmed; }
    };

    // Create and draw colour legend
    let thresholds = vis.thresholds;
    vis.colorLegendG.call(mapColorLegend, {
      circleRadius: 12,
      spacing: 30,
      textOffset: 15,
      backgroundRectWidth: 250,
      titleText: 'Number of cases',
      thresholds: thresholds
    });

    // Set up stylings for tooltips
    // Ideally, we'd want something like this for the end result:
    // https://bl.ocks.org/maelafifi/ee7fecf90bb5060d5f9a7551271f4397
    // This example uses d3-tip, which we may be able to utilize:
    // https://cdnjs.cloudflare.com/ajax/libs/d3-tip/0.9.1/d3-tip.min.js
    vis.tooltip = d3.select('body')
        .append('div')
        .style('opacity', 0)
        .attr('class', 'tooltip');
    vis.formatTime = d3.timeFormat("%B %d, %Y");
    let tooltipBarchartId = 'tooltip-barchart';
    vis.tooltip.html(
      '<div><svg id="' + tooltipBarchartId + '"></svg></div>'
    );

    vis.tooltipBarchart = new TooltipBarchart({
      parentElement: '#' + tooltipBarchartId,
      dataset : undefined,
      containerWidth: 240,
      containerHeight: 170,
      margin: { top: 30, bottom: 30, right: 10, left: 20 }
    });
    vis.tooltipBarchart.initVis();

    // This function helps us translate from a country name on our world map
    // to a data element form our COVID data that we can manipulate.
    vis.getDataByFeature = feat => vis.dataToRender.find(d => feat.properties.name === d.key);

    // Allow for zooming and panning within a reasonable extent
    let zoom = d3.zoom()
        .scaleExtent([1.2,50])
        .on('zoom', () => {
          vis.g.attr('transform', d3.event.transform);
        });

    // Set default zoom level to fill up the panel of the map
    vis.svg.call(zoom)
        .call(zoom.transform, d3.zoomIdentity.translate(20,0).scale(1.2))
        .append('svg:g')
        .attr('transform', 'scale(1,1)');

    vis.config.dataset.initialize().then(() => { vis.update(); });
  }

  update() {
    let vis = this;

    // We get our end date from the current state's end date
    let filteredEndData = vis.config.dataset.cleanedCovidDataMain.filter(d =>
      d['ObservationDate'].toDateString() === state.endDate.toDateString()
    );

    // By summing up the confirmed, deaths, and recovered cases on a single day,
    // we can capture every single case within a specific country or region.
    vis.dataToRender = d3.nest()
      .key(d => d['Country/Region'])
      .rollup(function(v) {
        return {
          confirmed: d3.sum(v, d => d['Confirmed']),
          deaths: d3.sum(v, d => d['Deaths']),
          recovered: d3.sum(v, d => d['Recovered'])
        };
      })
      .entries(filteredEndData);

    // if we have a start date different from the range of our data, then
    // we need to subtract the counts from the previous day from our
    // data to render before we render it:
    if (state.startDate > DATE_START) {
      let startDateMinusOne = new Date();
      let dateOffset = (24*60*60*1000); // 1 day
      startDateMinusOne.setTime(state.startDate.getTime() - dateOffset);

      let filteredStartData = vis.config.dataset.cleanedCovidDataMain.filter(d =>
        d['ObservationDate'].toDateString() === state.startDate.toDateString()
      );
      let dataToSubtract = d3.nest()
        .key(d => d['Country/Region'])
        .rollup(function(v) {
          return {
            confirmed: d3.sum(v, d => d['Confirmed']),
            deaths: d3.sum(v, d => d['Deaths']),
            recovered: d3.sum(v, d => d['Recovered'])
          };
        })
        .entries(filteredStartData);

      dataToSubtract.forEach(d => {
        // use d.key to find the corresponding entry in vis.dataToRender
        let found = vis.dataToRender.find(e => e.key === d.key);

        // Subtract each value of 'Confirmed', 'Deaths', and 'Recovered' of d to that corresponding entry.
        // There may be some errors in counts, so the subtraction may result in negative counts.
        // To prevent errors in rendering (rect elements cannot have negative y-values), we should
        // set all negative counts to 0.
        if (found) {
          found.value.confirmed -= d.value.confirmed;
          found.value.deaths    -= d.value.deaths;
          found.value.recovered -= d.value.recovered;

          if (found.value.confirmed < 0) { found.value.confirmed = 0; }
          if (found.value.deaths < 0) { found.value.deaths = 0; }
          if (found.value.recovered < 0) { found.value.recovered = 0; }

          let foundIdx = vis.dataToRender.findIndex(e => e.key === d.key);
          vis.dataToRender[foundIdx] = found;
        }
      })
    }

    // Based on what data we are visualizing, change the color scheme.
    // Yellow = confirmed
    // Green = recovered
    // Red = deaths
    let colorScheme = vis.visualize_confirmed
        ? d3.schemeYlOrBr[vis.thresholds.length+1]
        : vis.visualize_dead
          ? d3.schemeOrRd[vis.thresholds.length+1]
          : d3.schemeBuGn[vis.thresholds.length+1];
    vis.color = d3.scaleThreshold()
      .domain(vis.thresholds)
      .range(colorScheme);

    // Also change the color scheme of the legend
    for (let i = 1; i <= vis.thresholds.length; i++) {
      d3.select('.color-legend-circle-' + (i-1))
          .attr('fill', colorScheme[i]);
    }

    // Update title of map
    let titlePreamble = vis.visualize_confirmed
      ? 'Geographical COVID-19 cases from '
      : vis.visualize_dead
        ? 'Geographical COVID-19 cases from '
        : 'Geographical COVID-19 cases from '
    d3.select('h5.map-title')
        .text(
            titlePreamble
            + state.startDate.toLocaleDateString()
            + ' to '
            + state.endDate.toLocaleDateString()
          );

    vis.render();
  }

  render() {
    let vis = this;

    vis.features = topojson.feature(vis.config.dataset.cleanedTopoJson, vis.config.dataset.cleanedTopoJson.objects.countries).features;
    vis.features.map(d => {
      d.properties.projected = vis.projection(d3.geoCentroid(d));
    });

    let geoPath = vis.g.selectAll('.geo-path')
      .data(vis.features);

    let geoPathEnter = geoPath.enter().append('path')
        .attr('class', 'geo-path')
        .attr('d', vis.path)

    geoPath.merge(geoPathEnter)
        // If a country is in seletedCountries, add this class to it.  Otherwise do not.
        .classed('selected-country', feat => {
          let country = vis.getDataByFeature(feat);
          if (!country) { country = { 'key': feat.properties.name }; }
          return state.selectedCountry === country.key;
        })
        .attr('fill', feat => vis.color(vis.colorValue(vis.getDataByFeature(feat))))

        // Handle tooltips and fill
        .on('mouseover', feat => {
          vis.tooltip.transition()
            .duration(200)
            .style('opacity', 1);
          let country = vis.getDataByFeature(feat)
          vis.tooltipBarchart.countryToRender = (country) ? country : {
            'key': feat.properties.name,
            'value': {
              'confirmed': 0,
              'deaths': 0,
              'recovered': 0
            }
          };
          vis.tooltipBarchart.update();
        })
        // Keep track of where tooltip is
        .on('mousemove', feat => {
          vis.tooltip
            .style('left', (d3.event.pageX + 20) + 'px')
            .style('top', (d3.event.pageY) + 'px');
        })
        // Remove tooltip and set fill back to whatever it was before
        .on('mouseout', feat => {
          vis.tooltip.transition()
            .duration(200)
            .style('opacity', 0);
        })
        .on('click', feat => {
          // First, get  the country NAME by the feature NAME
          // If the country is already selected, deselect it
          // Else if the country is not selected, select it
          // Don't set the fill using the on-click listener.
          let country = vis.getDataByFeature(feat);
          if (!country) { country = { 'key': feat.properties.name }; }
          let countryName = country.key;

          if (state.selectedCountry === countryName) {
            state.setSelectedCountry(null);
          } else {
            state.setSelectedCountry(countryName);
          }
        });
  }
}
