/*
 * Helper function for reversing key value arrays
 */
function swap(json)
{
    var result = {};

    for(var key in json)
    {
        result[json[key]] = key;
    }

    return result;
}

/*
 * State management
 * ----------------
 * We will use this state variable in order to keep track of things for bidirectional
 * interactivity.  These include start/end dates and the selected countries.
 *
 * Note for developers: The three things that you will need to access in your update()
 * method are:
 *   - state.startDate
 *   - state.endDate
 *   - state.selectedCountry
 * NEVER MODIFY THESE PROPERTIES WITHOUT CALLING THE SETTERS!  The setters will take care
 * of error checking and calling the update() method of all the charts.
 */
const DATE_START = new Date('1/22/20'); // min date common to all our datasets
const DATE_END = new Date('4/7/20');     // max date common to all our datasets

const state = {
  startDate: DATE_START,
  endDate: DATE_END,
  selectedCountry: null,

  getStartDateAsStr: function()
  {
    var month = (1 + this.startDate.getMonth()).toString();
    var day  = this.startDate.getDate().toString();
    var year  = this.startDate.getFullYear().toString().slice(2)

    return month + "/" + day + "/" + year;
  },

  getEndDateAsStr: function()
  {
    var month = (1 + this.endDate.getMonth()).toString();
    var day  = this.endDate.getDate().toString();
    var year  = this.endDate.getFullYear().toString().slice(2)

    return month + "/" + day + "/" + year;
  },

  setStartDate: function(date) {
    if (date < this.endDate && date >= DATE_START) {
      this.startDate = date;
    } else if (date > this.endDate && date <= DATE_END) {
      this.startDate = this.endDate;
      this.endDate = date;
    }
    this.updateAll();
  },

  setEndDate: function(date) {
    if (date > this.startDate && date <= DATE_END) {
      this.endDate = date;
    } else if (date < this.startDate && date >= DATE_START) {
      this.endDate = this.startDate;
      this.startDate = date;
    }
    this.updateAll();
  },

  setSelectedCountry: function(country) {
    this.selectedCountry = country;
    this.updateAll();
  },

  updateAll: function() {
    map.update();
    virus.update();
    //stocks.update(); TODO: uncomment when/if stocks.update() is implemented (may not be necessary to update as dates don't change and currently no country data)
  }
};

/*
 * Instantiate Dataset objects
 * ---------------------------
 */
const mapData = new MapData({
  fileNames: ['data/covid_19_data.csv',
              'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json',]
});
const virusData = new VirusData({
  fileNames: ['data/time_series_covid_19_confirmed.csv',
              'data/time_series_covid_19_deaths.csv',
              'data/time_series_covid_19_recovered.csv',]
});
const stocksData = new StocksData({
  files: [ { file:  'data/s_p_500.csv',
             label: 'S&P 500' },
           { file:  'data/dow_jones.csv',
             label: 'DOW JONES' },
           { file:  'data/gold.csv',
             label: 'GOLD' },
           { file:  'data/crude_oil.csv',
             label: 'CRUDE OIL' } ],
  minDate: DATE_START,
  maxDate: DATE_END
});

/*
 * Instantiate Chart objects
 * ---------------------------
 * 1. Choropleth map
 *   - visualize covid-19 statistics per country within a variable date range
 *   - state.startDate and state.endDate are used for the date range
 *
 * 2. Grouped bar chart
 *   - compare covid-19 statistics between countries within a variable date range
 *   - state.startDate and state.endDate are used for the date range
 *
 * 3. Multi-line chart
 *   - visualize stock market changes over a fixed date range
 *   - DATE_START and DATE_END are used for the (fixed) date range
 *   - a brush (will be) used to set state.startDate and state.endDate (TODO)
 */
const map = new Map({
  parentElement: '#map',
  dataset : mapData,
  containerWidth: "100%",
  containerHeight: "100%"
});
const virus = new VirusPlot({
  parentElement: '#virus_plot',
  dataset : virusData,
  containerWidth: "100%",
  containerHeight: "100%"
});
const stocks = new StocksPlot({
  parentElement: '#stocks_plot',
  dataset : stocksData,
  containerWidth: 1200,
  containerHeight: 200,
  margin: { top: 10, bottom: 30, right: 20, left: 50 }
});

/*
 * Initialize and render all the charts
 * ------------------------------------
 * NOTE: each <Chart>.initvis() involves some Promise chaining.
 */
map.initVis();
virus.initVis();
stocks.initVis();

/*
 * The following code is for Alan's chart
 */
$(document).ready(function()
{
    $("#form_virus_display").change(function()
    {
        selected_value = $("input[name='name_virus_display']:checked").val();

        if (selected_value === "confirmed")
        {
            virus.visualize_confirmed = true;
            virus.visualize_dead      = false;
            virus.visualize_recovered = false;
            virus.update();

            map.visualize_confirmed = true;
            map.visualize_dead      = false;
            map.visualize_recovered = false;
            map.update();
        }

        if (selected_value === "dead")
        {
            virus.visualize_confirmed = false;
            virus.visualize_dead      = true;
            virus.visualize_recovered = false;
            virus.update();

            map.visualize_confirmed = false;
            map.visualize_dead      = true;
            map.visualize_recovered = false;
            map.update();
        }

        if (selected_value === "recovered")
        {
            virus.visualize_confirmed = false;
            virus.visualize_dead      = false;
            virus.visualize_recovered = true;
            virus.update();

            map.visualize_confirmed = false;
            map.visualize_dead      = false;
            map.visualize_recovered = true;
            map.update();
        }
    });
});

$(document).ready(function()
{
    $("#form_virus_country").change(function()
    {
        var virus_country_1_val = $("#virus_country_1").val();

        if (MapDict.hasOwnProperty(virus_country_1_val))
        {
            state.setSelectedCountry(MapDict[virus_country_1_val]);
        }
        else
        {
            state.setSelectedCountry(virus_country_1_val);
        }

        state.updateAll();
    });
});
