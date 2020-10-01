/* global L */ // JS Hint
var map;
$(document).ready(function () {
    initmap();
});

function initmap() {
    var lat = 30.2887;
    var lng = 71.5279;
    var zoom = 15;
    // set up the map
    map = new L.Map("map");
    map.setView(new L.LatLng(lat, lng), zoom);
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
    addControlsToMap(map);
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

function addControlsToMap(map) {
// Creating scale control
    var scale = L.control.scale();
// Adding scale control to the map
    scale.addTo(map);
    var url = "http://localhost:8080/geoserver/cite/wms?service=WFS&version=1.2.0&request=GetFeature&typeName=cite:M_Q_R_Combined&PROPERTYNAME=Sector&CQL_FILTER=Sector='P'&outputformat=application/json";
    $.ajax({
        url: url,
        success: function (data, status, xhr) {


        },
        error: function (xhr, status, error) {

        }
    });


}

