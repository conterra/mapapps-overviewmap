///
/// Copyright (C) 2025 con terra GmbH (info@conterra.de)
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///         http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import {WatchHandle} from "apprt-core/Mutable";
import Observers from "apprt-core/Observers";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";

export default class ViewSynchronizer {

    #mainView: any;
    #overviewMapView: any;
    #observers: any = Observers();
    #options: any;
    #activeMapView: any;


    constructor(mainView: any, overviewView: any, options: any) {
        this.#mainView = mainView;
        this.#overviewMapView = overviewView;
        this.#options = options;
        this.#activeMapView = mainView;
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
        const mainView = this.#mainView;

        if (mainView.camera) {
            overviewMapView.rotation = -mainView.camera.heading;
        } else {
            overviewMapView.rotation = mainView.rotation || 0;
        }
        this.#observers.add(mainView.watch("rotation", (rotation: number) => {
            if(rotation && this.#activeMapView === mainView){
                overviewMapView.rotation = rotation;
            }
        }));

        this.#observers.add(overviewMapView.watch("rotation", (rotation: number) => {
            if(rotation && this.#activeMapView === overviewMapView){
                mainView.rotation = rotation;
            }
        }));
    }

    #getExtentWatcherForView(viewToWatch: any, viewToUpdate: any, scaleMultiplier: number): WatchHandle{
        return reactiveUtils.watch(
            () => [viewToWatch.extent],
            async () => {
                if(viewToWatch === this.#activeMapView){
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
        this.#observers.add(this.#mainView.on("pointer-enter", () => this.#activeMapView = this.#mainView));
        this.#observers.add(this.#overviewMapView.on("pointer-enter", () => this.#activeMapView = this.#overviewMapView));
    }

}
