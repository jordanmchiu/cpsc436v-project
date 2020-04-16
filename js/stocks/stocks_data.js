class StocksData {

  constructor(_config) {
    //debugger;
    this.snpInfo = _config.files[0];
    this.snpData = []; // cleaned data goes here
    this.djiInfo = _config.files[1];
    this.djiData = []; // cleaned data goes here
    this.goldInfo = _config.files[2];
    this.goldData = []; // cleaned data goes here
    this.oilInfo = _config.files[3];
    this.oilData = []; // cleaned data goes here
    this.minDate = _config.minDate;
    this.maxDate = _config.maxDate;
    this.dataAvailable = false;
  }

  initialize() {
    let dataset = this;

    // Use Promise.all because we plan to use multiple stock data files,
    // for now we just have the one S&P500 dataset.
    return Promise.all([
      d3.csv(dataset.snpInfo['file'], d3.autoType),
      d3.csv(dataset.djiInfo['file'], d3.autoType),
      d3.csv(dataset.goldInfo['file'], d3.autoType),
      d3.csv(dataset.oilInfo['file'], d3.autoType),
    ]).then(files => {

      // Filter by dataset.minDate and dataset.maxDate
      let snpData = files[0].filter( (row) => {
          return (row.Date >= dataset.minDate && row.Date <= dataset.maxDate)
      });
      const snpStartPrice = snpData[0]['Close'];
      snpData = snpData.map( (row) => {
          return { date: row.Date,
                   price: ((row.Close - snpStartPrice)/snpStartPrice) }
      });

      let djiData = files[1].filter( (row) => {
          return (row.Date >= dataset.minDate && row.Date <= dataset.maxDate)
      });
      const djiStartPrice = djiData[0]['Close'];
      djiData = djiData.map( (row) => {
          return { date: row.Date,
                   price: ((row.Close - djiStartPrice)/djiStartPrice) }
      });

      let goldData = files[2].filter( (row) => {
          return (row.Date >= dataset.minDate && row.Date <= dataset.maxDate)
      });
      const goldStartPrice = goldData[0]['Close'];
      goldData = goldData.map( (row) => {
          return { date: row.Date,
                   price: ((row.Close - goldStartPrice)/goldStartPrice) }
      });

      let oilData = files[3].filter( (row) => {
          return (row.Date >= dataset.minDate && row.Date <= dataset.maxDate)
      });
      const oilStartPrice = oilData[0]['Close'];
      oilData = oilData.map( (row) => {
          return { date: row.Date,
                   price: ((row.Close - oilStartPrice)/oilStartPrice) }
      });

      dataset.snpData = snpData;
      dataset.djiData = djiData;
      dataset.goldData = goldData;
      dataset.oilData = oilData;
      dataset.dataAvailable = true;
      return dataset;
    });
  }
}
