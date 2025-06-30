/*
 * Copyright (C) 2025 con terra GmbH (info@conterra.de)
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
import ViewSynchronizer from "dn_overviewmap/ViewSynchronizer";

export default class OverviewMapWidgetFactory {

    #overviewMapView = null;
    #observers = null;
    #mapObservers = null;
    #viewSynchronizer;

    activate() {
        this.#observers = Observers();
        this.#mapObservers = Observers();
        this.#watchForViewChanges(this._mapWidgetModel);
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
            scale: properties["fixedScale"] || mapWidgetModel.view.scale * properties["scaleMultiplier"],
            center: mapWidgetModel.view.center,
            spatialReference: mapWidgetModel.spatialReference,
            constraints: {
                snapToZoom: false
            }

        });

        const mode = properties.interactionMode;
        switch (mode){
            case "interactive":
                div.style.cursor = "default";
                this.#enableInteractiveMode(overviewMapView);
                break;
            default:
                this.#enableClickModeOnView(overviewMapView);
        }

        this._connectView(overviewMapView);
    }

    async _parseBasemapConfig(basemapConfig) {
        return this._basemapConfigParser.parse(basemapConfig || "streets").then(({instance}) => instance);
    }

    #enableInteractiveMode(overviewMapView){
        overviewMapView.constraints.rotationEnabled = this._properties.enableRotation;
        this._mapWidgetModel.view.constraints.snapToZoom = false;
        this._connectView(overviewMapView);
    }

    #enableClickModeOnView(overviewMapView) {
        this._listenOnClickEvent(overviewMapView);
        this._disableViewEvents(overviewMapView);
    }

    _listenOnClickEvent(view) {
        const observers = this.#observers;
        observers.add(view.on("click", (event) => {
            view.center = event.mapPoint;
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
        this.#getMainView().then((view) => {
            this.#viewSynchronizer?.stop();
            const synchronizer = this.#viewSynchronizer = new ViewSynchronizer(view, overviewMapView, this._properties);
            synchronizer.sync();

            this.#mapObservers.add(view.watch("extent", () => {
                this._addExtentGraphicToView(view.extent, overviewMapView);
            }));
        });
    }

    _disconnectView() {
        this.#viewSynchronizer.stop();
        this.#mapObservers?.clean();
        this.#observers?.clean();
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

    #getMainView() {
        const mapWidgetModel = this._mapWidgetModel;
        // eslint-disable-next-line no-unused-vars
        return new Promise((resolve, reject) => {
            if (mapWidgetModel.view) {
                resolve(mapWidgetModel.view);
            } else {
                const handle = mapWidgetModel.watch("view", ({value: view}) => {
                    if (view) {
                        handle.remove();
                        resolve(view);
                    } else {
                        reject(new Error("View is undefined"));
                    }
                });
            }
        });
    }

    #watchForViewChanges(mapWidgetModel) {
        mapWidgetModel.watch("view", ({value}) => {
            if(value){
                this._connectView(this.#overviewMapView);
            }
        });
    }
}
