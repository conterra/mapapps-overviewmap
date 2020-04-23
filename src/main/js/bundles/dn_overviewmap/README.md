# dn_overviewmap
The Overview Map gives better orientation to the user by showing the current extent of the map in a smaller scaled map within a separated window.

## Usage
**Requirement: map.apps 4.4.0**

1. First you need to add the bundle dn_overviewmap to your app.
2. Then you can configure it.

To make the functions of this bundle available to the user, the following tool can be added to a toolset:

| Tool ID               | Component             | Description              |
|-----------------------|-----------------------|--------------------------|
| overviewMapToggleTool | overviewMapToggleTool | Show or hide the widget. |

## Configuration Reference

### Config

#### Sample configurations
```
"Config": {
    // dynamic scale
    "scaleMultiplier": 15,
    // well known basemap ID
    "basemap": "topo",
    "mapViewUiComponents": ["attribution"],
    "enableRotation": false
}
```
```
"Config": {
    // fixed scale
    "fixedScale": 5000000,
    // wms basemap
    "basemap": {
        "title": "BKG WebAtlasDE - Grau",
        "url": "http://sg.geodatenzentrum.de/wmts_webatlasde.light_grau",
        "type": "WMTS"
    },
    "mapViewUiComponents": [],
    "enableRotation": false
}
```

| Property            | Type                 | Possible Values               | Default               | Description                                                                                                                                             |
|---------------------|----------------------|-------------------------------|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| scaleMultiplier     | Number               |                               | ```15```              | The scale multiplier between the map and the overview map.                                                                                              |
| fixedScale          | Number               |                               | ```null```            | Set fix overview map scale. If set scaleMultiplier will be ignored.                                                                                     |
| enableRotation      | Boolean              | ```true``` &#124; ```false``` | ```false```           | Enable rotation of the overview map.                                                                                                                    |
| basemap             | String &#124; Object |                               | ```streets```         | Choose one of the well known basemap IDs (https://developers.arcgis.com/javascript/latest/api-reference/esri-Map.html#basemap) or an own basemap config |
| mapViewUiComponents | Array                |                               | ```[]```              | Add possible UI components to the overview map (https://developers.arcgis.com/javascript/latest/api-reference/esri-views-ui-DefaultUI.html#components)  |
