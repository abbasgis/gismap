/* global L */ // JS Hint
var map;
$(document).ready(function () {
    initmap();
    $('.selectpicker').selectpicker('refresh');
});

function initmap() {
    var lat = 30.2887;
    var lng = 71.5279;
    var zoom = 15;
    // set up the map
    map = new L.Map("map");
    map.setView(new L.LatLng(lat, lng), zoom);
    var scale = L.control.scale();
    scale.addTo(map);
    // map.addLayer(Stamen_Terrain);
    var baseLayers = addBaseLayersToMap(map);
    var cities = L.layerGroup();
    var wmsLayer = L.tileLayer.betterWms("http://localhost:8080/geoserver/cite/wms", {
        layers: 'cite:M_Q_R_Combined',
        format: 'image/png',
        transparent: true,
        version: '1.1.0',
        bounds: L.latLngBounds([[30.28056087120769, 71.5560788458804,], [30.306495782960003, 71.59549827154979]])

    });
    map.addLayer(wmsLayer);
    map.fitBounds(wmsLayer.options.bounds);
    var overlays = {
        "Cities": wmsLayer
    };

    L.control.layers(baseLayers, overlays).addTo(map);

}

function addBaseLayersToMap(map) {
    var googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });
    var googleHybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });
    map.addLayer(googleHybrid);
    var googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });
    var baseMaps = {
        "Hybrid": googleHybrid,
        "Streets": googleStreets,
        "Sattlite": googleSat
    };
    return baseMaps;

}

function addPlotsToComboOnSectorChange() {
// Creating scale control


}

$('#cmb_sectors').on('change', function (e) {
    var val = $('#cmb_sectors').val();
    var url = "http://localhost:8080/geoserver/cite/wms?service=WFS&version=1.2.0&request=GetFeature&typeName=cite:M_Q_R_Combined&CQL_FILTER=Sector='" + val + "'&outputformat=application/json";
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