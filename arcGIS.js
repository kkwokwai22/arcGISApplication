require([
    "esri/Map",
    "esri/views/SceneView",
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/tasks/Geoprocessor",
    "esri/tasks/support/LinearUnit",
    "esri/tasks/support/FeatureSet",
    "dojo/domReady!"
  ],
  function(Map, SceneView, GraphicsLayer, Graphic, Point,
    SimpleMarkerSymbol, SimpleFillSymbol, Geoprocessor,
    LinearUnit, FeatureSet) {

    var gpUrl =
      "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Elevation/ESRI_Elevation_World/GPServer/Viewshed";

    var map = new Map({
      basemap: "hybrid",
      ground: "world-elevation"
    });

    var view = new SceneView({
      container: "viewDiv",
      map: map,
      camera: { // autocasts as new Camera()
        position: [7.59564, 46.06595, 5184],
        tilt: 70
      }
    });

    var graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    var markerSymbol = new SimpleMarkerSymbol({
      color: [255, 0, 0],
      outline: { // autocasts as new SimpleLineSymbol()
        color: [255, 255, 255],
        width: 2
      }
    });

    var fillSymbol = new SimpleFillSymbol({
      color: [226, 119, 40, 0.75],
      outline: { // autocasts as new SimpleLineSymbol()
        color: [255, 255, 255],
        width: 1
      }
    });

    var gp = new Geoprocessor(gpUrl);
    gp.outSpatialReference = { // autocasts as new SpatialReference()
      wkid: 102100
    };
    view.on("click", computeViewshed);

    function computeViewshed(event) {
      graphicsLayer.removeAll();

      var point = new Point({
        longitude: event.mapPoint.longitude,
        latitude: event.mapPoint.latitude
      });

      var inputGraphic = new Graphic({
        geometry: point,
        symbol: markerSymbol
      });

      graphicsLayer.add(inputGraphic);

      var inputGraphicContainer = [];
      inputGraphicContainer.push(inputGraphic);
      var featureSet = new FeatureSet();
      featureSet.features = inputGraphicContainer;

      var vsDistance = new LinearUnit();
      vsDistance.distance = 5;
      vsDistance.units = "miles";

      var params = {
        "Input_Observation_Point": featureSet,
        "Viewshed_Distance": vsDistance
      };

      gp.execute(params).then(drawResultData);
    }

    function drawResultData(result) {
      var resultFeatures = result.results[0].value.features;

      // Assign each resulting graphic a symbol
      var viewshedGraphics = resultFeatures.map(function(feature) {
        feature.symbol = fillSymbol;
        return feature;
      });

      // Add the resulting graphics to the graphics layer
      graphicsLayer.addMany(viewshedGraphics);

      /********************************************************************
       * Animate to the result. This is a temporary workaround
       * for animating to an array of graphics in a SceneView. In a future
       * release, you will be able to replicate this behavior by passing
       * the graphics directly to the goTo function, like the following:
       *
       * view.goTo(viewshedGraphics);
       ********************************************************************/
      view.goTo({
        target: viewshedGraphics,
        tilt: 0
      });
    }
});
