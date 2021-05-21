/*
 * Copyright (C) 2020 con terra GmbH (info@conterra.de)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Observers from "apprt-core/Observers";
import Vue from "apprt-vue/Vue";
import VueDijit from "apprt-vue/VueDijit";
import OverviewMapWidget from "./OverviewMapWidget.vue";
import Map from "esri/Map";
import MapView from "esri/views/MapView";
import Graphic from "esri/Graphic";
import Polygon from "esri/geometry/Polygon";
import {rotate} from "esri/geometry/geometryEngine";

export default class OverviewMapWidgetFactory {

    #overviewMapView = null;
    #observers = null;
    #mapObservers = null;

    activate() {
        this.#observers = Observers();
        this.#mapObservers = Observers();
    }

    deactivate() {
        this.#observers.clean();
        this.#mapObservers.clean();
    }

    createInstance() {
        const vm = new Vue(OverviewMapWidget);
        const widget = VueDijit(vm);

        widget.onToolActivated = () => {
            const overviewMapView = this.#overviewMapView;
            this._connectView(overviewMapView);
        };
        widget.onToolDeactivated = () => {
            this._disconnectView();
        };

        widget.own({
            remove() {
                widget.onToolActivated = widget.onToolDeactivated = undefined;
            }
        });

        // listen to vue widget startup
        vm.$on("startup", () => {
            const overviewMapDiv = vm.$refs.overviewmap;
            this._createOverviewMap(overviewMapDiv);
        });

        return widget;
    }

    async _createOverviewMap(div) {
        const properties = this._properties;
        const mapWidgetModel = this._mapWidgetModel;
        const basemapConfig = properties.basemap || properties.basemapId;
        const overviewMap = new Map({
            basemap: await this._parseBasemapConfig(basemapConfig)
        });
        const mapViewUiComponents = properties.mapViewUiComponents || [];
        const overviewMapView = this.#overviewMapView = new MapView({
            map: overviewMap,
            container: div,
            popup: {autoOpenEnabled: false},
            ui: {
                components: mapViewUiComponents
            },
            spatialReference: mapWidgetModel.spatialReference
        });
        this._disableViewEvents(overviewMapView);
        this._listenOnClickEvent(overviewMapView);
        this._connectView(overviewMapView);
    }

    async _parseBasemapConfig(basemapConfig) {
        return this._basemapConfigParser.parse(basemapConfig || "streets").then(({instance}) => instance);
    }

    _listenOnClickEvent(view) {
        const observers = this.#observers;
        observers.add(view.on("click", (event) => {
            this._mapWidgetModel.center = event.mapPoint;
        }));
    }

    _disableViewEvents(view) {
        const observers = this.#observers;
        observers.add(view.on("key-down", (event) => {
            event.stopPropagation();
        }));
        observers.add(view.on("mouse-wheel", (event) => {
            event.stopPropagation();
        }));
        observers.add(view.on("double-click", (event) => {
            event.stopPropagation();
        }));
        observers.add(view.on("double-click", ["Control"], (event) => {
            event.stopPropagation();
        }));
        observers.add(view.on("drag", (event) => {
            event.stopPropagation();
        }));
        observers.add(view.on("drag", ["Shift"], (event) => {
            event.stopPropagation();
        }));
        observers.add(view.on("drag", ["Shift", "Control"], (event) => {
            event.stopPropagation();
        }));
    }

    _connectView(overviewMapView) {
        if (!overviewMapView) {
            return;
        }
        this._disconnectView();

        const observers = this.#mapObservers;
        const mapWidgetModel = this._mapWidgetModel;
        const properties = this._properties;
        const scaleMultiplier = properties.scaleMultiplier;
        const fixedScale = properties.fixedScale;

        overviewMapView.scale = fixedScale || mapWidgetModel.scale * scaleMultiplier;
        observers.add(mapWidgetModel.watch("scale", ({value}) => {
            overviewMapView.scale = fixedScale || value * scaleMultiplier;
        }));

        overviewMapView.center = mapWidgetModel.center;
        observers.add(mapWidgetModel.watch("center", ({value}) => {
            overviewMapView.center = value;
        }));

        if (properties.enableRotation) {
            if (mapWidgetModel.camera) {
                overviewMapView.rotation = -mapWidgetModel.camera.heading;
            } else {
                overviewMapView.rotation = mapWidgetModel.camera;
            }
            observers.add(mapWidgetModel.watch("rotation", ({value}) => {
                overviewMapView.rotation = value;
            }));
            observers.add(mapWidgetModel.watch("camera", ({value}) => {
                overviewMapView.camera = -value.heading;
            }));
        }

        this._addExtentGraphicToView(mapWidgetModel.extent, overviewMapView);
        observers.add(mapWidgetModel.watch("extent", ({value}) => {
            if (value) {
                const extent = value.clone();
                this._addExtentGraphicToView(extent, overviewMapView);
            }
        }));
    }

    _disconnectView() {
        this.#mapObservers?.clean();
    }

    _getPolygonFromExtent(extent) {
        return new Polygon({
            hasZ: false,
            hasM: false,
            spatialReference: extent.spatialReference,
            rings: [[
                [extent.xmax, extent.ymax],
                [extent.xmax, extent.ymin],
                [extent.xmin, extent.ymin],
                [extent.xmin, extent.ymax],
                [extent.xmax, extent.ymax]
            ]]
        });
    }

    _addExtentGraphicToView(extent, view) {
        if (!extent) {
            return;
        }
        const mapWidgetModel = this._mapWidgetModel;
        view.graphics.removeAll();
        let polygon = this._getPolygonFromExtent(extent);
        if (mapWidgetModel.viewmode === "2D") {
            polygon = rotate(polygon, mapWidgetModel.rotation);
        } else {
            polygon = rotate(polygon, -mapWidgetModel.camera.heading);
        }
        const polygonSymbol = {type: "simple-fill"};
        const graphic = new Graphic({
            geometry: polygon,
            symbol: polygonSymbol,
            attributes: {}
        });
        view.graphics.add(graphic);
    }

}
