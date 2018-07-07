var map;
var markers;
Maps = (function() {

  var zoom = 11;
  var center = [ 30.2672, -97.7431];
  //var map;
  markers = {};
  paths = {};
  var viewWidth;
  var viewHeight;
  var boundaries;
  
  //NOTES 
  // show/hide using options.opacity 
  // title using options.title
  // make a path... ?
  ////// SETUP MAP //////
  
  function setupInterface() {
    viewWidth = parseFloat($(".netlogo-canvas").css("width"));
    viewHeight = parseFloat($(".netlogo-canvas").css("height"));
    var spanText =    "<div id='mapContainer'></div>";
    $(".netlogo-widget-container").append(spanText);
    $("#mapContainer").css("width", parseFloat($(".netlogo-canvas").css("width")) - 2 + "px");
    $("#mapContainer").css("height", parseFloat($(".netlogo-canvas").css("height"))  - 2 + "px");
    $("#mapContainer").css("left", parseFloat($(".netlogo-view-container").css("left")) + 0 + "px");
    $("#mapContainer").css("top", parseFloat($(".netlogo-view-container").css("top")) + 0 + "px");
    //$("#mapContainer").css("display", "none");
    $("#mapContainer").css("display","inline-block");
    if (L) {
      map = L.map('mapContainer').setView([ 30.2672, -97.7431], 11);      
      if (map) { 
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        updateMap();
      }
    }
    setupEventListeners();
    //hideMap();
    //sendToBack();
    $("#mapContainer").css("display","none");
    $(".netlogo-view-container").css("pointer-events","none");
  }

  function setupEventListeners() {
    $(".netlogo-view-container").css("background-color","transparent"); 
    //map.on('dragend', function onDragEnd(){
    //  updateMap();
    //});
  }
  
  ////// DISPLAY MAP //////
  
  function updateMap() {
    var bounds = map ? map.getBounds() : { "_northEast": {"lat": 0, "lng": 0}, "_southWest": {"lat": 0, "lng": 0}};
    var yMax = bounds._northEast.lng;
    var xMax = bounds._northEast.lat;
    var yMin = bounds._southWest.lng;
    var xMin = bounds._southWest.lat;
    boundaries = {xmin: xMin, xmax: xMax, ymin: yMin, ymax: yMax};
  }


  ////// COORDINATE CONVERSION //////
  
  function patchToLatlng(coords) {
    var xcor = coords[0];
    var ycor = coords[1];
    var pixelX = universe.view.xPcorToCanvas(xcor);
    var pixelY = universe.view.yPcorToCanvas(ycor);
    var pixelPercentY = (pixelX / (viewWidth * 2));
    var pixelPercentX = 1 - (pixelY / (viewHeight * 2));
    var boundaryMinX = boundaries.xmin;
    var boundaryMinY = boundaries.ymin;
    var boundaryMaxX = boundaries.xmax;
    var boundaryMaxY = boundaries.ymax;
    //console.log(boundaries);
    var markerX = (pixelPercentX * (boundaryMaxX - boundaryMinX)) + boundaryMinX;
    var markerY = (pixelPercentY * (boundaryMaxY - boundaryMinY)) + boundaryMinY;
    return ([markerX, markerY]);
  }
  
  function latlngToPatch(coords) {
    var markerPositionX = coords[0];
    var markerPositionY = coords[1];
    var boundaryMinX = boundaries.xmin;
    var boundaryMinY = boundaries.ymin;
    var boundaryMaxX = boundaries.xmax;
    var boundaryMaxY = boundaries.ymax;
    //console.log(boundaries);
    if ( markerPositionX < boundaryMinX 
      || markerPositionX > boundaryMaxX
      || markerPositionY < boundaryMinY
      || markerPositionY > boundaryMaxY) {
      return (["out of bounds"]);
    }
    var markerPercentY = ((boundaryMaxX - markerPositionX) / (boundaryMaxX - boundaryMinX));
    var markerPercentX = 1 - (boundaryMaxY - markerPositionY) / (boundaryMaxY - boundaryMinY);
    var pixelX = markerPercentX * viewWidth;
    var pixelY = markerPercentY * viewHeight;
    var patchXcor = universe.view.xPixToPcor(pixelX);
    var patchYcor = universe.view.yPixToPcor(pixelY);
    return ([patchXcor, patchYcor]);
  }

  ////// SHOW AND HIDE MAP //////
  
  function showMap() {
    map.setView(center, zoom);
    updateMap();
    if (map) { map.invalidateSize(); }
    $("#mapContainer").css("display","inline-block");
    $("#mapContainer").css("z-index","0");
    $(".netlogo-view-container").css("pointer-events","none");
    $(".netlogo-view-container").css("z-index","1");
    $("#opacityWrapper").css("top",parseInt($("#mapContainer").css("top") - 15) + "px");
    $("#opacityWrapper").css("left",$("#mapContainer").css("left"));
    $("#opacityWrapper").css("display", "inline-block");
    drawPatches = false;
    map.invalidateSize()
    world.triggerUpdate();
  }
  
  function hideMap() {
    $("#mapContainer").css("display","none");
    $("#mapContainer").css("z-index","1");
    $(".netlogo-view-container").css("pointer-events","auto");
    $(".netlogo-view-container").css("z-index","0");
    $("#opacityWrapper").css("display", "none");
    drawPatches = true;
    world.triggerUpdate();
  }

  ////// MAP SETTINGS //////
  
  function setZoom(value) {
    zoom = value;
    map.setZoom(zoom);
  }
  
  function getZoom() {
    zoom = map.getZoom();
    return zoom;
  }
  
  function setCenterLatlng(value) {
    center = L.latLng(value[0], value[1]);
    zoom = map.getZoom();
    map.setView(center, zoom);
  }
  
  function getCenterLatlng() {
    center = map.getCenter();
    return [center.lat, center.lng];
  }
  
  //////// MARKERS //////////
  
  function createMarker(name, settings) {
    if (!markers[name]) { markers[name] = {}; }
    var newLatlng = L.latLng(settings[0], settings[1]);
    markers[name].latlng = newLatlng;
    map ? markers[name].marker = L.marker(newLatlng).addTo(map) : null;
    //markers[name].marker = leafletMarker;
  }
  
  function createMarkers(data) {
    for (var i=0; i<data.length; i++) {
      createMarker(data[i][0], data[i][1]);
    }
  }
  
  function getMarker(name) {
    return [name, getLatlng(name)];
  }
  
  function getMarkers() {
    var markerList = [];
    for (var key in markers) {
      markerList.push(getMarker(key));
    }
    return markerList;
  }
  
  function deleteMarker(name) {
    if (markers[name] && markers[name].marker) {
      hideObject(name);
      //map.removeLayer(markers[name].marker);
      delete markers[name];
    }
  }
  
  function deleteMarkers() {
    for (marker in markers) {
      deleteMarker(marker);
    }
  }
  
  ///////// MARKER ATTRIBUTES /////////
  
  function setLat(name, lat) {
    if (markers[name] && markers[name].marker) {
      var lng = markers[name].marker.getLatLng().lng;
      markers[name].marker.setLatLng(L.latLng(lat, lng));
    }
  }
  
  function setLng(name, lng) {
    if (markers[name] && markers[name].marker) {
      var lat = markers[name].marker.getLatLng().lat;
      markers[name].marker.setLatLng(L.latLng(lat, lng));
    }
  }
  function setLatlng(name, latlng) {
    if (markers[name] && markers[name].marker) {
      markers[name].marker.setLatLng(L.latLng(latlng[0], latlng[1]));
    }
  }
  function getLat(name) {
    if (markers[name] && markers[name].marker) {
      return markers[name].marker.getLatLng().lat;
    }
    return 0;
  }
  function getLng(name) {
    if (markers[name] && markers[name].marker) {
      return markers[name].marker.getLatLng().lng;
    }
    return 0;
  }
  function getLatlng(name) {
    if (markers[name] && markers[name].marker) {
      return [ markers[name].marker.getLatLng().lat, markers[name].marker.getLatLng().lng];
    }
    return [0, 0];
  }
  
    ///////// PATHS /////////
  
  function createPath(name, vertices) {
    var latlngs = vertices;
    paths[name] = {};
    paths[name].latlngs = latlngs;
    paths[name].color = "#000000";
    paths[name].polyline = L.polyline(latlngs, {color: paths[name].color});
    map.addLayer(paths[name].polyline);
  }

  function createPaths(paths) {
    for (var i=0; i<paths.length; i++) {
      createPath[paths[i][0], paths[i][1]];
    }
  }
  
  function hidePath(name) {
    hideObject(name);
    //map.removeLayer(paths[name]);
  }
  
  function showPath(name) {
    showObject(name);
    //map.addLayer(paths[name]);
  }
  
  function deletePath(name) {
    if (paths[name] && paths[name].polyline) {
      hideObject(name);
      delete paths[name];
    }
  }
  
  function deletePaths() {
    for (path in paths) {
      deletePath(path);
    }
  }
  
  ///////// PATH ATTRIBUTES /////////
    
  function setPathColor(name, color) {
    if (paths[name]) {
      map.removeLayer(paths[name].polyline);
      paths[name].color = color;
      paths[name].polyline = L.polyline(paths[name].latlngs, {color: color});
      map.addLayer(paths[name].polyline);
    }
  } 
  
  function getPathColor(name) {
    if (paths[name] && paths[name].color) {
      return paths[name].color;
    } else {
      return "#000000";
    }
  } 
  
  function getPathVertices(name) {
    if (paths[name]) {
      return paths[name].latlngs;
    } else {
      return "undefined";
    }
  }
  
  function setPathVertices(name, vertices) {
    var latlngs = vertices;
    if (paths[name]) {
      map.removeLayer(paths[name].polyline);
      paths[name].latlngs = latlngs;
      maps[name].polyline = L.polyline(latlngs, {color: paths[name].color }).addTo(map);
      map.addLayer(maps[name].polyline);
    } else {
      createPath(name, vertices);
    }
  }
  
  ////////// oBJECTS ///////////
  function createObject(objectList) {
    var name = objectList[0];
    var result = JSON.parse(objectList[1]);
    var type = result.type;
    if (type === "marker") {
      createMarker(name, result.latlng);
    } else if (type === "path") {
      createPath(name, result.vertices);
      setPathColor(name, result.color);
    }
  }
  
  function createObjects(objects) {
    for (var i=0; i<objects.length; i++) {
      createObject(objects[i]);
    }
  }
  
  function getObject(name) {
    var result = {};
    if (getObjectType(name) === "marker") {
      result.type = "marker";
      result.latlng = getLatlng(name);
    } else if (getObjectType(name) === "path") {
      result.type = "path";
      result.vertices = getPathVertices(name);
      result.color = getPathColor(name);
    }    
    var resultString = JSON.stringify(result);
    return [ name, resultString ];  
  }

  function getObjects() {
    var objectList = [];
    var name;
    var value;
    for (marker in markers) {
      name = marker;
      value = getObject(name);
      objectList.push(value);
    }
    for (path in paths) {
      name = path;
      value = getObject(name);
      objectList.push(value);
    }
    return objectList;
  }
  
  function deleteObject(name) {
    if (getObjectType(name) === "marker") {
      deleteMarker(name);
    } else if (getObjectType(name) === "path") {
      deletePath(name);
    }
  }
  
  function deleteObjects() {
    deleteMarkers();
    deletePaths();
  }
  
  function getObjectType(name) {
    if (markers[name]) {
      return "marker";
    } else if (paths[name]) {
      return "path";
    } else {
      return "none";
    }  
  }
  
  function objectExists(name) {
    return (markers[name] || paths[name]) ? true : false;
  }
  
  function showObject(name) {
    var objectType = getObjectType(name);
    if (objectType === "path") {
      paths[name].visible = true;
      map.removeLayer(paths[name].polyline);
      map.addLayer(paths[name].polyline);
    } else if (objectType === "marker") {
      markers[name].visible = true;
      map.removeLayer(markers[name].marker);    
      map.addLayer(markers[name].marker);    
    }
  }

  function hideObject(name) {
    var objectType = getObjectType(name);
    if (objectType === "path") {
      paths[name].visible = false;
      map.removeLayer(paths[name].polyline);
    } else if (objectType === "marker") {
      markers[name].visible = false;
      map.removeLayer(markers[name].marker);    
    }
  }
  
  ////////// MAP SETTINGS //////////
  
  function bringToFront() {
    $("#mapContainer").css("z-index","3");
  }
  
  function sendToBack() {
    $("#mapContainer").css("z-index","0"); 
  }

  function setOpacity(value) {
    $("#mapContainer").css("opacity", value);
    $("#opacity").val(value * 100);
  }
  
  function getOpacity() {
    return parseFloat($("#mapContainer").css("opacity"));
  }
  
  function setMapOffset(offset) {
    var top = offset[1] + "px";
    var left = offset[0] + "px";
    $("#mapContainer").css("top", top);
    $("#mapContainer").css("left", left);   
    if (offset.length === 4) {
      var height = offset[3] + "px";
      var width = offset[2] + "px";
      $("#mapContainer").css("height", height);
      $("#mapContainer").css("width", width);   
    }
  }
  
  function getMapOffset() {
    var top = parseInt($("#mapContainer").css("top"));
    var left = parseInt($("#mapContainer").css("left"));
    var height = parseInt($("#mapContainer").css("height"));
    var width = parseInt($("#mapContainer").css("width"));   
    return [ left, top, width, height ]
  }
  
  //////// DATA //////////
  
  function getAll() {
    var data = {};
    data.objects = getObjects();
    data.settings = getSettings();
    console.log(data);
    return JSON.stringify(data);
  }
  function setAll(dataString) {
    data = JSON.parse(dataString);
    console.log(data);
    if (data.objects) { createObjects(data.objects); }
    if (data.settings) { setSettings(data.settings); }
  }
  function getSettings() {
    var data = {};
    data.zoom = getZoom();
    data.centerLatlng = getCenterLatlng();
    return data;
    //return JSON.stringify(data);
  }
  function setSettings(data) {
    //var data = JSON.parse(results); 
    setZoom(data.zoom);
    setCenterLatlng(data.centerLatlng);
  }
  
  return {
    setupInterface: setupInterface,
    showMap: showMap,
    hideMap: hideMap,
    setZoom: setZoom,
    getZoom: getZoom,
    setCenterLatlng: setCenterLatlng,
    getCenterLatlng: getCenterLatlng,
    
    createMarker: createMarker,
    createMarkers: createMarkers,
    getMarker: getMarker,
    getMarkers: getMarkers,
    deleteMarker: deleteMarker,
    deleteMarkers: deleteMarkers,
    
    setLat: setLat,
    setLng: setLng,
    setLatlng: setLatlng,
    getLat: getLat,
    getLng: getLng,
    getLatlng: getLatlng,
    //importFile: importFile,
    //exportFile: exportFile,
    //setData: setData,
    //getData: getData,
    latlngToPatch: latlngToPatch,
    patchToLatlng: patchToLatlng,
    updateMap: updateMap,
    
    createPath: createPath,
    createPaths: createPaths,
    deletePath: deletePath,
    deletePaths: deletePaths,
        
    setPathColor: setPathColor,
    getPathColor: getPathColor,
    setPathVertices: setPathVertices,
    getPathVertices: getPathVertices,
    
    hidePath: hidePath,
    showPath: showPath,
    
    bringToFront: bringToFront,
    sendToBack: sendToBack,
    setOpacity: setOpacity,
    getOpacity: getOpacity,
    setMapOffset: setMapOffset,
    getMapOffset: getMapOffset,
    
    createObject: createObject,
    createObjects: createObjects,
    getObject: getObject,
    getObjects: getObjects,
    deleteObject: deleteObject,
    deleteObjects: deleteObjects,
    getObjectType: getObjectType,
    objectExists: objectExists,
    showObject: showObject,
    hideObject: hideObject,
    
    setAll: setAll,
    getAll: getAll,
  
  };
 
})();