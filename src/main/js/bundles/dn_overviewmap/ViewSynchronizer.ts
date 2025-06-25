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
import MapView from "esri/views/MapView";
import {WatchHandle} from "apprt-core/Mutable";
import Observers from "apprt-core/Observers";
import * as reactiveUtils from "esri/core/reactiveUtils";
import MapWidgetModel from "map-widget/MapWidgetModel";

export default class ViewSynchronizer {

    #mainView: MapView;
    #overviewMapView: MapView;
    #observers: any = Observers();
    #options: any;
    #mapWidgetModel: MapWidgetModel;
    #activeMap: MapView;


    constructor(mainView: MapView, overviewView: MapView, mapWidgetModel: MapWidgetModel, options: any) {
        this.#mainView = mainView;
        this.#overviewMapView = overviewView;
        this.#mapWidgetModel = mapWidgetModel;
        this.#options = options;
        this.#activeMap = mainView;
    }

    sync(): void {
        this.#watchForExtentChanges();

        if (this.#options.enableRotation) {
            this.#watchForRotation();
        }
        this.#watchForActiveMapChanges();
    }

    stop(): void {
        this.#observers.clean();
    }

    #watchForExtentChanges(): void {
        const mainView = this.#mainView;
        const overviewMapView = this.#overviewMapView;

        const scaleMultiplier = this.#options.scaleMultiplier ? this.#options.scaleMultiplier : 1;

        overviewMapView.center = mainView.center;
        overviewMapView.scale = mainView.scale * scaleMultiplier;
        mainView.constraints.snapToZoom = false;

        this.#observers.add(this.#getExtentWatcherForView(overviewMapView, mainView, 1 / scaleMultiplier));
        this.#observers.add(this.#getExtentWatcherForView(mainView, overviewMapView, scaleMultiplier));
    }

    #watchForRotation(): void {
        const overviewMapView = this.#overviewMapView;
        const mapWidgetModel = this.#mapWidgetModel;

        if (mapWidgetModel.camera) {
            overviewMapView.rotation = -mapWidgetModel.camera.heading;
        } else {
            overviewMapView.rotation = mapWidgetModel.rotation || 0;
        }
        this.#observers.add(mapWidgetModel.watch("rotation", ({value}) => {
            if(value){
                overviewMapView.rotation = value;
            }
        }));
    }

    #getExtentWatcherForView(viewToWatch: MapView, viewToUpdate: MapView, scaleMultiplier: number): WatchHandle{
        return reactiveUtils.watch(
            () => [viewToWatch.extent],
            async () => {
                if(viewToWatch === this.#activeMap){
                    viewToUpdate.center = viewToWatch.center;
                    viewToUpdate.scale = this.#options.fixedScale || viewToWatch.scale * scaleMultiplier;
                }
            },
            {
                initial: true
            }
        );
    }

    #watchForActiveMapChanges(): void {
        this.#observers.add(this.#mainView.on("pointer-enter", () => this.#activeMap = this.#mainView));
        this.#observers.add(this.#overviewMapView.on("pointer-enter", () => this.#activeMap = this.#overviewMapView));
    }

}
