var Flare = new function() {
    let dialog_title = "Flare";
    let menu_prefix = "Flare | ";

    // CLASS: Utility functions
    this.Utils = new function() {
        this.tileToGlobalID = function(map, tile) {
            if (!map.isTileMap || !tile || !tile.tileset) {
                return 0;
            }

            let firstgid = 0;
            for (let i = 0; i < map.tilesets.length; i++) {
                if (i > 0) {
                    firstgid += map.tilesets[i-1].tileCount;
                }
                if (map.tilesets[i].name == tile.tileset.name) {
                    return firstgid + tile.id + 1;
                }
            }

            return 0;
        };

        this.layerNameToIndex = function(map, name) {
            for (let i = 0; i < map.layerCount; i++) {
                if (map.layerAt(i).name == name)
                    return i;
            }
            return null;
        };
    };

    // CLASS: MapMod tools
    this.MapMod = new function() {
        var mapmod_prefix = "<MAPMOD>_";
        var mapmod_erase_prefix = "<MAPMOD_ERASE>_";

        this.createLayers = tiled.registerAction("flare_mapmod_create_layers", function(createLayers) {
            let map = tiled.activeAsset;
            if (map.isTileMap) {
                for (let i = 0; i < map.layerCount; i++) {
                    let layer = map.layerAt(i);
                    if (layer.isTileLayer) {
                        // strip off the prefixes to get the base layer's name
                        let base_name = layer.name;
                        if (base_name.startsWith(mapmod_prefix))
                            base_name = base_name.split(mapmod_prefix)[1];
                        else if (base_name.startsWith(mapmod_erase_prefix))
                            base_name = base_name.split(mapmod_erase_prefix)[1];

                        let mapmod_index = Flare.Utils.layerNameToIndex(map, mapmod_prefix + base_name);
                        let mapmod_erase_index = Flare.Utils.layerNameToIndex(map, mapmod_erase_prefix + base_name);

                        if (mapmod_erase_index == null) {
                            let mapmod_layer = new TileLayer(mapmod_erase_prefix + base_name);
                            map.insertLayerAt(i+1, mapmod_layer);
                            map.currentLayer = mapmod_layer;
                        }
                        if (mapmod_index == null) {
                            let mapmod_layer = new TileLayer(mapmod_prefix + base_name);
                            map.insertLayerAt(i+1, mapmod_layer);
                            map.currentLayer = mapmod_layer;
                        }
                    }
                }
            }
            else {
                tiled.alert("Please select a map.", dialog_title);
            }
        });

        this.removeLayers = tiled.registerAction("flare_mapmod_remove_layers", function(removeLayers) {
            let map = tiled.activeAsset;
            if (!map.isTileMap) {
                tiled.alert("Please select a map.", dialog_title);
                return;
            }

            let layers_to_remove = [];

            for (let i = 0; i < map.layerCount; i++) {
                if (map.layerAt(i).name.startsWith(mapmod_prefix) || map.layerAt(i).name.startsWith(mapmod_erase_prefix))
                    layers_to_remove.push(i);
            }

            if (layers_to_remove.length > 0) {
                if (tiled.confirm("Remove mapmod layers?", dialog_title)) {
                    for (let i = layers_to_remove.length; i > 0; i--) {
                        map.removeLayerAt(layers_to_remove[i-1]);
                    }
                }
            }
            else {
                tiled.alert("No mapmod layers found.", dialog_title);
            }
        });

        this.saveToObject = tiled.registerAction("flare_mapmod_save_to_object", function(saveToObject) {
            let map = tiled.activeAsset;
            if (!map.isTileMap) {
                tiled.alert("Please select a map.", dialog_title);
                return;
            }

            let layers_to_remove = [];
            let mapmod_str = "";

            for (let i = 0; i < map.layerCount; i++) {
                let layer = map.layerAt(i);
                if (layer.name.startsWith(mapmod_prefix)) {

                    let target_layer = layer.name.split(mapmod_prefix)[1];

                    for (let x = 0; x < layer.width; x++) {
                        for (let y = 0; y < layer.height; y++) {
                            let tile = layer.tileAt(x, y);
                            if (tile != null) {
                                if (mapmod_str != "")
                                    mapmod_str += ";";

                                mapmod_str += target_layer + "," + String(x) + "," + String(y) + "," + String(Flare.Utils.tileToGlobalID(map, tile));
                            }
                        }
                    }

                    layers_to_remove.push(i);
                }
                else if (layer.name.startsWith(mapmod_erase_prefix)) {

                    let target_layer = layer.name.split(mapmod_erase_prefix)[1];

                    for (let x = 0; x < layer.width; x++) {
                        for (let y = 0; y < layer.height; y++) {
                            let tile = layer.tileAt(x, y);
                            if (tile != null) {
                                if (mapmod_str != "")
                                    mapmod_str += ";";

                                mapmod_str += target_layer + "," + String(x) + "," + String(y) + ",0";
                            }
                        }
                    }

                    layers_to_remove.push(i);
                }
            }

            if (layers_to_remove.length > 0) {
                if (mapmod_str != "") {
                    let selected_event_obj = false;

                    for (let i = 0; i < map.selectedObjects.length; i++) {
                        let obj = map.selectedObjects[i];
                        if (obj.type == "event") {
                            selected_event_obj = true;
                            let prop_str = obj.property("mapmod");
                            if (prop_str == undefined)
                                prop_str = "";

                            if (prop_str != "")
                                prop_str += ";";
                            prop_str += mapmod_str;

                            obj.setProperty("mapmod", prop_str);
                        }
                    }

                    if (!selected_event_obj)
                        tiled.alert("No mapmod applied.<br/>Please select an object with the <b>Type</b> property set as <b>event</b>.", dialog_title);
                    else {
                        if (tiled.confirm("Remove mapmod layers?", dialog_title)) {
                            for (let i = layers_to_remove.length; i > 0; i--) {
                                map.removeLayerAt(layers_to_remove[i-1]);
                            }
                        }
                    }
                }
                else {
                    tiled.alert("No tiles found in mapmod layers.", dialog_title);
                }
            }
            else {
                tiled.alert("No mapmod layers found. To create these layers:<ol><li>Select <b>Map</b> from the main menu.</li><li>Select <b>[Flare] Mapmod -> Create Layers</b>.</li></ul>", dialog_title);
            }
        });

        this.createLayers.text = menu_prefix + "Mapmod -> Create layers";
        this.removeLayers.text = menu_prefix + "Mapmod -> Remove layers";
        this.saveToObject.text = menu_prefix + "Mapmod -> Save layers to event object";

        tiled.extendMenu("Map", [
            { action: "flare_mapmod_create_layers", before: "MapProperties" },
            { action: "flare_mapmod_remove_layers", before: "MapProperties" },
            { action: "flare_mapmod_save_to_object", before: "MapProperties" },
            { separator: true }
        ]);
    };

    // CLASS: Tileset definition tools
    this.TilesetDef = new function() {
        this.tilesetDefFromMap = tiled.registerMapFormat("flare_tilesetdef_from_map", {
            name = "Flare tileset definition files",
            extension: "txt",
            write: function(map, filename) {
                let tset_img_path = tiled.prompt("Where are the tilesets images located in your mod?", "images/tilesets/", dialog_title);
                tset_img_path = FileInfo.cleanPath(FileInfo.fromNativeSeparators(tset_img_path));
                if (tset_img_path !=  "")
                    tset_img_path += "/";

                let omit_dev_tsets = tiled.confirm("<b>(Recommended)</b> Omit tilesets with the following names?:<ul><li><i>collision</i></li><li><i>set_rules</i></li></ul>", dialog_title);
                let textfile = new TextFile(filename, TextFile.WriteOnly);

                tsets = map.tilesets;
                for (let i = 0; i < tsets.length; i++) {
                    if (omit_dev_tsets && (tsets[i].name == "collision" || tsets[i].name == "set_rules"))
                        continue;

                    textfile.writeLine("[tileset]");
                    let filename_tset = FileInfo.baseName(tsets[i].image) + "." + FileInfo.suffix(tsets[i].image);
                    textfile.writeLine("img=" + tset_img_path + filename_tset);
                    for (let j = 0; j < tsets[i].tileCount; j++) {
                        let tile = tsets[i].tile(j);
                        let tile_id = Flare.Utils.tileToGlobalID(map, tile);
                        let tile_w = tsets[i].tileWidth;
                        let tile_h = tsets[i].tileHeight;
                        let tiles_per_row = tsets[i].imageWidth / tile_w;
                        let left_x = (tile.id % tiles_per_row) * tile_w;
                        let top_y = Math.floor(tile.id / tiles_per_row) * tile_h;
                        let off_x = (map.tileWidth / 2) - tsets[i].tileOffset.x;
                        let off_y = tile_h - (map.tileHeight / 2) - tsets[i].tileOffset.y;
                        textfile.writeLine("tile=" + tile_id + "," + left_x + "," + top_y + "," + tile_w + "," + tile_h + "," + off_x + "," + off_y);
                    }
                    textfile.writeLine("");
                }

                textfile.commit();
            },
        });

        this.tilesetDefFromTileset = tiled.registerTilesetFormat("flare_tilesetdef_from_tileset", {
            name = "Flare tileset definition files",
            extension: "txt",
            write: function(tset, filename) {
                let tset_img_path = tiled.prompt("Where are the tilesets images located in your mod?", "images/tilesets/", dialog_title);
                tset_img_path = FileInfo.cleanPath(FileInfo.fromNativeSeparators(tset_img_path));
                if (tset_img_path !=  "")
                    tset_img_path += "/";

                let map_tile_width = tset.property("map_tile_width");
                let map_tile_height = tset.property("map_tile_height");

                if (map_tile_width == undefined || map_tile_height == undefined) {
                    tiled.alert("Tileset is missing the <b>map_tile_width</b> and/or <b>map_tile_height</b> custom properties. As a result, the tile x/y offsets will be set to 0. To add these custom properties:<ol><li>Select <b>Tileset</b> from the main menu.</li><li>Select <b>Tileset -> Create custom properties</b>.</li><li>Define these properties based on the <b>tile_size</b> property in your Flare mod's <u>engine/tileset_config.txt</u> file.</li></ol>", dialog_title);
                }

                let textfile = new TextFile(filename, TextFile.WriteOnly);

                textfile.writeLine("[tileset]");
                let filename_tset = FileInfo.baseName(tset.image) + "." + FileInfo.suffix(tset.image);
                textfile.writeLine("img=" + tset_img_path + filename_tset);
                for (let j = 0; j < tset.tileCount; j++) {
                    let tile = tset.tile(j);
                    let tile_id = tile.id + 1;
                    let tile_w = tset.tileWidth;
                    let tile_h = tset.tileHeight;
                    let tiles_per_row = tset.imageWidth / tile_w;
                    let left_x = (tile.id % tiles_per_row) * tile_w;
                    let top_y = Math.floor(tile.id / tiles_per_row) * tile_h;
                    let off_x = 0;
                    let off_y = 0;
                    if (map_tile_width != undefined && map_tile_height != undefined) {
                        off_x = (map_tile_width / 2) - tset.tileOffset.x;
                        off_y = tile_h - (map_tile_height / 2) - tset.tileOffset.y;
                    }
                    textfile.writeLine("tile=" + tile_id + "," + left_x + "," + top_y + "," + tile_w + "," + tile_h + "," + off_x + "," + off_y);
                }
                textfile.writeLine("");

                textfile.commit();
            },
        });

        this.createProperties = tiled.registerAction("flare_tilesetdef_create_properties", function(createProperties) {
            let tset = tiled.activeAsset;
            if (!tset.isTileset) {
                tiled.alert("Please select a tileset.", dialog_title);
                return;
            }
            if (tset.property("map_tile_width") == undefined) {
                tset.setProperty("map_tile_width", 0);
            }
            if (tset.property("map_tile_height") == undefined) {
                tset.setProperty("map_tile_height", 0);
            }
        });

        this.createProperties.text = menu_prefix + "Tileset -> Create custom properties";

        tiled.extendMenu("Tileset", [
            { action: "flare_tilesetdef_create_properties", before: "TilesetProperties" },
            { separator: true }
        ]);
    };
};
