[![devnet-bundle-snapshot](https://github.com/conterra/mapapps-overviewmap/actions/workflows/devnet-bundle-snapshot.yml/badge.svg)](https://github.com/conterra/mapapps-overviewmap/actions/workflows/devnet-bundle-snapshot.yml)
![Static Badge](https://img.shields.io/badge/requires_map.apps-4.20.0-e5e5e5?labelColor=%233E464F&logoColor=%23e5e5e5)
![Static Badge](https://img.shields.io/badge/tested_for_map.apps-4.20.0-%20?labelColor=%233E464F&color=%232FC050)
# Overview Map Bundle
The Overview Map gives better orientation to the user by showing the current extent of the map in a smaller scaled map within a separated window.

![Screenshot App](https://github.com/conterra/mapapps-overviewmap/blob/main/screenshot.png)

## Sample App
https://demos.conterra.de/mapapps/resources/apps/public_demo_overviewmap/index.html

## Installation Guide
**Requirement: map.apps 4.4.0**

[dn_overviewmap Documentation](https://github.com/conterra/mapapps-overviewmap/tree/master/src/main/js/bundles/dn_overviewmap)

## Quick start

Clone this project and ensure that you have all required dependencies installed correctly (see [Documentation](https://docs.conterra.de/en/mapapps/latest/developersguide/getting-started/set-up-development-environment.html)).

Then run the following commands from the project root directory to start a local development server:

```bash
# install all required node modules
$ mvn initialize

# start dev server
$ mvn compile -Denv=dev -Pinclude-mapapps-deps

# run unit tests
$ mvn test -P run-js-tests,include-mapapps-deps
```
