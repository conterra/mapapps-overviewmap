# Overview Map Bundle
The Overview Map gives better orientation to the user by showing the current extent of the map in a smaller scaled map within a separated window.

![Screenshot App](https://github.com/conterra/mapapps-overviewmap/blob/main/screenshot.JPG)

# Build Status
[![devnet-bundle-snapshot](https://github.com/conterra/mapapps-overviewmap/actions/workflows/devnet-bundle-snapshot.yml/badge.svg)](https://github.com/conterra/mapapps-overviewmap/actions/workflows/devnet-bundle-snapshot.yml)

## Sample App
https://demos.conterra.de/mapapps/resources/apps/downloads_overviewmap/index.html

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
