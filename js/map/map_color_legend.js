// Adapted from choropleth map tutorial ion VizHub
// https://vizhub.com/jordanmchiu/72c1473eb5ff449ca7910be1e12fcd63?edit=files&file=index.js

const mapColorLegend = (selection, props) => {
  const {
    circleRadius,
    spacing,
    textOffset,
    backgroundRectWidth,
    titleText,
    thresholds
  } = props;

  const backgroundRect = selection.selectAll('rect')
  	.data([null]);

  backgroundRect.enter().append('rect')
  	.merge(backgroundRect)
  		.attr('x', -circleRadius * 2)
  		.attr('y', -circleRadius * 2)
  		.attr('rx', 5)
  		.attr('width', backgroundRectWidth)
  		.attr('height', spacing * (thresholds.length + 1) + circleRadius * 2)
  		.attr('fill', 'white')
  		.attr('opacity', 0.8);

  selection.append("text")
      .attr('y', 2)
      .attr("text-anchor", "center")
      .attr("font-weight", "bold")
      .text(titleText);

  const groups = selection.selectAll('g')
    .data(thresholds);
  const groupsEnter = groups
    .enter().append('g')
      .attr('class', 'tick');
  groupsEnter
    .merge(groups)
      .attr('transform', (d, i) =>
        `translate(0, ${(i+1) * spacing})`
      );
  groups.exit().remove();

  groupsEnter.append('circle')
    .merge(groups.select('circle'))
      .attr('r', circleRadius)
      .attr('class', (d, i) => 'color-legend-circle-' + i);

  const numberFormat = (d, i) =>
    (i === 0)
    ? d
    : (i === thresholds.length - 1)
      ? d + '+'
      : d + '-' + (thresholds[i+1] - 1);

  groupsEnter.append('text')
    .merge(groups.select('text'))
      .text(numberFormat)
      .attr('dy', '0.32em')
      .attr('x', textOffset);
}
