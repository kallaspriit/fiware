/* eslint-disable */

$('#container').highcharts({
	chart: {
		type: 'spline',
		events: {
			load: function() {
				var series = this.series[0];

				setInterval(function() {
					$.get('/info/lab', function(response) {
						var attributes = response.contextResponses[0].contextElement.attributes;
						var temperatureHistory = JSON.parse(attributes['temperature-history'].value);

						console.log('info', temperatureHistory);

						series.setData(temperatureHistory);
					});
				}, 1000);
			}
		}
	},
	title: {
		text: 'Temperature Chart'
	},
	subtitle: {
		text: 'Live data fetched from FIWARE populated by an Arduino YUN'
	},
	/*
	xAxis: {
		categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
		'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	},
	*/
	yAxis: {
		title: {
			text: 'Temperature in degrees celsius'
		},
		labels: {
			formatter: function() {
				return this.value + '°';
			}
		}
	},
	tooltip: {
		crosshairs: true,
			shared: true
		},
		plotOptions: {
			spline: {
				marker: {
					radius: 4,
					lineColor: '#666666',
					lineWidth: 1
				}
			}
		},
		series: [{
			name: 'Arduni YUN @ Stagnation Lab',
			marker: {
				symbol: 'square'
			},
			data: []
		}]
	}
);