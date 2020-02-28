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

#### Sample configuration
```json
"Config": {
    "scaleMultiplier": 3,
    "enableRotation": false,
    "basemapId": "streets"
}
```

| Property            | Type    | Possible Values               | Default       | Description                                                                                                                   |
|---------------------|---------|-------------------------------|---------------|-------------------------------------------------------------------------------------------------------------------------------|
| scaleMultiplier     | Number  |                               | ```15```      | The scale multiplier between the map and the overview map.                                                                     |
| enableRotation      | Boolean | ```true``` &#124; ```false``` | ```false```   | Enable rotation of the overview map.                                                                                          |
| basemapId           | String  |                               | ```streets``` | Choose one of the well known basemap IDs: https://developers.arcgis.com/javascript/latest/api-reference/esri-Map.html#basemap |
