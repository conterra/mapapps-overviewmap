/*
 * Copyright (C) 2019 con terra GmbH (info@conterra.de)
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
import Binding from "apprt-binding/Binding";
import {ifDefined} from "apprt-binding/Transformers";
import Observers from "apprt-core/Observers";
import Vue from "apprt-vue/Vue";
import VueDijit from "apprt-vue/VueDijit";
import OverviewMapWidget from "./OverviewMapWidget.vue";
import Map from "esri/Map";
import MapView from "esri/views/MapView";
import Graphic from "esri/Graphic";
import Polygon from "esri/geometry/Polygon";
import {rotate} from "esri/geometry/geometryEngine";

const _overviewMapBinding = Symbol("_overviewMapBinding");
const _overviewMapView = Symbol("_overviewMapView");
const _observers = Symbol("_observers");

export default class CameraWidgetFactory {

    activate() {
        this[_observers] = Observers();
    }

    deactivate() {
        this[_observers].clean();
    }

    createInstance() {
        const vm = new Vue(OverviewMapWidget);
        const widget = VueDijit(vm);

        // register methods to enable/disable binding
        widget.enableBinding = () => {
            if (this[_overviewMapBinding]) {
                this[_overviewMapBinding]
                    .syncToRightNow()
                    .enable();
            }
        };
        widget.disableBinding = () => {
            this[_overviewMapBinding].disable();
        };

        // clean up binding and attached functions
        const that = this;
        widget.own({
            remove() {
                that[_overviewMapBinding].unbind();
                that[_overviewMapBinding] = undefined;
                widget.enableBinding = widget.disableBinding = undefined;
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
        const overviewMapView = this[_overviewMapView] = new MapView({
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

        this._addExtentGraphicToView(mapWidgetModel.extent, overviewMapView);
        mapWidgetModel.watch("extent", ({value}) => {
            if (value) {
                const extent = value.clone();
                this._addExtentGraphicToView(extent, overviewMapView);
            }
        });

        const overviewMapBinding = this._createOverviewMapBinding(overviewMapView);
        overviewMapBinding
            .syncToRightNow()
            .enable();
    }

    async _parseBasemapConfig(basemapConfig) {
        return this._basemapConfigParser.parse(basemapConfig || "streets").then(({instance}) => instance);
    }

    _listenOnClickEvent(view) {
        const observers = this[_observers];
        observers.add(view.on("click", (event) => {
            this._mapWidgetModel.center = event.mapPoint;
        }));
    }

    _disableViewEvents(view) {
        const observers = this[_observers];
        observers.add(view.on("key-down", function (event) {
            event.stopPropagation();
        }));
        observers.add(view.on("mouse-wheel", function (event) {
            event.stopPropagation();
        }));
        observers.add(view.on("double-click", function (event) {
            event.stopPropagation();
        }));
        observers.add(view.on("double-click", ["Control"], function (event) {
            event.stopPropagation();
        }));
        observers.add(view.on("drag", function (event) {
            event.stopPropagation();
        }));
        observers.add(view.on("drag", ["Shift"], function (event) {
            event.stopPropagation();
        }));
        observers.add(view.on("drag", ["Shift", "Control"], function (event) {
            event.stopPropagation();
        }));
    }

    _createOverviewMapBinding(view) {
        const properties = this._properties;
        const scaleMultiplier = properties.scaleMultiplier;
        const fixedScale = properties.fixedScale;
        const overviewMapBinding = this[_overviewMapBinding] = Binding.for(this._mapWidgetModel, view)
            .syncToRight("scale", "scale", (scaleValue) => {
                return fixedScale || scaleValue * scaleMultiplier
            })
            .syncToRight("center", "center");

        if (properties.enableRotation) {
            overviewMapBinding.syncAllToRight("rotation");
            overviewMapBinding.syncToRight("camera", "rotation", ifDefined((camera) => -camera.heading));
        }
        return overviewMapBinding;
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
