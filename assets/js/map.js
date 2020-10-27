/* global L */ // JS Hint
var map;
var selection_layer;
$(document).ready(function () {
    map = initmap();
    createSelectionLayer(map);
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
        var source = tiled.get('visible') ? tiled.getSource() : tiled.getSource();
        var url = source.getGetFeatureInfoUrl(
            evt.coordinate, viewResolution, view.getProjection(),
            {'INFO_FORMAT': 'application/json', 'FEATURE_COUNT': 1});
        $.ajax({
            url: url,
            success: function (data, status, xhr) {
                var f = data.features;
                if(f.length > 0){
                selectAndZoomFeature(f[0]);
                }else{
                    alert("No Record Found")
                }
            },
            error: function (xhr, status, error) {

            }
        });
        // if (url) {
        //     document.getElementById('nodelist').innerHTML = '<iframe seamless src="' + url + '"></iframe>';
        // }
    });
    return map;
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

var features = [];

function comboChangeManagement() {
    $('#cmb_sectors').on('change', function (e) {
        features = [];
        var val = $('#cmb_sectors').val();
        var url = "http://localhost:9012/geoserver/cite/wms?service=WFS&version=1.2.0&request=GetFeature&typeName=cite:M_Q_R_Combined&CQL_FILTER=Sector='" + val + "'&outputformat=application/json";
        $.ajax({
            url: url,
            success: function (data, status, xhr) {
                $('#cmb_plots').empty();
                features = data.features;
                var f = features;
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
    $('#cmb_plots').on('change', function (e) {
        var plot_no = $('#cmb_plots').val();
        var feature = getPlotDetailFromFeatureArray(features, plot_no);
        selectAndZoomFeature(feature);
    });
}

function createSelectionLayer(map) {

    selection_layer = new ol.layer.Vector({
        displayInLayerSwitcher: true,
        title: 'Selection Layer',
        source: new ol.source.Vector({
            features: []
        }),

        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#ffcc33',
                width: 2
            }),
        })
    });
    map.addLayer(selection_layer);
    selection_layer.set('name', 'selectLayer');

}

function getPlotDetailFromFeatureArray(features, plot) {
    var feature = null;
    for (var i = 0; i < features.length; i++) {
        var prop_plot_no = features[i].properties.Plot_No
        if (prop_plot_no == plot) {
            return features[i];
        }
    }
    return feature
}

function selectAndZoomFeature(feature) {
    setAttributeValues(feature.properties);
    var selectionSource = selection_layer.getSource();
    selection_layer.getSource().clear();
    var f = (new ol.format.GeoJSON()).readFeatures(feature);
    selectionSource.addFeatures(f);
    var extent = selectionSource.getExtent();
    map.getView().fit(extent, map.getSize());
}

function setAttributeValues(prop) {
    $("#sector").text(prop.Sector);
    $("#plot_no").text(prop.Plot_No);
    $("#plot_type").text(prop.Type);
}