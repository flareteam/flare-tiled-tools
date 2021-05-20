# Flare Tiled Tools

These tools are to be used with [Tiled](https://www.mapeditor.org/) for creating and editing maps for the [Flare](https://flarerpg.org) game engine.

There are two important files:

1. **flare.js** - A collection of functions built around Tiled's scripting API that aid in some Flare-specific tasks. It is described in more detail below.
2. **objecttypes.xml** - Can be imported into Tiled's *Object Types Editor*. It will provide color-coding for map objects, and more importantly, will expose the available properties for map objects.

## flare.js

To use this, simply copy it Tiled's extensions folder. You can find this folder by going to the *Plugins* tab of Tiled's *Preferences* window.

### Features

- Adds *Flare tileset definition* as an export type for both tile maps and external tilesets. This feature serves as a replacement for the old `tilesetdef-generator` tool.
- Adds actions to the *Map* menu to easily define `mapmod` properties for event objects.

### Using the mapmod feature

To create a mapmod, the intended workflow looks like this:

1. Select *Flare | Mapmod -> Create Layers* from the *Map* menu. This will create two layers for each tile layer in your map.
    - If you want to remove all mapmod layers, simply select *Flare | Mapmod -> Remove Layers* from the *Map* menu.
2. To add or change tiles from a layer, select the `<MAPMOD>_` layer that matches your target layer and paint tiles as desired.
3. To erase tiles from a layer, select the `<MAPMOD_ERASE>_` layer that matches your target layer and paint tiles as desired. Since this is strictly for erasing, you can paint with any tile.
4. Select an object that has `event` as its type.
5. Select *Flare | Mapmod -> Save layers to event object* from the *Map* menu. The `mapmod` property of the event will be updated and you will be prompted to remove the mapmod layers.

