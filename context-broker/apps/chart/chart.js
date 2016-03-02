/* eslint-disable */

var config = {
	entityId: 'lab',
	attributeName: 'temperature-history',
	chart: {
		title: 'Light Intensity',
		subtitle: 'Live light brightness reported by an Arduino YUN',
		axis: {
			title: 'Light brightness percentage',
			unit: '%'
		},
		seriesTitle: 'Arduni YUN @ Lai 29'
	}
};

$('#container').highcharts({
	chart: {
		type: 'spline',
		events: {
			load: function() {
				var series = this.series[0];

				setInterval(function() {
					$.get('/info/' + config.entityId, function(response) {
						var attributes = response.contextResponses[0].contextElement.attributes;
						var data = JSON.parse(attributes[config.attributeName].value);

						console.log('data', data);

						series.setData(data);
					});
				}, 1000);
			}
		}
	},
	title: {
		text: config.chart.title
	},
	subtitle: {
		text: config.chart.subtitle
	},
	yAxis: {
		title: {
			text: config.chart.axis.title
		},
		labels: {
			formatter: function() {
				return this.value + config.chart.axis.unit;
			}
		}
	},
	series: [{
		name: config.chart.seriesTitle,
		data: []
	}]
});