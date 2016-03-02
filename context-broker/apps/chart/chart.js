/* eslint-disable */

var config = {
	entityId: 'lab',
	attributeName: 'brightness',
	chart: {
		title: 'Light Intensity',
		subtitle: 'Live room brightness reported by an Arduino YUN',
		axis: {
			title: 'Light intensity percentage',
			unit: '%'
		},
		seriesTitle: 'Arduni YUN'
	}
};

var previousItemCount = 0;

$('#container').highcharts({
	chart: {
		// type: 'spline',
		zoomType: 'x',
		events: {
			load: function() {
				var series = this.series[0];

				setInterval(function() {
					$.get('/info/' + config.entityId, function(response) {
						var attributes = response.contextResponses[0].contextElement.attributes;
						var data = attributes[config.attributeName + '-history'].value.map(function(item) {
							return [(new Date(item[0])).getTime(), Number.parseInt(item[1], 10)]
						});
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
	xAxis: {
		type: 'datetime'
	},
	yAxis: {
		title: {
			text: config.chart.axis.title
		},
		labels: {
			formatter: function() {
				return this.value + config.chart.axis.unit;
			}
		},
		floor: 0,
		ceiling: 100
	},
	plotOptions: {
		area: {
			fillColor: {
				linearGradient: {
					x1: 0,
					y1: 0,
					x2: 0,
					y2: 1
				},
				stops: [
					[0, Highcharts.getOptions().colors[0]],
					[1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
				]
			},
			marker: {
				radius: 2
			},
			lineWidth: 1,
			states: {
				hover: {
					lineWidth: 1
				}
			},
			threshold: null
		}
	},
	tooltip: {
		formatter: function () {
			var date = new Date(this.x);
			var formattedDate = Highcharts.dateFormat('%d.%m.%Y %H:%M', date);

			return '<small>' + formattedDate + '</small><br/><b>Intensity: ' + Highcharts.numberFormat(this.y, 1) + '%</b>'
		}
	},
	series: [{
		type: 'area',
		name: config.chart.seriesTitle,
		data: []
	}],
	legend: {
		enabled: false
	}
});