class VirusData
{
    constructor(_config)
    {
        this.availableCountries = [];
        this.availableDates     = [];

        this.covidDataConfirmed = _config.fileNames[0];
        this.covidDataDeaths    = _config.fileNames[1];
        this.covidDataRecovered = _config.fileNames[2];

        this.cleanedCovidDataConfirmed = [];
        this.cleanedCovidDataDeaths    = [];
        this.cleanedCovidDataRecovered = [];

        this.dataAvailable = false;
    }

    initialize()
    {
        let dataset = this;

        return Promise.all([
            d3.csv(dataset.covidDataConfirmed),
            d3.csv(dataset.covidDataDeaths),
            d3.csv(dataset.covidDataRecovered),
        ]).then(files =>
        {
            dataset.cleanedCovidDataConfirmed = dataset.cleanCovidTimeSeries(files[0]);
            dataset.cleanedCovidDataDeaths    = dataset.cleanCovidTimeSeries(files[1]);
            dataset.cleanedCovidDataRecovered = dataset.cleanCovidTimeSeries(files[2]);

            dataset.dataAvailable = true;
            return dataset;
        });
    }

    cleanCovidTimeSeries(file)
    {
        // All the time series data takes on the same format.
        // TODO: clean data
        var countries_temp = new Set();

        var countries_outp = [];

        // step 1) here we are doing cleaning of the data
        file.forEach((d) =>
        {
            d["Province/State"] =  d["Province/State"].trim();
            d["Country/Region"] =  d["Country/Region"].trim();
            d["Lat"]            = +d["Lat"];
            d["Long"]           = +d["Long"];
            d["People"]         = [];

            for (var index in d)
            {
                if (!d.hasOwnProperty(index))
                {
                    continue;
                }

                if (index !== "Province/State" &&
                    index !== "Country/Region" &&
                    index !== "Lat"            &&
                    index !== "Long"           &&
                    index !== "People")
                {
                    var element_1 = index;
                    var element_2 = +d[index];
                    var element_p = [element_1, element_2];

                    d["People"].push(element_p);
                    delete d[index];
                }
            }

            if (d["Country/Region"] !== "")
            {
                countries_temp.add(d["Country/Region"]);
            }
        });

        // step 2) here we are doing grouping of the data
        countries_temp.forEach((c) =>
        {
            var country_name = c;
            var country_data = {};
            var country_arry = [];

            var country_min  = 0;
            var country_max  = 0;

            file.forEach((d) =>
            {
                if (d["Country/Region"] === country_name)
                {
                    var temp_min = 0;
                    var temp_max = 0;

                    d["People"].forEach((p) =>
                    {
                        var old_number = country_data[p[0]] || 0;
                        var new_number = old_number + p[1];

                        country_data[p[0]] = Math.max(new_number, temp_max);

                        if (country_max < new_number)
                        {
                            country_max = new_number;
                        }

                        if (temp_max < new_number)
                        {
                            temp_max = new_number;
                        }
                    });
                }
            });

            for (var index in country_data)
            {
                if (!country_data.hasOwnProperty(index))
                {
                    continue;
                }

                country_arry.push([index, country_data[index]]);
            }

            countries_outp.push({"name":country_name,
                                 "data":country_arry,
                                 "min" :country_min,
                                 "max" :country_max});
        });

        // step 3) here we are doing aggregating of the data
        var countries_total_array = [];
        var countries_total_initd = false;

        var countries_total_min   = 0;
        var countries_total_max   = 0;

        countries_outp.forEach(country =>
        {
            if (!countries_total_initd)
            {
                for (var i=0; i<country.data.length; i++)
                {
                    countries_total_array.push(country.data[i].slice());

                    this.availableDates.push(country.data[i][0]);
                }

                countries_total_max   = country.max;
                countries_total_initd = true;
            }

            else
            {
                for (var i=0; i<country.data.length; i++)
                {
                    countries_total_array[i][1] += country.data[i][1];
                }

                countries_total_max   += country.max;
                countries_total_initd  = true;
            }
        });

        countries_outp.push({"name":"Worldwide",
                             "data":countries_total_array,
                             "min" :countries_total_min,
                             "max" :countries_total_max});

        this.availableCountries = Array.from(countries_temp);

        var virus_country_1 = $("#virus_country_1")[0];

        virus.config.dataset.availableCountries.forEach(c =>
        {
            var option_1 = document.createElement("option");
            option_1.value     = c;
            option_1.innerHTML = c;
            virus_country_1.appendChild(option_1);
        });

        $("#virus_country_1").val("Mainland China");

        return countries_outp;
    }
}
