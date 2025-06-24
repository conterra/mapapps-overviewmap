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
