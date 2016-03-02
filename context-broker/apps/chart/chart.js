/* eslint-disable */

var config = {
	entityId: 'lab',
	attributeName: 'brightness',
	chart: {
		title: 'Light Intensity',
		subtitle: 'Live light brightness reported by an Arduino YUN',
		axis: {
			title: 'Light brightness percentage',
			unit: '%'
		},
		seriesTitle: 'Arduni YUN'
	}
};

var previousItemCount = 0;

$('#container').highcharts({
	chart: {
		type: 'spline',
		events: {
			load: function() {
				var series = this.series[0];

				setInterval(function() {
					$.get('/info/' + config.entityId, function(response) {
						var attributes = response.contextResponses[0].contextElement.attributes;
						var data = attributes[config.attributeName + '-history'].value.map((value) => Number.parseFloat(value));
						var currentItemCount = Number.parseInt(attributes[config.attributeName + '-count'].value, 10);
						var newItemCount = currentItemCount - previousItemCount;
						var newItems = data.slice(data.length - newItemCount);

						if (previousItemCount === 0) {
							series.setData(data);
						} else {
							newItems.forEach((newItem) => {
								series.addPoint(newItem);
							});
						}

						previousItemCount = currentItemCount;
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
	tooltip: {
		formatter: function () {
			return '<b>' + Highcharts.numberFormat(this.y, 1) + '%'
		}
	},
	series: [{
		name: config.chart.seriesTitle,
		data: []
	}]
});