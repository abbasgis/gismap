/* global L */ // JS Hint
var map;
$(document).ready(function () {
    initmap();
    comboChangeManagement();
    $('.selectpicker').selectpicker('refresh');
});

function initmap() {
    var format = 'image/png';
    var bounds = [3085030.1931152344, 674252.6356214079,
        3088877.666502936, 677207.5471191406];
    var untiled = new ol.layer.Image({
        title: "Drone Imagery",
        type: 'base',
        visible: true,
        source: new ol.source.ImageWMS({
            ratio: 1,
            url: 'http://localhost:9012/geoserver/cite/wms',
            params: {
                'FORMAT': format,
                'VERSION': '1.1.1',
                "LAYERS": 'cite:M_Q_R_Combined2',
                "exceptions": 'application/vnd.ogc.se_inimage',
            }
        })
    });
    var tiled = new ol.layer.Image({
        visible: true,
        title: "Sectors",
        preload: Infinity,
        source: new ol.source.ImageWMS({
            ratio: 1,
            url: 'http://localhost:9012/geoserver/cite/wms',
            params: {
                'FORMAT': format,
                'VERSION': '1.1.1',
                "LAYERS": 'cite:M_Q_R_Combined',
                "exceptions": 'application/vnd.ogc.se_inimage',
            }
        })
    });
    var projection = new ol.proj.Projection({
        code: 'EPSG:404000',
        units: 'degrees',
        global: false
    });
    var map = new ol.Map({
        controls: getControls(),
        target: 'map',
        layers: [
            new ol.layer.Group({
                title: 'Basemap',
                layers: [
                    untiled
                ]
            }),
            new ol.layer.Group({
                title: 'Overlays',
                layers: [
                    tiled
                ]
            }),

        ],
        view: new ol.View({
            projection: projection
        })
    });
    map.getView().on('change:resolution', function (evt) {
        var resolution = evt.target.get('resolution');
        var units = map.getView().getProjection().getUnits();
        var dpi = 25.4 / 0.28;
        var mpu = ol.proj.METERS_PER_UNIT[units];
        var scale = resolution * mpu * 39.37 * dpi;
        if (scale >= 9500 && scale <= 950000) {
            scale = Math.round(scale / 1000) + "K";
        } else if (scale >= 950000) {
            scale = Math.round(scale / 1000000) + "M";
        } else {
            scale = Math.round(scale);
        }
        // document.getElementById('scale').innerHTML = "Scale = 1 : " + scale;
    });
    map.getView().fit(bounds, map.getSize());
    map.addControl(new ol.control.ZoomToExtent({
        extent: map.getView().calculateExtent(map.getSize())
    }));
    map.on('singleclick', function (evt) {
        var view = map.getView();
        var viewResolution = view.getResolution();
        var source = untiled.get('visible') ? untiled.getSource() : tiled.getSource();
        var url = source.getGetFeatureInfoUrl(
            evt.coordinate, viewResolution, view.getProjection(),
            {'INFO_FORMAT': 'text/html', 'FEATURE_COUNT': 50});
        if (url) {
            // document.getElementById('nodelist').innerHTML = '<iframe seamless src="' + url + '"></iframe>';
        }
    });

}

function getControls() {
    var controls = ol.control.defaults().extend([
        // new ol.control.ZoomSlider(),
        new ol.control.Rotate(),
        new ol.control.FullScreen(),
        new ol.control.LayerSwitcher({
            tipLabel: 'Légende' // Optional label for button
        }),
        new ol.control.ScaleLine({
            // units: 'metric',
            // target: document.getElementById('scale-line'),
            // className: 'custom-scale-position',
            bar: true,
            steps: 5,
            text: true,
            minWidth: 140

        }),
        // new ol.control.FullScreen({source: fullScreenTarget}),

    ]);
    return controls;
}

function comboChangeManagement() {
    $('#cmb_sectors').on('change', function (e) {
        var val = $('#cmb_sectors').val();
        var url = "http://localhost:9012/geoserver/cite/wms?service=WFS&version=1.2.0&request=GetFeature&typeName=cite:M_Q_R_Combined&CQL_FILTER=Sector='" + val + "'&outputformat=application/json";
        $.ajax({
            url: url,
            success: function (data, status, xhr) {
                $('#cmb_plots').empty();
                var f = data.features;
                if (f.length > 0) {
                    for (var key in f) {
                        var prop = f[key].properties;
                        var txtOption = '<option value="' + prop.Plot_No + '"';
                        txtOption += '>' + prop.Plot_No + '</option>';
                        $('#cmb_plots').append(txtOption);
                    }

                }
                $('.selectpicker').selectpicker('refresh');

            },
            error: function (xhr, status, error) {

            }
        });
    });
}