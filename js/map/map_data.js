class MapData {

  constructor(_config) {
    this.covidDataMain = _config.fileNames[0];
    this.topoJson = _config.fileNames[1];

    this.cleanedCovidDataMain = [];
    this.cleanedTopoJson = [];

    this.dataAvailable = false;
  }

  initialize() {
    let dataset = this;
    return Promise.all([
      d3.csv(dataset.covidDataMain),
      d3.json(dataset.topoJson),
    ]).then(files => {
      dataset.cleanedCovidDataMain = dataset.cleanCovidDataMain(files[0]);
      dataset.cleanedTopoJson = dataset.cleanTopoJson(files[1]);

      dataset.dataAvailable = true;
      return dataset;
    });
  }

  cleanCovidDataMain(file) {
    file.forEach(d => {
      d['SNo'] = +d['SNo'];
      d['ObservationDate'] = new Date(d['ObservationDate']);
      d['Last Update'] = new Date(d['Last Update']);
      d['Confirmed'] = +d['Confirmed'];
      d['Deaths'] = +d['Deaths'];
      d['Recovered'] = +d['Recovered'];

      d['Country/Region'] = d['Country/Region'].trim();
      d['Country/Region'] = (d['Country/Region'] in MapDict)
        ? MapDict[d['Country/Region']]
        : d['Country/Region'];
    });

    file = file.filter(d => d['Country/Region'] !== 'Others');

    return file;
  }

  cleanTopoJson(file) {
    // TODO: clean data
    return file;
  }
}
